import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface SiteStats {
	publicReviewCount: number;
	publicSpotListCount: number;
}

// 首頁用的全站規模數字（不分使用者）。head: true 只拿筆數不搬資料列，
// 三個 count 各自獨立查詢即可，資料量小，不需要額外的 RPC 聚合
export async function getSiteStats(): Promise<SiteStats> {
	const supabase = await createClient();

	const [{ count: publicReviewCount }, { count: publicSpotListCount }] = await Promise.all([
		supabase
			.from("concert_records")
			.select("id", { count: "exact", head: true })
			.eq("is_public", true),
		supabase
			.from("spot_lists")
			.select("id", { count: "exact", head: true })
			.eq("is_public", true),
	]);

	return {
		publicReviewCount: publicReviewCount ?? 0,
		publicSpotListCount: publicSpotListCount ?? 0,
	};
}
