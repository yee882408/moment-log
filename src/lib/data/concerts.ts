import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type ConcertRow = Database["public"]["Tables"]["concerts"]["Row"];

export type TemplateListItem = Pick<
	ConcertRow,
	"id" | "title" | "artist" | "venue_name" | "date"
>;

export type TemplateDetail = Pick<
	ConcertRow,
	"id" | "title" | "artist" | "venue_name" | "venue_lat" | "venue_lng" | "date"
>;

// 給 /concerts/new 的範本下拉：需要座標一起帶，選了才能填入
export type TemplateOption = TemplateDetail;

const PAGE_SIZE = 9;

export interface TemplatesPage {
	templates: TemplateListItem[];
	totalCount: number;
	totalPages: number;
}

// 範本所有人可讀（RLS），列表不需 user 過濾；offset 分頁，page 從 1 起算
export async function getTemplates(page = 1): Promise<TemplatesPage> {
	const supabase = await createClient();
	const from = (page - 1) * PAGE_SIZE;
	const to = from + PAGE_SIZE - 1;

	const { data, error, count } = await supabase
		.from("concerts")
		.select("id, title, artist, venue_name, date", { count: "exact" })
		.order("date", { ascending: false })
		.range(from, to);

	if (error) {
		throw new Error(`讀取範本失敗：${error.message}`);
	}

	const totalCount = count ?? 0;
	return {
		templates: data ?? [],
		totalCount,
		totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
	};
}

// 範本下拉選項（含座標）。範本所有人可讀（RLS）
export async function getTemplateOptions(): Promise<TemplateOption[]> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("concerts")
		.select("id, title, artist, venue_name, venue_lat, venue_lng, date")
		.order("date", { ascending: false });
	if (error) {
		throw new Error(`讀取範本失敗：${error.message}`);
	}
	return data ?? [];
}

export async function getTemplateById(id: string): Promise<TemplateDetail | null> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("concerts")
		.select("id, title, artist, venue_name, venue_lat, venue_lng, date")
		.eq("id", id)
		.maybeSingle();
	if (error) {
		throw new Error(`讀取範本失敗：${error.message}`);
	}
	return data;
}
