"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/types";

const UNIQUE_VIOLATION = "23505";

// wasLiked：呼叫端目前的按讚狀態（切換前）；決定這次要 insert 還是 delete
export async function toggleSpotListLike(
	listId: string,
	wasLiked: boolean,
): Promise<ActionResult> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return { error: "尚未登入" };
	}

	if (wasLiked) {
		const { error } = await supabase
			.from("spot_list_likes")
			.delete()
			.eq("list_id", listId)
			.eq("user_id", user.id);
		if (error) {
			return { error: error.message };
		}
	} else {
		const { error } = await supabase
			.from("spot_list_likes")
			.insert({ list_id: listId, user_id: user.id });
		// 重複按讚（例如雙開分頁快速點兩下）視為已達成目的，不當錯誤
		if (error && error.code !== UNIQUE_VIOLATION) {
			return { error: error.message };
		}
	}

	revalidatePath(`/spots/${listId}`);
}
