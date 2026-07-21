import type { ReactElement } from "react";
import { Card } from "@/components/ui/Card";

interface StatsOverviewCardsProps {
	totalCount: number;
	totalSpending: number;
	averageRating: number | null;
}

function OverviewCard({ label, value }: { label: string; value: string }): ReactElement {
	return (
		<Card className="flex flex-col gap-1">
			<span className="text-sm text-muted-foreground">{label}</span>
			<span className="text-2xl font-semibold text-foreground">{value}</span>
		</Card>
	);
}

export function StatsOverviewCards({
	totalCount,
	totalSpending,
	averageRating,
}: StatsOverviewCardsProps): ReactElement {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
			<OverviewCard label="總場次" value={`${totalCount} 場`} />
			<OverviewCard label="總花費" value={`NT$${totalSpending.toLocaleString()}`} />
			<OverviewCard
				label="平均評分"
				value={averageRating != null ? `${averageRating.toFixed(1)} / 5` : "尚無評分"}
			/>
		</div>
	);
}
