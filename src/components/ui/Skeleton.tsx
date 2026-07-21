import type { ReactElement, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// 純展示用的灰色骨架方塊，供各 loading.tsx 組出頁面對應的載入佔位版面
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>): ReactElement {
	return (
		<div
			data-slot="skeleton"
			className={cn("animate-pulse rounded-lg bg-background", className)}
			{...props}
		/>
	);
}
