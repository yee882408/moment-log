import type { ReactElement, ReactNode } from "react";
import Link from "next/link";
import { Music } from "lucide-react";
import { Card } from "@/components/ui/Card";
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

// 縮小封面圖高度（128px → 96px）讓 3 列卡片不超出一個視窗高度，方便看到下方分頁
const CARD_HEIGHT = "h-[268px]";
const COVER_HEIGHT = "h-24"; // 96px

// 只有兩種欄數（1 欄手機／3 欄桌面，取消中間的 2 欄斷點），避免中間寬度時
// min-height 算的是 3 欄但實際排成 2 欄，導致高度不夠、列表仍被撐開。
// min-height 只在 lg（3 欄）套用：手機版（1 欄）本來就需要捲動看完整列表，
// 固定高度反而在資料不足一頁時製造大量空白，不套用比較合理。
// lg 斷點列數 = ceil(每頁筆數 / 3)，高度 = 列數 * 268px 卡片 + (列數-1) * 16px 間距（gap-4）
// Tailwind 任意值語法只接受字面值，這裡把實際用到的每頁筆數列出對應 class，
// 避免用動態字串組出 Tailwind 掃描不到的 class 名稱
const MIN_HEIGHT_BY_MAX_ITEMS: Record<number, string> = {
	9: "lg:min-h-[836px]", // 3 列：268*3 + 16*2
};

// 心得卡片網格，供 /reviews、/concerts 等列表重用
// Card 本身不是 <Link>：主要區塊（封面圖～評分）用一個絕對定位的 <Link> 撐滿當作點擊區，
// footer 區塊獨立在外可以自帶另一個 <Link>（例如作者連到 /users/[id]），避免 <a> 巢狀 <a>
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
		<div
			className={`grid grid-cols-1 gap-4 lg:grid-cols-3 ${minHeightClass ?? ""}`}
		>
			{reviews.map((item) => (
				<Card
					key={item.id}
					hover
					className={`relative z-0 flex ${CARD_HEIGHT} flex-col gap-1`}
				>
					<Link href={buildHref(item)} className="absolute inset-0 z-0">
						<span className="sr-only">{item.title}</span>
					</Link>
					{item.cover_image_url ? (
						<CoverImage
							src={item.cover_image_url}
							alt={item.title}
							width={320}
							height={96}
							className={`pointer-events-none mb-2 w-full shrink-0 rounded-lg object-cover ${COVER_HEIGHT}`}
						/>
					) : (
						<div
							className={`pointer-events-none mb-2 flex w-full shrink-0 items-center justify-center rounded-lg bg-indigo-50 ${COVER_HEIGHT}`}
						>
							<Music className="h-8 w-8 text-primary/40" strokeWidth={1.5} />
						</div>
					)}
					<span className="pointer-events-none line-clamp-1 font-medium text-foreground">
						{item.title}
					</span>
					<span className="pointer-events-none line-clamp-1 text-sm text-muted-foreground">
						{item.artist}
					</span>
					<span className="pointer-events-none line-clamp-1 text-xs text-muted-foreground">
						{item.venue_name} · {item.date}
					</span>
					{item.rating != null && (
						<span className="pointer-events-none">
							<StarRating value={item.rating} />
						</span>
					)}
					{item.tags && item.tags.length > 0 && (
						<div className="pointer-events-none flex flex-wrap items-center gap-1">
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
					{renderFooter && (
						<div className="relative z-10 mt-auto flex items-center gap-2 border-t border-border pt-2 text-xs text-muted-foreground">
							{renderFooter(item)}
						</div>
					)}
				</Card>
			))}
		</div>
	);
}
