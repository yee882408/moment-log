"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { searchBookmarkedSpotLists } from "@/lib/actions/spotListBookmarks";
import type { SpotListSummary } from "@/lib/data/spots";
import type { BookmarkedSpotListSort } from "@/lib/data/spotListBookmarks";
import { SpotListCard } from "@/components/spots/SpotListCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/Spinner";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { useListSearch } from "@/lib/hooks/useListSearch";
import type { SyncedSearchState } from "@/lib/hooks/useSyncedSearchState";

const DEFAULT_SORT: BookmarkedSpotListSort = "newest";

interface BookmarkedSpotListsBrowserProps {
	initialLists: SpotListSummary[];
	initialTotalPages: number;
	initialState: SyncedSearchState;
}

// /bookmarks/spots 用：與 SpotBrowser 同構，但沒有「我的/公開」tab 切換——
// 收藏頁只有一種視角（我收藏的清單），不需要 tab 也就不需要 refetch/tabRef 那套機制
export function BookmarkedSpotListsBrowser({
	initialLists,
	initialTotalPages,
	initialState,
}: BookmarkedSpotListsBrowserProps): ReactElement {
	const {
		keyword,
		setKeyword,
		sort,
		page,
		items: lists,
		totalPages,
		isPending,
		hasKeyword,
		handleSubmit,
		handleSortChange,
		handlePageChange,
	} = useListSearch<SpotListSummary, BookmarkedSpotListSort>({
		initialItems: initialLists,
		initialTotalPages,
		initialState,
		initialTags: [],
		defaultSort: DEFAULT_SORT,
		search: async (page, filters, sort) => {
			const result = await searchBookmarkedSpotLists(page, filters, sort);
			return { items: result.lists, totalPages: result.totalPages };
		},
	});

	return (
		<div className="flex flex-col gap-5">
			<form
				onSubmit={handleSubmit}
				className="flex flex-wrap items-center rounded-md border border-border bg-card shadow-sm"
			>
				<div className="relative min-w-48 flex-1 after:absolute after:top-1/5 after:right-0 after:bottom-1/5 after:w-px after:bg-border">
					<input
						value={keyword}
						onChange={(e) => setKeyword(e.target.value)}
						placeholder="搜尋標題或藝人"
						className="w-full bg-transparent px-3.5 py-2.5 text-sm outline-none"
					/>
					{hasKeyword && (
						<button
							type="button"
							onClick={() => setKeyword("")}
							aria-label="清空搜尋文字"
							className="absolute top-1/2 right-4 flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
						>
							✕
						</button>
					)}
				</div>
				<Select value={sort} onValueChange={(v) => handleSortChange(v as BookmarkedSpotListSort)}>
					<SelectTrigger className="w-28 rounded-none border-0 border-r border-border py-2.5 shadow-none">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="newest">最新收藏</SelectItem>
						<SelectItem value="oldest">最早收藏</SelectItem>
						<SelectItem value="popular">最熱門</SelectItem>
					</SelectContent>
				</Select>
				<button
					type="submit"
					className="cursor-pointer px-5 py-2.5 text-sm font-bold text-primary hover:underline"
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
					{lists.length === 0 && (
						<p className="text-sm text-muted-foreground">
							{keyword ? (
								"沒有符合條件的收藏。"
							) : (
								<>
									還沒有收藏任何追星地圖，
									<Link href="/spots" className="text-primary hover:underline">
										去逛逛追星地圖
									</Link>
									。
								</>
							)}
						</p>
					)}

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{lists.map((list) => (
							<SpotListCard key={list.id} list={list} />
						))}
					</div>

					<PaginationControls page={page} totalPages={totalPages} onChange={handlePageChange} />
				</>
			)}
		</div>
	);
}
