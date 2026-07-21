import type { ReactElement } from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading(): ReactElement {
	return (
		<main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 p-6">
			<div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
				<Skeleton className="h-5 w-28" />
				<div className="flex flex-col gap-2">
					<Skeleton className="h-8 w-2/3" />
					<Skeleton className="h-5 w-1/3" />
					<Skeleton className="h-4 w-1/2" />
				</div>
				<Skeleton className="aspect-video w-full" />
			</div>
		</main>
	);
}
