"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { searchBookmarkedReviews } from "@/lib/actions/bookmarks";
import type { PublicReview } from "@/lib/data/reviews";
import type { BookmarkedReviewSort } from "@/lib/data/bookmarks";
import { ReviewGrid } from "@/components/reviews/ReviewGrid";
import { AuthorAvatar } from "@/components/reviews/AuthorAvatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/Spinner";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { TagFilterDropdown } from "@/components/common/TagFilterDropdown";
import { useListSearch } from "@/lib/hooks/useListSearch";
import type { SyncedSearchState } from "@/lib/hooks/useSyncedSearchState";
import type { TagOption } from "@/lib/data/tags";

const DEFAULT_SORT: BookmarkedReviewSort = "newest";

interface BookmarkedReviewSearchProps {
	initialReviews: PublicReview[];
	initialTotalPages: number;
	initialState: SyncedSearchState;
	initialTags: TagOption[];
}

// /bookmarks/reviews 用：與 ReviewSearch 同構，差異是排序選單不含 relevance
// （收藏搜尋走簡化版 ilike 比對，不是全文搜尋，沒有 rank 分數可排）與空狀態文案
export function BookmarkedReviewSearch({
	initialReviews,
	initialTotalPages,
	initialState,
	initialTags,
}: BookmarkedReviewSearchProps): ReactElement {
	const {
		keyword,
		setKeyword,
		sort,
		selectedTags,
		page,
		items: reviews,
		totalPages,
		isPending,
		hasKeyword,
		handleSubmit,
		handleSortChange,
		handleTagsApply,
		handlePageChange,
	} = useListSearch<PublicReview, BookmarkedReviewSort>({
		initialItems: initialReviews,
		initialTotalPages,
		initialState,
		initialTags,
		defaultSort: DEFAULT_SORT,
		search: async (page, filters, sort) => {
			const result = await searchBookmarkedReviews(page, filters, sort);
			return { items: result.reviews, totalPages: result.totalPages };
		},
	});

	return (
		<div className="flex flex-col gap-6">
			<form
				onSubmit={handleSubmit}
				className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-white p-3"
			>
				<div className="relative flex-1 min-w-48">
					<input
						value={keyword}
						onChange={(e) => setKeyword(e.target.value)}
						placeholder="搜尋標題或藝人"
						className="w-full rounded-lg border border-border py-2 pl-3 pr-8 text-sm outline-none focus:border-primary"
					/>
					{hasKeyword && (
						<button
							type="button"
							onClick={() => setKeyword("")}
							aria-label="清空搜尋文字"
							className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground"
						>
							✕
						</button>
					)}
				</div>
				<Select value={sort} onValueChange={(v) => handleSortChange(v as BookmarkedReviewSort)}>
					<SelectTrigger className="w-28">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="newest">最新收藏</SelectItem>
						<SelectItem value="oldest">最早收藏</SelectItem>
						<SelectItem value="popular">最熱門</SelectItem>
					</SelectContent>
				</Select>
				<TagFilterDropdown selected={selectedTags} onApply={handleTagsApply} />
				<button
					type="submit"
					className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
				>
					搜尋
				</button>
			</form>

			{isPending ? (
				<div className="flex justify-center py-10">
					<Spinner />
				</div>
			) : (
				<>
					{reviews.length === 0 && (
						<p className="text-sm text-muted-foreground">
							{keyword ? (
								"沒有符合條件的收藏。"
							) : (
								<>
									還沒有收藏任何心得，
									<Link href="/reviews" className="text-primary hover:underline">
										去逛逛心得分享牆
									</Link>
									。
								</>
							)}
						</p>
					)}

					<ReviewGrid
						reviews={reviews}
						buildHref={(r) => `/reviews/${r.id}`}
						renderFooter={(r) => (
							<>
								<Link
									href={`/users/${r.user_id}`}
									className="flex items-center gap-2 hover:underline"
								>
									<AuthorAvatar author={r.author} avatarUrl={r.author_avatar_url} />
									<span className="line-clamp-1">{r.author ?? "匿名"}</span>
								</Link>
								<span className="ml-auto shrink-0">♥ {r.like_count}</span>
							</>
						)}
					/>

					<PaginationControls page={page} totalPages={totalPages} onChange={handlePageChange} />
				</>
			)}
		</div>
	);
}
