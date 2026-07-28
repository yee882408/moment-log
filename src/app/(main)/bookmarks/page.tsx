import type { Metadata } from "next";
import type { ReactElement } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyBookmarkedReviewsPreview } from "@/lib/data/bookmarks";
import { getMyBookmarkedSpotListsPreview } from "@/lib/data/spotListBookmarks";
import { AuthorReviewGrid } from "@/components/reviews/AuthorReviewGrid";
import { SpotListCard } from "@/components/spots/SpotListCard";
import { BookmarkSection } from "@/components/bookmarks/BookmarkSection";

export const metadata: Metadata = {
	title: "我的收藏",
	description: "你收藏的演唱會心得與追星地圖清單。",
	robots: { index: false },
};

const PREVIEW_LIMIT = 4;

export default async function BookmarksPage(): Promise<ReactElement> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		redirect("/login");
	}

	const [{ reviews, totalCount: reviewCount }, { lists, totalCount: spotCount }] = await Promise.all([
		getMyBookmarkedReviewsPreview(user.id),
		getMyBookmarkedSpotListsPreview(user.id),
	]);

	// 兩個區塊都空：合併成單一整頁空狀態，避免兩個各自的空狀態並列顯得空洞重複
	const bothEmpty = reviewCount === 0 && spotCount === 0;

	return (
		<main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4.5 p-6">
			<div>
				<span className="text-xs font-bold tracking-wider text-primary uppercase">
					我的珍藏
				</span>
				<h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">我的收藏</h1>
			</div>

			{bothEmpty ? (
				<div className="relative rounded-sm border border-dashed border-border bg-card/50 px-5 py-14 text-center">
					<p className="text-sm text-muted-foreground">
						在心得或追星地圖的詳情頁點擊收藏按鈕，就會出現在這裡
					</p>
					<div className="mt-3 flex items-center justify-center gap-4 text-sm">
						<Link href="/reviews" className="text-primary hover:underline">
							去逛逛心得分享牆 →
						</Link>
						<Link href="/spots" className="text-primary hover:underline">
							去逛逛追星地圖 →
						</Link>
					</div>
				</div>
			) : (
				<div className="flex flex-col gap-8">
					<BookmarkSection
						title="收藏的心得"
						href="/bookmarks/reviews"
						totalCount={reviewCount}
						previewCount={PREVIEW_LIMIT}
						isEmpty={reviewCount === 0}
						emptyText="還沒有收藏任何心得"
						emptyActionHref="/reviews"
						emptyActionLabel="去逛逛心得分享牆"
					>
						<AuthorReviewGrid reviews={reviews} gridClassName="grid grid-cols-1 gap-4 sm:grid-cols-2" />
					</BookmarkSection>

					<BookmarkSection
						title="收藏的追星地圖"
						href="/bookmarks/spots"
						totalCount={spotCount}
						previewCount={PREVIEW_LIMIT}
						isEmpty={spotCount === 0}
						emptyText="還沒有收藏任何追星地圖"
						emptyActionHref="/spots"
						emptyActionLabel="去逛逛追星地圖"
					>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
							{lists.map((list) => (
								<SpotListCard key={list.id} list={list} />
							))}
						</div>
					</BookmarkSection>
				</div>
			)}
		</main>
	);
}
