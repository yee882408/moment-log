import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface AdminUserItem {
	id: string;
	displayName: string;
	avatarUrl: string | null;
	role: string;
	email: string;
	createdAt: string;
	isBanned: boolean;
}

const PAGE_SIZE = 10;

export interface AdminUsersPage {
	users: AdminUserItem[];
	totalCount: number;
	totalPages: number;
}

// 所有使用者列表，供 /admin/users 管理用；非 admin 呼叫 RPC 會回空陣列（function 內部檢查）
// RPC 回傳全部結果，無法用 range() 分頁，改在應用層對已排序好的陣列切片
export async function getAdminUsers(page = 1): Promise<AdminUsersPage> {
	const supabase = await createClient();
	const { data, error } = await supabase.rpc("admin_list_users");
	if (error) {
		throw new Error(`讀取使用者列表失敗：${error.message}`);
	}

	const all: AdminUserItem[] = (data ?? []).map((u) => ({
		id: u.id,
		displayName: u.display_name,
		avatarUrl: u.avatar_url,
		role: u.role,
		email: u.email,
		createdAt: u.created_at,
		isBanned: u.is_banned,
	}));

	const totalCount = all.length;
	const from = (page - 1) * PAGE_SIZE;
	return {
		users: all.slice(from, from + PAGE_SIZE),
		totalCount,
		totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
	};
}
