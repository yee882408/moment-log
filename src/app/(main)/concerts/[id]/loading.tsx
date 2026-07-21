import type { ReactElement } from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading(): ReactElement {
	return (
		<main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<Skeleton className="h-5 w-24" />
				<div className="flex gap-2">
					<Skeleton className="h-9 w-16" />
					<Skeleton className="h-9 w-16" />
				</div>
			</div>
			<div className="flex flex-col gap-2">
				<Skeleton className="h-8 w-2/3" />
				<Skeleton className="h-5 w-1/3" />
				<Skeleton className="h-4 w-1/2" />
			</div>
			<Skeleton className="aspect-video w-full" />
		</main>
	);
}
