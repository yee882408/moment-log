import type { ReactElement } from "react";
import { Skeleton } from "@/components/ui/Skeleton";

interface CardGridSkeletonProps {
	count?: number;
}

// 對應 ReviewGrid/SpotListCard 的三欄卡片網格版面，供 /concerts、/reviews、/spots、
// /users/[id] 等列表頁的 loading.tsx 共用
export function CardGridSkeleton({ count = 6 }: CardGridSkeletonProps): ReactElement {
	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
			{Array.from({ length: count }, (_, i) => (
				<Skeleton key={i} className="h-[268px] w-full" />
			))}
		</div>
	);
}
