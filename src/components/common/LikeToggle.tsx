"use client";

import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { toast } from "sonner";

interface LikeToggleProps {
	initialLiked: boolean;
	initialCount: number;
	// currentlyLiked：呼叫端目前的按讚狀態（切換前）；決定這次要 insert 還是 delete
	onToggle: (currentlyLiked: boolean) => Promise<{ error: string } | undefined>;
}

// 讚按鈕共用邏輯：optimistic update + 失敗還原 + toast，供 LikeButton/SpotListLikeButton 包裝
export function LikeToggle({ initialLiked, initialCount, onToggle }: LikeToggleProps): ReactElement {
	const [liked, setLiked] = useState(initialLiked);
	const [count, setCount] = useState(initialCount);
	const [, startTransition] = useTransition();

	const handleClick = (): void => {
		// optimistic：先切換畫面，失敗才退回
		const nextLiked = !liked;
		setLiked(nextLiked);
		setCount((c) => c + (nextLiked ? 1 : -1));

		startTransition(async () => {
			const result = await onToggle(liked);
			if (result?.error) {
				setLiked(liked);
				setCount((c) => c + (liked ? 1 : -1));
				toast.error(result.error);
			}
		});
	};

	return (
		<div className="flex items-center gap-2">
			<button
				type="button"
				aria-pressed={liked}
				aria-label={liked ? "取消讚" : "讚"}
				onClick={handleClick}
				className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border transition-colors ${
					liked
						? "border-primary bg-primary text-white"
						: "border-border bg-white text-muted-foreground hover:bg-background"
				}`}
			>
				<svg
					viewBox="0 0 24 24"
					fill={liked ? "currentColor" : "none"}
					stroke="currentColor"
					strokeWidth={2}
					className="h-5 w-5"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M12 21s-6.716-4.35-9.428-8.09C.665 10.42 1.1 6.9 3.6 5.2a5.5 5.5 0 0 1 7.9 1.6.6.6 0 0 0 1 0 5.5 5.5 0 0 1 7.9-1.6c2.5 1.7 2.935 5.22 1.028 7.71C18.716 16.65 12 21 12 21Z"
					/>
				</svg>
			</button>
			<span className="text-sm text-muted-foreground">{count}</span>
		</div>
	);
}
