"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";

const MotionLink = motion.create(Link);

interface FeaturedReviewItem {
	id: string;
	title: string;
	artist: string;
	venue_name: string;
	like_count: number;
	cover_image_url: string | null;
}

interface HeroFeaturedReviewProps {
	review: FeaturedReviewItem;
}

// 首頁 Hero 右側視覺：展示目前最熱門的一篇公開心得，滿版填滿整個區域，點擊
// 可直接跳到該篇詳情頁。先試過多張卡片堆疊／扇形展開的做法，但測試資料裡
// 熱門的幾篇心得剛好都是同一位藝人，堆疊出來的畫面看起來重複且雜亂；改成
// 只展示單一焦點內容，完全不會有遮蔽或重複的排版問題，也讓「最熱門」這件
// 事更有說服力。有上傳封面圖就用真實圖片鋪底，沒有（或載入失敗）才
// fallback 回漸層色。用 motion.create(Link) 讓進場動畫與 Next.js 的
// client-side 導覽（不整頁刷新）可以並存
export function HeroFeaturedReview({ review }: HeroFeaturedReviewProps): ReactElement {
	const [imageFailed, setImageFailed] = useState(false);
	const showImage = review.cover_image_url && !imageFailed;

	return (
		<MotionLink
			href={`/reviews/${review.id}`}
			initial={{ opacity: 0, scale: 0.96, y: 12 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			transition={{ duration: 0.5, ease: "easeOut" }}
			className="relative hidden h-85 overflow-hidden rounded-2xl shadow-[0_24px_48px_-16px_rgba(79,70,229,0.35)] transition-transform duration-200 hover:scale-[1.01] lg:block"
		>
			{showImage ? (
				<Image
					src={review.cover_image_url!}
					alt=""
					fill
					className="object-cover"
					onError={() => setImageFailed(true)}
				/>
			) : (
				<div className="absolute inset-0 bg-linear-to-br from-indigo-500 to-purple-500" />
			)}

			<span className="absolute top-4 right-4 z-10 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
				熱門心得
			</span>
			<div className="absolute inset-0 bg-linear-to-t from-black/75 via-transparent to-transparent" />
			<div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-6 text-white">
				<span className="line-clamp-1 text-2xl font-bold">{review.title}</span>
				<span className="line-clamp-1 text-sm text-white/85">
					{review.artist} · {review.venue_name} · ♥ {review.like_count}
				</span>
			</div>
		</MotionLink>
	);
}
