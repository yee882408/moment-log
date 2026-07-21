"use client";

import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { toast } from "sonner";
import { toggleFollow } from "@/lib/actions/follows";
import { Button } from "@/components/ui/Button";

interface FollowButtonProps {
	targetUserId: string;
	initialFollowing: boolean;
}

export function FollowButton({
	targetUserId,
	initialFollowing,
}: FollowButtonProps): ReactElement {
	const [following, setFollowing] = useState(initialFollowing);
	const [, startTransition] = useTransition();

	const handleClick = (): void => {
		// optimistic：先切換畫面，失敗才退回
		const nextFollowing = !following;
		setFollowing(nextFollowing);

		startTransition(async () => {
			const result = await toggleFollow(targetUserId, following);
			if (result?.error) {
				setFollowing(following);
				toast.error(result.error);
			}
		});
	};

	return (
		<Button type="button" variant={following ? "secondary" : "primary"} onClick={handleClick}>
			{following ? "已追蹤" : "追蹤"}
		</Button>
	);
}
