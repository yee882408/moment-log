"use client";

import type { ReactElement, ReactNode } from "react";
import Link from "next/link";
import { Music } from "lucide-react";
import { Badge, StarRating } from "@/components/ui/Badge";
import { CoverImage } from "@/components/ui/CoverImage";

// /reviews（PublicReview）與 /concerts（RecordListItem）共同擁有的欄位子集
export interface ReviewCardItem {
	id: string;
	title: string;
	artist: string;
	venue_name: string;
	date: string;
	rating: number | null;
	cover_image_url: string | null;
	// 只有公開心得列表（PublicReview）才有讚數；/concerts 的私人紀錄不傳這個欄位
	like_count?: number;
	// 目前只有 /concerts（RecordListItem）有查詢標籤；/reviews（PublicReview）維持
	// undefined 就不會渲染，兩邊共用同一個 ReviewGrid 不需要各自處理
	tags?: { id: string; name: string }[];
}

// 卡片高度固定（見下方 CARD_HEIGHT），標籤最多顯示 2 個避免撐爆版面，其餘用 +N 表示
const MAX_VISIBLE_TAGS = 2;

interface ReviewGridProps<T extends ReviewCardItem> {
	reviews: T[];
	// 每張卡片的連結目標，由呼叫端決定（/reviews/[id] 或 /concerts/[id]）
	buildHref: (item: T) => string;
	// 卡片底部區塊，由呼叫端決定要顯示公開標籤還是作者資訊（可能自帶另一個 <Link>，
	// 所以這塊獨立在主連結之外，避免 <a> 巢狀 <a>）
	renderFooter?: (item: T) => ReactNode;
	// 該頁最大可能筆數（例如分頁的 PAGE_SIZE），用來固定 grid 高度，避免分頁列因筆數不足而上移
	maxItemsPerPage?: number;
}

// 封面圖佔滿卡片上半部（滿版疊字版面），卡片整體拉高到 400px 讓圖片有足夠份量
const CARD_HEIGHT = "h-[400px]";
const COVER_HEIGHT = "h-[260px]";

// lg 斷點列數 = ceil(每頁筆數 / 3)，高度 = 列數 * 400px 卡片 + (列數-1) * 16px 間距（gap-4）
// Tailwind 任意值語法只接受字面值，這裡把實際用到的每頁筆數列出對應 class，
// 避免用動態字串組出 Tailwind 掃描不到的 class 名稱
const MIN_HEIGHT_BY_MAX_ITEMS: Record<number, string> = {
	9: "lg:min-h-[1232px]", // 3 列：400*3 + 16*2
};

interface HoverCardProps<T extends ReviewCardItem> {
	item: T;
	href: string;
	footer?: ReactNode;
}

// hover 時整張卡片浮起 + 輕微放大（純 CSS transition，不需要 JS）。
// 曾經試過 rotateX/rotateY 依游標位置即時傾斜的 3D 效果，但實測（Puppeteer
// 截圖比對）發現只要有 perspective 旋轉，文字所在的合成層就會出現次像素
// 定位、字體抗鋸齒模糊，角度愈小只是愈不明顯、無法完全消除——這是瀏覽器
// GPU 合成 3D 變換的固有限制。改用 translateY + scale：兩者都是 2D 平面內的
// 變換，不會觸發透視合成，文字維持清晰，仍有明確的立體/回饋感
//
// 卡片外層是 <div>（不是 <Link>）：footer 常帶另一個連到 /users/[id] 的 <Link>
// （作者頭像），若整張卡片本身也是 <Link> 會產生 <a> 巢狀 <a>，不合法的 HTML
// 且瀏覽器行為不一致。改成用絕對定位的 <Link> 蓋住圖片～標籤這塊主要區域，
// footer 留在 <Link> 之外
function HoverCard<T extends ReviewCardItem>({ item, href, footer }: HoverCardProps<T>): ReactElement {
	return (
		<div
			className={`group relative flex ${CARD_HEIGHT} flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 ease-out hover:-translate-y-2.5 hover:shadow-[0_28px_40px_-16px_rgba(15,23,42,0.32)]`}
		>
			<Link href={href} className="absolute inset-0 z-0 flex flex-col">
				<span className="sr-only">{item.title}</span>
				<div className={`relative w-full shrink-0 overflow-hidden ${COVER_HEIGHT}`}>
					{item.cover_image_url ? (
						<CoverImage
							src={item.cover_image_url}
							alt=""
							width={400}
							height={260}
							className="h-full w-full scale-100 object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
						/>
					) : (
						<div className="flex h-full w-full scale-100 items-center justify-center bg-linear-to-br from-primary/80 to-accent/80 transition-transform duration-300 ease-out group-hover:scale-[1.04]">
							<Music className="h-10 w-10 text-white/70" strokeWidth={1.5} />
						</div>
					)}
					{/* 標題／場館資訊疊在圖片底部，漸層遮罩確保任何底圖顏色下文字都可讀 */}
					<div
						className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 px-4 pt-8 pb-3 text-white"
						style={{
							background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 65%, transparent 100%)",
						}}
					>
						<span className="line-clamp-1 text-base font-semibold">{item.title}</span>
						<span className="line-clamp-1 text-xs text-white/80">
							{item.artist} · {item.venue_name} · {item.date}
						</span>
					</div>
				</div>

				<div className="flex flex-1 flex-col gap-2 px-4 pt-3 pb-2">
					{item.rating != null && <StarRating value={item.rating} />}
					{item.tags && item.tags.length > 0 && (
						<div className="flex flex-wrap items-center gap-1">
							{item.tags.slice(0, MAX_VISIBLE_TAGS).map((tag) => (
								<Badge key={tag.id} variant="neutral">
									{tag.name}
								</Badge>
							))}
							{item.tags.length > MAX_VISIBLE_TAGS && (
								<span className="text-xs text-muted-foreground">
									+{item.tags.length - MAX_VISIBLE_TAGS}
								</span>
							)}
						</div>
					)}
				</div>
			</Link>

			{footer && (
				<div className="relative z-10 mt-auto flex items-center gap-2 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
					{footer}
				</div>
			)}
		</div>
	);
}

// 心得卡片網格，供 /reviews、/concerts 等列表重用
export function ReviewGrid<T extends ReviewCardItem>({
	reviews,
	buildHref,
	renderFooter,
	maxItemsPerPage,
}: ReviewGridProps<T>): ReactElement {
	const minHeightClass = maxItemsPerPage
		? MIN_HEIGHT_BY_MAX_ITEMS[maxItemsPerPage]
		: undefined;

	return (
		<div className={`grid grid-cols-1 gap-4 lg:grid-cols-3 ${minHeightClass ?? ""}`}>
			{reviews.map((item) => (
				<HoverCard
					key={item.id}
					item={item}
					href={buildHref(item)}
					footer={renderFooter?.(item)}
				/>
			))}
		</div>
	);
}
