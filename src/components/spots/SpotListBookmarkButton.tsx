"use client";

import type { ReactElement } from "react";
import { toggleSpotListBookmark } from "@/lib/actions/spotListBookmarks";
import { BookmarkToggle } from "@/components/common/BookmarkToggle";

interface SpotListBookmarkButtonProps {
	listId: string;
	initialBookmarked: boolean;
}

export function SpotListBookmarkButton({
	listId,
	initialBookmarked,
}: SpotListBookmarkButtonProps): ReactElement {
	return (
		<BookmarkToggle
			initialBookmarked={initialBookmarked}
			onToggle={(bookmarked) => toggleSpotListBookmark(listId, bookmarked)}
		/>
	);
}
