"use server";

import { createClient } from "@/lib/supabase/server";
import { getNotifications, getUnreadCount, type NotificationItem } from "@/lib/data/notifications";

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
