import type { ReactElement } from "react";
import { Card } from "@/components/ui/Card";
import type { SpendingStats } from "@/lib/data/stats";

interface SpendingStatsCardProps {
	data: SpendingStats;
}

function formatPrice(value: number | null): string {
	return value != null ? `NT$${Math.round(value).toLocaleString()}` : "尚無資料";
}

export function SpendingStatsCard({ data }: SpendingStatsCardProps): ReactElement {
	return (
		<Card className="flex flex-col gap-3">
			<h2 className="text-sm font-semibold text-foreground">花費統計</h2>
			<div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
				<div className="flex flex-col gap-1">
					<span className="text-xs text-muted-foreground">平均票價</span>
					<span className="text-lg font-semibold text-foreground">{formatPrice(data.average)}</span>
				</div>
				<div className="flex flex-col gap-1">
					<span className="text-xs text-muted-foreground">最高單場</span>
					<span className="text-lg font-semibold text-foreground">{formatPrice(data.highest)}</span>
				</div>
				<div className="flex flex-col gap-1">
					<span className="text-xs text-muted-foreground">最低單場</span>
					<span className="text-lg font-semibold text-foreground">{formatPrice(data.lowest)}</span>
				</div>
			</div>
		</Card>
	);
}
