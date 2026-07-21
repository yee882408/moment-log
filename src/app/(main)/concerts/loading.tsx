import type { ReactElement } from "react";
import { CardGridSkeleton } from "@/components/common/CardGridSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading(): ReactElement {
	return (
		<main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<Skeleton className="h-7 w-40" />
				<Skeleton className="h-9 w-28" />
			</div>
			<Skeleton className="h-14 w-full" />
			<CardGridSkeleton />
		</main>
	);
}
