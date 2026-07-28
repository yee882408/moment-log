import type { Metadata } from "next";
import type { ReactElement } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublicReviewById, getRelatedReviewsByArtist } from "@/lib/data/reviews";
import { getLikeState } from "@/lib/data/likes";
import { isRecordBookmarked } from "@/lib/data/bookmarks";
import { getCommentsByRecordId } from "@/lib/data/comments";
import { JsonLd } from "@/lib/seo/JsonLd";
import { buildReviewJsonLd } from "@/lib/seo/schemas";
import { htmlToPlainText } from "@/lib/richtext/plainText";
import { RecordDetailBody } from "@/components/reviews/RecordDetailBody";

interface PageProps {
	params: Promise<{ id: string }>;
}

const DESCRIPTION_LENGTH = 100;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { id } = await params;
	const review = await getPublicReviewById(id);
	if (!review) {
		return {};
	}

	const title = `${review.title} - ${review.artist}`;
	const description = review.review
		? htmlToPlainText(review.review).slice(0, DESCRIPTION_LENGTH)
		: `${review.author ?? "匿名"}在 ${review.venue_name} 的 ${review.artist} 演唱會紀錄`;

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			images: review.cover_image_url ? [review.cover_image_url] : undefined,
		},
		twitter: {
			title,
			description,
			images: review.cover_image_url ? [review.cover_image_url] : undefined,
		},
	};
}

export default async function ReviewDetailPage({ params }: PageProps): Promise<ReactElement> {
	const { id } = await params;

	const review = await getPublicReviewById(id);
	if (!review) {
		notFound(); // 不存在或非公開 → 404
	}

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	const [likeState, bookmarkedByMe, commentsPage, relatedReviews] = await Promise.all([
		getLikeState(id, user?.id ?? null),
		isRecordBookmarked(id, user?.id ?? null),
		getCommentsByRecordId(id, 1),
		getRelatedReviewsByArtist(review.artist, id),
	]);

	return (
		<>
			<JsonLd data={buildReviewJsonLd(review)} />
			<RecordDetailBody
				id={review.id}
				userId={review.user_id}
				title={review.title}
				artist={review.artist}
				venueName={review.venue_name}
				date={review.date}
				seatInfo={review.seat_info}
				rating={review.rating}
				tags={review.tags}
				coverImageUrl={review.cover_image_url}
				review={review.review}
				spotifyPlaylistId={review.spotify_playlist_id}
				author={review.author}
				authorAvatarUrl={review.author_avatar_url}
				isPublic
				backHref="/reviews"
				backLabel="← 返回心得分享"
				currentUserId={user?.id ?? null}
				likeState={likeState}
				bookmarkedByMe={bookmarkedByMe}
				commentsPage={commentsPage}
				relatedReviews={relatedReviews}
			/>
		</>
	);
}
