"use client";

import type { ReactElement } from "react";
import { deleteComment } from "@/lib/actions/comments";
import type { RecordComment } from "@/lib/data/comments";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Card } from "@/components/ui/Card";
import { useConfirmDelete } from "@/lib/hooks/useConfirmDelete";

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
		<Card className="flex flex-col gap-1">
			<div className="flex items-center justify-between gap-2">
				<span className="text-sm font-medium text-foreground">
					{comment.author ?? "匿名"}
				</span>
				{canDelete && (
					<Button
						type="button"
						variant="ghost"
						className="text-xs"
						onClick={() => dialogRef.current?.open()}
					>
						刪除
					</Button>
				)}
			</div>
			<p className="whitespace-pre-wrap text-sm text-foreground">{comment.body}</p>
			{canDelete && (
				<ConfirmDialog
					ref={dialogRef}
					title="確定刪除這則留言？"
					description="此動作無法復原。"
					busy={busy}
					onConfirm={handleConfirm}
				/>
			)}
		</Card>
	);
}
