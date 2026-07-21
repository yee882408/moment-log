"use server";

import { createClient } from "@/lib/supabase/server";
import {
	getNotifications,
	getUnreadCount,
	type NotificationItem,
	type NotificationType,
} from "@/lib/data/notifications";

interface CreateNotificationInput {
	userId: string; // 通知的接收者
	actorId: string; // 觸發這則通知的人（目前登入者）
	type: NotificationType;
	recordId?: string;
	commentId?: string;
}

// 供 follows.ts/likes.ts/comments.ts 的成功分支呼叫。自己操作自己的不通知；
// 失敗只吞掉不往外拋——通知寫入失敗不該讓按讚/留言/追蹤本身失敗
export async function createNotification(input: CreateNotificationInput): Promise<void> {
	if (input.userId === input.actorId) {
		return;
	}

	const supabase = await createClient();
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

// Popover 開啟時呼叫：一次把目前所有未讀通知標記已讀
export async function markAllAsRead(): Promise<void> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return;
	}

	const { error } = await supabase
		.from("notifications")
		.update({ is_read: true })
		.eq("user_id", user.id)
		.eq("is_read", false);
	if (error) {
		console.error(`標記通知已讀失敗：${error.message}`);
	}
}

// 供 Client Component（NotificationBell）呼叫的薄包裝，data 層本身標記
// server-only 不能被 client 直接 import
export async function getNotificationsAction(): Promise<NotificationItem[]> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return [];
	}
	return getNotifications(user.id);
}

export async function getUnreadCountAction(): Promise<number> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return 0;
	}
	return getUnreadCount(user.id);
}
