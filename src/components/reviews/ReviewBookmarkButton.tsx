"use client";

import type { ReactElement } from "react";
import { toggleBookmark } from "@/lib/actions/bookmarks";
import { BookmarkToggle } from "@/components/common/BookmarkToggle";

interface ReviewBookmarkButtonProps {
	recordId: string;
	initialBookmarked: boolean;
	disabled?: boolean;
}

export function ReviewBookmarkButton({
	recordId,
	initialBookmarked,
	disabled,
}: ReviewBookmarkButtonProps): ReactElement {
	return (
		<BookmarkToggle
			initialBookmarked={initialBookmarked}
			onToggle={(bookmarked) => toggleBookmark(recordId, bookmarked)}
			disabled={disabled}
			disabledReason="公開後才能收藏"
		/>
	);
}
