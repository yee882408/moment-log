"use client";

import type { ReactElement } from "react";
import { toggleLike } from "@/lib/actions/likes";
import { LikeToggle } from "@/components/common/LikeToggle";

interface LikeButtonProps {
	recordId: string;
	initialCount: number;
	initialLiked: boolean;
	disabled?: boolean;
}

export function LikeButton({
	recordId,
	initialCount,
	initialLiked,
	disabled,
}: LikeButtonProps): ReactElement {
	return (
		<LikeToggle
			initialLiked={initialLiked}
			initialCount={initialCount}
			onToggle={(liked) => toggleLike(recordId, liked)}
			disabled={disabled}
			disabledReason="公開後才能按讚"
		/>
	);
}
