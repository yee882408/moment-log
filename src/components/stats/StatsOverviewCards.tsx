import type { ReactElement, ReactNode } from "react";

interface StatsOverviewCardsProps {
	totalCount: number;
	totalSpending: number;
	averageRating: number | null;
}

// 護照戳章卡殼：4px 圓角 + 虛線內框，跟 concerts/spots 頁的視覺語言一致
function StatCard({
	eyebrow,
	children,
	className,
}: {
	eyebrow: string;
	children: ReactNode;
	className?: string;
}): ReactElement {
	return (
		<div className={`relative flex flex-col justify-center rounded-sm border border-border bg-card p-5 ${className ?? ""}`}>
			<div className="pointer-events-none absolute inset-1.5 rounded-xs border border-dashed border-border opacity-60" />
			<span className="mb-3 block text-xs font-bold tracking-wider text-primary uppercase">
				{eyebrow}
			</span>
			{children}
		</div>
	);
}

function StarRatingDisplay({ rating }: { rating: number }): ReactElement {
	const rounded = Math.round(rating);
	return (
		<span className="mt-1.5 block text-sm tracking-widest text-primary">
			{"★".repeat(rounded)}
			{"☆".repeat(5 - rounded)}
		</span>
	);
}

export function StatsOverviewCards({
	totalCount,
	totalSpending,
	averageRating,
}: StatsOverviewCardsProps): ReactElement {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.3fr_1fr_1fr]">
			<StatCard eyebrow="總場次" className="min-h-32">
				<span className="text-3xl leading-none font-bold text-foreground">
					{totalCount}
					<span className="ml-1.5 text-xl font-semibold text-muted-foreground">場</span>
				</span>
			</StatCard>
			<StatCard eyebrow="總花費" className="min-h-32">
				<span className="text-2xl leading-none font-semibold text-foreground">
					NT${totalSpending.toLocaleString()}
				</span>
			</StatCard>
			<StatCard eyebrow="平均評分" className="min-h-32">
				<span className="text-2xl leading-none font-semibold text-foreground">
					{averageRating != null ? averageRating.toFixed(1) : "—"}
					<span className="ml-1 text-sm font-medium text-muted-foreground">/ 5</span>
				</span>
				{averageRating != null ? (
					<StarRatingDisplay rating={averageRating} />
				) : (
					<span className="mt-1.5 block text-xs text-muted-foreground">尚無評分</span>
				)}
			</StatCard>
		</div>
	);
}
