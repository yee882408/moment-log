import type { ReactElement } from "react";
import { CardGridSkeleton } from "@/components/common/CardGridSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading(): ReactElement {
	return (
		<main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
			<Skeleton className="h-7 w-32" />
			<Skeleton className="h-14 w-full" />
			<CardGridSkeleton />
		</main>
	);
}
