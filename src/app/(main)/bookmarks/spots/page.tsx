import type { Metadata } from "next";
import type { ReactElement } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyBookmarkedSpotLists, type BookmarkedSpotListSort } from "@/lib/data/spotListBookmarks";
import { parseSearchStateFromServerParams } from "@/lib/hooks/searchState";
import { BookmarkedSpotListsBrowser } from "@/components/bookmarks/BookmarkedSpotListsBrowser";

export const metadata: Metadata = {
	title: "收藏的追星地圖",
	description: "瀏覽你收藏的所有追星地圖清單。",
	robots: { index: false },
};

interface PageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BookmarkedSpotListsPage({ searchParams }: PageProps): Promise<ReactElement> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		redirect("/login");
	}

	const params = await searchParams;
	const state = parseSearchStateFromServerParams(params, "newest");

	const { lists, totalPages } = await getMyBookmarkedSpotLists(
		user.id,
		state.page,
		{ keyword: state.keyword || undefined },
		state.sort as BookmarkedSpotListSort,
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
				<h1 className="text-2xl font-extrabold tracking-tight text-foreground">收藏的追星地圖</h1>
			</div>
			<BookmarkedSpotListsBrowser
				initialLists={lists}
				initialTotalPages={totalPages}
				initialState={state}
			/>
		</main>
	);
}
