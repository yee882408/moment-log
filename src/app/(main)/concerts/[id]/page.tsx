import type { ReactElement } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRecordById } from "@/lib/data/records";
import { DeleteRecordButton } from "@/components/concerts/DeleteRecordButton";
import { Card } from "@/components/ui/Card";
import { Badge, StarRating } from "@/components/ui/Badge";
import { CoverImage } from "@/components/ui/CoverImage";
import { Button } from "@/components/ui/Button";

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

	return (
		<main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<Link
					href="/concerts"
					className="text-sm text-muted-foreground hover:underline"
				>
					← 返回列表
				</Link>
				<div className="flex gap-2">
					<Button asChild variant="secondary">
						<Link href={`/concerts/${record.id}/edit`}>編輯</Link>
					</Button>
					<DeleteRecordButton recordId={record.id} />
				</div>
			</div>

			<header className="flex flex-col gap-2">
				<div className="flex items-center gap-2">
					<h1 className="text-2xl font-semibold text-foreground">
						{record.title}
					</h1>
					{record.is_public && <Badge variant="public">公開</Badge>}
				</div>
				<p className="text-muted-foreground">{record.artist}</p>
				<div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
					<span>{record.venue_name}</span>
					<span>·</span>
					<span>{record.date}</span>
					{record.ticket_price != null && (
						<>
							<span>·</span>
							<span>NT${record.ticket_price}</span>
						</>
					)}
					{record.rating != null && <StarRating value={record.rating} />}
				</div>
				{record.tags.length > 0 && (
					<div className="flex flex-wrap gap-1.5">
						{record.tags.map((tag) => (
							<Badge key={tag.id} variant="neutral">
								{tag.name}
							</Badge>
						))}
					</div>
				)}
			</header>

			{record.cover_image_url && (
				<CoverImage
					src={record.cover_image_url}
					alt={record.title}
					width={672}
					height={378}
					className="w-full rounded-xl object-cover"
				/>
			)}

			{record.spotify_playlist_id && (
				<div className="flex flex-col gap-1">
					<iframe
						title="Spotify 歌單"
						src={`https://open.spotify.com/embed/playlist/${record.spotify_playlist_id}`}
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

			{record.review && (
				<Card className="whitespace-pre-wrap text-sm leading-7 text-foreground">
					{record.review}
				</Card>
			)}
		</main>
	);
}
