"use server";

import { createClient } from "@/lib/supabase/server";
import { searchTags as searchTagsData, getSuggestedTags as getSuggestedTagsData, type TagOption } from "@/lib/data/tags";

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

// 給定標籤文字陣列，查詢已存在的、插入不存在的，回傳全部對應的 {id, name}。
// tags 表沒有 update policy（不可改名），不能用 upsert（重複 name 會走 ON CONFLICT DO
// UPDATE 而被 RLS 擋下），改成「先查已存在的，只 insert 真正不存在的」兩段式作法；
// 併發新增同名標籤時，insert 因 unique(name) 衝突失敗也沒關係，重新查一次就能拿到
// 別人剛建立的那筆
export async function upsertTagsByName(names: string[]): Promise<TagOption[] | { error: string }> {
	const trimmedNames = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
	if (trimmedNames.length === 0) {
		return [];
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
		return { error: selectError.message };
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
				return { error: error.message };
			}
			created = reQueried;
		} else {
			created = data ?? [];
		}
	}

	return [...(existing ?? []), ...created];
}
