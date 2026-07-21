"use client";

import type { ReactElement } from "react";
import { deleteSpotList } from "@/lib/actions/spots";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useConfirmDelete } from "@/lib/hooks/useConfirmDelete";

interface DeleteSpotListButtonProps {
	listId: string;
}

export function DeleteSpotListButton({ listId }: DeleteSpotListButtonProps): ReactElement {
	// 成功會 redirect；有回傳代表失敗
	const { busy, dialogRef, handleConfirm } = useConfirmDelete(() => deleteSpotList(listId), {
		errorPrefix: "刪除失敗：",
	});

	return (
		<>
			<Button type="button" variant="danger" onClick={() => dialogRef.current?.open()}>
				刪除清單
			</Button>
			<ConfirmDialog
				ref={dialogRef}
				title="確定刪除這個清單？"
				description="清單內所有地點也會一併刪除，此動作無法復原。"
				busy={busy}
				onConfirm={handleConfirm}
			/>
		</>
	);
}
