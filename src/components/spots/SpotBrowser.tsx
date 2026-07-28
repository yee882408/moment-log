"use client";

import { useRef, useState } from "react";
import type { ReactElement } from "react";
import Link from "next/link";
import { searchMySpotLists, searchPublicSpotLists } from "@/lib/actions/spots";
import type { SpotListSummary, SpotListSort } from "@/lib/data/spots";
import { SpotListCard } from "@/components/spots/SpotListCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/Spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { useListSearch } from "@/lib/hooks/useListSearch";
import type { SyncedSearchState } from "@/lib/hooks/useSyncedSearchState";

type Tab = "mine" | "public";

const DEFAULT_SORT: SpotListSort = "newest";

interface SpotBrowserProps {
	loggedIn: boolean;
	initialTab: Tab;
	initialLists: SpotListSummary[];
	initialTotalPages: number;
	initialState: SyncedSearchState;
}

export function SpotBrowser({
	loggedIn,
	initialTab,
	initialLists,
	initialTotalPages,
	initialState,
}: SpotBrowserProps): ReactElement {
	// tab 不進 URL、不歸 useListSearch 管理（它只認識 keyword/sort/tags/page）。
	// state 讓 Tabs 高亮能立即反應點擊（不等查詢結果回來，呼應舊版註解的 UX）；
	// ref 則讓非同步的 search callback 讀到「當下」tab，避免 closure 捕獲舊值
	const [tab, setTab] = useState<Tab>(initialTab);
	const tabRef = useRef<Tab>(initialTab);

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
		refetch,
	} = useListSearch<SpotListSummary, SpotListSort>({
		initialItems: initialLists,
		initialTotalPages,
		initialState,
		initialTags: [],
		defaultSort: DEFAULT_SORT,
		search: async (page, filters, sort) => {
			const result =
				tabRef.current === "mine"
					? await searchMySpotLists(page, filters, sort)
					: await searchPublicSpotLists(page, filters, sort);
			return { items: result.lists, totalPages: result.totalPages };
		},
	});

	const handleTabChange = (nextTab: Tab): void => {
		tabRef.current = nextTab;
		setTab(nextTab); // 立即觸發 re-render，Tabs 高亮不用等查詢結果回來
		refetch();
	};

	return (
		<div className="flex flex-col gap-5">
			{loggedIn && (
				// 分頁夾造型：TabsList 貼齊底線、TabsTrigger 選中時「浮」在底線上方，
				// 覆寫 Radix Tabs 預設的藥丸式底座（見 ui/tabs.tsx），只用在這個頁面
				<Tabs value={tab} onValueChange={(v) => handleTabChange(v as Tab)}>
					<TabsList className="h-auto w-fit items-end gap-0.5 rounded-none border-b border-border bg-transparent p-0">
						<TabsTrigger
							value="mine"
							className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-[#eef0fe] px-5.5 py-2 text-foreground/70 data-[state=active]:z-10 data-[state=active]:-mb-px data-[state=active]:border-b-card data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-none"
						>
							我的清單
						</TabsTrigger>
						<TabsTrigger
							value="public"
							className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-[#eef0fe] px-5.5 py-2 text-foreground/70 data-[state=active]:z-10 data-[state=active]:-mb-px data-[state=active]:border-b-card data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-none"
						>
							公開清單
						</TabsTrigger>
					</TabsList>
				</Tabs>
			)}

			{/* 表格/文件感搜尋列：拿掉圓角膠囊感，輸入框/排序中間用直線分隔，
			    搜尋鈕改成純文字風格，呼應清單卡片的護照造型 */}
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
				<Select value={sort} onValueChange={(v) => handleSortChange(v as SpotListSort)}>
					<SelectTrigger className="w-28 rounded-none border-0 border-r border-border py-2.5 shadow-none">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="newest">最新</SelectItem>
						<SelectItem value="oldest">最舊</SelectItem>
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
								"沒有符合條件的清單。"
							) : tab === "mine" ? (
								<>
									還沒有任何清單，
									<Link href="/spots/new" className="text-primary hover:underline">
										新增第一個
									</Link>
									。
								</>
							) : (
								"目前還沒有人公開清單。"
							)}
						</p>
					)}

					<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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
