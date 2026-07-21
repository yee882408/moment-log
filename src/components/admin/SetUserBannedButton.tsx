"use client";

import type { ReactElement } from "react";
import { setUserBanned } from "@/lib/actions/admin-users";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useConfirmDelete } from "@/lib/hooks/useConfirmDelete";

interface SetUserBannedButtonProps {
	userId: string;
	isBanned: boolean;
}

export function SetUserBannedButton({
	userId,
	isBanned,
}: SetUserBannedButtonProps): ReactElement {
	const { busy, dialogRef, handleConfirm } = useConfirmDelete(
		() => setUserBanned(userId, !isBanned),
		{ errorPrefix: "操作失敗：" },
	);

	return (
		<>
			<Button
				type="button"
				variant={isBanned ? "secondary" : "danger"}
				onClick={() => dialogRef.current?.open()}
				className="px-3 py-1.5 text-xs"
			>
				{isBanned ? "解除停用" : "停用帳號"}
			</Button>
			<ConfirmDialog
				ref={dialogRef}
				title={isBanned ? "確定解除停用？" : "確定停用這個帳號？"}
				description={
					isBanned
						? "這位使用者將恢復正常登入與使用平台的權限。"
						: "這位使用者將立即無法登入，若目前已登入也會在下次操作時被強制登出。"
				}
				confirmLabel={isBanned ? "確定解除停用" : "確定停用"}
				busyLabel="處理中…"
				confirmVariant={isBanned ? "primary" : "danger"}
				busy={busy}
				onConfirm={handleConfirm}
			/>
		</>
	);
}
