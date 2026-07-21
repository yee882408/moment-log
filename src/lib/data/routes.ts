import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface VenueChoice {
	name: string;
	lat: number;
	lng: number;
}

const PAGE_SIZE = 10;

export interface VenuesPage {
	venues: VenueChoice[];
	totalCount: number;
	totalPages: number;
}

// 可規劃路線的場館來源：範本 + 自己紀錄過（有座標的），依名稱去重
// 去重是在應用層做的（合併兩個表的結果），分頁也只能在去重後、於記憶體中切片
export async function getRouteVenues(
	userId: string,
	page = 1,
): Promise<VenuesPage> {
	const supabase = await createClient();
	const [mine, templates] = await Promise.all([
		supabase
			.from("concert_records")
			.select("venue_name, venue_lat, venue_lng")
			.eq("user_id", userId)
			.not("venue_lat", "is", null),
		supabase.from("concerts").select("venue_name, venue_lat, venue_lng"),
	]);
	if (mine.error) {
		throw new Error(`讀取場館失敗：${mine.error.message}`);
	}
	if (templates.error) {
		throw new Error(`讀取場館失敗：${templates.error.message}`);
	}

	const seen = new Set<string>();
	const all: VenueChoice[] = [];
	for (const row of [...(templates.data ?? []), ...(mine.data ?? [])]) {
		if (row.venue_lat == null || row.venue_lng == null) {
			continue;
		}
		if (seen.has(row.venue_name)) {
			continue;
		}
		seen.add(row.venue_name);
		all.push({
			name: row.venue_name,
			lat: row.venue_lat,
			lng: row.venue_lng,
		});
	}

	const totalCount = all.length;
	const from = (page - 1) * PAGE_SIZE;
	return {
		venues: all.slice(from, from + PAGE_SIZE),
		totalCount,
		totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
	};
}
