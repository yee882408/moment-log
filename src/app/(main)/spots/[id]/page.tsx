import type { ReactElement } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSpotListById } from "@/lib/data/spots";
import { getSpotListLikeState } from "@/lib/data/spotListLikes";
import { SpotItemsPanel } from "@/components/spots/SpotItemsPanel";
import { SpotListLikeButton } from "@/components/spots/SpotListLikeButton";
import { DeleteSpotListButton } from "@/components/spots/DeleteSpotListButton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function SpotListDetailPage({ params }: PageProps): Promise<ReactElement> {
	const { id } = await params;
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const list = await getSpotListById(id);
	if (!list) {
		notFound(); // 不存在、或私密且不是本人 → RLS 已擋在查詢層，這裡回 404
	}

	const canEdit = user?.id === list.user_id;
	const likeState = await getSpotListLikeState(id, user?.id ?? null);

	return (
		<main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<Link href="/spots" className="text-sm text-muted-foreground hover:underline">
					← 返回列表
				</Link>
				{canEdit && (
					<div className="flex gap-2">
						<Button asChild variant="secondary">
							<Link href={`/spots/${list.id}/edit`}>編輯</Link>
						</Button>
						<DeleteSpotListButton listId={list.id} />
					</div>
				)}
			</div>

			<header className="flex flex-col gap-2">
				<div className="flex items-center gap-2">
					<h1 className="text-2xl font-semibold text-foreground">{list.title}</h1>
					{list.is_public && <Badge variant="public">公開</Badge>}
				</div>
				<p className="text-muted-foreground">{list.artist}</p>
				{list.description && (
					<p className="whitespace-pre-wrap text-sm text-foreground">{list.description}</p>
				)}
			</header>

			{user ? (
				<SpotListLikeButton
					listId={list.id}
					initialCount={likeState.count}
					initialLiked={likeState.likedByMe}
				/>
			) : (
				<Button asChild variant="secondary" className="justify-start">
					<Link href="/login">讚 · {likeState.count}（請登入）</Link>
				</Button>
			)}

			<SpotItemsPanel
				listId={list.id}
				artist={list.artist}
				initialItems={list.items}
				canEdit={canEdit}
			/>
		</main>
	);
}
