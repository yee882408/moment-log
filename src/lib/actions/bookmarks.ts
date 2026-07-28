"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
	getMyBookmarkedReviews,
	type BookmarkedReviewFilters,
	type BookmarkedReviewSort,
} from "@/lib/data/bookmarks";
import { toGenericActionError, type ActionResult } from "@/lib/actions/types";

const UNIQUE_VIOLATION = "23505";

interface BookmarkedReviewsPageResult {
	reviews: Awaited<ReturnType<typeof getMyBookmarkedReviews>>["reviews"];
	totalPages: number;
}

// 供 /bookmarks/reviews 的搜尋列在 Client Component 內查詢用，不經過 URL/整頁刷新
export async function searchBookmarkedReviews(
	page: number,
	filters: BookmarkedReviewFilters,
	sort: BookmarkedReviewSort,
): Promise<BookmarkedReviewsPageResult> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return { reviews: [], totalPages: 1 };
	}

	const { reviews, totalPages } = await getMyBookmarkedReviews(user.id, page, filters, sort);
	return { reviews, totalPages };
}

// wasBookmarked：呼叫端目前的收藏狀態（切換前）；決定這次要 insert 還是 delete
export async function toggleBookmark(
	recordId: string,
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
			.from("record_bookmarks")
			.delete()
			.eq("record_id", recordId)
			.eq("user_id", user.id);
		if (error) {
			return toGenericActionError(error, "toggleBookmark.delete");
		}
	} else {
		const { error } = await supabase
			.from("record_bookmarks")
			.insert({ record_id: recordId, user_id: user.id });
		// 重複收藏（例如雙開分頁快速點兩下）視為已達成目的，不當錯誤
		if (error && error.code !== UNIQUE_VIOLATION) {
			return toGenericActionError(error, "toggleBookmark.insert");
		}
	}

	// 這篇紀錄可能是從 /concerts/[id] 或 /reviews/[id] 任一頁面觸發的操作，兩條路徑都要
	// revalidate；"/bookmarks" 用 layout 一次涵蓋底下所有子路由（含分頁全部頁面），
	// 對不存在快取的路徑呼叫是安全的 no-op
	revalidatePath(`/reviews/${recordId}`);
	revalidatePath(`/concerts/${recordId}`);
	revalidatePath("/bookmarks", "layout");
}
