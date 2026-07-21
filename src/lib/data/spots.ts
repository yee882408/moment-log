import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type SpotListRow = Database["public"]["Tables"]["spot_lists"]["Row"];
type SpotListItemRow = Database["public"]["Tables"]["spot_list_items"]["Row"];

// 列表卡片用（/spots）：清單基本資訊 + 底下地點數量 + 讚數
export type SpotListSummary = Pick<
	SpotListRow,
	"id" | "title" | "artist" | "description" | "is_public"
> & {
	item_count: number;
	like_count: number;
};

// 清單基本資料，供編輯表單用（不含底下的地點，地點管理在清單詳情頁）
export type SpotListDetail = Pick<
	SpotListRow,
	"id" | "title" | "artist" | "description" | "is_public" | "user_id"
>;

// 清單詳情頁用：清單資訊 + 底下所有地點
export interface SpotListWithItems extends SpotListDetail {
	items: SpotListItem[];
}

export type SpotListItem = Pick<
	SpotListItemRow,
	| "id"
	| "place_name"
	| "place_lat"
	| "place_lng"
	| "place_type"
	| "description"
	| "cover_image_url"
>;

export interface SpotListFilters {
	keyword?: string; // 同時比對 title/artist（模糊比對）
}

export type SpotListSort = "newest" | "oldest" | "popular";

const PAGE_SIZE = 9;

export interface SpotListsPage {
	lists: SpotListSummary[];
	totalCount: number;
	totalPages: number;
}

const SUMMARY_COLUMNS = "id, title, artist, description, is_public, item_count, like_count";

// 取得某使用者「自己的」清單（不分公私）；offset 分頁，page 從 1 起算
export async function getMySpotLists(
	userId: string,
	page = 1,
	filters: SpotListFilters = {},
	sort: SpotListSort = "newest",
): Promise<SpotListsPage> {
	const supabase = await createClient();
	const from = (page - 1) * PAGE_SIZE;
	const to = from + PAGE_SIZE - 1;

	let query = supabase
		.from("spot_lists_with_item_count")
		.select(SUMMARY_COLUMNS, { count: "exact" })
		.eq("user_id", userId);

	// 同時比對標題/藝人；ilike 不分大小寫模糊比對，值由 supabase 參數化，無 SQL injection 風險
	if (filters.keyword) {
		const kw = filters.keyword.replace(/[%,]/g, ""); // 濾掉 ilike 萬用字元與 or() 語法的分隔字元
		query = query.or(`title.ilike.%${kw}%,artist.ilike.%${kw}%`);
	}

	const orderColumn = sort === "popular" ? "like_count" : "created_at";
	const { data, error, count } = await query
		.order(orderColumn, { ascending: sort === "oldest" })
		.range(from, to);

	if (error) {
		throw new Error(`讀取清單失敗：${error.message}`);
	}

	// view 的型別產生器把所有欄位標成 nullable（保守推斷），這些欄位在 spot_lists
	// 本身是 not null，這裡用 ! 斷言還原實際保證
	const lists: SpotListSummary[] = (data ?? []).map((l) => ({
		id: l.id!,
		title: l.title!,
		artist: l.artist!,
		description: l.description ?? null,
		is_public: l.is_public!,
		item_count: l.item_count ?? 0,
		like_count: l.like_count ?? 0,
	}));

	const totalCount = count ?? 0;
	return {
		lists,
		totalCount,
		totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
	};
}

// 公開清單列表；免登入可讀（RLS 允許 anon 讀 is_public=true）
export async function getPublicSpotLists(
	page = 1,
	filters: SpotListFilters = {},
	sort: SpotListSort = "newest",
): Promise<SpotListsPage> {
	const supabase = await createClient();
	const from = (page - 1) * PAGE_SIZE;
	const to = from + PAGE_SIZE - 1;

	let query = supabase
		.from("spot_lists_with_item_count")
		.select(SUMMARY_COLUMNS, { count: "exact" })
		.eq("is_public", true);

	if (filters.keyword) {
		const kw = filters.keyword.replace(/[%,]/g, "");
		query = query.or(`title.ilike.%${kw}%,artist.ilike.%${kw}%`);
	}

	const orderColumn = sort === "popular" ? "like_count" : "created_at";
	const { data, error, count } = await query
		.order(orderColumn, { ascending: sort === "oldest" })
		.range(from, to);

	if (error) {
		throw new Error(`讀取公開清單失敗：${error.message}`);
	}

	const lists: SpotListSummary[] = (data ?? []).map((l) => ({
		id: l.id!,
		title: l.title!,
		artist: l.artist!,
		description: l.description ?? null,
		is_public: l.is_public!,
		item_count: l.item_count ?? 0,
		like_count: l.like_count ?? 0,
	}));

	const totalCount = count ?? 0;
	return {
		lists,
		totalCount,
		totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
	};
}

// 某清單底下所有地點；RLS 已限制只能讀公開清單或自己的私密清單
export async function getSpotListItems(listId: string): Promise<SpotListItem[]> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("spot_list_items")
		.select("id, place_name, place_lat, place_lng, place_type, description, cover_image_url")
		.eq("list_id", listId)
		.order("created_at", { ascending: true });

	if (error) {
		throw new Error(`讀取地點失敗：${error.message}`);
	}
	return data ?? [];
}

// 清單詳情 + 底下地點；RLS 已處理權限（公開清單任何人可讀，私密只有本人）
// 找不到（不存在、或私密且不是本人）回 null
export async function getSpotListById(id: string): Promise<SpotListWithItems | null> {
	const supabase = await createClient();
	const { data: list, error: listError } = await supabase
		.from("spot_lists")
		.select("id, title, artist, description, is_public, user_id")
		.eq("id", id)
		.maybeSingle();

	if (listError) {
		throw new Error(`讀取清單失敗：${listError.message}`);
	}
	if (!list) {
		return null;
	}

	const items = await getSpotListItems(id);
	return { ...list, items };
}

// 取得單筆「自己的」清單基本資料；找不到（或不是自己的）回 null，供編輯表單用
export async function getSpotListForEdit(
	userId: string,
	id: string,
): Promise<SpotListDetail | null> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("spot_lists")
		.select("id, title, artist, description, is_public, user_id")
		.eq("id", id)
		.eq("user_id", userId)
		.maybeSingle();

	if (error) {
		throw new Error(`讀取清單失敗：${error.message}`);
	}
	return data;
}
