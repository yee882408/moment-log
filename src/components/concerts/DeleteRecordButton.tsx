"use client";

import type { ReactElement } from "react";
import { deleteRecord } from "@/lib/actions/records";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useConfirmDelete } from "@/lib/hooks/useConfirmDelete";

interface DeleteRecordButtonProps {
	recordId: string;
	// 外部覆寫樣式，例如 /concerts/[id] 雜誌風頁面需要無邊框的純文字連結外觀
	className?: string;
}

export function DeleteRecordButton({
	recordId,
	className,
}: DeleteRecordButtonProps): ReactElement {
	// 成功會 redirect；有回傳代表失敗
	const { busy, dialogRef, handleConfirm } = useConfirmDelete(() => deleteRecord(recordId), {
		errorPrefix: "刪除失敗：",
	});

	return (
		<>
			<Button
				type="button"
				variant="danger"
				className={className}
				onClick={() => dialogRef.current?.open()}
			>
				刪除
			</Button>
			<ConfirmDialog
				ref={dialogRef}
				title="確定刪除這筆紀錄？"
				description="此動作無法復原。"
				busy={busy}
				onConfirm={handleConfirm}
			/>
		</>
	);
}
