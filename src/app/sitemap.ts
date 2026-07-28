import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// sitemap 只讀公開資料、不需要登入狀態，直接用匿名 client 查詢，
// 不透過 lib/supabase/server.ts（那支依賴 next/headers 的 cookies()，
// 這裡不在 request context 內執行，用不到也不該用）
function createAnonClient() {
	return createClient<Database>(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
	);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const supabase = createAnonClient();

	const [{ data: reviews }, { data: spotLists }] = await Promise.all([
		supabase
			.from("concert_records")
			.select("id, created_at")
			.eq("is_public", true),
		supabase
			.from("spot_lists")
			.select("id, created_at")
			.eq("is_public", true),
	]);

	const reviewEntries: MetadataRoute.Sitemap = (reviews ?? []).map((r) => ({
		url: `${siteUrl}/reviews/${r.id}`,
		lastModified: r.created_at ?? undefined,
	}));

	const spotListEntries: MetadataRoute.Sitemap = (spotLists ?? []).map((l) => ({
		url: `${siteUrl}/spots/${l.id}`,
		lastModified: l.created_at ?? undefined,
	}));

	return [
		{ url: siteUrl, changeFrequency: "daily", priority: 1 },
		{ url: `${siteUrl}/reviews`, changeFrequency: "daily", priority: 0.8 },
		{ url: `${siteUrl}/spots`, changeFrequency: "daily", priority: 0.8 },
		...reviewEntries,
		...spotListEntries,
	];
}
