"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { concertSchema, type ConcertInput } from "@/lib/validation/concert";
import { isCurrentUserAdmin } from "@/lib/data/profile";
import { toGenericActionError, type ActionResult } from "@/lib/actions/types";

// 驗證；回傳 ok 的資料或錯誤。座標欄位已從表單移除，僅供既有資料 round-trip，選填
function validate(input: ConcertInput):
	| { ok: true; row: ConcertRowInput }
	| { ok: false; error: string } {
	const parsed = concertSchema.safeParse(input);
	if (!parsed.success) {
		return { ok: false, error: "資料格式錯誤" };
	}
	const v = parsed.data;
	return {
		ok: true,
		row: {
			title: v.title,
			artist: v.artist,
			venue_name: v.venueName,
			venue_lat: v.venueLat ?? null,
			venue_lng: v.venueLng ?? null,
			date: v.date,
		},
	};
}

// 範本欄位（不含 id / created_by / created_at）
interface ConcertRowInput {
	title: string;
	artist: string;
	venue_name: string;
	venue_lat: number | null;
	venue_lng: number | null;
	date: string;
}

export async function createTemplate(input: ConcertInput): Promise<ActionResult> {
	// 跟 updateTemplate/deleteTemplate 同樣的模式：action 自己也檢查一次，不只依賴 RLS
	if (!(await isCurrentUserAdmin())) {
		return { error: "沒有權限" };
	}

	const result = validate(input);
	if (!result.ok) {
		return { error: result.error };
	}

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return { error: "尚未登入" };
	}

	// RLS 的 concerts_admin_write 也會擋非 admin；created_by 記錄建立者
	const { error } = await supabase
		.from("concerts")
		.insert({ ...result.row, created_by: user.id });
	if (error) {
		return toGenericActionError(error, "createTemplate");
	}

	revalidatePath("/admin/concerts");
	redirect("/admin/concerts");
}

export async function updateTemplate(
	id: string,
	input: ConcertInput,
): Promise<ActionResult> {
	// 跟 createTemplate 同樣的模式：action 自己也檢查一次，不只依賴 RLS
	if (!(await isCurrentUserAdmin())) {
		return { error: "沒有權限" };
	}

	const result = validate(input);
	if (!result.ok) {
		return { error: result.error };
	}

	const supabase = await createClient();
	const { error } = await supabase
		.from("concerts")
		.update(result.row)
		.eq("id", id);
	if (error) {
		return toGenericActionError(error, "updateTemplate");
	}

	revalidatePath("/admin/concerts");
	revalidatePath(`/admin/concerts/${id}/edit`);
	redirect("/admin/concerts");
}

export async function deleteTemplate(id: string): Promise<ActionResult> {
	if (!(await isCurrentUserAdmin())) {
		return { error: "沒有權限" };
	}

	const supabase = await createClient();
	const { error } = await supabase.from("concerts").delete().eq("id", id);
	if (error) {
		return toGenericActionError(error, "deleteTemplate");
	}

	revalidatePath("/admin/concerts");
	redirect("/admin/concerts");
}
