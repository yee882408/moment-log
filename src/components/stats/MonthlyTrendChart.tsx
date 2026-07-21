"use client";

import type { ReactElement } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
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
			<Card className="flex flex-col gap-3">
				<h2 className="text-sm font-semibold text-foreground">每月場次趨勢</h2>
				<p className="text-sm text-muted-foreground">還沒有足夠的紀錄可以繪製趨勢圖</p>
			</Card>
		);
	}

	const chartData = data.map((d) => ({ month: formatMonth(d.month), count: d.count }));

	return (
		<Card className="flex flex-col gap-3">
			<h2 className="text-sm font-semibold text-foreground">每月場次趨勢</h2>
			<div className="h-64 w-full">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={chartData}>
						<CartesianGrid strokeDasharray="3 3" vertical={false} />
						<XAxis dataKey="month" fontSize={12} />
						<YAxis allowDecimals={false} fontSize={12} width={30} />
						<Tooltip />
						<Bar dataKey="count" name="場次" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
					</BarChart>
				</ResponsiveContainer>
			</div>
		</Card>
	);
}
