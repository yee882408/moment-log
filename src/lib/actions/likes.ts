"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/actions/notifications";
import type { ActionResult } from "@/lib/actions/types";

const UNIQUE_VIOLATION = "23505";

// wasLiked：呼叫端目前的按讚狀態（切換前）；決定這次要 insert 還是 delete
export async function toggleLike(
	recordId: string,
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
			.from("record_likes")
			.delete()
			.eq("record_id", recordId)
			.eq("user_id", user.id);
		if (error) {
			return { error: error.message };
		}
	} else {
		const { error } = await supabase
			.from("record_likes")
			.insert({ record_id: recordId, user_id: user.id });
		// 重複按讚（例如雙開分頁快速點兩下）視為已達成目的，不當錯誤
		if (error && error.code !== UNIQUE_VIOLATION) {
			return { error: error.message };
		}
		if (!error) {
			const { data: record } = await supabase
				.from("concert_records")
				.select("user_id")
				.eq("id", recordId)
				.maybeSingle();
			if (record) {
				await createNotification({
					userId: record.user_id,
					actorId: user.id,
					type: "like",
					recordId,
				});
			}
		}
	}

	revalidatePath(`/reviews/${recordId}`);
}
