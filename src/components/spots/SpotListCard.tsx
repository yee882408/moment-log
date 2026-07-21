import type { ReactElement } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { SpotListSummary } from "@/lib/data/spots";

interface SpotListCardProps {
	list: SpotListSummary;
}

// 清單卡片，供 /spots 列表頁重用；點擊整張卡片進清單詳情頁看地圖
export function SpotListCard({ list }: SpotListCardProps): ReactElement {
	return (
		<Card hover className="relative flex min-h-32 flex-col gap-2">
			<Link href={`/spots/${list.id}`} className="absolute inset-0 z-0">
				<span className="sr-only">{list.title}</span>
			</Link>
			<span className="pointer-events-none line-clamp-1 font-medium text-foreground">
				{list.title}
			</span>
			<span className="pointer-events-none inline-flex w-fit items-center rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
				{list.artist}
			</span>
			{list.description && (
				<p
					title={list.description}
					className="pointer-events-none line-clamp-2 min-h-0 text-sm text-muted-foreground"
				>
					{list.description}
				</p>
			)}
			<div className="pointer-events-none mt-auto flex items-center gap-3 text-xs text-muted-foreground">
				<span>{list.item_count} 個地點</span>
				<span className="ml-auto">♥ {list.like_count}</span>
			</div>
		</Card>
	);
}
