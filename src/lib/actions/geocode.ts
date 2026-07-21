"use server";

import type { VenueResult } from "@/lib/types/venue";

// 透過伺服器代理打 Nominatim：才設得了 User-Agent（其使用政策要求），也不暴露細節給前端
export async function searchVenues(query: string): Promise<VenueResult[]> {
	const q = query.trim();
	if (!q) {
		return [];
	}

	const url =
		"https://nominatim.openstreetmap.org/search" +
		`?q=${encodeURIComponent(q)}&format=json&limit=5`;

	const res = await fetch(url, {
		headers: {
			// Nominatim 使用政策要求標明 App 身分
			"User-Agent": "moment-log/0.1 (practice project)",
		},
	});
	if (!res.ok) {
		return [];
	}

	const data = (await res.json()) as Array<{
		display_name: string;
		lat: string;
		lon: string;
	}>;

	return data.map((d) => ({
		label: d.display_name,
		lat: Number(d.lat),
		lng: Number(d.lon),
	}));
}
