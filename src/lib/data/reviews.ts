import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getRecordTags, getTagsByRecordIds, type TagOption } from "@/lib/data/tags";
import { searchConcertRecordIds, reorderByKeywordSearch } from "@/lib/data/concertRecordSearch";

const PAGE_SIZE = 9;

const LIST_COLUMNS =
	"id, user_id, title, artist, venue_name, date, rating, cover_image_url, created_at, like_count, profiles(display_name, avatar_url)";

export interface PublicReview {
	id: string;
	user_id: string; // 連到 /users/[id]；非敏感資訊，公開頁曝光沒問題
	title: string;
	artist: string;
	venue_name: string;
	date: string;
	rating: number | null;
	cover_image_url: string | null;
	created_at: string;
	author: string | null; // 作者 display_name
	author_avatar_url: string | null;
	like_count: number;
	tags: TagOption[];
}

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

// view 的型別產生器把所有欄位標成 nullable（保守推斷），這些欄位在 concert_records
// 本身是 not null，這裡用 ! 斷言還原實際保證
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

// 詳情頁不帶 like_count：讚數狀態改由 getLikeState 提供（含 likedByMe），避免重複來源
export interface PublicReviewDetail extends Omit<PublicReview, "like_count"> {
	review: string | null;
	spotify_playlist_id: string | null;
}

interface ReviewsPage {
	reviews: PublicReview[];
	totalCount: number;
	totalPages: number;
}

export interface PublicReviewFilters {
	keyword?: string; // 全文搜尋比對 title/artist/venue_name/review
	tagIds?: string[]; // 只列出帶有這些標籤（任一符合，OR 邏輯）的紀錄
}

export type PublicReviewSort = "newest" | "oldest" | "popular" | "relevance";

// 公開心得列表（offset 分頁，跟其他列表一致，可跳頁/回上一頁）
// 免登入：RLS 允許 anon 讀 is_public=true；注意不撈 ticket_price（公開頁不露私密資訊）
export async function getPublicReviews(
	page = 1,
	filters: PublicReviewFilters = {},
	sort: PublicReviewSort = "newest",
): Promise<ReviewsPage> {
	const supabase = await createClient();
	const from = (page - 1) * PAGE_SIZE;
	const to = from + PAGE_SIZE - 1;
	const keyword = filters.keyword?.trim();

	// 有關鍵字：改走全文搜尋 RPC（tsvector + trigram），涵蓋 title/artist/venue_name/review
	if (keyword) {
		return getPublicReviewsByKeyword(supabase, keyword, filters.tagIds, page, sort);
	}

	let query = supabase
		.from("concert_records_with_like_count")
		.select(LIST_COLUMNS, { count: "exact" })
		.eq("is_public", true);

	// 標籤篩選：跟 getMyRecords 同樣的兩段式做法（view 沒有 join concert_record_tags）
	if (filters.tagIds?.length) {
		const { data: matchedRows } = await supabase
			.from("concert_record_tags")
			.select("record_id")
			.in("tag_id", filters.tagIds);
		const matchedIds = [...new Set((matchedRows ?? []).map((r) => r.record_id))];
		query = query.in("id", matchedIds.length ? matchedIds : ["00000000-0000-0000-0000-000000000000"]);
	}

	const orderColumn = sort === "popular" ? "like_count" : "date";
	const { data, error, count } = await query
		.order(orderColumn, { ascending: sort === "oldest" })
		.range(from, to);

	if (error) {
		throw new Error(`讀取公開心得失敗：${error.message}`);
	}

	const recordIds = (data ?? []).map((r) => r.id!);
	const tagsByRecordId = await getTagsByRecordIds(recordIds);
	const reviews = (data ?? []).map((r) => mapPublicReviewRow(r, tagsByRecordId.get(r.id!) ?? []));

	const totalCount = count ?? 0;
	return {
		reviews,
		totalCount,
		totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
	};
}

