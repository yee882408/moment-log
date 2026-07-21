"use client";

import { useEffect, useRef, useState } from "react";
import { searchTags, getSuggestedTags } from "@/lib/actions/tags";
import type { TagOption } from "@/lib/data/tags";

const DEBOUNCE_MS = 250;

// 共用的標籤 autocomplete 查詢邏輯，供 TagInput（新增/編輯紀錄的標籤輸入）與
// TagFilterDropdown（搜尋頁的標籤篩選）共用：query 為空字串時回傳建議清單
// （使用者用過的 + 熱門標籤），有輸入文字則 debounce 查詢全站符合前綴的標籤
// enabled 預設 true 只在下拉選單實際開啟時才傳 true，避免元件一掛載（下拉關閉、
// query 還是空字串）就自動打一次 getSuggestedTags() 這個較重的 Server Action，
// 拖慢單純進入頁面（連結按鈕本身一直存在於畫面上）的體感速度
export function useTagSearch(
	query: string,
	enabled: boolean = true,
): { results: TagOption[]; loading: boolean } {
	const [results, setResults] = useState<TagOption[]>([]);
	const [loading, setLoading] = useState(false);
	const requestIdRef = useRef(0);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		const requestId = ++requestIdRef.current;
		const trimmed = query.trim();

		const timer = setTimeout(
			() => {
				// 真正要發查詢時才切成 loading，避免在 effect body 內同步呼叫 setState
				// （React Compiler 會擋下 effect 開頭就同步 setState 的寫法）
				setLoading(true);
				const fetcher = trimmed ? searchTags(trimmed) : getSuggestedTags();
				fetcher.then((data) => {
					// 忽略過期的回應（例如打字很快時，較舊的請求晚回來）
					if (requestIdRef.current === requestId) {
						setResults(data);
						setLoading(false);
					}
				});
			},
			trimmed ? DEBOUNCE_MS : 0,
		);

		return () => clearTimeout(timer);
	}, [query, enabled]);

	return { results, loading };
}
