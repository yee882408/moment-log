import type { ReactElement } from "react";
import { Card } from "@/components/ui/Card";
import type { IntervalStats } from "@/lib/data/stats";

interface IntervalStatsCardProps {
	data: IntervalStats;
}

export function IntervalStatsCard({ data }: IntervalStatsCardProps): ReactElement {
	if (data.averageDays == null || data.longestDays == null) {
		return (
			<Card className="flex flex-col gap-3">
				<h2 className="text-sm font-semibold text-foreground">場次間隔</h2>
				<p className="text-sm text-muted-foreground">累積 2 場以上才能看到間隔統計</p>
			</Card>
		);
	}

	return (
		<Card className="flex flex-col gap-3">
			<h2 className="text-sm font-semibold text-foreground">場次間隔</h2>
			<div className="grid grid-cols-2 gap-4">
				<div className="flex flex-col gap-1">
					<span className="text-xs text-muted-foreground">平均間隔</span>
					<span className="text-xl font-semibold text-foreground">{data.averageDays} 天</span>
				</div>
				<div className="flex flex-col gap-1">
					<span className="text-xs text-muted-foreground">最長間隔</span>
					<span className="text-xl font-semibold text-foreground">{data.longestDays} 天</span>
				</div>
			</div>
		</Card>
	);
}
