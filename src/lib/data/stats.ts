import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getTagsByRecordIds } from "@/lib/data/tags";

const TOP_LIMIT = 5;

export interface StatsCount {
	name: string;
	count: number;
}

export interface MonthlyCount {
	month: string; // yyyy-mm-01
	count: number;
}

export interface YearOverYear {
	thisYear: { count: number; spending: number };
	lastYear: { count: number; spending: number };
}

export interface SpendingStats {
	average: number | null;
	highest: number | null;
	lowest: number | null;
}

export interface IntervalStats {
	averageDays: number | null;
	longestDays: number | null;
}

export interface RecordStatsOverview {
	totalCount: number;
	totalSpending: number;
	averageRating: number | null;
	topVenues: StatsCount[];
	topArtists: StatsCount[];
	tagDistribution: StatsCount[];
	monthlyTrend: MonthlyCount[];
	yearOverYear: YearOverYear;
	spendingStats: SpendingStats;
	intervalStats: IntervalStats;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// 今年 vs 去年同一批紀錄各自的場次與花費加總；用 date 開頭 4 碼字串比對年份，
// 不需要真的 parse 成 Date（concert_records.date 是 "YYYY-MM-DD" 格式字串）
function calcYearOverYear(rows: { date: string; ticket_price: number | null }[]): YearOverYear {
	const thisYearStr = String(new Date().getFullYear());
	const lastYearStr = String(new Date().getFullYear() - 1);

	const sumFor = (yearStr: string): { count: number; spending: number } => {
		const matched = rows.filter((r) => r.date.startsWith(yearStr));
		return {
			count: matched.length,
			spending: matched.reduce((sum, r) => sum + (r.ticket_price ?? 0), 0),
		};
	};

	return { thisYear: sumFor(thisYearStr), lastYear: sumFor(lastYearStr) };
}

// 只對有填票價的紀錄計算，避免 null 拉低平均或誤判成 0 元最低價
function calcSpendingStats(ticketPrices: number[]): SpendingStats {
	if (ticketPrices.length === 0) {
		return { average: null, highest: null, lowest: null };
	}
	return {
		average: ticketPrices.reduce((sum, p) => sum + p, 0) / ticketPrices.length,
		highest: Math.max(...ticketPrices),
		lowest: Math.min(...ticketPrices),
	};
}

// 依日期排序後算相鄰紀錄的天數差；少於 2 筆時沒有「間隔」可言
function calcIntervalStats(dates: string[]): IntervalStats {
	if (dates.length < 2) {
		return { averageDays: null, longestDays: null };
	}
	const sorted = [...dates].sort();
	const gaps: number[] = [];
	for (let i = 1; i < sorted.length; i++) {
		const diffMs = new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime();
		gaps.push(Math.round(diffMs / MS_PER_DAY));
	}
	return {
		averageDays: Math.round(gaps.reduce((sum, g) => sum + g, 0) / gaps.length),
		longestDays: Math.max(...gaps),
	};
}

// 依名稱分組計數，取前 N 名（次數多到少排序）
function countBy(values: string[], limit: number): StatsCount[] {
	const counts = new Map<string, number>();
	for (const value of values) {
		counts.set(value, (counts.get(value) ?? 0) + 1);
	}
	return [...counts.entries()]
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, limit);
}

// 使用者的個人統計總覽：概覽數字 + 場館/藝人/標籤排行 + 月度趨勢。
// 資料量對個人使用者來說很小（頂多幾百筆紀錄），除了月度趨勢需要資料庫端
// group by（見 get_monthly_record_counts），其餘都是撈全部紀錄後在 JS 端 reduce
export async function getMyStatsOverview(userId: string): Promise<RecordStatsOverview> {
	const supabase = await createClient();

	const { data: records, error } = await supabase
		.from("concert_records")
		.select("id, venue_name, artist, ticket_price, rating, date")
		.eq("user_id", userId);
	if (error) {
		throw new Error(`讀取統計資料失敗：${error.message}`);
	}

	const rows = records ?? [];
	const totalCount = rows.length;
	const totalSpending = rows.reduce((sum, r) => sum + (r.ticket_price ?? 0), 0);
	const ratedRows = rows.filter((r): r is typeof r & { rating: number } => r.rating != null);
	const averageRating =
		ratedRows.length > 0
			? ratedRows.reduce((sum, r) => sum + r.rating, 0) / ratedRows.length
			: null;

	const topVenues = countBy(
		rows.map((r) => r.venue_name),
		TOP_LIMIT,
	);
	const topArtists = countBy(
		rows.map((r) => r.artist),
		TOP_LIMIT,
	);

	const recordIds = rows.map((r) => r.id);
	const tagsByRecordId = await getTagsByRecordIds(recordIds);
	const allTagNames = [...tagsByRecordId.values()].flat().map((t) => t.name);
	const tagDistribution = countBy(allTagNames, TOP_LIMIT);

	const { data: monthlyRows, error: monthlyError } = await supabase.rpc(
		"get_monthly_record_counts",
	);
	if (monthlyError) {
		throw new Error(`讀取月度趨勢失敗：${monthlyError.message}`);
	}
	const monthlyTrend: MonthlyCount[] = (monthlyRows ?? []).map((r) => ({
		month: r.month,
		count: r.count,
	}));

	const yearOverYear = calcYearOverYear(rows);
	const spendingStats = calcSpendingStats(
		rows.map((r) => r.ticket_price).filter((p): p is number => p != null),
	);
	const intervalStats = calcIntervalStats(rows.map((r) => r.date));

	return {
		totalCount,
		totalSpending,
		averageRating,
		topVenues,
		topArtists,
		tagDistribution,
		monthlyTrend,
		yearOverYear,
		spendingStats,
		intervalStats,
	};
}
