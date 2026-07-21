import "server-only";

import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type ConcertRecordSort = "newest" | "oldest" | "popular" | "relevance";

interface SearchConcertRecordIdsParams {
	keyword: string;
	userId?: string;
	publicOnly: boolean;
	tagIds?: string[];
	page: number;
	pageSize: number;
}

interface SearchConcertRecordIdsResult {
	ids: string[];
	totalCount: number;
}

// 有關鍵字時的共用查詢：呼叫全文搜尋 RPC（tsvector + trigram）拿排序後的 id 清單與總數
// 供 records.ts（我的紀錄）、reviews.ts（公開心得）共用；呼叫端各自再用 .in("id", ids)
// 撈自己需要的完整欄位，因為兩邊最終的 DTO 形狀不同（RecordListItem vs PublicReview）
export async function searchConcertRecordIds(
	supabase: SupabaseClient,
	{ keyword, userId, publicOnly, tagIds, page, pageSize }: SearchConcertRecordIdsParams,
): Promise<SearchConcertRecordIdsResult> {
	const from = (page - 1) * pageSize;
	const rpcTagIds = tagIds?.length ? tagIds : undefined;

	const { data: rankedIds, error: rpcError } = await supabase.rpc("search_concert_records", {
		p_keyword: keyword,
		p_user_id: userId,
		p_public_only: publicOnly,
		p_tag_ids: rpcTagIds,
		p_limit: pageSize,
		p_offset: from,
	});
	if (rpcError) {
		throw new Error(`搜尋失敗：${rpcError.message}`);
	}

	const { data: totalCount, error: countError } = await supabase.rpc("search_concert_records_count", {
		p_keyword: keyword,
		p_user_id: userId,
		p_public_only: publicOnly,
		p_tag_ids: rpcTagIds,
	});
	if (countError) {
		throw new Error(`搜尋失敗：${countError.message}`);
	}

	return {
		ids: (rankedIds ?? []).map((r) => r.id),
		totalCount: totalCount ?? 0,
	};
}

// RPC 已依 rank 排好順序，.in() 不保證回傳順序；relevance 排序時依 ids 順序重排，
// 其他排序在記憶體對這頁資料（最多 pageSize 筆）重新排序，成本可忽略
export function reorderByKeywordSearch<T extends { id: string | null; date: string | null; like_count: number | null }>(
	rows: T[],
	ids: string[],
	sort: ConcertRecordSort,
): T[] {
	if (sort === "relevance") {
		const byId = new Map(rows.map((r) => [r.id, r]));
		return ids.map((id) => byId.get(id)).filter((r): r is T => r != null);
	}
	return [...rows].sort((a, b) => {
		if (sort === "popular") return (b.like_count ?? 0) - (a.like_count ?? 0);
		const cmp = (a.date ?? "").localeCompare(b.date ?? "");
		return sort === "oldest" ? cmp : -cmp;
	});
}
