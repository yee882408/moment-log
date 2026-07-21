"use client";

import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { SyncedSearchState } from "@/lib/hooks/searchState";

export type { SyncedSearchState } from "@/lib/hooks/searchState";

// 把搜尋狀態寫回 URL query string（用 replace 不留歷史紀錄，搜尋列打字不該塞爆上一頁鍵）
// 值等於預設值時省略該 query key，保持網址簡潔（例如 page=1、sort=newest 不顯示）
export function useSyncSearchStateToUrl(defaultSort: string): (state: SyncedSearchState) => void {
	const router = useRouter();
	const pathname = usePathname();

	return useCallback(
		(state: SyncedSearchState) => {
			const params = new URLSearchParams();
			if (state.keyword) params.set("q", state.keyword);
			if (state.sort && state.sort !== defaultSort) params.set("sort", state.sort);
			if (state.tagIds.length) params.set("tags", state.tagIds.join(","));
			if (state.page > 1) params.set("page", String(state.page));

			const query = params.toString();
			router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
		},
		[router, pathname, defaultSort],
	);
}
