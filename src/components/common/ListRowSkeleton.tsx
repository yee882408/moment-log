import type { ReactElement } from "react";
import { Skeleton } from "@/components/ui/Skeleton";

interface ListRowSkeletonProps {
	count?: number;
}

// 對應 admin/concerts、admin/users、routes 這類單欄卡片列表版面
export function ListRowSkeleton({ count = 5 }: ListRowSkeletonProps): ReactElement {
	return (
		<ul className="flex flex-col gap-3">
			{Array.from({ length: count }, (_, i) => (
				<li key={i}>
					<Skeleton className="h-16 w-full" />
				</li>
			))}
		</ul>
	);
}
