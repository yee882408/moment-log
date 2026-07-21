import type { ReactElement } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRecordById } from "@/lib/data/records";
import { RecordForm } from "@/components/concerts/RecordForm";
import { Card } from "@/components/ui/Card";

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function EditRecordPage({
	params,
}: PageProps): Promise<ReactElement> {
	const { id } = await params;
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	const record = await getRecordById(user.id, id);
	if (!record) {
		notFound();
	}

	return (
		<main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-semibold text-foreground">
					編輯紀錄
				</h1>
				<Link
					href={`/concerts/${record.id}`}
					className="text-sm text-muted-foreground hover:underline"
				>
					← 返回詳情
				</Link>
			</div>
			<Card>
				<RecordForm
					recordId={record.id}
					defaultValues={{
						title: record.title,
						artist: record.artist,
						venueName: record.venue_name,
						venueLat: record.venue_lat ?? undefined,
						venueLng: record.venue_lng ?? undefined,
						date: record.date,
						ticketPrice: record.ticket_price ?? undefined,
						rating: record.rating ?? undefined,
						review: record.review ?? undefined,
						spotifyPlaylistId: record.spotify_playlist_id ?? undefined,
						coverImageUrl: record.cover_image_url ?? undefined,
						isPublic: record.is_public,
						tags: record.tags.map((t) => t.name),
					}}
				/>
			</Card>
		</main>
	);
}
