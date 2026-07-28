"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/data/notifications";
import { toGenericActionError, type ActionResult } from "@/lib/actions/types";

const UNIQUE_VIOLATION = "23505";

// wasFollowing：呼叫端目前的追蹤狀態（切換前）；決定這次要 insert 還是 delete
export async function toggleFollow(
	targetUserId: string,
	wasFollowing: boolean,
): Promise<ActionResult> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return { error: "尚未登入" };
	}
	if (user.id === targetUserId) {
		return { error: "無法追蹤自己" };
	}

	if (wasFollowing) {
		const { error } = await supabase
			.from("follows")
			.delete()
			.eq("follower_id", user.id)
			.eq("followee_id", targetUserId);
		if (error) {
			return toGenericActionError(error, "toggleFollow.delete");
		}
	} else {
		const { error } = await supabase
			.from("follows")
			.insert({ follower_id: user.id, followee_id: targetUserId });
		// 重複追蹤（例如雙開分頁快速點兩下）視為已達成目的，不當錯誤
		if (error && error.code !== UNIQUE_VIOLATION) {
			return toGenericActionError(error, "toggleFollow.insert");
		}
		if (!error) {
			await createNotification({ userId: targetUserId, actorId: user.id, type: "follow" });
		}
	}

	revalidatePath(`/users/${targetUserId}`);
}
