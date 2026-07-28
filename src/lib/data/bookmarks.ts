import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getTagsByRecordIds, type TagOption } from "@/lib/data/tags";
import type { PublicReview } from "@/lib/data/reviews";

const PAGE_SIZE = 9;
const PREVIEW_LIMIT = 4;

const LIST_COLUMNS =
	"id, user_id, title, artist, venue_name, date, rating, cover_image_url, created_at, like_count, profiles(display_name, avatar_url)";

type PublicReviewRow = {
	id: string | null;
	user_id: string | null;
	title: string | null;
	artist: string | null;
	venue_name: string | null;
	date: string | null;
	rating: number | null;
	cover_image_url: string | null;
	created_at: string | null;
	like_count: number | null;
	profiles: { display_name: string | null; avatar_url: string | null } | null;
};

function mapPublicReviewRow(row: PublicReviewRow, tags: TagOption[]): PublicReview {
	return {
		id: row.id!,
		user_id: row.user_id!,
		title: row.title!,
		artist: row.artist!,
		venue_name: row.venue_name!,
		date: row.date!,
		rating: row.rating,
		cover_image_url: row.cover_image_url,
		created_at: row.created_at!,
		author: row.profiles?.display_name ?? null,
		author_avatar_url: row.profiles?.avatar_url ?? null,
		like_count: row.like_count ?? 0,
		tags,
	};
}

export interface BookmarkedReviewFilters {
	keyword?: string; // title/artist 模糊比對；心得內文不搜（收藏筆數規模小，不走全文搜尋 RPC）
	tagIds?: string[];
}

export type BookmarkedReviewSort = "newest" | "oldest" | "popular";

export interface BookmarkedReviewsPage {
	reviews: PublicReview[];
	totalCount: number;
	totalPages: number;
}

// 詳情頁用：目前登入者是否已收藏這篇心得（未登入一律 false）。收藏是私人行為、
// 不像讚需要顯示數量，只需要單一 boolean
export async function isRecordBookmarked(
	recordId: string,
	currentUserId: string | null,
): Promise<boolean> {
	if (!currentUserId) {
		return false;
	}

	const supabase = await createClient();
	const { data, error } = await supabase
		.from("record_bookmarks")
		.select("id")
		.eq("record_id", recordId)
		.eq("user_id", currentUserId)
		.maybeSingle();
	if (error) {
		throw new Error(`讀取收藏狀態失敗：${error.message}`);
	}
	return data !== null;
}

// 收藏列表的核心查詢：先在 record_bookmarks join concert_records_with_like_count 上做
// 關鍵字/標籤篩選、依排序分頁，拿到這一頁的 record_id 清單與總數，再用 .in("id", ids)
// 撈完整欄位。兩段式查詢比照 reviews.ts 的既有模式；relevance 排序不適用（非全文搜尋，
// 沒有 rank 分數）。join 對象選 concert_records_with_like_count 而非 concert_records，
// 是為了讓 popular（依讚數）能在 SQL 層直接排序分頁，而不是只在單頁內重排——後者
// 分頁邊界仍以另一個欄位為準，會導致「全站讚數最高的那篇」可能永遠排不進第 1 頁
async function fetchBookmarkedRecordIds(
	supabase: Awaited<ReturnType<typeof createClient>>,
	userId: string,
	filters: BookmarkedReviewFilters,
	sort: BookmarkedReviewSort,
	offset: number,
	limit: number,
): Promise<{ ids: string[]; totalCount: number }> {
	let query = supabase
		.from("record_bookmarks")
		.select("record_id, concert_records_with_like_count!inner(title, artist, like_count)", {
			count: "exact",
		})
		.eq("user_id", userId);

	const keyword = filters.keyword?.trim();
	if (keyword) {
		const kw = keyword.replace(/[%,]/g, "");
		query = query.or(`title.ilike.%${kw}%,artist.ilike.%${kw}%`, {
			referencedTable: "concert_records_with_like_count",
		});
	}

	if (filters.tagIds?.length) {
		const { data: matchedRows } = await supabase
			.from("concert_record_tags")
			.select("record_id")
			.in("tag_id", filters.tagIds);
		const matchedIds = [...new Set((matchedRows ?? []).map((r) => r.record_id))];
		query = query.in("record_id", matchedIds.length ? matchedIds : ["00000000-0000-0000-0000-000000000000"]);
	}

	const { data, error, count } =
		sort === "popular"
			? await query
					.order("like_count", { ascending: false, referencedTable: "concert_records_with_like_count" })
					.range(offset, offset + limit - 1)
			: await query
					.order("created_at", { ascending: sort === "oldest" })
					.range(offset, offset + limit - 1);
	if (error) {
		throw new Error(`讀取收藏清單失敗：${error.message}`);
	}

	return {
		ids: (data ?? []).map((r) => r.record_id),
		totalCount: count ?? 0,
	};
}

// ids 對應的完整卡片欄位。排序已在第一段查詢決定好，這裡照 ids 原樣 map 回去
// （.in() 不保證回傳順序），不需要再重排
async function hydrateReviews(
	supabase: Awaited<ReturnType<typeof createClient>>,
	ids: string[],
): Promise<PublicReview[]> {
	if (ids.length === 0) {
		return [];
	}

	const { data, error } = await supabase
		.from("concert_records_with_like_count")
		.select(LIST_COLUMNS)
		.in("id", ids);
	if (error) {
		throw new Error(`讀取收藏清單失敗：${error.message}`);
	}

	const byId = new Map((data ?? []).map((r) => [r.id, r]));
	const orderedRows = ids.map((id) => byId.get(id)).filter((r): r is NonNullable<typeof r> => r != null);

	const recordIds = orderedRows.map((r) => r.id!);
	const tagsByRecordId = await getTagsByRecordIds(recordIds);
	return orderedRows.map((r) => mapPublicReviewRow(r, tagsByRecordId.get(r.id!) ?? []));
}

// /bookmarks/reviews 分頁全部用
export async function getMyBookmarkedReviews(
	userId: string,
	page = 1,
	filters: BookmarkedReviewFilters = {},
	sort: BookmarkedReviewSort = "newest",
): Promise<BookmarkedReviewsPage> {
	const supabase = await createClient();
	const offset = (page - 1) * PAGE_SIZE;

	const { ids, totalCount } = await fetchBookmarkedRecordIds(
		supabase,
		userId,
		filters,
		sort,
		offset,
		PAGE_SIZE,
	);
	const reviews = await hydrateReviews(supabase, ids);

	return {
		reviews,
		totalCount,
		totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
	};
}

// /bookmarks 首頁預覽用：最近收藏前 4 筆，固定 newest 排序，不支援篩選
export async function getMyBookmarkedReviewsPreview(
	userId: string,
	limit = PREVIEW_LIMIT,
): Promise<{ reviews: PublicReview[]; totalCount: number }> {
	const supabase = await createClient();
	const { ids, totalCount } = await fetchBookmarkedRecordIds(supabase, userId, {}, "newest", 0, limit);
	const reviews = await hydrateReviews(supabase, ids);
	return { reviews, totalCount };
}
