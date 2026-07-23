import type { ReactElement } from "react";
import Link from "next/link";
import { getCurrentUserProfile } from "@/lib/data/profile";
import { getPublicReviews } from "@/lib/data/reviews";
import { getSiteStats } from "@/lib/data/siteStats";
import { Button } from "@/components/ui/Button";
import { AuthorReviewGrid } from "@/components/reviews/AuthorReviewGrid";
import { HeroFeaturedReview } from "@/components/home/HeroFeaturedReview";

const FEATURED_REVIEW_COUNT = 3;

const FEATURES = [
	{
		tag: "Record",
		title: "心得記錄",
		description: "留下每一場演唱會的評分與心得，選擇公開分享或私下珍藏。",
	},
	{
		tag: "Map",
		title: "追星地圖",
		description: "以藝人為單位整理巡演周邊的景點、美食清單，分享給喜歡的同好。",
	},
	{
		tag: "Stats",
		title: "成就統計",
		description: "自動彙整花費、場館、藝人排行，回顧一年下來追了多少場。",
	},
];

export default async function Home(): Promise<ReactElement> {
	const [profile, { reviews: featuredReviews }, siteStats] = await Promise.all([
		getCurrentUserProfile(),
		getPublicReviews(1, {}, "popular"),
		getSiteStats(),
	]);

	const topReview = featuredReviews[0];

	return (
		<main className="flex flex-1 flex-col">
			<section className="mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-10 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:py-20">
				<div className="flex flex-col items-start gap-4">
					<span className="text-xs font-bold tracking-wider text-primary uppercase">
						Concert Memory Log
					</span>
					<h1 className="text-3xl leading-tight font-extrabold tracking-tight text-foreground sm:text-4xl">
						記錄每一場
						<br />
						演唱會的回憶
					</h1>
					<p className="max-w-sm text-muted-foreground">
						心得與評分可選擇公開分享，跟其他人一起回顧屬於你的追星足跡。
					</p>
					<div className="mt-1 flex flex-wrap items-center gap-3">
						{profile ? (
							<Button asChild>
								<Link href="/concerts">個人紀錄</Link>
							</Button>
						) : (
							<Button asChild>
								<Link href="/login">登入 / 註冊</Link>
							</Button>
						)}
						<Button asChild variant="secondary">
							<Link href="/reviews">瀏覽心得分享</Link>
						</Button>
					</div>

					<div className="mt-3 flex items-center gap-8">
						<div>
							<div className="text-xl font-extrabold text-foreground">
								{siteStats.publicReviewCount}
							</div>
							<div className="text-xs text-muted-foreground">篇心得分享</div>
						</div>
						<div>
							<div className="text-xl font-extrabold text-foreground">
								{siteStats.publicSpotListCount}
							</div>
							<div className="text-xs text-muted-foreground">份追星清單</div>
						</div>
					</div>
				</div>

				{topReview && <HeroFeaturedReview review={topReview} />}
			</section>

			<section className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16">
				<div className="text-center">
					<h2 className="text-lg font-semibold text-foreground">能做什麼</h2>
				</div>

				<p className="mx-auto max-w-2xl text-center text-xl leading-relaxed font-semibold text-muted-foreground">
					寫下<strong className="text-foreground">心得記錄</strong>，整理成
					<span className="text-primary">追星地圖</span>分享給喜歡的同好，
					由 moment-log 自動彙整成你的<strong className="text-foreground">成就統計</strong>。
				</p>

				<div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
					{FEATURES.map(({ tag, title, description }, index) => (
						<div
							key={title}
							className={`px-0 sm:px-7 ${index > 0 ? "border-t border-border pt-8 sm:border-t-0 sm:border-l sm:pt-0" : ""}`}
						>
							<span className="mb-2 block text-xs font-bold tracking-wider text-primary uppercase">
								{tag}
							</span>
							<h3 className="mb-2 text-lg font-bold text-foreground">{title}</h3>
							<p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
						</div>
					))}
				</div>
			</section>

			{featuredReviews.length > 0 && (
				<section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 pb-20">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold text-foreground">熱門心得</h2>
						<Button asChild variant="secondary" className="text-sm">
							<Link href="/reviews?sort=popular">查看全部 →</Link>
						</Button>
					</div>
					<AuthorReviewGrid reviews={featuredReviews.slice(0, FEATURED_REVIEW_COUNT)} />
				</section>
			)}
		</main>
	);
}
