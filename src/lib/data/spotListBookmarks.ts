import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { SpotListSummary } from "@/lib/data/spots";

const PAGE_SIZE = 9;
const PREVIEW_LIMIT = 4;

const SUMMARY_COLUMNS = "id, title, artist, description, is_public, item_count, like_count";

export interface BookmarkedSpotListFilters {
	keyword?: string; // title/artist 模糊比對，比照 getMySpotLists 的既有模式
}

export type BookmarkedSpotListSort = "newest" | "oldest" | "popular";

export interface BookmarkedSpotListsPage {
	lists: SpotListSummary[];
	totalCount: number;
	totalPages: number;
}

// 詳情頁用：目前登入者是否已收藏這份清單（未登入一律 false）
export async function isSpotListBookmarked(
	listId: string,
	currentUserId: string | null,
): Promise<boolean> {
	if (!currentUserId) {
		return false;
	}

	const supabase = await createClient();
	const { data, error } = await supabase
		.from("spot_list_bookmarks")
		.select("id")
		.eq("list_id", listId)
		.eq("user_id", currentUserId)
		.maybeSingle();
	if (error) {
		throw new Error(`讀取收藏狀態失敗：${error.message}`);
	}
	return data !== null;
}

// 兩段式查詢比照 data/bookmarks.ts：先在 spot_list_bookmarks join
// spot_lists_with_item_count 上做關鍵字篩選、依排序分頁，拿到 list_id 清單與總數，
// 再撈完整欄位。join 對象選 spot_lists_with_item_count 而非 spot_lists，是為了讓
// popular（依讚數）能在 SQL 層直接排序分頁，而不是只在單頁內重排
async function fetchBookmarkedListIds(
	supabase: Awaited<ReturnType<typeof createClient>>,
	userId: string,
	filters: BookmarkedSpotListFilters,
	sort: BookmarkedSpotListSort,
	offset: number,
	limit: number,
): Promise<{ ids: string[]; totalCount: number }> {
	let query = supabase
		.from("spot_list_bookmarks")
		.select("list_id, spot_lists_with_item_count!inner(title, artist, like_count)", {
			count: "exact",
		})
		.eq("user_id", userId);

	const keyword = filters.keyword?.trim();
	if (keyword) {
		const kw = keyword.replace(/[%,]/g, "");
		query = query.or(`title.ilike.%${kw}%,artist.ilike.%${kw}%`, {
			referencedTable: "spot_lists_with_item_count",
		});
	}

	const { data, error, count } =
		sort === "popular"
			? await query
					.order("like_count", { ascending: false, referencedTable: "spot_lists_with_item_count" })
					.range(offset, offset + limit - 1)
			: await query
					.order("created_at", { ascending: sort === "oldest" })
					.range(offset, offset + limit - 1);
	if (error) {
		throw new Error(`讀取收藏清單失敗：${error.message}`);
	}

	return {
		ids: (data ?? []).map((r) => r.list_id),
		totalCount: count ?? 0,
	};
}

// ids 對應的完整卡片欄位；排序已在第一段查詢決定好，這裡照 ids 原樣 map 回去
async function hydrateSpotLists(
	supabase: Awaited<ReturnType<typeof createClient>>,
	ids: string[],
): Promise<SpotListSummary[]> {
	if (ids.length === 0) {
		return [];
	}

	const { data, error } = await supabase
		.from("spot_lists_with_item_count")
		.select(SUMMARY_COLUMNS)
		.in("id", ids);
	if (error) {
		throw new Error(`讀取收藏清單失敗：${error.message}`);
	}

	const byId = new Map((data ?? []).map((l) => [l.id, l]));
	const orderedRows = ids.map((id) => byId.get(id)).filter((l): l is NonNullable<typeof l> => l != null);

	// view 的型別產生器把所有欄位標成 nullable（保守推斷），這些欄位在 spot_lists
	// 本身是 not null，這裡用 ! 斷言還原實際保證（比照 spots.ts 既有模式）
	return orderedRows.map((l) => ({
		id: l.id!,
		title: l.title!,
		artist: l.artist!,
		description: l.description ?? null,
		is_public: l.is_public!,
		item_count: l.item_count ?? 0,
		like_count: l.like_count ?? 0,
	}));
}

// /bookmarks/spots 分頁全部用
export async function getMyBookmarkedSpotLists(
	userId: string,
	page = 1,
	filters: BookmarkedSpotListFilters = {},
	sort: BookmarkedSpotListSort = "newest",
): Promise<BookmarkedSpotListsPage> {
	const supabase = await createClient();
	const offset = (page - 1) * PAGE_SIZE;

	const { ids, totalCount } = await fetchBookmarkedListIds(
		supabase,
		userId,
		filters,
		sort,
		offset,
		PAGE_SIZE,
	);
	const lists = await hydrateSpotLists(supabase, ids);

	return {
		lists,
		totalCount,
		totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
	};
}

// /bookmarks 首頁預覽用：最近收藏前 4 筆，固定 newest 排序，不支援篩選
export async function getMyBookmarkedSpotListsPreview(
	userId: string,
	limit = PREVIEW_LIMIT,
): Promise<{ lists: SpotListSummary[]; totalCount: number }> {
	const supabase = await createClient();
	const { ids, totalCount } = await fetchBookmarkedListIds(supabase, userId, {}, "newest", 0, limit);
	const lists = await hydrateSpotLists(supabase, ids);
	return { lists, totalCount };
}
