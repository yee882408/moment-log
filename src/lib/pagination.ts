// 目前頁前後各顯示幾頁數字（不含永遠顯示的頭尾頁）
const SIBLING_COUNT = 1;

export type PageItem = number | "ellipsis-start" | "ellipsis-end";

// 產生頁碼列表：永遠顯示第 1、最後一頁，中間顯示目前頁前後 SIBLING_COUNT 頁，
// 其餘用省略號表示。頁數少時（不足以省略）直接列出全部頁碼。
// 供 Pagination（Link 換頁）與 PaginationControls（client state 換頁）共用同一套排版邏輯。
export function buildPageItems(page: number, totalPages: number): PageItem[] {
	const totalNumbersWithoutEllipsis = SIBLING_COUNT * 2 + 5; // 頭 + 尾 + 目前頁 + 2 個省略號位置的緩衝
	if (totalPages <= totalNumbersWithoutEllipsis) {
		return Array.from({ length: totalPages }, (_, i) => i + 1);
	}

	const leftSibling = Math.max(page - SIBLING_COUNT, 1);
	const rightSibling = Math.min(page + SIBLING_COUNT, totalPages);
	const showLeftEllipsis = leftSibling > 2;
	const showRightEllipsis = rightSibling < totalPages - 1;

	const items: PageItem[] = [1];
	if (showLeftEllipsis) {
		items.push("ellipsis-start");
	} else if (leftSibling > 1) {
		items.push(2);
	}

	for (let p = Math.max(leftSibling, 2); p <= Math.min(rightSibling, totalPages - 1); p++) {
		items.push(p);
	}

	if (showRightEllipsis) {
		items.push("ellipsis-end");
	} else if (rightSibling < totalPages) {
		items.push(totalPages - 1);
	}
	items.push(totalPages);

	return items;
}
