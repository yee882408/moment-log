import type { ReactElement } from "react";
import type { IntervalStats, SpendingStats } from "@/lib/data/stats";

interface SpendingIntervalCardProps {
	spending: SpendingStats;
	interval: IntervalStats;
}

function formatPrice(value: number | null): string {
	return value != null ? `NT$${Math.round(value).toLocaleString()}` : "尚無資料";
}

function MetricCell({
	label,
	value,
	accent,
}: {
	label: string;
	value: string;
	accent?: boolean;
}): ReactElement {
	return (
		<div className="flex flex-col gap-1">
			<span className="text-xs text-muted-foreground">{label}</span>
			<span className={`text-lg font-semibold ${accent ? "text-primary" : "text-foreground"}`}>
				{value}
			</span>
		</div>
	);
}

// 花費統計（平均/最高/最低票價）跟場次間隔（平均/最長間隔天數）合併成一張卡，
// 避免兩張各自只有兩三個小數字的卡片讓頁面顯得零碎
export function SpendingIntervalCard({ spending, interval }: SpendingIntervalCardProps): ReactElement {
	return (
		<div className="relative rounded-sm border border-border bg-card p-5">
			<div className="pointer-events-none absolute inset-1.5 rounded-xs border border-dashed border-border opacity-60" />
			<span className="mb-4 block text-xs font-bold tracking-wider text-primary uppercase">
				花費與間隔
			</span>
			<div className="grid grid-cols-3 gap-3">
				<MetricCell label="平均票價" value={formatPrice(spending.average)} />
				<MetricCell label="最高單場" value={formatPrice(spending.highest)} />
				<MetricCell label="最低單場" value={formatPrice(spending.lowest)} />
			</div>
			<div className="mt-3.5 grid grid-cols-2 gap-3 border-t border-dashed border-border pt-3.5">
				{interval.averageDays != null && interval.longestDays != null ? (
					<>
						<MetricCell label="平均間隔" value={`${interval.averageDays} 天`} accent />
						<MetricCell label="最長間隔" value={`${interval.longestDays} 天`} accent />
					</>
				) : (
					<p className="col-span-2 text-sm text-muted-foreground">累積 2 場以上才能看到間隔統計</p>
				)}
			</div>
		</div>
	);
}
