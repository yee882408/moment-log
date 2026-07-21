"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// 共用登出邏輯：signOut → 導回首頁 → refresh 讓 Server Component 重新讀取登入狀態
// 供 SignOutButton、UserMenu、NavLinks（手機版選單）共用
export function useSignOut(): (onBeforeNavigate?: () => void) => Promise<void> {
	const router = useRouter();

	return async (onBeforeNavigate?: () => void) => {
		const supabase = createClient();
		await supabase.auth.signOut();
		onBeforeNavigate?.();
		router.push("/");
		router.refresh();
	};
}
