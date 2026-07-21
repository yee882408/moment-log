import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface TagOption {
	id: string;
	name: string;
}

const SEARCH_LIMIT = 10;
const SUGGESTED_LIMIT = 5;

// autocomplete 用：依名稱前綴模糊比對，供 TagInput/TagFilterDropdown 打字時查詢
export async function searchTags(query: string): Promise<TagOption[]> {
	const trimmed = query.trim();
	if (!trimmed) {
		return [];
	}

	const supabase = await createClient();
	const kw = trimmed.replace(/[%,]/g, ""); // 濾掉 ilike 萬用字元
	const { data, error } = await supabase
		.from("tags")
		.select("id, name")
		.ilike("name", `${kw}%`)
		.order("name")
		.limit(SEARCH_LIMIT);

	if (error) {
		throw new Error(`搜尋標籤失敗：${error.message}`);
	}
	return data ?? [];
}

// 編輯紀錄時預填目前已有的標籤
export async function getRecordTags(recordId: string): Promise<TagOption[]> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("concert_record_tags")
		.select("tags(id, name)")
		.eq("record_id", recordId);

	if (error) {
		throw new Error(`讀取紀錄標籤失敗：${error.message}`);
	}
	return (data ?? []).map((r) => r.tags).filter((t): t is TagOption => t != null);
}

// 批次查詢一批紀錄各自的標籤，避免在列表 map 迴圈內對每筆紀錄各發一次查詢（N+1）。
// 供 records.ts（我的紀錄列表）、reviews.ts（公開心得列表）共用
export async function getTagsByRecordIds(recordIds: string[]): Promise<Map<string, TagOption[]>> {
	const result = new Map<string, TagOption[]>();
	if (recordIds.length === 0) {
		return result;
	}

	const supabase = await createClient();
	const { data, error } = await supabase
		.from("concert_record_tags")
		.select("record_id, tags(id, name)")
		.in("record_id", recordIds);

	if (error) {
		throw new Error(`讀取標籤失敗：${error.message}`);
	}

	for (const row of data ?? []) {
		if (!row.tags) {
			continue;
		}
		const list = result.get(row.record_id) ?? [];
		list.push(row.tags);
		result.set(row.record_id, list);
	}
	return result;
}

// 依 id 清單取回標籤名稱；URL 帶入 tagIds 時，初始渲染需要名稱才能顯示已選標籤 chip
export async function getTagsByIds(tagIds: string[]): Promise<TagOption[]> {
	if (tagIds.length === 0) {
		return [];
	}
	const supabase = await createClient();
	const { data, error } = await supabase.from("tags").select("id, name").in("id", tagIds);
	if (error) {
		throw new Error(`讀取標籤失敗：${error.message}`);
	}
	return data ?? [];
}

// TagFilterDropdown 初始（未輸入時）用：使用者自己用過的標籤 + 全站熱門標籤混合，各取一部分湊到 SUGGESTED_LIMIT 筆
export async function getSuggestedTags(userId: string | null): Promise<TagOption[]> {
	const supabase = await createClient();

	const ownedTags: TagOption[] = [];
	if (userId) {
		const { data, error } = await supabase
			.from("concert_record_tags")
			.select("tags(id, name), concert_records!inner(user_id)")
			.eq("concert_records.user_id", userId)
			.limit(20);
		if (error) {
			throw new Error(`讀取常用標籤失敗：${error.message}`);
		}
		for (const row of data ?? []) {
			if (row.tags && !ownedTags.some((t) => t.id === row.tags!.id)) {
				ownedTags.push(row.tags);
			}
		}
	}

	// 全站熱門標籤：依 concert_record_tags 出現次數排序。Supabase JS 沒有直接的
	// group-by-count 查詢語法，這裡改用 RPC 較合適，但範圍內先用簡化版本：
	// 撈一批 join 資料在應用層做計數（資料量小，標籤功能剛上線不會有效能疑慮）
	const { data: allTagRows, error: popularError } = await supabase
		.from("concert_record_tags")
		.select("tags(id, name)")
		.limit(500);
	if (popularError) {
		throw new Error(`讀取熱門標籤失敗：${popularError.message}`);
	}

	const countByTagId = new Map<string, { tag: TagOption; count: number }>();
	for (const row of allTagRows ?? []) {
		if (!row.tags) {
			continue;
		}
		const entry = countByTagId.get(row.tags.id);
		if (entry) {
			entry.count += 1;
		} else {
			countByTagId.set(row.tags.id, { tag: row.tags, count: 1 });
		}
	}
	const popularTags = [...countByTagId.values()]
		.sort((a, b) => b.count - a.count)
		.map((e) => e.tag);

	const result: TagOption[] = [];
	const usedIds = new Set<string>();
	// 先放使用者用過的（最多取一半名額），再補熱門標籤湊滿
	for (const tag of ownedTags) {
		if (result.length >= SUGGESTED_LIMIT) {
			break;
		}
		result.push(tag);
		usedIds.add(tag.id);
	}
	for (const tag of popularTags) {
		if (result.length >= SUGGESTED_LIMIT) {
			break;
		}
		if (!usedIds.has(tag.id)) {
			result.push(tag);
			usedIds.add(tag.id);
		}
	}
	return result;
}
