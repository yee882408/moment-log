import type { ReactElement } from "react";
import { ListRowSkeleton } from "@/components/common/ListRowSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading(): ReactElement {
	return (
		<main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
			<Skeleton className="h-7 w-28" />
			<Skeleton className="h-4 w-64" />
			<ListRowSkeleton />
		</main>
	);
}
