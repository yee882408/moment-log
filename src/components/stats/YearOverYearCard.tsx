import type { ReactElement } from "react";
import { Card } from "@/components/ui/Card";
import type { YearOverYear } from "@/lib/data/stats";

interface YearOverYearCardProps {
	data: YearOverYear;
}

export function YearOverYearCard({ data }: YearOverYearCardProps): ReactElement {
	const thisYear = new Date().getFullYear();
	const lastYear = thisYear - 1;

	return (
		<Card className="flex flex-col gap-3">
			<h2 className="text-sm font-semibold text-foreground">年度回顧</h2>
			<div className="grid grid-cols-2 gap-4">
				<div className="flex flex-col gap-1">
					<span className="text-xs text-muted-foreground">{thisYear} 年</span>
					<span className="text-xl font-semibold text-foreground">{data.thisYear.count} 場</span>
					<span className="text-xs text-muted-foreground">
						NT${data.thisYear.spending.toLocaleString()}
					</span>
				</div>
				<div className="flex flex-col gap-1">
					<span className="text-xs text-muted-foreground">{lastYear} 年</span>
					<span className="text-xl font-semibold text-foreground">{data.lastYear.count} 場</span>
					<span className="text-xs text-muted-foreground">
						NT${data.lastYear.spending.toLocaleString()}
					</span>
				</div>
			</div>
		</Card>
	);
}
