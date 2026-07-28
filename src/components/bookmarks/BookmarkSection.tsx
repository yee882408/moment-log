import type { ReactElement, ReactNode } from "react";
import Link from "next/link";

interface BookmarkSectionProps {
	kicker?: string;
	title: string;
	href: string;
	totalCount: number;
	previewCount: number;
	isEmpty: boolean;
	emptyText: string;
	emptyActionHref: string;
	emptyActionLabel: string;
	children: ReactNode;
}

// /bookmarks 首頁兩區塊（收藏的心得／收藏的追星地圖）共用的外框：kicker + 標題 +
// 「查看全部」連結（只在超過預覽筆數時顯示）+ 內容區 + 空狀態
export function BookmarkSection({
	kicker,
	title,
	href,
	totalCount,
	previewCount,
	isEmpty,
	emptyText,
	emptyActionHref,
	emptyActionLabel,
	children,
}: BookmarkSectionProps): ReactElement {
	return (
		<section className="flex flex-col gap-3">
			<div className="flex items-end justify-between border-b border-dashed border-border pb-2.5">
				<div>
					{kicker && (
						<span className="block text-xs font-bold tracking-wider text-primary uppercase">
							{kicker}
						</span>
					)}
					<h2 className="mt-0.5 text-lg font-semibold text-foreground">{title}</h2>
				</div>
				{totalCount > previewCount && (
					<Link
						href={href}
						className="shrink-0 text-sm text-muted-foreground hover:text-foreground hover:underline"
					>
						查看全部 {totalCount} 筆 →
					</Link>
				)}
			</div>

			{isEmpty ? (
				<div className="relative rounded-sm border border-dashed border-border bg-card/50 px-5 py-10 text-center">
					<p className="text-sm text-muted-foreground">{emptyText}</p>
					<Link
						href={emptyActionHref}
						className="mt-2 inline-block text-sm text-primary hover:underline"
					>
						{emptyActionLabel} →
					</Link>
				</div>
			) : (
				children
			)}
		</section>
	);
}
