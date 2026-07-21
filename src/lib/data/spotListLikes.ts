import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface SpotListLikeState {
	count: number;
	likedByMe: boolean;
}

// 清單詳情頁用：讚數 + 目前登入者是否已讚（未登入一律 false）
export async function getSpotListLikeState(
	listId: string,
	currentUserId: string | null,
): Promise<SpotListLikeState> {
	const supabase = await createClient();

	const { count, error: countError } = await supabase
		.from("spot_list_likes")
		.select("id", { count: "exact", head: true })
		.eq("list_id", listId);
	if (countError) {
		throw new Error(`讀取讚數失敗：${countError.message}`);
	}

	let likedByMe = false;
	if (currentUserId) {
		const { data, error } = await supabase
			.from("spot_list_likes")
			.select("id")
			.eq("list_id", listId)
			.eq("user_id", currentUserId)
			.maybeSingle();
		if (error) {
			throw new Error(`讀取按讚狀態失敗：${error.message}`);
		}
		likedByMe = data !== null;
	}

	return { count: count ?? 0, likedByMe };
}
