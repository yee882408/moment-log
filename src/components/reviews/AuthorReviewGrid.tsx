"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { ReviewGrid, type ReviewCardItem } from "@/components/reviews/ReviewGrid";
import { AuthorAvatar } from "@/components/reviews/AuthorAvatar";

interface AuthorReviewCardItem extends ReviewCardItem {
	user_id: string;
	author: string | null;
	author_avatar_url: string | null;
	like_count: number;
}

interface AuthorReviewGridProps<T extends AuthorReviewCardItem> {
	reviews: T[];
}

// ReviewGrid 的 buildHref/renderFooter 是函式 prop，"use client" 元件不能從
// Server Component 直接收函式（無法跨 server→client 邊界序列化）。這支包裝
// 「連到 /reviews/[id] + 作者頭像/名字 + 讚數」這個固定的 footer 模式（目前
// /reviews/[id] 相關文章區塊用），本身是 Client Component，Server Component
// 呼叫端只需要傳資料，不需要傳函式
export function AuthorReviewGrid<T extends AuthorReviewCardItem>({
	reviews,
}: AuthorReviewGridProps<T>): ReactElement {
	return (
		<ReviewGrid
			reviews={reviews}
			buildHref={(r) => `/reviews/${r.id}`}
			renderFooter={(r) => (
				<>
					<Link
						href={`/users/${r.user_id}`}
						className="flex items-center gap-2 hover:underline"
					>
						<AuthorAvatar author={r.author} avatarUrl={r.author_avatar_url} />
						<span className="line-clamp-1">{r.author ?? "匿名"}</span>
					</Link>
					<span className="ml-auto shrink-0">♥ {r.like_count}</span>
				</>
			)}
		/>
	);
}
