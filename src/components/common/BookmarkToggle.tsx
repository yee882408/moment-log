"use client";

import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";

interface BookmarkToggleProps {
	initialBookmarked: boolean;
	// currentlyBookmarked：呼叫端目前的收藏狀態（切換前）；決定這次要 insert 還是 delete
	onToggle: (currentlyBookmarked: boolean) => Promise<{ error: string } | undefined>;
	// 私密內容無法被收藏（RLS 擋 insert），呼叫端傳 disabled 時按鈕顯示但不可操作
	disabled?: boolean;
	disabledReason?: string;
}

// 收藏按鈕共用邏輯：與 LikeToggle 平行的獨立元件，不強行抽共用泛型——收藏不顯示
// 數量（私人行為，沒有公開聚合需求），icon/語意也不同，抽象後參數會比各自實作更難讀。
// optimistic update + 失敗還原 + toast 的邏輯結構比照 LikeToggle，供
// ReviewBookmarkButton/SpotListBookmarkButton 包裝
export function BookmarkToggle({
	initialBookmarked,
	onToggle,
	disabled = false,
	disabledReason,
}: BookmarkToggleProps): ReactElement {
	const [bookmarked, setBookmarked] = useState(initialBookmarked);
	const [, startTransition] = useTransition();

	const handleClick = (): void => {
		// optimistic：先切換畫面，失敗才退回
		const nextBookmarked = !bookmarked;
		setBookmarked(nextBookmarked);

		startTransition(async () => {
			const result = await onToggle(bookmarked);
			if (result?.error) {
				setBookmarked(bookmarked);
				toast.error(result.error);
			}
		});
	};

	return (
		<button
			type="button"
			aria-pressed={bookmarked}
			aria-label={bookmarked ? "取消收藏" : "收藏"}
			disabled={disabled}
			title={disabled ? disabledReason : undefined}
			onClick={handleClick}
			className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
				disabled
					? "cursor-not-allowed border-border bg-white text-muted-foreground/50"
					: bookmarked
						? "cursor-pointer border-primary bg-primary text-white"
						: "cursor-pointer border-border bg-white text-muted-foreground hover:bg-background"
			}`}
		>
			<Bookmark className="h-4.5 w-4.5" fill={bookmarked ? "currentColor" : "none"} />
		</button>
	);
}
