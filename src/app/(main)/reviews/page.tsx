import type { Metadata } from "next";
import type { ReactElement } from "react";
import { getPublicReviews, type PublicReviewSort } from "@/lib/data/reviews";
import { getTagsByIds } from "@/lib/data/tags";
import { parseSearchStateFromServerParams } from "@/lib/hooks/searchState";
import { ReviewSearch } from "@/components/reviews/ReviewSearch";

export const metadata: Metadata = {
	title: "心得分享",
	description: "瀏覽公開分享的演唱會心得，依藝人、標籤搜尋你感興趣的場次紀錄。",
};

interface PageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ReviewsPage({ searchParams }: PageProps): Promise<ReactElement> {
	const params = await searchParams;
	const state = parseSearchStateFromServerParams(params, "newest");
	const initialTags = await getTagsByIds(state.tagIds);

	const { reviews, totalPages } = await getPublicReviews(
		state.page,
		{
			keyword: state.keyword || undefined,
			tagIds: state.tagIds.length ? state.tagIds : undefined,
		},
		state.sort as PublicReviewSort
	);

	return (
		<main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
			<h1 className="text-xl font-semibold text-foreground">心得分享</h1>
			<ReviewSearch
				initialReviews={reviews}
				initialTotalPages={totalPages}
				initialState={state}
				initialTags={initialTags}
			/>
		</main>
	);
}
