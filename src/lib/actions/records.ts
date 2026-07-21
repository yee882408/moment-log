"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { recordSchema, type RecordInput } from "@/lib/validation/record";
import {
	getMyRecords,
	type RecordFilters,
	type RecordsPage,
	type RecordSort,
} from "@/lib/data/records";
import { upsertTagsByName } from "@/lib/actions/tags";
import type { ActionResult } from "@/lib/actions/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// 建立/更新紀錄成功後同步標籤：先 upsert 出對應的 tag id，updateRecord 情境要先清掉
// 該紀錄現有的 join row 再重新 insert（資料量小，直接整批替換比算 diff 簡單）
async function syncRecordTags(
	supabase: SupabaseClient<Database>,
	recordId: string,
	tagNames: string[],
	mode: "insert" | "replace",
): Promise<{ error: string } | undefined> {
	if (mode === "replace") {
		const { error: deleteError } = await supabase
			.from("concert_record_tags")
			.delete()
			.eq("record_id", recordId);
		if (deleteError) {
			return { error: deleteError.message };
		}
	}

	if (tagNames.length === 0) {
		return undefined;
	}

	const tags = await upsertTagsByName(tagNames);
	if ("error" in tags) {
		return tags;
	}

	const { error: insertError } = await supabase
		.from("concert_record_tags")
		.insert(tags.map((tag) => ({ record_id: recordId, tag_id: tag.id })));
	if (insertError) {
		return { error: insertError.message };
	}
	return undefined;
}

// 把表單欄位（camelCase）轉成資料表欄位（snake_case），空字串轉 null
// 非 export，"use server" 檔的 export 只能是 async function
function toRow(v: RecordInput) {
	return {
		title: v.title,
		artist: v.artist,
		venue_name: v.venueName,
		venue_lat: v.venueLat ?? null,
		venue_lng: v.venueLng ?? null,
		date: v.date,
		ticket_price: v.ticketPrice ?? null,
		rating: v.rating ?? null,
		review: v.review || null,
		spotify_playlist_id: v.spotifyPlaylistId || null,
		cover_image_url: v.coverImageUrl || null,
		is_public: v.isPublic,
	};
}

// 供 /concerts 的搜尋列在 Client Component 內查詢用，不經過 URL/整頁刷新
export async function searchMyRecords(
	page: number,
	filters: RecordFilters,
	sort: RecordSort = "newest",
): Promise<RecordsPage> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return { records: [], totalCount: 0, totalPages: 1 };
	}

	return getMyRecords(user.id, filters, page, sort);
}

export async function createRecord(input: RecordInput): Promise<ActionResult> {
	// 伺服器端再驗一次：前端 Zod 只是 UX，可被繞過，這層才是真防線
	const parsed = recordSchema.safeParse(input);
	if (!parsed.success) {
		return { error: "資料格式錯誤" };
	}

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return { error: "尚未登入" };
	}

	// user_id 由伺服器端的登入者決定，前端無法偽造
	// template_id 只在新增時寫入（記錄套用來源）；updateRecord 不碰它，編輯不會清掉來源
	const { data, error } = await supabase
		.from("concert_records")
		.insert({
			user_id: user.id,
			template_id: parsed.data.templateId ?? null,
			...toRow(parsed.data),
		})
		.select("id")
		.single();

	if (error) {
		return { error: error.message };
	}

	const tagResult = await syncRecordTags(supabase, data.id, parsed.data.tags, "insert");
	if (tagResult?.error) {
		return tagResult;
	}

	revalidatePath("/concerts"); // 讓列表頁的快取失效，重新撈最新資料
	redirect("/concerts");
}

export async function updateRecord(
	id: string,
	input: RecordInput,
): Promise<ActionResult> {
	const parsed = recordSchema.safeParse(input);
	if (!parsed.success) {
		return { error: "資料格式錯誤" };
	}

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return { error: "尚未登入" };
	}

	// eq user_id 與 RLS 雙重保險：只能改自己的
	const { error } = await supabase
		.from("concert_records")
		.update(toRow(parsed.data))
		.eq("id", id)
		.eq("user_id", user.id);

	if (error) {
		return { error: error.message };
	}

	const tagResult = await syncRecordTags(supabase, id, parsed.data.tags, "replace");
	if (tagResult?.error) {
		return tagResult;
	}

	revalidatePath("/concerts");
	revalidatePath(`/concerts/${id}`);
	revalidatePath(`/reviews/${id}`);
	// 跟列表頁（RecordSearch）的連結邏輯一致：公開紀錄的詳情頁是 /reviews/[id]（無編輯/
	// 刪除按鈕，任何人可看），私密的才是 /concerts/[id]（本人專用管理頁）。編輯完不分流
	// 會導致同一篇紀錄在「列表點進去」跟「編輯完儲存」看到兩種不同外觀的詳情頁
	redirect(parsed.data.isPublic ? `/reviews/${id}` : `/concerts/${id}`);
}

export async function deleteRecord(id: string): Promise<ActionResult> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return { error: "尚未登入" };
	}

	const { error } = await supabase
		.from("concert_records")
		.delete()
		.eq("id", id)
		.eq("user_id", user.id);

	if (error) {
		return { error: error.message };
	}

	revalidatePath("/concerts");
	redirect("/concerts");
}
