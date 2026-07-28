import type { ReactElement, ReactNode } from "react";
import Link from "next/link";
import { ReviewContent } from "@/components/richtext/ReviewContent";
import { ReviewHero } from "@/components/reviews/ReviewHero";
import { LikeButton } from "@/components/reviews/LikeButton";
import { ReviewBookmarkButton } from "@/components/reviews/ReviewBookmarkButton";
// import { ShareCardButton } from "@/components/reviews/ShareCardButton"; // 分享卡片功能暫不開放，見下方 JSX 註解
import { CommentSection } from "@/components/reviews/CommentSection";
import { AuthorReviewGrid } from "@/components/reviews/AuthorReviewGrid";
import { AuthorAvatar } from "@/components/reviews/AuthorAvatar";
import type { CommentsPage } from "@/lib/data/comments";
import type { PublicReview } from "@/lib/data/reviews";
import type { TicketCurrency } from "@/lib/currency";

// /concerts/[id]（本人管理自己的紀錄）與 /reviews/[id]（任何人看公開心得）共用的
// 詳情頁呈現邏輯：雜誌風 hero + 心得內文/歌單 + 讚/分享/作者/留言 + 相關心得。
// 兩邊查詢權限不同（分別是 getRecordById／getPublicReviewById），呼叫端各自查好
// 資料後轉成這裡定義的欄位傳入，這個元件本身不做任何權限判斷或資料查詢
export interface RecordDetailBodyProps {
	id: string;
	userId: string;
	title: string;
	artist: string;
	venueName: string;
	date: string;
	seatInfo: string | null;
	rating: number | null;
	tags: { id: string; name: string }[];
	coverImageUrl: string | null;
	review: string | null;
	spotifyPlaylistId: string | null;
	author: string | null;
	authorAvatarUrl: string | null;
	isPublic: boolean;
	// 只有 /concerts/[id] 才會有值；/reviews/[id] 不傳（票價視為隱私，不對外顯示）
	ticketPrice?: number | null;
	ticketCurrency?: TicketCurrency;
	// /concerts/[id] 傳入編輯/刪除連結；/reviews/[id] 不傳
	topbarActions?: ReactNode;
	backHref: string;
	backLabel: string;
	currentUserId: string | null;
	likeState: { count: number; likedByMe: boolean };
	bookmarkedByMe: boolean;
	commentsPage: CommentsPage;
	relatedReviews: PublicReview[];
}

export function RecordDetailBody({
	id,
	userId,
	title,
	artist,
	venueName,
	date,
	seatInfo,
	rating,
	tags,
	coverImageUrl,
	review,
	spotifyPlaylistId,
	author,
	authorAvatarUrl,
	isPublic,
	ticketPrice,
	ticketCurrency,
	topbarActions,
	backHref,
	backLabel,
	currentUserId,
	likeState,
	bookmarkedByMe,
	commentsPage,
	relatedReviews,
}: RecordDetailBodyProps): ReactElement {
	// 純裝飾用的紀錄編號（取 id 前 8 碼），呼應雜誌排版底部的 credit 列
	const recordNo = id.replace(/-/g, "").slice(0, 8).toUpperCase();

	return (
		<main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-6 pb-16">
			<div className="flex items-center justify-between text-sm">
				<Link href={backHref} className="text-[#7d7568] hover:text-[#18130f]">
					{backLabel}
				</Link>
				{topbarActions && <div className="flex items-center gap-4.5">{topbarActions}</div>}
			</div>

			<ReviewHero
				title={title}
				artist={artist}
				venueName={venueName}
				date={date}
				seatInfo={seatInfo}
				ticketPrice={ticketPrice}
				ticketCurrency={ticketCurrency}
				rating={rating}
				tags={tags}
				coverImageUrl={coverImageUrl}
				badge={isPublic && "公開"}
				playlist={
					spotifyPlaylistId && (
						<div className="mt-2 flex flex-col gap-3">
							<div className="flex items-center gap-2 border-b border-[#e4dcd0] pb-2.5 text-xs tracking-widest text-[#7d7568] uppercase">
								🎧 Spotify 歌單
							</div>
							<iframe
								title="Spotify 歌單"
								src={`https://open.spotify.com/embed/playlist/${spotifyPlaylistId}`}
								width="100%"
								height="352"
								loading="lazy"
								allow="encrypted-media"
								className="rounded-xl"
							/>
							<p className="text-xs text-[#7d7568]">
								若歌單未正常顯示，可能是非公開歌單或已被刪除。
							</p>
						</div>
					)
				}
			>
				{review && <ReviewContent review={review} variant="plain" />}
			</ReviewHero>

			{/* 作者/讚/分享、留言：跳出 ReviewHero 的雙欄 body-grid，滿版寬度呈現，
			    跟 Spotify 歌單一致，不擠在窄欄裡 */}
			<div className="flex flex-col gap-6">
				<div className="flex flex-wrap items-center justify-center gap-4 border-t border-b border-[#e4dcd0] py-4">
					<Link
						href={`/users/${userId}`}
						className="flex w-fit items-center gap-2 rounded-full border border-[#e4dcd0] py-1 pl-1 pr-3 text-sm text-[#18130f] hover:border-[#b8934a]/50"
					>
						<AuthorAvatar author={author} avatarUrl={authorAvatarUrl} sizeClass="h-7 w-7" />
						{author ?? "匿名"}
					</Link>

					<span className="h-5 w-px bg-[#e4dcd0]" />

					{currentUserId ? (
						<LikeButton
							recordId={id}
							initialCount={likeState.count}
							initialLiked={likeState.likedByMe}
							disabled={!isPublic}
						/>
					) : (
						<Link
							href="/login"
							className="text-sm text-[#7d7568] hover:text-[#18130f] hover:underline"
						>
							讚 · {likeState.count}（請登入）
						</Link>
					)}

					<span className="h-5 w-px bg-[#e4dcd0]" />

					{currentUserId ? (
						<ReviewBookmarkButton
							recordId={id}
							initialBookmarked={bookmarkedByMe}
							disabled={!isPublic}
						/>
					) : (
						<Link
							href="/login"
							className="text-sm text-[#7d7568] hover:text-[#18130f] hover:underline"
						>
							收藏（請登入）
						</Link>
					)}

					{/* 分享卡片功能暫不開放，先隱藏入口；ShareCardButton/route handler 保留，
					    之後要重新開放時把下面兩行取消註解即可
					<span className="h-5 w-px bg-[#e4dcd0]" />
					<ShareCardButton recordId={id} disabled={!isPublic} />
					*/}
				</div>
				{!isPublic && (
					<p className="-mt-4 text-center text-xs text-[#7d7568]">
						🔒 這篇紀錄目前是私密的，公開後才能按讚、收藏、留言
					</p>
				)}

				<CommentSection
					recordId={id}
					currentUserId={currentUserId}
					initialCommentsPage={commentsPage}
					canComment={isPublic}
				/>
			</div>

			<div className="flex items-center justify-between border-t border-[#e4dcd0] pt-4 text-xs tracking-wider text-[#7d7568] uppercase">
				<span>Concert Memory Log</span>
				<span>Record No. {recordNo}</span>
			</div>

			{relatedReviews.length > 0 && (
				<section className="flex flex-col gap-3 border-t border-[#e4dcd0] pt-8">
					<h2 className="text-sm font-semibold text-foreground">{artist} 的其他心得</h2>
					<AuthorReviewGrid reviews={relatedReviews} />
				</section>
			)}
		</main>
	);
}
