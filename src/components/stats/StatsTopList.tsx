import type { ReactElement } from "react";
import { Card } from "@/components/ui/Card";
import type { StatsCount } from "@/lib/data/stats";

interface StatsTopListProps {
	title: string;
	items: StatsCount[];
	emptyText: string;
}

// 場館/藝人/標籤排行共用的清單元件：名稱 + 次數 + 用寬度比例模擬的橫向 bar
// （純排行用途，資料量小，不需要為此引入 recharts）
export function StatsTopList({ title, items, emptyText }: StatsTopListProps): ReactElement {
	const maxCount = items[0]?.count ?? 0;

	return (
		<Card className="flex flex-col gap-3">
			<h2 className="text-sm font-semibold text-foreground">{title}</h2>
			{items.length === 0 ? (
				<p className="text-sm text-muted-foreground">{emptyText}</p>
			) : (
				<ul className="flex flex-col gap-2">
					{items.map((item) => (
						<li key={item.name} className="flex flex-col gap-1">
							<div className="flex items-center justify-between text-sm text-foreground">
								<span className="truncate">{item.name}</span>
								<span className="shrink-0 text-muted-foreground">{item.count}</span>
							</div>
							<div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
								<div
									className="h-full rounded-full bg-primary"
									style={{ width: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%` }}
								/>
							</div>
						</li>
					))}
				</ul>
			)}
		</Card>
	);
}
