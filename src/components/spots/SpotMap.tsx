"use client";

import dynamic from "next/dynamic";
import type { ReactElement } from "react";
import { Spinner } from "@/components/ui/Spinner";
import type { SpotMapPoint } from "@/components/spots/SpotMapInner";

export type { SpotMapPoint } from "@/components/spots/SpotMapInner";

// Leaflet 依賴瀏覽器 window，SSR 階段會出錯，用 dynamic import 停用 SSR
const SpotMapInner = dynamic(
	() => import("@/components/spots/SpotMapInner").then((m) => m.SpotMapInner),
	{
		ssr: false,
		loading: () => (
			<div className="flex h-96 w-full items-center justify-center rounded-xl border border-border bg-background">
				<Spinner />
			</div>
		),
	},
);

interface SpotMapProps {
	points: SpotMapPoint[];
	previewPoint?: { lat: number; lng: number; label: string } | null;
	focusedPointId?: string | null;
	heightClassName?: string;
}

export function SpotMap({
	points,
	previewPoint,
	focusedPointId,
	heightClassName,
}: SpotMapProps): ReactElement {
	return (
		<SpotMapInner
			points={points}
			previewPoint={previewPoint}
			focusedPointId={focusedPointId}
			heightClassName={heightClassName}
		/>
	);
}
