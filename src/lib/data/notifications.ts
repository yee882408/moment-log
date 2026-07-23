import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type NotificationType = Database["public"]["Enums"]["notification_type"];

export interface NotificationItem {
	id: string;
	type: NotificationType;
	actorId: string;
	actorName: string;
	actorAvatarUrl: string | null;
	recordId: string | null;
	recordTitle: string | null;
	commentId: string | null;
	isRead: boolean;
	createdAt: string;
}

const LIST_LIMIT = 20;

interface CreateNotificationInput {
	userId: string; // 通知的接收者
	actorId: string; // 觸發這則通知的人（呼叫端必須傳目前登入者的 id，這裡會再驗證一次）
	type: NotificationType;
	recordId?: string;
	commentId?: string;
}

// 供 follows.ts/likes.ts/comments.ts 的成功分支呼叫。刻意不在 actions/ 底下（不加
// "use server"）：這支函式信任呼叫端傳入的 actorId 代表「目前登入者」，若放在
// actions/ 會被 Next.js 視為可從前端直接呼叫的 Server Action，任何人都能繞過
// follows/likes/comments 的流程直接呼叫、帶入任意 actorId 對任意 userId 灌發假通知
// （RLS 只擋得住冒充別人的 actor_id，擋不住用自己身分對任意人狂發）。這裡額外驗證
// actorId 必須等於當下 session 的使用者，即使日後這支被誤搬到 actions/ 底下，
// 也不會讓呼叫端能冒充別人發送通知
// 自己操作自己的不通知；失敗只吞掉不往外拋——通知寫入失敗不該讓按讚/留言/追蹤本身失敗
export async function createNotification(input: CreateNotificationInput): Promise<void> {
	if (input.userId === input.actorId) {
		return;
	}

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user || user.id !== input.actorId) {
		console.error("建立通知失敗：actorId 與目前登入者不符");
		return;
	}

	const { error } = await supabase.from("notifications").insert({
		user_id: input.userId,
		actor_id: input.actorId,
		type: input.type,
		record_id: input.recordId ?? null,
		comment_id: input.commentId ?? null,
	});
	if (error) {
		console.error(`建立通知失敗（type=${input.type}）：${error.message}`);
	}
}

// Popover 清單用：join profiles（actor 顯示名/頭像）與 concert_records（標題），
// 讓 UI 不用再各自查一次
export async function getNotifications(userId: string): Promise<NotificationItem[]> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("notifications")
		.select(
			"id, type, actor_id, record_id, comment_id, is_read, created_at, profiles!notifications_actor_id_fkey(display_name, avatar_url), concert_records(title)",
		)
		.eq("user_id", userId)
		.order("created_at", { ascending: false })
		.limit(LIST_LIMIT);

	if (error) {
		throw new Error(`讀取通知失敗：${error.message}`);
	}

	return (data ?? []).map((n) => ({
		id: n.id,
		type: n.type,
		actorId: n.actor_id,
		actorName: n.profiles?.display_name ?? "匿名",
		actorAvatarUrl: n.profiles?.avatar_url ?? null,
		recordId: n.record_id,
		recordTitle: n.concert_records?.title ?? null,
		commentId: n.comment_id,
		isRead: n.is_read,
		createdAt: n.created_at,
	}));
}

// 鈴鐺徽章用：只算數量，head:true 不搬資料列，減少流量
export async function getUnreadCount(userId: string): Promise<number> {
	const supabase = await createClient();
	const { count, error } = await supabase
		.from("notifications")
		.select("id", { count: "exact", head: true })
		.eq("user_id", userId)
		.eq("is_read", false);

	if (error) {
		throw new Error(`讀取未讀通知數失敗：${error.message}`);
	}
	return count ?? 0;
}
