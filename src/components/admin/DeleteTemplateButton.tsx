"use client";

import type { ReactElement } from "react";
import { deleteTemplate } from "@/lib/actions/concerts";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useConfirmDelete } from "@/lib/hooks/useConfirmDelete";

interface DeleteTemplateButtonProps {
	templateId: string;
}

export function DeleteTemplateButton({
	templateId,
}: DeleteTemplateButtonProps): ReactElement {
	const { busy, dialogRef, handleConfirm } = useConfirmDelete(() => deleteTemplate(templateId), {
		errorPrefix: "刪除失敗：",
	});

	return (
		<>
			<Button
				type="button"
				variant="danger"
				onClick={() => dialogRef.current?.open()}
				className="px-3 py-1.5 text-xs"
			>
				刪除
			</Button>
			<ConfirmDialog
				ref={dialogRef}
				title="確定刪除這個範本？"
				description="已套用這個範本的使用者紀錄不受影響，僅移除範本本身。"
				busy={busy}
				onConfirm={handleConfirm}
			/>
		</>
	);
}
