"use client";

import { useEffect, useState } from "react";

// 通用 debounce hook：延遲回傳最新值，用於 as-you-type 搜尋等情境避免每個按鍵都觸發查詢
export function useDebouncedValue<T>(value: T, delayMs: number): T {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delayMs);
		return () => clearTimeout(timer);
	}, [value, delayMs]);

	return debounced;
}
