"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { commentSchema, type CommentInput } from "@/lib/validation/comment";
import { getCommentsByRecordId, type CommentsPage } from "@/lib/data/comments";
import { createNotification } from "@/lib/data/notifications";
import { toGenericActionError, type ActionResult } from "@/lib/actions/types";

export type CreateCommentResult = { error: string } | { totalPages: number };

export async function createComment(
	recordId: string,
	input: CommentInput,
): Promise<CreateCommentResult> {
	const parsed = commentSchema.safeParse(input);
	if (!parsed.success) {
		return { error: "留言內容不符規則" };
	}

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return { error: "尚未登入" };
	}

	const { data: comment, error } = await supabase
		.from("record_comments")
		.insert({
			record_id: recordId,
			user_id: user.id,
			body: parsed.data.body,
		})
		.select("id")
		.single();
	if (error) {
		return toGenericActionError(error, "createComment");
	}

	const { data: record } = await supabase
		.from("concert_records")
		.select("user_id")
		.eq("id", recordId)
		.maybeSingle();
	if (record) {
		await createNotification({
			userId: record.user_id,
			actorId: user.id,
			type: "comment",
			recordId,
			commentId: comment.id,
		});
	}

	revalidatePath(`/reviews/${recordId}`);

	const { totalPages } = await getCommentsByRecordId(recordId, 1);
	return { totalPages };
}

// 供留言區塊在 Client Component 內換頁用，不經過 URL/整頁刷新
export async function getCommentsPage(
	recordId: string,
	page: number,
): Promise<CommentsPage> {
	return getCommentsByRecordId(recordId, page);
}

export async function deleteComment(
	commentId: string,
	recordId: string,
): Promise<ActionResult> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return { error: "尚未登入" };
	}

	// eq user_id 與 RLS 雙重保險：只能刪自己的留言（紀錄擁有者沒有額外刪除權）
	const { error } = await supabase
		.from("record_comments")
		.delete()
		.eq("id", commentId)
		.eq("user_id", user.id);
	if (error) {
		return toGenericActionError(error, "deleteComment");
	}

	revalidatePath(`/reviews/${recordId}`);
}
