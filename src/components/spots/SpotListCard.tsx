import type { ReactElement } from "react";
import Link from "next/link";
import type { SpotListSummary } from "@/lib/data/spots";

interface SpotListCardProps {
	list: SpotListSummary;
}

// 清單卡片，供 /spots 列表頁重用；點擊整張卡片進清單詳情頁看地圖。
// 護照戳章造型：右上角圓形印章標示公開/私密狀態、虛線內框，
// 呼應追星「巡禮」的旅行記錄調性；不用 ui/Card（圓角/陰影跟印章造型不同套）
export function SpotListCard({ list }: SpotListCardProps): ReactElement {
	return (
		<div className="group relative rounded-sm border border-border bg-card p-5 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_16px_28px_-14px_rgba(15,23,42,0.2)]">
			<Link href={`/spots/${list.id}`} className="absolute inset-0 z-0">
				<span className="sr-only">{list.title}</span>
			</Link>
			{/* 虛線內框：純裝飾，呼應護照/文件的印刷質感 */}
			<div className="pointer-events-none absolute inset-1.5 rounded-sm border border-dashed border-border" />

			<span
				className={`pointer-events-none absolute top-3.5 right-4 flex h-11.5 w-11.5 rotate-[8deg] items-center justify-center rounded-full border-2 text-center text-2xs leading-tight font-extrabold tracking-wide opacity-90 ${
					list.is_public
						? "border-success text-success"
						: "border-muted-foreground text-muted-foreground"
				}`}
			>
				{list.is_public ? (
					<>
						VISITED
						<br />✓ PUBLIC
					</>
				) : (
					<>
						PRIVATE
						<br />◐ LOG
					</>
				)}
			</span>

			<span className="pointer-events-none block text-xs font-bold tracking-wider text-primary uppercase">
				{list.artist}
			</span>
			<h3 className="pointer-events-none mt-1.5 mr-15 line-clamp-2 text-lg leading-snug font-semibold text-foreground">
				{list.title}
			</h3>

			{/* 純虛線分隔，不放編號文字（避免冒充有意義的資料） */}
			<div className="pointer-events-none mt-2.5 border-t border-dashed border-border" />

			<div className="pointer-events-none mt-2.5 flex items-center justify-between text-xs text-muted-foreground">
				<span>{list.item_count} 個地點</span>
				<span>♥ {list.like_count}</span>
			</div>
		</div>
	);
}
