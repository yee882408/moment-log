import type { ReactElement } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSpotListById } from "@/lib/data/spots";
import { getSpotListLikeState } from "@/lib/data/spotListLikes";
import { isSpotListBookmarked } from "@/lib/data/spotListBookmarks";
import { JsonLd } from "@/lib/seo/JsonLd";
import { buildSpotListJsonLd } from "@/lib/seo/schemas";
import { SpotItemsPanel } from "@/components/spots/SpotItemsPanel";
import { SpotListLikeButton } from "@/components/spots/SpotListLikeButton";
import { SpotListBookmarkButton } from "@/components/spots/SpotListBookmarkButton";
import { DeleteSpotListButton } from "@/components/spots/DeleteSpotListButton";

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
	const [likeState, bookmarkedByMe] = await Promise.all([
		getSpotListLikeState(id, user?.id ?? null),
		isSpotListBookmarked(id, user?.id ?? null),
	]);

	return (
		<main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4.5 p-6">
			{list.is_public && <JsonLd data={buildSpotListJsonLd(list)} />}
			<div className="flex items-center justify-between text-sm">
				<Link href="/spots" className="text-muted-foreground hover:text-foreground">
					← 返回列表
				</Link>
				{canEdit && (
					<div className="flex items-center gap-4.5">
						<Link href={`/spots/${list.id}/edit`} className="text-foreground hover:underline">
							編輯
						</Link>
						<DeleteSpotListButton
							listId={list.id}
							className="border-0 bg-transparent p-0 text-destructive hover:bg-transparent hover:underline"
						/>
					</div>
				)}
			</div>

			{/* 戳章護照封面：延續 /spots 列表卡片的視覺語言（虛線內框、右上角旋轉印章），
			    把標題/藝人/描述/讚收在同一塊卡片內 */}
			<div className="relative rounded-sm border border-border bg-card p-6">
				<div className="pointer-events-none absolute inset-1.5 rounded-sm border border-dashed border-border" />

				{list.is_public && (
					<span className="absolute top-5 right-6 flex h-14.5 w-14.5 rotate-[8deg] items-center justify-center rounded-full border-2 border-success text-center text-2xs leading-tight font-extrabold tracking-wide text-success opacity-90">
						VISITED
						<br />✓ PUBLIC
					</span>
				)}

				<span className="block text-xs font-bold tracking-wider text-primary uppercase">
					{list.artist}
				</span>
				<h1 className="mt-1.5 mr-18 text-2xl leading-tight font-semibold text-foreground">
					{list.title}
				</h1>
				{list.description && (
					<p className="mt-2 max-w-[60ch] text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
						{list.description}
					</p>
				)}

				<div className="mt-3.5 flex items-center gap-3.5 border-t border-dashed border-border pt-3.5">
					{user ? (
						<SpotListLikeButton
							listId={list.id}
							initialCount={likeState.count}
							initialLiked={likeState.likedByMe}
						/>
					) : (
						<Link href="/login" className="text-sm text-muted-foreground hover:underline">
							讚 · {likeState.count}（請登入）
						</Link>
					)}

					{user ? (
						<SpotListBookmarkButton listId={list.id} initialBookmarked={bookmarkedByMe} />
					) : (
						<Link href="/login" className="text-sm text-muted-foreground hover:underline">
							收藏（請登入）
						</Link>
					)}
				</div>
			</div>

			<SpotItemsPanel
				listId={list.id}
				artist={list.artist}
				initialItems={list.items}
				canEdit={canEdit}
			/>
		</main>
	);
}
