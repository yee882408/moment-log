import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import { getRecordTags, getTagsByRecordIds, type TagOption } from "@/lib/data/tags";
import { searchConcertRecordIds, reorderByKeywordSearch } from "@/lib/data/concertRecordSearch";

const LIST_COLUMNS =
	"id, title, artist, venue_name, date, rating, is_public, cover_image_url, like_count, comment_count";

type RecordListRow = {
	id: string | null;
	title: string | null;
	artist: string | null;
	venue_name: string | null;
	date: string | null;
	rating: number | null;
	is_public: boolean | null;
	cover_image_url: string | null;
	like_count: number | null;
	comment_count: number | null;
};

// view 的型別產生器把所有欄位標成 nullable（保守推斷），這些欄位在 concert_records
// 本身是 not null（除了 rating/cover_image_url 本來就可為 null），這裡用 ! 斷言還原實際保證
function mapRecordListRow(row: RecordListRow, tags: TagOption[]): RecordListItem {
	return {
		id: row.id!,
		title: row.title!,
		artist: row.artist!,
		venue_name: row.venue_name!,
		date: row.date!,
		rating: row.rating,
		is_public: row.is_public!,
		cover_image_url: row.cover_image_url,
		like_count: row.like_count ?? 0,
		comment_count: row.comment_count ?? 0,
		tags,
	};
}

type RecordRow = Database["public"]["Tables"]["concert_records"]["Row"];

// 列表只需要部分欄位，從 Row 型別挑出來重用
export type RecordListItem = Pick<
	RecordRow,
	| "id"
	| "title"
	| "artist"
	| "venue_name"
	| "date"
	| "rating"
	| "is_public"
	| "cover_image_url"
> & {
	// 只有公開紀錄才有意義；私密紀錄一律回 0（RLS 之外沒人能對私密紀錄按讚/留言）
	like_count: number;
	comment_count: number;
	tags: TagOption[];
};

// 詳情／編輯需要的欄位（不用 SELECT *，明確列出）
export type RecordDetail = Pick<
	RecordRow,
	| "id"
	| "title"
	| "artist"
	| "venue_name"
	| "venue_lat"
	| "venue_lng"
	| "date"
	| "ticket_price"
	| "rating"
	| "review"
	| "is_public"
	| "spotify_playlist_id"
	| "cover_image_url"
> & {
	tags: TagOption[];
};

export interface RecordFilters {
	keyword?: string; // 全文搜尋比對 title/artist/venue_name/review
	tagIds?: string[]; // 只列出帶有這些標籤（任一符合，OR 邏輯）的紀錄
}

export type RecordSort = "newest" | "oldest" | "popular" | "relevance";

const PAGE_SIZE = 9;

export interface RecordsPage {
	records: RecordListItem[];
	totalCount: number;
	totalPages: number;
}

// 取得某使用者「自己的」紀錄（RLS 之外仍要明確 eq user_id，否則會混進別人的公開紀錄）
// offset 分頁；page 從 1 起算
export async function getMyRecords(
	userId: string,
	filters: RecordFilters = {},
	page = 1,
	sort: RecordSort = "newest",
): Promise<RecordsPage> {
	const supabase = await createClient();
	const from = (page - 1) * PAGE_SIZE;
	const to = from + PAGE_SIZE - 1;
	const keyword = filters.keyword?.trim();

	// 有關鍵字：改走全文搜尋 RPC（tsvector + trigram），涵蓋 title/artist/venue_name/review
	if (keyword) {
		return getMyRecordsByKeyword(supabase, userId, keyword, filters.tagIds, page, sort);
	}

	let query = supabase
		.from("concert_records_with_like_count")
		.select(LIST_COLUMNS, { count: "exact" })
		.eq("user_id", userId);

	// 標籤篩選：view 沒有 join concert_record_tags，Supabase JS 對「join 表存在性篩選」
	// 沒有直接語法，改成兩段式：先查符合標籤的 record_id 清單，再用 .in("id", ids) 帶入
	if (filters.tagIds?.length) {
		const { data: matchedRows } = await supabase
			.from("concert_record_tags")
			.select("record_id")
			.in("tag_id", filters.tagIds);
		const matchedIds = [...new Set((matchedRows ?? []).map((r) => r.record_id))];
		// 沒有任何紀錄符合時帶一個不可能存在的 id，讓查詢直接回空結果
		query = query.in("id", matchedIds.length ? matchedIds : ["00000000-0000-0000-0000-000000000000"]);
	}

	const orderColumn = sort === "popular" ? "like_count" : "date";
	const { data, error, count } = await query
		.order(orderColumn, { ascending: sort === "oldest" })
		.range(from, to);

	if (error) {
		throw new Error(`讀取紀錄失敗：${error.message}`);
	}

	const recordIds = (data ?? []).map((r) => r.id!);
	const tagsByRecordId = await getTagsByRecordIds(recordIds);
	const records = (data ?? []).map((r) => mapRecordListRow(r, tagsByRecordId.get(r.id!) ?? []));

	const totalCount = count ?? 0;
	return {
		records,
		totalCount,
		totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
	};
}

// 有關鍵字時的查詢路徑：先呼叫共用的全文搜尋 helper 拿排序後的 id 清單與總數，
// 再用 .in("id", ids) 撈完整欄位（RPC 只回傳 id/rank，其餘欄位仍需另外組裝）
async function getMyRecordsByKeyword(
	supabase: Awaited<ReturnType<typeof createClient>>,
	userId: string,
	keyword: string,
	tagIds: string[] | undefined,
	page: number,
	sort: RecordSort,
): Promise<RecordsPage> {
	const { ids, totalCount } = await searchConcertRecordIds(supabase, {
		keyword,
		userId,
		publicOnly: false,
		tagIds,
		page,
		pageSize: PAGE_SIZE,
	});
	if (ids.length === 0) {
		return { records: [], totalCount, totalPages: 1 };
	}

	const { data, error } = await supabase
		.from("concert_records_with_like_count")
		.select(LIST_COLUMNS)
		.in("id", ids);
	if (error) {
		throw new Error(`讀取紀錄失敗：${error.message}`);
	}

	const orderedRows = reorderByKeywordSearch(data ?? [], ids, sort);
	const recordIds = orderedRows.map((r) => r.id!);
	const tagsByRecordId = await getTagsByRecordIds(recordIds);
	const records = orderedRows.map((r) => mapRecordListRow(r, tagsByRecordId.get(r.id!) ?? []));

	return {
		records,
		totalCount,
		totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
	};
}

// 取得單筆「自己的」紀錄；找不到（或不是自己的）回 null
export async function getRecordById(
	userId: string,
	id: string,
): Promise<RecordDetail | null> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("concert_records")
		.select(
			"id, title, artist, venue_name, venue_lat, venue_lng, date, ticket_price, rating, review, is_public, spotify_playlist_id, cover_image_url",
		)
		.eq("id", id)
		.eq("user_id", userId)
		.maybeSingle();

	if (error) {
		throw new Error(`讀取紀錄失敗：${error.message}`);
	}
	if (!data) {
		return null;
	}

	const tags = await getRecordTags(id);
	return { ...data, tags };
}
