"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileSchema, type ProfileInput } from "@/lib/validation/profile";
import type { ActionResult } from "@/lib/actions/types";

export async function updateProfile(
	input: ProfileInput & { avatarUrl?: string },
): Promise<ActionResult> {
	const parsed = profileSchema.safeParse(input);
	if (!parsed.success) {
		return { error: "顯示名稱不符規則" };
	}

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return { error: "尚未登入" };
	}

	const { error } = await supabase
		.from("profiles")
		.update({
			display_name: parsed.data.displayName,
			...(input.avatarUrl ? { avatar_url: input.avatarUrl } : {}),
		})
		.eq("id", user.id);
	if (error) {
		return { error: error.message };
	}

	revalidatePath("/profile");
	revalidatePath("/", "layout"); // header 的頭像/名稱要跟著更新
}
