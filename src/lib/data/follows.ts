import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface FollowState {
	followerCount: number;
	followingByMe: boolean;
}

// 使用者頁面用：這個人有幾個追蹤者 + 目前登入者是否已追蹤他（未登入一律 false）
export async function getFollowState(
	targetUserId: string,
	currentUserId: string | null,
): Promise<FollowState> {
	const supabase = await createClient();

	const { count, error: countError } = await supabase
		.from("follows")
		.select("id", { count: "exact", head: true })
		.eq("followee_id", targetUserId);
	if (countError) {
		throw new Error(`讀取追蹤者數失敗：${countError.message}`);
	}

	let followingByMe = false;
	if (currentUserId) {
		const { data, error } = await supabase
			.from("follows")
			.select("id")
			.eq("follower_id", currentUserId)
			.eq("followee_id", targetUserId)
			.maybeSingle();
		if (error) {
			throw new Error(`讀取追蹤狀態失敗：${error.message}`);
		}
		followingByMe = data !== null;
	}

	return { followerCount: count ?? 0, followingByMe };
}
