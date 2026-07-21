"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
	spotListSchema,
	spotItemSchema,
	type SpotListInput,
	type SpotItemInput,
} from "@/lib/validation/spot";
import {
	getMySpotLists,
	getPublicSpotLists,
	getSpotListItems,
	type SpotListFilters,
	type SpotListsPage,
	type SpotListItem,
	type SpotListSort,
} from "@/lib/data/spots";
import type { ActionResult } from "@/lib/actions/types";

export type AddSpotItemResult = { error: string } | { items: SpotListItem[] };

// 供 /spots 列表頁在 Client Component 內查詢用，不經過 URL/整頁刷新
export async function searchMySpotLists(
	page: number,
	filters: SpotListFilters = {},
	sort: SpotListSort = "newest",
): Promise<SpotListsPage> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return { lists: [], totalCount: 0, totalPages: 1 };
	}

	return getMySpotLists(user.id, page, filters, sort);
}

export async function searchPublicSpotLists(
	page: number,
	filters: SpotListFilters,
	sort: SpotListSort = "newest",
): Promise<SpotListsPage> {
	return getPublicSpotLists(page, filters, sort);
}

export async function createSpotList(input: SpotListInput): Promise<ActionResult> {
	// 伺服器端再驗一次：前端 Zod 只是 UX，可被繞過，這層才是真防線
	const parsed = spotListSchema.safeParse(input);
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
	const { data, error } = await supabase
		.from("spot_lists")
		.insert({
			user_id: user.id,
			title: parsed.data.title,
			artist: parsed.data.artist,
			description: parsed.data.description || null,
			is_public: parsed.data.isPublic,
		})
		.select("id")
		.single();

	if (error) {
		return { error: error.message };
	}

	revalidatePath("/spots");
	// 建立後直接進清單詳情頁，呼應「先建清單再逐筆加地點」的流程
	redirect(`/spots/${data.id}`);
}

export async function updateSpotList(
	id: string,
	input: SpotListInput,
): Promise<ActionResult> {
	const parsed = spotListSchema.safeParse(input);
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
		.from("spot_lists")
		.update({
			title: parsed.data.title,
			artist: parsed.data.artist,
			description: parsed.data.description || null,
			is_public: parsed.data.isPublic,
		})
		.eq("id", id)
		.eq("user_id", user.id);

	if (error) {
		return { error: error.message };
	}

	revalidatePath("/spots");
	revalidatePath(`/spots/${id}`);
	redirect(`/spots/${id}`);
}

export async function deleteSpotList(id: string): Promise<ActionResult> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return { error: "尚未登入" };
	}

	const { error } = await supabase
		.from("spot_lists")
		.delete()
		.eq("id", id)
		.eq("user_id", user.id);

	if (error) {
		return { error: error.message };
	}

	revalidatePath("/spots");
	redirect("/spots");
}

// 新增地點後留在清單詳情頁（不 redirect），因為使用者通常會連續加好幾筆；
// 成功時直接回傳最新地點清單，讓 Client Component 更新畫面不用再多打一次查詢
export async function addSpotListItem(
	listId: string,
	input: SpotItemInput,
): Promise<AddSpotItemResult> {
	const parsed = spotItemSchema.safeParse(input);
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

	// RLS 已限制只能對自己的清單新增地點；這裡不用再手動驗 list_id 歸屬，policy 會擋
	const { error } = await supabase.from("spot_list_items").insert({
		list_id: listId,
		place_name: parsed.data.placeName,
		place_lat: parsed.data.placeLat,
		place_lng: parsed.data.placeLng,
		place_type: parsed.data.placeType ?? null,
		description: parsed.data.description || null,
		cover_image_url: parsed.data.coverImageUrl || null,
	});

	if (error) {
		return { error: error.message };
	}

	revalidatePath(`/spots/${listId}`);
	const items = await getSpotListItems(listId);
	return { items };
}

// 供 Client Component 換頁/重新整理時用（例如刪除地點後重新抓取最新清單）
export async function fetchSpotListItems(listId: string): Promise<SpotListItem[]> {
	return getSpotListItems(listId);
}

// 編輯既有地點；成功時直接回傳最新地點清單，讓 Client Component 更新畫面不用再多打一次查詢
export async function updateSpotListItem(
	itemId: string,
	listId: string,
	input: SpotItemInput,
): Promise<AddSpotItemResult> {
	const parsed = spotItemSchema.safeParse(input);
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

	// 查詢層 + RLS 雙重保險：只能改自己清單裡的地點（跟 updateSpotList 同樣的模式）
	const { data: list } = await supabase
		.from("spot_lists")
		.select("id")
		.eq("id", listId)
		.eq("user_id", user.id)
		.maybeSingle();
	if (!list) {
		return { error: "沒有權限" };
	}

	const { error } = await supabase
		.from("spot_list_items")
		.update({
			place_name: parsed.data.placeName,
			place_lat: parsed.data.placeLat,
			place_lng: parsed.data.placeLng,
			place_type: parsed.data.placeType ?? null,
			description: parsed.data.description || null,
			cover_image_url: parsed.data.coverImageUrl || null,
		})
		.eq("id", itemId)
		.eq("list_id", listId);

	if (error) {
		return { error: error.message };
	}

	revalidatePath(`/spots/${listId}`);
	const items = await getSpotListItems(listId);
	return { items };
}

export async function deleteSpotListItem(
	itemId: string,
	listId: string,
): Promise<ActionResult> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return { error: "尚未登入" };
	}

	// 查詢層 + RLS 雙重保險：只能刪自己清單裡的地點（跟 deleteSpotList 同樣的模式）
	const { data: list } = await supabase
		.from("spot_lists")
		.select("id")
		.eq("id", listId)
		.eq("user_id", user.id)
		.maybeSingle();
	if (!list) {
		return { error: "沒有權限" };
	}

	const { error } = await supabase
		.from("spot_list_items")
		.delete()
		.eq("id", itemId)
		.eq("list_id", listId);

	if (error) {
		return { error: error.message };
	}

	revalidatePath(`/spots/${listId}`);
}
