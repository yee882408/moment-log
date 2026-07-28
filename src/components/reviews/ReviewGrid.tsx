"use client";

import type { ReactElement, ReactNode } from "react";
import Link from "next/link";
import { Music } from "lucide-react";
import { Badge, StarRating } from "@/components/ui/Badge";
import { CoverImage } from "@/components/ui/CoverImage";
import { formatTicketPrice, DEFAULT_TICKET_CURRENCY, type TicketCurrency } from "@/lib/currency";

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
	// 只有 /concerts（RecordListItem）有票價；/reviews 公開頁刻意不撈這個欄位
	// （票價視為私密資訊，見 lib/data/reviews.ts 註解），undefined 時卡片不顯示 Price 欄
	ticket_price?: number | null;
	// 只在有 ticket_price 時才會有意義；/reviews 沒有票價自然也不需要幣別
	ticket_currency?: TicketCurrency;
	// 只有 /concerts（RecordListItem）需要顯示「公開」徽章；/reviews 全部都是
	// 公開心得，不需要這個標記，undefined 時卡片不顯示徽章
	is_public?: boolean;
}

// 標籤最多顯示 2 個避免撐爆版面，其餘用 +N 表示
const MAX_VISIBLE_TAGS = 2;

interface ReviewGridProps<T extends ReviewCardItem> {
	reviews: T[];
	// 每張卡片的連結目標，由呼叫端決定（/reviews/[id] 或 /concerts/[id]）
	buildHref: (item: T) => string;
	// 卡片底部區塊，由呼叫端決定要顯示公開標籤還是作者資訊（可能自帶另一個 <Link>，
	// 所以這塊獨立在主連結之外，避免 <a> 巢狀 <a>）
	renderFooter?: (item: T) => ReactNode;
}

interface HoverCardProps<T extends ReviewCardItem> {
	item: T;
	href: string;
	footer?: ReactNode;
}

// 用紀錄 id 生一組穩定的假票號（不是真的序號，純裝飾），格式如 NO. A93F-2C1B，
// 讓每張卡片的票根細節有變化又不必額外查詢/儲存
function ticketNumber(id: string): string {
	const hex = id.replace(/-/g, "").toUpperCase();
	return `${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
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
//
// 票根視覺：仿實體票券的結構——封面只留公開徽章、票頭 kicker、標題/藝人獨立
// 於封面下方（不疊字）、撕票孔＋虛線分隔、Venue/Date/Price 三欄字段、標籤列、
// 底部條碼＋票號。卡片不再固定高度，內容多寡決定實際高度
function HoverCard<T extends ReviewCardItem>({ item, href, footer }: HoverCardProps<T>): ReactElement {
	return (
		<div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 ease-out hover:-translate-y-2.5 hover:shadow-[0_28px_40px_-16px_rgba(15,23,42,0.32)]">
			<Link href={href} className="flex flex-1 flex-col">
				<span className="sr-only">{item.title}</span>
				<div className="relative aspect-video w-full shrink-0 overflow-hidden">
					{item.cover_image_url ? (
						<CoverImage
							src={item.cover_image_url}
							alt=""
							width={400}
							height={225}
							className="absolute inset-0 h-full w-full scale-100 object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
						/>
					) : (
						<div className="absolute inset-0 flex scale-100 items-center justify-center bg-linear-to-br from-primary/80 to-accent/80 transition-transform duration-300 ease-out group-hover:scale-[1.04]">
							<Music className="h-10 w-10 text-white/70" strokeWidth={1.5} />
						</div>
					)}
					{item.is_public && (
						<span className="absolute top-3 right-3 rounded-full border border-primary/25 bg-card/90 px-2.5 py-1 text-2xs font-bold tracking-wider text-primary uppercase backdrop-blur-sm">
							● 公開
						</span>
					)}
				</div>

				<div className="px-4 pt-3">
					<span className="mb-1 line-clamp-1 block text-xs font-bold tracking-[0.14em] text-primary">
						{item.artist}
					</span>
					<span className="line-clamp-1 text-lg font-extrabold tracking-tight text-foreground">
						{item.title}
					</span>
					{item.rating != null && (
						<div className="mt-1.5">
							<StarRating value={item.rating} />
						</div>
					)}
				</div>

				{/* 撕票孔：兩個貼齊卡片左右邊緣的半圓缺口，配上虛線構成票根感 */}
				<div className="relative mt-3 h-0 shrink-0">
					<span className="absolute -left-2.5 top-0 h-5 w-5 -translate-y-1/2 rounded-full bg-background" />
					<span className="absolute -right-2.5 top-0 h-5 w-5 -translate-y-1/2 rounded-full bg-background" />
					<div className="absolute inset-x-4 top-0 -translate-y-1/2 border-t border-dashed border-border" />
				</div>

				<div className="grid grid-cols-3 gap-2 px-4 pt-4 font-mono">
					<TicketField label="Venue" value={item.venue_name} />
					<TicketField label="Date" value={item.date} />
					{item.ticket_price != null ? (
						<TicketField
							label="Price"
							value={formatTicketPrice(item.ticket_price, item.ticket_currency ?? DEFAULT_TICKET_CURRENCY)}
						/>
					) : (
						<span />
					)}
				</div>

				{item.tags && item.tags.length > 0 && (
					<div className="flex flex-wrap items-center gap-1 px-4 pt-3">
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

				<div className="mt-auto flex items-center gap-3 px-4 pt-4 pb-2">
					<div
						className="h-6 flex-1 opacity-60"
						style={{
							background:
								"repeating-linear-gradient(90deg, var(--color-foreground) 0 2px, transparent 2px 5px, var(--color-foreground) 5px 6px, transparent 6px 10px)",
						}}
					/>
					<span className="font-mono text-2xs tracking-widest text-muted-foreground/70">
						NO. {ticketNumber(item.id)}
					</span>
				</div>
			</Link>

			{footer && (
				<div className="mt-auto flex items-center gap-2 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
					{footer}
				</div>
			)}
		</div>
	);
}

function TicketField({ label, value }: { label: string; value: string }): ReactElement {
	return (
		<div className="min-w-0">
			<div className="text-2xs tracking-[0.12em] text-muted-foreground/80 uppercase">{label}</div>
			<div className="truncate text-xs text-foreground">{value}</div>
		</div>
	);
}

// 心得卡片網格，供 /reviews、/concerts 等列表重用
export function ReviewGrid<T extends ReviewCardItem>({
	reviews,
	buildHref,
	renderFooter,
}: ReviewGridProps<T>): ReactElement {
	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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
