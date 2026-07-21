import type { ReactElement } from "react";
import { CardGridSkeleton } from "@/components/common/CardGridSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading(): ReactElement {
	return (
		<main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
			<div className="flex items-center gap-3">
				<Skeleton className="h-10 w-10 rounded-full" />
				<div className="flex flex-col gap-1">
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-4 w-20" />
				</div>
			</div>
			<CardGridSkeleton count={9} />
		</main>
	);
}
