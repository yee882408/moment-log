import type { ReactElement } from "react";
import { Skeleton } from "@/components/ui/Skeleton";

interface CardGridSkeletonProps {
	count?: number;
	// ReviewGrid（滿版圖片疊字版面，400px）與 SpotListCard（彈性高度，實際約 128px）
	// 卡片高度差異大，骨架跟真實卡片落差太多會在資料載入完成時有明顯跳動，
	// 呼叫端各自傳自己頁面實際的卡片高度
	cardHeightClassName?: string;
}

// 對應 ReviewGrid/SpotListCard 的三欄卡片網格版面，供 /concerts、/reviews、/spots、
// /users/[id] 等列表頁的 loading.tsx 共用
export function CardGridSkeleton({
	count = 6,
	cardHeightClassName = "h-[400px]",
}: CardGridSkeletonProps): ReactElement {
	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
			{Array.from({ length: count }, (_, i) => (
				<Skeleton key={i} className={`w-full ${cardHeightClassName}`} />
			))}
		</div>
	);
}
