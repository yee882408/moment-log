"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import type { ReactElement } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export interface ConfirmDialogHandle {
	open: () => void;
	close: () => void;
}

interface ConfirmDialogProps {
	title: string;
	description: string;
	confirmLabel?: string;
	busyLabel?: string;
	confirmVariant?: "danger" | "primary";
	busy?: boolean;
	onConfirm: () => void;
}

// 用 Radix Dialog 取代 window.confirm：內建 Esc 關閉與 focus trap
// 用 forwardRef + useImperativeHandle 暴露 open()/close()，讓觸發按鈕留在呼叫端自訂樣式
export const ConfirmDialog = forwardRef<ConfirmDialogHandle, ConfirmDialogProps>(
	function ConfirmDialog(
		{
			title,
			description,
			confirmLabel = "確定刪除",
			busyLabel = "刪除中…",
			confirmVariant = "danger",
			busy = false,
			onConfirm,
		},
		ref,
	): ReactElement {
		const [open, setOpen] = useState(false);

		useImperativeHandle(ref, () => ({
			open: () => setOpen(true),
			close: () => setOpen(false),
		}));

		return (
			<Dialog
				open={open}
				onOpenChange={(next) => {
					// 處理中不能被 Esc/點背景關閉，避免中途中斷確認流程
					if (!busy) {
						setOpen(next);
					}
				}}
			>
				{/* stopPropagation：Dialog 內容經 Portal 傳送到 document.body，但 React 合成事件仍沿 JSX 樹冒泡，
				    ConfirmDialog 常被巢狀在可點擊卡片（如 SpotItemCard）內，需擋下避免點取消/確認誤觸卡片的 onClick */}
				<DialogContent
					data-slot="confirm-dialog"
					showCloseButton={false}
					onClick={(e) => e.stopPropagation()}
				>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
					<div className="mt-6 flex justify-end gap-2">
						<Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
							取消
						</Button>
						<Button type="button" variant={confirmVariant} disabled={busy} onClick={onConfirm}>
							{busy ? busyLabel : confirmLabel}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		);
	},
);