// 有關鍵字時的查詢路徑：先呼叫共用的全文搜尋 helper 拿排序後的 id 清單與總數，
// 再用 .in("id", ids) 撈完整欄位（RPC 只回傳 id/rank，其餘欄位仍需另外組裝）
// userId 不傳：只搜尋公開紀錄，不限定作者
async function getPublicReviewsByKeyword(
	supabase: Awaited<ReturnType<typeof createClient>>,
	keyword: string,
	tagIds: string[] | undefined,
	page: number,
	sort: PublicReviewSort,
): Promise<ReviewsPage> {
	const { ids, totalCount } = await searchConcertRecordIds(supabase, {
		keyword,
		publicOnly: true,
		tagIds,
		page,
		pageSize: PAGE_SIZE,
	});
	if (ids.length === 0) {
		return { reviews: [], totalCount, totalPages: 1 };
	}

	const { data, error } = await supabase
		.from("concert_records_with_like_count")
		.select(LIST_COLUMNS)
		.in("id", ids);
	if (error) {
		throw new Error(`讀取公開心得失敗：${error.message}`);
	}

	const orderedRows = reorderByKeywordSearch(data ?? [], ids, sort);
	const recordIds = orderedRows.map((r) => r.id!);
	const tagsByRecordId = await getTagsByRecordIds(recordIds);
	const reviews = orderedRows.map((r) => mapPublicReviewRow(r, tagsByRecordId.get(r.id!) ?? []));

	return {
		reviews,
		totalCount,
		totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
	};
}

// 某使用者的公開心得列表（offset 分頁），供 /users/[id] 重用
export async function getPublicReviewsByAuthor(
	authorId: string,
	page = 1,
): Promise<ReviewsPage> {
	const supabase = await createClient();
	const from = (page - 1) * PAGE_SIZE;
	const to = from + PAGE_SIZE - 1;

	const { data, error, count } = await supabase
		.from("concert_records_with_like_count")
		.select(LIST_COLUMNS, { count: "exact" })
		.eq("is_public", true)
		.eq("user_id", authorId)
		.order("created_at", { ascending: false })
		.range(from, to);

	if (error) {
		throw new Error(`讀取使用者公開心得失敗：${error.message}`);
	}

	const recordIds = (data ?? []).map((r) => r.id!);
	const tagsByRecordId = await getTagsByRecordIds(recordIds);
	const reviews = (data ?? []).map((r) => mapPublicReviewRow(r, tagsByRecordId.get(r.id!) ?? []));

	const totalCount = count ?? 0;
	return {
		reviews,
		totalCount,
		totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
	};
}

// 單篇公開心得（唯讀）。非公開或不存在 → null
// 用 cache() 包裝：同一次 request 內 generateMetadata 與頁面本體都會呼叫這支，
// 去重成一次查詢，避免重複打兩次資料庫
export const getPublicReviewById = cache(async function getPublicReviewById(
	id: string,
): Promise<PublicReviewDetail | null> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("concert_records")
		.select(
			"id, user_id, title, artist, venue_name, date, rating, review, spotify_playlist_id, cover_image_url, created_at, profiles(display_name, avatar_url)",
		)
		.eq("id", id)
		.eq("is_public", true)
		.maybeSingle();

	if (error) {
		throw new Error(`讀取公開心得失敗：${error.message}`);
	}
	if (!data) {
		return null;
	}

	const tags = await getRecordTags(id);
	return {
		id: data.id,
		user_id: data.user_id,
		title: data.title,
		artist: data.artist,
		venue_name: data.venue_name,
		date: data.date,
		rating: data.rating,
		review: data.review,
		spotify_playlist_id: data.spotify_playlist_id,
		cover_image_url: data.cover_image_url,
		created_at: data.created_at,
		author: data.profiles?.display_name ?? null,
		author_avatar_url: data.profiles?.avatar_url ?? null,
		tags,
	};
});

const RELATED_LIMIT = 3;

// 同藝人的其他公開心得，依讚數排序取前幾筆（排除自己）；用 concert_records_with_like_count view
export async function getRelatedReviewsByArtist(
	artist: string,
	excludeId: string,
): Promise<PublicReview[]> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("concert_records_with_like_count")
		.select(LIST_COLUMNS)
		.eq("is_public", true)
		.eq("artist", artist)
		.neq("id", excludeId)
		.order("like_count", { ascending: false })
		.limit(RELATED_LIMIT);

	if (error) {
		throw new Error(`讀取相關文章失敗：${error.message}`);
	}

	const recordIds = (data ?? []).map((r) => r.id!);
	const tagsByRecordId = await getTagsByRecordIds(recordIds);
	return (data ?? []).map((r) => mapPublicReviewRow(r, tagsByRecordId.get(r.id!) ?? []));
}
