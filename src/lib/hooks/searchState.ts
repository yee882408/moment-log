export interface SyncedSearchState {
	keyword: string;
	sort: string;
	tagIds: string[];
	page: number;
}

// 給 page.tsx（Server Component）解析 searchParams 用；純函式，不含任何 client hook，
// 不能跟 useSyncSearchStateToUrl 放同一個 "use client" 檔案，否則 Server Component 無法直接呼叫它
export function parseSearchStateFromServerParams(
	searchParams: Record<string, string | string[] | undefined>,
	defaultSort: string,
): SyncedSearchState {
	const get = (key: string): string | undefined => {
		const v = searchParams[key];
		return Array.isArray(v) ? v[0] : v;
	};
	return {
		keyword: get("q") ?? "",
		sort: get("sort") ?? defaultSort,
		tagIds: get("tags")?.split(",").filter(Boolean) ?? [],
		page: Math.max(1, Number(get("page")) || 1),
	};
}
