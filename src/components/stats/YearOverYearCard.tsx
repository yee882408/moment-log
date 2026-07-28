import type { ReactElement } from "react";
import type { YearOverYear } from "@/lib/data/stats";

interface YearOverYearCardProps {
	data: YearOverYear;
}

// 去年 0 場時百分比沒有意義（分母為 0），用 null 表示「無法比較」
function calcDeltaPct(thisCount: number, lastCount: number): number | null {
	if (lastCount === 0) {
		return null;
	}
	return ((thisCount - lastCount) / lastCount) * 100;
}

export function YearOverYearCard({ data }: YearOverYearCardProps): ReactElement {
	const thisYear = new Date().getFullYear();
	const lastYear = thisYear - 1;
	const deltaPct = calcDeltaPct(data.thisYear.count, data.lastYear.count);
	const isUp = deltaPct != null && deltaPct > 0;
	const isDown = deltaPct != null && deltaPct < 0;

	return (
		<div className="relative rounded-sm border border-border bg-card p-5">
			<div className="pointer-events-none absolute inset-1.5 rounded-xs border border-dashed border-border opacity-60" />
			<span className="mb-4 block text-xs font-bold tracking-wider text-primary uppercase">
				年度回顧
			</span>
			<div className="flex items-center gap-3">
				<div className="min-w-0 flex-1 opacity-55">
					<span className="text-xs tracking-wide text-muted-foreground uppercase">
						{lastYear} 年
					</span>
					<span className="mt-1 block truncate text-2xl leading-none font-bold text-foreground">
						{data.lastYear.count} 場
					</span>
					<span className="mt-1 block truncate text-xs text-muted-foreground">
						NT${data.lastYear.spending.toLocaleString()}
					</span>
				</div>

				<div className="flex shrink-0 flex-col items-center gap-1.5">
					<div className="relative flex items-center">
						<span className="absolute right-full mr-1 text-sm leading-none text-border">—</span>
						<span
							className={`flex h-8.5 min-w-8.5 items-center justify-center rounded-full px-1.5 text-sm font-bold ${
								isUp
									? "bg-success/10 text-success"
									: isDown
										? "bg-destructive/10 text-destructive"
										: "bg-muted text-muted-foreground"
							}`}
						>
							{isUp && `+${data.thisYear.count - data.lastYear.count}`}
							{isDown && data.thisYear.count - data.lastYear.count}
							{!isUp && !isDown && "="}
						</span>
						<span className="absolute left-full ml-1 text-sm leading-none text-border">→</span>
					</div>
					{deltaPct != null && (
						<span
							className={`text-xs font-bold text-nowrap ${isUp ? "text-success" : isDown ? "text-destructive" : "text-muted-foreground"}`}
						>
							{isUp ? "+" : ""}
							{deltaPct.toFixed(1)}%
						</span>
					)}
				</div>

				<div className="min-w-0 flex-1 text-right">
					<span className="text-xs tracking-wide text-muted-foreground uppercase">
						{thisYear} 年
					</span>
					<span className="mt-1 block truncate text-2xl leading-none font-bold text-foreground">
						{data.thisYear.count} 場
					</span>
					<span className="mt-1 block truncate text-xs text-muted-foreground">
						NT${data.thisYear.spending.toLocaleString()}
					</span>
				</div>
			</div>
		</div>
	);
}
