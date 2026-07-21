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
