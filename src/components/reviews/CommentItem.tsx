"use client";

import type { ReactElement } from "react";
import { deleteComment } from "@/lib/actions/comments";
import type { RecordComment } from "@/lib/data/comments";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AuthorAvatar } from "@/components/reviews/AuthorAvatar";
import { useConfirmDelete } from "@/lib/hooks/useConfirmDelete";
import { formatRelativeTime } from "@/lib/relativeTime";

interface CommentItemProps {
	comment: RecordComment;
	recordId: string;
	canDelete: boolean;
	onDeleted: () => void;
}

export function CommentItem({
	comment,
	recordId,
	canDelete,
	onDeleted,
}: CommentItemProps): ReactElement {
	// onDeleted：通知父層重新抓取目前頁資料
	const { busy, dialogRef, handleConfirm } = useConfirmDelete(
		() => deleteComment(comment.id, recordId),
		{ errorPrefix: "刪除失敗：", onSuccess: onDeleted },
	);

	return (
		<div className="flex gap-2.5 border-b border-[#e4dcd0] pb-4 last:border-b-0 last:pb-0">
			<AuthorAvatar
				author={comment.author}
				avatarUrl={comment.author_avatar_url}
				sizeClass="h-7 w-7"
			/>
			<div className="flex flex-1 items-start justify-between gap-2">
				<p className="text-sm leading-relaxed whitespace-pre-wrap text-[#18130f]">
					<span className="mr-1.5 font-semibold">{comment.author ?? "匿名"}</span>
					{comment.body}
					<span className="ml-1.5 text-xs text-[#7d7568]">
						{formatRelativeTime(comment.created_at)}
					</span>
				</p>
				{canDelete && (
					<Button
						type="button"
						variant="ghost"
						className="shrink-0 text-xs"
						onClick={() => dialogRef.current?.open()}
					>
						刪除
					</Button>
				)}
			</div>
			{canDelete && (
				<ConfirmDialog
					ref={dialogRef}
					title="確定刪除這則留言？"
					description="此動作無法復原。"
					busy={busy}
					onConfirm={handleConfirm}
				/>
			)}
		</div>
	);
}
