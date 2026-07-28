import type { ReactElement } from "react";
import type { StatsCount } from "@/lib/data/stats";

interface StatsTopListProps {
	title: string;
	items: StatsCount[];
	emptyText: string;
}

// 前三名依名次遞減強調色，第四名以後統一用最淡的色階，避免榜單尾端喧賓奪主
const rankStyles = [
	{ num: "text-lg text-primary", bar: "bg-primary" },
	{ num: "text-base text-primary/60", bar: "bg-primary/60" },
	{ num: "text-base text-primary/35", bar: "bg-primary/35" },
];
const restRankStyle = { num: "text-base text-border", bar: "bg-primary/20" };

// 場館/藝人/標籤排行共用的清單元件：名次 + 名稱 + 次數 + 用寬度比例模擬的橫向 bar
// （純排行用途，資料量小，不需要為此引入 recharts）
export function StatsTopList({ title, items, emptyText }: StatsTopListProps): ReactElement {
	const maxCount = items[0]?.count ?? 0;

	return (
		<div className="relative rounded-sm border border-border bg-card p-5">
			<div className="pointer-events-none absolute inset-1.5 rounded-xs border border-dashed border-border opacity-60" />
			<span className="mb-4 block text-xs font-bold tracking-wider text-primary uppercase">
				{title}
			</span>
			{items.length === 0 ? (
				<p className="text-sm text-muted-foreground">{emptyText}</p>
			) : (
				<ul className="flex flex-col gap-2.5">
					{items.map((item, index) => {
						const style = rankStyles[index] ?? restRankStyle;
						return (
							<li key={item.name} className="flex items-center gap-2.5">
								<span className={`w-5 shrink-0 text-right font-bold ${style.num}`}>
									{index + 1}
								</span>
								<div className="min-w-0 flex-1">
									<div className="mb-1 flex items-center justify-between text-sm text-foreground">
										<span className="truncate">{item.name}</span>
										<span className="ml-2 shrink-0 text-muted-foreground">{item.count}</span>
									</div>
									<div className="h-1.25 w-full overflow-hidden rounded-full bg-background">
										<div
											className={`h-full rounded-full ${style.bar}`}
											style={{ width: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%` }}
										/>
									</div>
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
