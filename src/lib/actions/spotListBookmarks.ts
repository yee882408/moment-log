"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
	getMyBookmarkedSpotLists,
	type BookmarkedSpotListFilters,
	type BookmarkedSpotListSort,
	type BookmarkedSpotListsPage,
} from "@/lib/data/spotListBookmarks";
import { toGenericActionError, type ActionResult } from "@/lib/actions/types";

const UNIQUE_VIOLATION = "23505";

// 供 /bookmarks/spots 的搜尋列在 Client Component 內查詢用，不經過 URL/整頁刷新
export async function searchBookmarkedSpotLists(
	page: number,
	filters: BookmarkedSpotListFilters,
	sort: BookmarkedSpotListSort,
): Promise<BookmarkedSpotListsPage> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return { lists: [], totalCount: 0, totalPages: 1 };
	}

	return getMyBookmarkedSpotLists(user.id, page, filters, sort);
}

// wasBookmarked：呼叫端目前的收藏狀態（切換前）；決定這次要 insert 還是 delete
export async function toggleSpotListBookmark(
	listId: string,
	wasBookmarked: boolean,
): Promise<ActionResult> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return { error: "尚未登入" };
	}

	if (wasBookmarked) {
		const { error } = await supabase
			.from("spot_list_bookmarks")
			.delete()
			.eq("list_id", listId)
			.eq("user_id", user.id);
		if (error) {
			return toGenericActionError(error, "toggleSpotListBookmark.delete");
		}
	} else {
		const { error } = await supabase
			.from("spot_list_bookmarks")
			.insert({ list_id: listId, user_id: user.id });
		// 重複收藏（例如雙開分頁快速點兩下）視為已達成目的，不當錯誤
		if (error && error.code !== UNIQUE_VIOLATION) {
			return toGenericActionError(error, "toggleSpotListBookmark.insert");
		}
	}

	revalidatePath(`/spots/${listId}`);
	revalidatePath("/bookmarks", "layout");
}
