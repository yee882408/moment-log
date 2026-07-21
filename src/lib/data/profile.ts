import "server-only";

import { createClient } from "@/lib/supabase/server";

// 目前登入者是否為 admin（讀 profiles.role）。未登入回 false
export async function isCurrentUserAdmin(): Promise<boolean> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return false;
	}

	const { data } = await supabase
		.from("profiles")
		.select("role")
		.eq("id", user.id)
		.maybeSingle();

	return data?.role === "admin";
}

export interface CurrentUserProfile {
	id: string;
	email: string | null;
	displayName: string;
	avatarUrl: string | null;
}

// 目前登入者的個人檔案，供 SiteHeader（頭像/選單）與 /profile 頁面共用。未登入回 null
export async function getCurrentUserProfile(): Promise<CurrentUserProfile | null> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return null;
	}

	const { data, error } = await supabase
		.from("profiles")
		.select("display_name, avatar_url")
		.eq("id", user.id)
		.maybeSingle();
	if (error) {
		throw new Error(`讀取個人檔案失敗：${error.message}`);
	}

	return {
		id: user.id,
		email: user.email ?? null,
		displayName: data?.display_name ?? "",
		avatarUrl: data?.avatar_url ?? null,
	};
}

export interface PublicProfile {
	id: string;
	displayName: string;
	avatarUrl: string | null;
}

// 任意使用者的公開檔案（供 /users/[id] 顯示對方資訊）。找不到回 null
export async function getPublicProfileById(id: string): Promise<PublicProfile | null> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("profiles")
		.select("id, display_name, avatar_url")
		.eq("id", id)
		.maybeSingle();
	if (error) {
		throw new Error(`讀取使用者失敗：${error.message}`);
	}
	if (!data) {
		return null;
	}

	return {
		id: data.id,
		displayName: data.display_name,
		avatarUrl: data.avatar_url,
	};
}
