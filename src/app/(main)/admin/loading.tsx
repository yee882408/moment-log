import type { ReactElement } from "react";
import { ListRowSkeleton } from "@/components/common/ListRowSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";

// 對應整個 admin/layout.tsx 邊界（layout 本身要查 isCurrentUserAdmin，尚未 resolve
// 前這個骨架先顯示）；子路由（concerts/users）不再各自重複放這個骨架。
// Header 已由外層 (main)/layout.tsx 提供，不會卸載重掛，這裡不需要再放 header 骨架
export default function Loading(): ReactElement {
	return (
		<>
			<div className="h-1 w-full bg-accent" />
			<main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
				<Skeleton className="h-7 w-32" />
				<ListRowSkeleton />
			</main>
		</>
	);
}
