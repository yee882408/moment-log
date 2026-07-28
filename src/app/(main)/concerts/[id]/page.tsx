import type { ReactElement } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRecordById } from "@/lib/data/records";
import { getRelatedReviewsByArtist } from "@/lib/data/reviews";
import { getLikeState } from "@/lib/data/likes";
import { isRecordBookmarked } from "@/lib/data/bookmarks";
import { getCommentsByRecordId } from "@/lib/data/comments";
import { DeleteRecordButton } from "@/components/concerts/DeleteRecordButton";
import { RecordDetailBody } from "@/components/reviews/RecordDetailBody";

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function RecordDetailPage({
	params,
}: PageProps): Promise<ReactElement> {
	const { id } = await params; // Next.js 16：params 是 Promise，要 await
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	const record = await getRecordById(user.id, id);
	if (!record) {
		notFound(); // 找不到或不是自己的 → 404
	}

	// 讚/留言只可能發生在公開紀錄上（RLS 擋私密紀錄 insert），私密紀錄查這些
	// 一定是空結果；相關心得同理只查公開紀錄，私密紀錄不需要查（也沒有意義）
	const [likeState, bookmarkedByMe, commentsPage, relatedReviews] = await Promise.all([
		getLikeState(id, user.id),
		isRecordBookmarked(id, user.id),
		getCommentsByRecordId(id, 1),
		record.is_public ? getRelatedReviewsByArtist(record.artist, id) : Promise.resolve([]),
	]);

	return (
		<RecordDetailBody
			id={record.id}
			userId={record.user_id}
			title={record.title}
			artist={record.artist}
			venueName={record.venue_name}
			date={record.date}
			seatInfo={record.seat_info}
			rating={record.rating}
			tags={record.tags}
			coverImageUrl={record.cover_image_url}
			review={record.review}
			spotifyPlaylistId={record.spotify_playlist_id}
			author={record.author}
			authorAvatarUrl={record.author_avatar_url}
			isPublic={record.is_public}
			ticketPrice={record.ticket_price}
			ticketCurrency={record.ticket_currency}
			backHref="/concerts"
			backLabel="← 返回列表"
			currentUserId={user.id}
			likeState={likeState}
			bookmarkedByMe={bookmarkedByMe}
			commentsPage={commentsPage}
			relatedReviews={relatedReviews}
			topbarActions={
				<>
					<Link href={`/concerts/${record.id}/edit`} className="text-[#18130f] hover:underline">
						編輯
					</Link>
					<DeleteRecordButton
						recordId={record.id}
						className="border-0 bg-transparent p-0 text-[#7a2e2e] hover:bg-transparent hover:underline"
					/>
				</>
			}
		/>
	);
}
