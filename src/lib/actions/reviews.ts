"use server";

import {
	getPublicReviews,
	type PublicReviewFilters,
	type PublicReviewSort,
} from "@/lib/data/reviews";

interface ReviewsPageResult {
	reviews: Awaited<ReturnType<typeof getPublicReviews>>["reviews"];
	totalPages: number;
}

// 供 /reviews 的搜尋列在 Client Component 內查詢用，不經過 URL/整頁刷新
export async function searchPublicReviews(
	page: number,
	filters: PublicReviewFilters,
	sort: PublicReviewSort,
): Promise<ReviewsPageResult> {
	const { reviews, totalPages } = await getPublicReviews(page, filters, sort);
	return { reviews, totalPages };
}
