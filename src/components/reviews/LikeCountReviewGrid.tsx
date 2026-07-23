"use client";

import type { ReactElement } from "react";
import { ReviewGrid, type ReviewCardItem } from "@/components/reviews/ReviewGrid";

interface LikeCountReviewCardItem extends ReviewCardItem {
	like_count: number;
}

interface LikeCountReviewGridProps<T extends LikeCountReviewCardItem> {
	reviews: T[];
	maxItemsPerPage?: number;
}

// ReviewGrid 的 buildHref/renderFooter 是函式 prop，"use client" 元件不能從
// Server Component 直接收函式。這支包裝「連到 /reviews/[id] + 純讚數」的固定
// footer 模式（/users/[id] 用：頁面本身就在看某個作者，footer 不需要再顯示
// 作者是誰），Server Component 呼叫端只需要傳資料
export function LikeCountReviewGrid<T extends LikeCountReviewCardItem>({
	reviews,
	maxItemsPerPage,
}: LikeCountReviewGridProps<T>): ReactElement {
	return (
		<ReviewGrid
			reviews={reviews}
			maxItemsPerPage={maxItemsPerPage}
			buildHref={(r) => `/reviews/${r.id}`}
			renderFooter={(r) => <span>♥ {r.like_count}</span>}
		/>
	);
}
