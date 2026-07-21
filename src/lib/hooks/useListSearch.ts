"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useSyncSearchStateToUrl, type SyncedSearchState } from "@/lib/hooks/useSyncedSearchState";
import type { TagOption } from "@/lib/data/tags";

const DEBOUNCE_MS = 400;

interface SearchResult<TItem> {
	totalPages: number;
	items: TItem[];
}

interface UseListSearchParams<TItem, TSort extends string> {
	initialItems: TItem[];
	initialTotalPages: number;
	initialState: SyncedSearchState;
	initialTags: TagOption[];
	defaultSort: TSort;
	// 呼叫端的 server action，回傳結果欄位名稱因 records/reviews 而異，統一由呼叫端轉成 SearchResult
	search: (
		page: number,
		filters: { keyword?: string; tagIds?: string[] },
		sort: TSort,
	) => Promise<SearchResult<TItem>>;
}

interface UseListSearchResult<TItem, TSort extends string> {
	keyword: string;
	setKeyword: (value: string) => void;
	sort: TSort;
	selectedTags: TagOption[];
	page: number;
	items: TItem[];
	totalPages: number;
	isPending: boolean;
	hasKeyword: boolean;
	handleSubmit: (e: { preventDefault: () => void }) => void;
	handleSortChange: (nextSort: TSort) => void;
	handleTagsApply: (nextTags: TagOption[]) => void;
	handlePageChange: (nextPage: number) => void;
}

// 共用搜尋列表邏輯：state、debounce as-you-type、URL 同步、排序/標籤/換頁 handler。
// 供 RecordSearch（我的紀錄）、ReviewSearch（公開心得）共用；兩者的呈現層（JSX、
// 空狀態文案、ReviewGrid 的 renderFooter/buildHref）差異夠大，不強行抽共用元件，
// 只抽這一層邏輯完全相同的部分
export function useListSearch<TItem, TSort extends string>({
	initialItems,
	initialTotalPages,
	initialState,
	initialTags,
	defaultSort,
	search,
}: UseListSearchParams<TItem, TSort>): UseListSearchResult<TItem, TSort> {
	const [keyword, setKeyword] = useState(initialState.keyword);
	const [sort, setSort] = useState<TSort>(initialState.sort as TSort);
	const [selectedTags, setSelectedTags] = useState<TagOption[]>(initialTags);
	const [page, setPage] = useState(initialState.page);
	const [items, setItems] = useState(initialItems);
	const [totalPages, setTotalPages] = useState(initialTotalPages);
	const [isPending, startTransition] = useTransition();
	const syncToUrl = useSyncSearchStateToUrl(defaultSort);

	const debouncedKeyword = useDebouncedValue(keyword, DEBOUNCE_MS);
	// 首次渲染的 initialState 來自 SSR，已經查過一次，不該再觸發一次一樣的查詢
	const isFirstRender = useRef(true);

	const runSearch = (targetPage: number, nextKeyword: string, nextSort: TSort, nextTags: TagOption[]): void => {
		// 關鍵字清空時，relevance 排序沒有意義，打回預設排序
		const effectiveSort = nextKeyword
			? nextSort
			: nextSort === "relevance"
				? defaultSort
				: nextSort;
		startTransition(async () => {
			const result = await search(
				targetPage,
				{
					keyword: nextKeyword.trim() || undefined,
					tagIds: nextTags.length ? nextTags.map((t) => t.id) : undefined,
				},
				effectiveSort,
			);
			setPage(targetPage);
			setSort(effectiveSort);
			setItems(result.items);
			setTotalPages(result.totalPages);
			syncToUrl({
				keyword: nextKeyword,
				sort: effectiveSort,
				tagIds: nextTags.map((t) => t.id),
				page: targetPage,
			});
		});
	};

	// as-you-type：debounce 後的關鍵字變動時自動查詢（含清空關鍵字時查全部，不用特判）
	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}
		runSearch(1, debouncedKeyword, sort, selectedTags);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- 只在 debouncedKeyword 變動時觸發，sort/selectedTags 用當下 closure 值即可
	}, [debouncedKeyword]);

	return {
		keyword,
		setKeyword,
		sort,
		selectedTags,
		page,
		items,
		totalPages,
		isPending,
		hasKeyword: keyword.length > 0,
		handleSubmit: (e) => {
			e.preventDefault();
			runSearch(1, keyword, sort, selectedTags); // Enter/送出：不等 debounce，立刻查目前輸入值
		},
		handleSortChange: (nextSort) => runSearch(1, keyword, nextSort, selectedTags),
		handleTagsApply: (nextTags) => {
			setSelectedTags(nextTags);
			runSearch(1, keyword, sort, nextTags);
		},
		handlePageChange: (nextPage) => runSearch(nextPage, keyword, sort, selectedTags),
	};
}
