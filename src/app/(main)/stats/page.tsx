import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyStatsOverview } from "@/lib/data/stats";
import { StatsOverviewCards } from "@/components/stats/StatsOverviewCards";
import { StatsTopList } from "@/components/stats/StatsTopList";
import { MonthlyTrendChart } from "@/components/stats/MonthlyTrendChart";
import { YearOverYearCard } from "@/components/stats/YearOverYearCard";
import { SpendingIntervalCard } from "@/components/stats/SpendingIntervalCard";

export default async function StatsPage(): Promise<ReactElement> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	const stats = await getMyStatsOverview(user.id);

	return (
		<main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4.5 p-6">
			<div>
				<span className="block text-xs font-bold tracking-wider text-primary uppercase">
					追星檔案庫
				</span>
				<h1 className="mt-1 text-2xl font-semibold text-foreground">我的追星統計</h1>
			</div>

			<StatsOverviewCards
				totalCount={stats.totalCount}
				totalSpending={stats.totalSpending}
				averageRating={stats.averageRating}
			/>

			<MonthlyTrendChart data={stats.monthlyTrend} />

			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<StatsTopList title="最常去的場館" items={stats.topVenues} emptyText="還沒有任何紀錄" />
				<StatsTopList title="最常看的藝人" items={stats.topArtists} emptyText="還沒有任何紀錄" />
				<StatsTopList title="標籤分佈" items={stats.tagDistribution} emptyText="還沒有使用過標籤" />
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<YearOverYearCard data={stats.yearOverYear} />
				<SpendingIntervalCard spending={stats.spendingStats} interval={stats.intervalStats} />
			</div>
		</main>
	);
}
