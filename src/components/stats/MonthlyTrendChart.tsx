"use client";

import type { ReactElement } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthlyCount } from "@/lib/data/stats";

interface MonthlyTrendChartProps {
	data: MonthlyCount[];
}

// yyyy-mm-01 → yyyy/mm，圖表 X 軸標籤用
function formatMonth(month: string): string {
	const [year, m] = month.split("-");
	return `${year}/${m}`;
}

// 個人每月看演場次趨勢圖；recharts 需要瀏覽器渲染，獨立成 Client Component
export function MonthlyTrendChart({ data }: MonthlyTrendChartProps): ReactElement {
	if (data.length === 0) {
		return (
			<div className="relative rounded-sm border border-border bg-card p-5">
				<div className="pointer-events-none absolute inset-1.5 rounded-xs border border-dashed border-border opacity-60" />
				<span className="mb-4 block text-xs font-bold tracking-wider text-primary uppercase">
					每月場次趨勢
				</span>
				<p className="text-sm text-muted-foreground">還沒有足夠的紀錄可以繪製趨勢圖</p>
			</div>
		);
	}

	const chartData = data.map((d) => ({ month: formatMonth(d.month), count: d.count }));

	return (
		<div className="relative rounded-sm border border-border bg-card p-5">
			<div className="pointer-events-none absolute inset-1.5 rounded-xs border border-dashed border-border opacity-60" />
			<span className="mb-4 block text-xs font-bold tracking-wider text-primary uppercase">
				每月場次趨勢
			</span>
			<div className="h-64 w-full">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={chartData}>
						<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
						<XAxis dataKey="month" fontSize={12} stroke="var(--color-muted-foreground)" />
						<YAxis allowDecimals={false} fontSize={12} width={28} stroke="var(--color-muted-foreground)" />
						<Tooltip
							contentStyle={{
								borderRadius: 4,
								border: "1px solid var(--color-border)",
								fontSize: 12,
							}}
						/>
						<Bar dataKey="count" name="場次" fill="var(--color-primary)" radius={[3, 3, 0, 0]} maxBarSize={34} />
					</BarChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
