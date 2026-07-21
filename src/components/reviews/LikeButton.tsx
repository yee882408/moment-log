"use client";

import type { ReactElement } from "react";
import { toggleLike } from "@/lib/actions/likes";
import { LikeToggle } from "@/components/common/LikeToggle";

interface LikeButtonProps {
	recordId: string;
	initialCount: number;
	initialLiked: boolean;
}

export function LikeButton({
	recordId,
	initialCount,
	initialLiked,
}: LikeButtonProps): ReactElement {
	return (
		<LikeToggle
			initialLiked={initialLiked}
			initialCount={initialCount}
			onToggle={(liked) => toggleLike(recordId, liked)}
		/>
	);
}
