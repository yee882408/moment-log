"use client";

import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { getCommentsPage } from "@/lib/actions/comments";
import type { CommentsPage } from "@/lib/data/comments";
import { CommentItem } from "@/components/reviews/CommentItem";
import { CommentForm } from "@/components/reviews/CommentForm";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { Spinner } from "@/components/ui/Spinner";

interface CommentSectionProps {
	recordId: string;
	currentUserId: string | null;
	initialCommentsPage: CommentsPage;
	// 私密紀錄無法留言（RLS 擋 insert）；登入者仍會看到表單，但輸入框/送出鈕禁用
	canComment?: boolean;
}

export function CommentSection({
	recordId,
	currentUserId,
	initialCommentsPage,
	canComment = true,
}: CommentSectionProps): ReactElement {
	const [page, setPage] = useState(1);
	const [commentsPage, setCommentsPage] = useState(initialCommentsPage);
	const [isPending, startTransition] = useTransition();

	const loadPage = (targetPage: number): void => {
		startTransition(async () => {
			let result = await getCommentsPage(recordId, targetPage);
			let finalPage = targetPage;
			// targetPage 可能超過剛查回來的 totalPages（例如刪光目前頁的最後一則留言後，
			// 總頁數縮減），這種情況改停在新的最後一頁，而不是停留在已經不存在的頁碼
			if (targetPage > result.totalPages) {
				finalPage = result.totalPages;
				result = await getCommentsPage(recordId, finalPage);
			}
			setPage(finalPage);
			setCommentsPage(result);
		});
	};

	const handleCreated = (totalPages: number): void => {
		loadPage(totalPages); // 新留言永遠在最後一頁，直接跳過去
	};

	const handleDeleted = (): void => {
		loadPage(page); // 通常留在目前頁；若目前頁已被刪空，loadPage 會自動退到新的最後一頁
	};

	return (
		<section className="flex flex-col gap-4">
			<h2 className="text-xs font-bold tracking-[0.14em] text-[#b8934a] uppercase">
				留言（{commentsPage.totalCount}）
			</h2>

			<div className="flex min-h-40 flex-col gap-4">
				{isPending ? (
					<div className="flex flex-1 items-center justify-center py-8">
						<Spinner />
					</div>
				) : (
					<>
						{commentsPage.comments.length === 0 && (
							<p className="text-sm text-[#7d7568]">還沒有留言，來當第一個吧。</p>
						)}
						{commentsPage.comments.map((c) => (
							<CommentItem
								key={c.id}
								comment={c}
								recordId={recordId}
								canDelete={currentUserId === c.user_id}
								onDeleted={handleDeleted}
							/>
						))}
					</>
				)}
				<PaginationControls
					page={page}
					totalPages={commentsPage.totalPages}
					onChange={loadPage}
					disabled={isPending}
				/>
			</div>

			{currentUserId && (
				<CommentForm recordId={recordId} onCreated={handleCreated} disabled={!canComment} />
			)}
		</section>
	);
}
