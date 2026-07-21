"use client";

import type { ReactElement } from "react";
import { setUserRole } from "@/lib/actions/admin-users";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useConfirmDelete } from "@/lib/hooks/useConfirmDelete";

interface SetUserRoleButtonProps {
	userId: string;
	currentRole: string;
}

export function SetUserRoleButton({
	userId,
	currentRole,
}: SetUserRoleButtonProps): ReactElement {
	const isAdmin = currentRole === "admin";
	const nextRole = isAdmin ? "user" : "admin";

	const { busy, dialogRef, handleConfirm } = useConfirmDelete(
		() => setUserRole(userId, nextRole),
		{ errorPrefix: "操作失敗：" },
	);

	return (
		<>
			<Button
				type="button"
				variant={isAdmin ? "secondary" : "primary"}
				onClick={() => dialogRef.current?.open()}
				className="px-3 py-1.5 text-xs"
			>
				{isAdmin ? "降為一般使用者" : "設為管理員"}
			</Button>
			<ConfirmDialog
				ref={dialogRef}
				title={isAdmin ? "確定降為一般使用者？" : "確定設為管理員？"}
				description={
					isAdmin
						? "這位使用者將失去後台管理權限。"
						: "這位使用者將取得後台管理權限，包含範本管理與使用者管理。"
				}
				confirmLabel={isAdmin ? "確定降級" : "確定設為管理員"}
				busyLabel="處理中…"
				confirmVariant={isAdmin ? "danger" : "primary"}
				busy={busy}
				onConfirm={handleConfirm}
			/>
		</>
	);
}
