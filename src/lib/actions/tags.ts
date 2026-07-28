"use server";

import { createClient } from "@/lib/supabase/server";
import { searchTags as searchTagsData, getSuggestedTags as getSuggestedTagsData, type TagOption } from "@/lib/data/tags";
import { toGenericActionError } from "@/lib/actions/types";

// 供 Client Component（TagInput/TagFilterDropdown）呼叫的薄包裝，data 層本身標記
// server-only 不能被 client 直接 import
export async function searchTags(query: string): Promise<TagOption[]> {
	return searchTagsData(query);
}

export async function getSuggestedTags(): Promise<TagOption[]> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	return getSuggestedTagsData(user?.id ?? null);
}

const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 20;

// 給定標籤文字陣列，查詢已存在的、插入不存在的，回傳全部對應的 {id, name}。
// tags 表沒有 update policy（不可改名），不能用 upsert（重複 name 會走 ON CONFLICT DO
// UPDATE 而被 RLS 擋下），改成「先查已存在的，只 insert 真正不存在的」兩段式作法；
// 併發新增同名標籤時，insert 因 unique(name) 衝突失敗也沒關係，重新查一次就能拿到
// 別人剛建立的那筆
//
// 上限比照 recordSchema.tags（10 筆、單一 20 字）：這支是可從前端直接呼叫的 Server
// Action，不會經過表單的 zod 驗證，若不在這裡也做同樣的上限檢查，可以被繞過表單
// 直接塞入大量/超長字串到 tags 表（該表也沒有對應的 DB check constraint）
export async function upsertTagsByName(names: string[]): Promise<TagOption[] | { error: string }> {
	const trimmedNames = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
	if (trimmedNames.length === 0) {
		return [];
	}
	if (trimmedNames.length > MAX_TAGS) {
		return { error: `最多 ${MAX_TAGS} 個標籤` };
	}
	if (trimmedNames.some((name) => name.length > MAX_TAG_LENGTH)) {
		return { error: `單一標籤不可超過 ${MAX_TAG_LENGTH} 字` };
	}

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return { error: "尚未登入" };
	}

	const { data: existing, error: selectError } = await supabase
		.from("tags")
		.select("id, name")
		.in("name", trimmedNames);
	if (selectError) {
		return toGenericActionError(selectError, "upsertTagsByName.select");
	}

	const existingNames = new Set((existing ?? []).map((t) => t.name));
	const newNames = trimmedNames.filter((name) => !existingNames.has(name));

	let created: TagOption[] = [];
	if (newNames.length > 0) {
		const { data, error } = await supabase
			.from("tags")
			.insert(newNames.map((name) => ({ name })))
			.select("id, name");
		if (error) {
			// 併發情況下可能剛好被別人搶先建立同名標籤（unique 衝突），重新查一次撈出結果
			const { data: reQueried, error: reQueryError } = await supabase
				.from("tags")
				.select("id, name")
				.in("name", newNames);
			if (reQueryError || !reQueried) {
				return toGenericActionError(error, "upsertTagsByName.insert");
			}
			created = reQueried;
		} else {
			created = data ?? [];
		}
	}

	return [...(existing ?? []), ...created];
}
