"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/types";

// newRole 只接受 "admin" | "user"；自我操作與非 admin 呼叫由 RPC function 內部擋下並 raise exception
export async function setUserRole(
	targetId: string,
	newRole: "admin" | "user",
): Promise<ActionResult> {
	const supabase = await createClient();
	const { error } = await supabase.rpc("admin_set_user_role", {
		target_id: targetId,
		new_role: newRole,
	});
	if (error) {
		return { error: error.message };
	}

	revalidatePath("/admin/users");
}

// 自我操作由 RPC function 內部擋下並 raise exception
export async function setUserBanned(
	targetId: string,
	banned: boolean,
): Promise<ActionResult> {
	const supabase = await createClient();
	const { error } = await supabase.rpc("admin_set_user_banned", {
		target_id: targetId,
		banned,
	});
	if (error) {
		return { error: error.message };
	}

	revalidatePath("/admin/users");
}
