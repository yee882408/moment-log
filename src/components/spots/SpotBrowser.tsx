"use client";

import { useState, useTransition } from "react";
import type { FormEvent, ReactElement } from "react";
import Link from "next/link";
import { searchMySpotLists, searchPublicSpotLists } from "@/lib/actions/spots";
import type { SpotListsPage, SpotListSort } from "@/lib/data/spots";
import { SpotListCard } from "@/components/spots/SpotListCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/Spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaginationControls } from "@/components/ui/PaginationControls";

type Tab = "mine" | "public";

interface SpotBrowserProps {
	loggedIn: boolean;
	initialTab: Tab;
	initialListsPage: SpotListsPage;
}

export function SpotBrowser({
	loggedIn,
	initialTab,
	initialListsPage,
}: SpotBrowserProps): ReactElement {
	const [tab, setTab] = useState<Tab>(initialTab);
	const [keyword, setKeyword] = useState("");
	const [sort, setSort] = useState<SpotListSort>("newest");
	const [page, setPage] = useState(1);
	const [listsPage, setListsPage] = useState(initialListsPage);
	const [isPending, startTransition] = useTransition();

	const runSearch = (
		nextTab: Tab,
		targetPage: number,
		nextKeyword: string,
		nextSort: SpotListSort,
	): void => {
		// tab 狀態立即更新，不等查詢結果回來——Tabs 的高亮效果才會馬上反應點擊，
		// 資料查詢期間交給下方既有的 isPending + Spinner 顯示載入中，
		// 不然使用者點下去要等整趟伺服器查詢跑完，tab 才會切換，感覺像是沒反應
		setTab(nextTab);
		setPage(targetPage);
		startTransition(async () => {
			const filters = { keyword: nextKeyword.trim() || undefined };
			const result =
				nextTab === "mine"
					? await searchMySpotLists(targetPage, filters, nextSort)
					: await searchPublicSpotLists(targetPage, filters, nextSort);
			setListsPage(result);
		});
	};

	const handleSubmit = (e: FormEvent): void => {
		e.preventDefault();
		runSearch(tab, 1, keyword, sort);
	};

	const handleSortChange = (nextSort: SpotListSort): void => {
		setSort(nextSort);
		runSearch(tab, 1, keyword, nextSort);
	};

	// 關鍵字被清空（不論是按 X 還是鍵盤刪除到空白）時自動跳回全部結果，
	// 避免畫面停留在「清空前那次搜尋」的舊結果
	const handleKeywordChange = (value: string): void => {
		setKeyword(value);
		if (value === "" && keyword !== "") {
			runSearch(tab, 1, "", sort);
		}
	};

	const hasKeyword = keyword.length > 0;
	const { lists, totalPages } = listsPage;

	return (
		<div className="flex flex-col gap-5">
			{loggedIn && (
				<Tabs value={tab} onValueChange={(v) => runSearch(v as Tab, 1, keyword, sort)}>
					<TabsList className="w-64">
						<TabsTrigger value="mine">我的清單</TabsTrigger>
						<TabsTrigger value="public">公開清單</TabsTrigger>
					</TabsList>
				</Tabs>
			)}

			<form
				onSubmit={handleSubmit}
				className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-white p-3"
			>
				<div className="relative min-w-48 flex-1">
					<input
						value={keyword}
						onChange={(e) => handleKeywordChange(e.target.value)}
						placeholder="搜尋標題或藝人"
						className="w-full rounded-lg border border-border py-2 pl-3 pr-8 text-sm outline-none focus:border-primary"
					/>
					{hasKeyword && (
						<button
							type="button"
							onClick={() => handleKeywordChange("")}
							aria-label="清空搜尋文字"
							className="absolute top-1/2 right-2 flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground"
						>
							✕
						</button>
					)}
				</div>
				<Select value={sort} onValueChange={(v) => handleSortChange(v as SpotListSort)}>
					<SelectTrigger className="w-28">
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

					<PaginationControls
						page={page}
						totalPages={totalPages}
						onChange={(nextPage) => runSearch(tab, nextPage, keyword, sort)}
					/>
				</>
			)}
		</div>
	);
}
