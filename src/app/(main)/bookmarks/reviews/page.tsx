import type { Metadata } from "next";
import type { ReactElement } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyBookmarkedReviews, type BookmarkedReviewSort } from "@/lib/data/bookmarks";
import { getTagsByIds } from "@/lib/data/tags";
import { parseSearchStateFromServerParams } from "@/lib/hooks/searchState";
import { BookmarkedReviewSearch } from "@/components/bookmarks/BookmarkedReviewSearch";

export const metadata: Metadata = {
	title: "收藏的心得",
	description: "瀏覽你收藏的所有演唱會心得。",
	robots: { index: false },
};

interface PageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BookmarkedReviewsPage({ searchParams }: PageProps): Promise<ReactElement> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		redirect("/login");
	}

	const params = await searchParams;
	const state = parseSearchStateFromServerParams(params, "newest");
	const initialTags = await getTagsByIds(state.tagIds);

	const { reviews, totalPages } = await getMyBookmarkedReviews(
		user.id,
		state.page,
		{
			keyword: state.keyword || undefined,
			tagIds: state.tagIds.length ? state.tagIds : undefined,
		},
		state.sort as BookmarkedReviewSort,
	);

	return (
		<main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
			<div className="flex flex-col gap-1">
				<Link href="/bookmarks" className="text-sm text-muted-foreground hover:text-foreground">
					← 返回我的收藏
				</Link>
				<span className="mt-2 text-xs font-bold tracking-wider text-primary uppercase">
					我的珍藏
				</span>
				<h1 className="text-2xl font-extrabold tracking-tight text-foreground">收藏的心得</h1>
			</div>
			<BookmarkedReviewSearch
				initialReviews={reviews}
				initialTotalPages={totalPages}
				initialState={state}
				initialTags={initialTags}
			/>
		</main>
	);
}
