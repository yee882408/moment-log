"use client";

import { useRef, useState } from "react";
import type { RefObject } from "react";
import { toast } from "sonner";
import type { ConfirmDialogHandle } from "@/components/ui/ConfirmDialog";

interface UseConfirmDeleteOptions {
	// 失敗訊息前綴，例如「刪除失敗：」「操作失敗：」，維持各呼叫端原本的文案差異
	errorPrefix?: string;
	// 成功後是否自動關閉 dialog：多數刪除按鈕靠 Server Action 的 redirect 讓元件卸載，
	// 不需要這步（預設 true 也不影響，卸載前多呼叫一次 close 無副作用）；
	// 設 false 可跳過（目前沒有呼叫端需要跳過，保留彈性）
	closeOnSuccess?: boolean;
	// 成功後額外要通知的對象，例如父層要重新抓取資料（SpotItemCard/CommentItem 的 onDeleted）
	onSuccess?: () => void;
}

// 共用「busy state + ConfirmDialogHandle ref + 呼叫 action + 失敗 toast」骨架，
// 供刪除/確認類按鈕重用。呼叫端保留自己的 <Button>/<ConfirmDialog> 排版與文案
export function useConfirmDelete(
	action: () => Promise<{ error: string } | undefined>,
	options?: UseConfirmDeleteOptions,
): {
	busy: boolean;
	dialogRef: RefObject<ConfirmDialogHandle | null>;
	handleConfirm: () => Promise<void>;
} {
	const [busy, setBusy] = useState(false);
	const dialogRef = useRef<ConfirmDialogHandle>(null);
	const closeOnSuccess = options?.closeOnSuccess ?? true;

	const handleConfirm = async (): Promise<void> => {
		setBusy(true);
		const result = await action();
		if (result?.error) {
			toast.error(`${options?.errorPrefix ?? ""}${result.error}`);
			setBusy(false);
			return;
		}
		setBusy(false);
		if (closeOnSuccess) {
			dialogRef.current?.close();
		}
		options?.onSuccess?.();
	};

	return { busy, dialogRef, handleConfirm };
}
