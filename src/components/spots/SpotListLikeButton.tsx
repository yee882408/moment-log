"use client";

import type { ReactElement } from "react";
import { toggleSpotListLike } from "@/lib/actions/spotListLikes";
import { LikeToggle } from "@/components/common/LikeToggle";

interface SpotListLikeButtonProps {
	listId: string;
	initialCount: number;
	initialLiked: boolean;
}

export function SpotListLikeButton({
	listId,
	initialCount,
	initialLiked,
}: SpotListLikeButtonProps): ReactElement {
	return (
		<LikeToggle
			initialLiked={initialLiked}
			initialCount={initialCount}
			onToggle={(liked) => toggleSpotListLike(listId, liked)}
		/>
	);
}
