import type { ReactElement, ReactNode } from "react";
import { Music } from "lucide-react";
import { StarRating } from "@/components/ui/Badge";
import { CoverImage } from "@/components/ui/CoverImage";
import { formatTicketPrice, DEFAULT_TICKET_CURRENCY, type TicketCurrency } from "@/lib/currency";

interface ReviewHeroProps {
	title: string;
	artist: string;
	venueName: string;
	date: string;
	seatInfo?: string | null;
	ticketPrice?: number | null;
	ticketCurrency?: TicketCurrency;
	rating: number | null;
	tags: { id: string; name: string }[];
	coverImageUrl: string | null;
	// 封面右上角的額外標記（例如 /concerts/[id] 的「公開」標籤）
	badge?: ReactNode;
	// 右欄內容：心得內文等，跟左側 meta 側欄並排（見 body-grid）
	children?: ReactNode;
	// Spotify 歌單等需要滿版寬度的區塊，跳出雙欄 grid、獨立佔滿整個 hero 寬度
	playlist?: ReactNode;
}

// 紀錄/心得詳情頁共用的雜誌風版面：封面 hero（滿版背景、疊字標題）+
// 下方左右雙欄 body-grid（左側 200px meta 側欄：Rating/Venue/Date/Ticket/Tags，
// 右側放心得內文等 children）+ 跨欄滿版的 playlist 區塊，對齊 aespa 7/24
// 設計樣板的結構。/concerts/[id]（個人紀錄）與 /reviews/[id]（公開心得）
// 欄位結構相同，只有 ticketPrice、badge 是否顯示依頁面而異
export function ReviewHero({
	title,
	artist,
	venueName,
	date,
	seatInfo,
	ticketPrice,
	ticketCurrency,
	rating,
	tags,
	coverImageUrl,
	badge,
	children,
	playlist,
}: ReviewHeroProps): ReactElement {
	return (
		<div className="flex flex-col gap-10">
			<div className="relative aspect-16/10 w-full overflow-hidden rounded-sm">
				{coverImageUrl ? (
					<CoverImage
						src={coverImageUrl}
						alt=""
						width={780}
						height={488}
						className="absolute inset-0 h-full w-full object-cover"
					/>
				) : (
					<div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-[#2c2420] to-[#14100d]">
						<Music className="h-9 w-9 text-[#e6c98a]/70" strokeWidth={1.5} />
					</div>
				)}
				<div
					className="absolute inset-0"
					style={{
						background:
							"linear-gradient(to top, rgba(10,8,6,0.92) 0%, rgba(10,8,6,0.35) 45%, transparent 75%)",
					}}
				/>
				{badge && (
					<span className="absolute top-6 right-6 z-10 rounded-full border border-[#fbf5ec]/35 bg-[#fbf5ec]/14 px-3 py-1 text-xs tracking-wider text-[#fbf5ec] backdrop-blur-sm">
						{badge}
					</span>
				)}
				<div className="absolute inset-x-0 bottom-0 px-9 pt-10 pb-8">
					<span className="mb-3.5 inline-flex items-center gap-2.5 text-xs font-semibold tracking-[0.18em] text-[#e6c98a]">
						<span className="h-px w-5.5 bg-[#e6c98a]" />
						{artist}
					</span>
					{/* clamp 響應式字級為雜誌封面標題的刻意例外，隨視窗寬度縮放，不套用固定字級 token */}
					<h1 className="max-w-[14ch] text-[clamp(32px,5.4vw,50px)] leading-[1.08] font-semibold tracking-tight text-balance text-[#fbf5ec]">
						{title}
					</h1>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-10 sm:grid-cols-[200px_1fr]">
				<aside className="flex flex-col gap-5.5">
					{rating != null && (
						<>
							<MetaField label="Rating">
								<StarRating value={rating} />
							</MetaField>
							<hr className="border-t border-[#e4dcd0]" />
						</>
					)}
					<MetaField label="Venue">{venueName}</MetaField>
					{seatInfo && <MetaField label="Seat">{seatInfo}</MetaField>}
					<MetaField label="Date">{date}</MetaField>
					{ticketPrice != null && (
						<MetaField label="Ticket">
							{formatTicketPrice(ticketPrice, ticketCurrency ?? DEFAULT_TICKET_CURRENCY)}
						</MetaField>
					)}
					{tags.length > 0 && (
						<>
							<hr className="border-t border-[#e4dcd0]" />
							<MetaField label="Tags">
								<div className="flex flex-wrap gap-1.5">
									{tags.map((tag) => (
										<span
											key={tag.id}
											className="rounded-full border border-[#e4dcd0] px-2.5 py-1 text-xs text-[#7d7568]"
										>
											{tag.name}
										</span>
									))}
								</div>
							</MetaField>
						</>
					)}
				</aside>

				<div className="flex flex-col gap-2">{children}</div>
			</div>

			{playlist}
		</div>
	);
}

function MetaField({ label, children }: { label: string; children: ReactNode }): ReactElement {
	return (
		<div>
			<div className="mb-1.25 text-xs font-bold tracking-[0.14em] text-[#b8934a] uppercase">
				{label}
			</div>
			<div className="text-base leading-normal text-[#18130f]">{children}</div>
		</div>
	);
}
