import type { ReactElement } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublicReviewById, getRelatedReviewsByArtist } from "@/lib/data/reviews";
import { getLikeState } from "@/lib/data/likes";
import { getCommentsByRecordId } from "@/lib/data/comments";
import { Card } from "@/components/ui/Card";
import { Badge, StarRating } from "@/components/ui/Badge";
import { CoverImage } from "@/components/ui/CoverImage";
import { Button } from "@/components/ui/Button";
import { LikeButton } from "@/components/reviews/LikeButton";
import { ShareCardButton } from "@/components/reviews/ShareCardButton";
import { CommentSection } from "@/components/reviews/CommentSection";
import { ReviewGrid } from "@/components/reviews/ReviewGrid";
import { AuthorAvatar } from "@/components/reviews/AuthorAvatar";

interface PageProps {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ from?: string }>;
}

export default async function ReviewDetailPage({ params, searchParams }: PageProps): Promise<ReactElement> {
	const { id } = await params;
	const { from } = await searchParams;
	// 從「我的紀錄」列表點進來的公開紀錄（帶 ?from=concerts）返回應該回我的紀錄列表，
	// 而不是公開心得列表；其他入口（/reviews 列表、其他使用者頁面等）維持返回 /reviews
	const backHref = from === "concerts" ? "/concerts" : "/reviews";
	const backLabel = from === "concerts" ? "← 返回個人紀錄" : "← 返回心得分享";

	const review = await getPublicReviewById(id);
	if (!review) {
		notFound(); // 不存在或非公開 → 404
	}

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	const [likeState, commentsPage, relatedReviews] = await Promise.all([
		getLikeState(id, user?.id ?? null),
		getCommentsByRecordId(id, 1),
		getRelatedReviewsByArtist(review.artist, id),
	]);

	return (
		<main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 p-6">
			<div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
				<Link href={backHref} className="text-sm text-muted-foreground hover:underline">
					{backLabel}
				</Link>

				<header className="flex flex-col gap-2">
					<h1 className="text-2xl font-semibold text-foreground">{review.title}</h1>
					<p className="text-muted-foreground">{review.artist}</p>
					<div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
						<span>{review.venue_name}</span>
						<span>·</span>
						<span>{review.date}</span>
						{review.rating != null && <StarRating value={review.rating} />}
					</div>
					{review.tags.length > 0 && (
						<div className="flex flex-wrap gap-1.5">
							{review.tags.map((tag) => (
								<Badge key={tag.id} variant="neutral">
									{tag.name}
								</Badge>
							))}
						</div>
					)}
				</header>

				{review.cover_image_url && (
					<CoverImage
						src={review.cover_image_url}
						alt={review.title}
						width={672}
						height={378}
						className="w-full rounded-xl object-cover"
					/>
				)}

				{review.spotify_playlist_id && (
					<div className="flex flex-col gap-1">
						<iframe
							title="Spotify 歌單"
							src={`https://open.spotify.com/embed/playlist/${review.spotify_playlist_id}`}
							width="100%"
							height="352"
							loading="lazy"
							allow="encrypted-media"
							className="rounded-xl"
						/>
						<p className="text-xs text-muted-foreground">
							若歌單未正常顯示，可能是非公開歌單或已被刪除。
						</p>
					</div>
				)}

				{review.review && (
					<Card className="whitespace-pre-wrap text-sm leading-7 text-foreground">
						{review.review}
					</Card>
				)}

				<div className="flex flex-wrap items-center gap-2">
					{user ? (
						<LikeButton
							recordId={review.id}
							initialCount={likeState.count}
							initialLiked={likeState.likedByMe}
						/>
					) : (
						<Button asChild variant="secondary" className="justify-start">
							<Link href="/login">讚 · {likeState.count}（請登入）</Link>
						</Button>
					)}
					<ShareCardButton recordId={review.id} />
				</div>

				<Link
					href={`/users/${review.user_id}`}
					className="flex w-fit items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground"
				>
					<AuthorAvatar
						author={review.author}
						avatarUrl={review.author_avatar_url}
						sizeClass="h-7 w-7"
					/>
					{review.author ?? "匿名"}
				</Link>

				<CommentSection
					recordId={review.id}
					currentUserId={user?.id ?? null}
					initialCommentsPage={commentsPage}
				/>
			</div>

			{relatedReviews.length > 0 && (
				<section className="flex flex-col gap-3">
					<h2 className="text-sm font-semibold text-foreground">{review.artist} 的其他心得</h2>
					<ReviewGrid
						reviews={relatedReviews}
						buildHref={(r) => `/reviews/${r.id}`}
						renderFooter={(r) => (
							<>
								<Link
									href={`/users/${r.user_id}`}
									className="flex items-center gap-2 hover:underline"
								>
									<AuthorAvatar author={r.author} avatarUrl={r.author_avatar_url} />
									<span className="line-clamp-1">{r.author ?? "匿名"}</span>
								</Link>
								<span className="ml-auto shrink-0">♥ {r.like_count}</span>
							</>
						)}
					/>
				</section>
			)}
		</main>
	);
}
