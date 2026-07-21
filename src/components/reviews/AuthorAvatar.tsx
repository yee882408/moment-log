import type { ReactElement } from "react";
import { CoverImage } from "@/components/ui/CoverImage";

interface AuthorAvatarProps {
	author: string | null;
	avatarUrl: string | null;
	// Tailwind 尺寸 class（寬高需一致），預設 h-5 w-5 對應現有作者圓圈大小
	sizeClass?: string;
}

// 作者頭像：有圖顯示圖片，沒圖 fallback 顯示名字首字，供列表卡片/詳情頁重用
export function AuthorAvatar({
	author,
	avatarUrl,
	sizeClass = "h-5 w-5",
}: AuthorAvatarProps): ReactElement {
	if (avatarUrl) {
		return (
			<CoverImage
				src={avatarUrl}
				alt={author ?? "作者頭像"}
				width={40}
				height={40}
				className={`shrink-0 rounded-full object-cover ${sizeClass}`}
			/>
		);
	}

	return (
		<span
			className={`flex shrink-0 items-center justify-center rounded-full bg-background ${sizeClass}`}
		>
			{(author ?? "匿")[0]}
		</span>
	);
}
