import type { ReactElement } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublicReviewsByAuthor } from "@/lib/data/reviews";
import { getFollowState } from "@/lib/data/follows";
import { getPublicProfileById } from "@/lib/data/profile";
import { LikeCountReviewGrid } from "@/components/reviews/LikeCountReviewGrid";
import { AuthorAvatar } from "@/components/reviews/AuthorAvatar";
import { Pagination } from "@/components/ui/Pagination";
import { FollowButton } from "@/components/users/FollowButton";

interface PageProps {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ page?: string }>;
}

export default async function UserProfilePage({
	params,
	searchParams,
}: PageProps): Promise<ReactElement> {
	const { id } = await params;
	const { page: pageParam } = await searchParams;
	const page = Math.max(1, Number(pageParam) || 1);

	const profile = await getPublicProfileById(id);
	if (!profile) {
		notFound();
	}

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	const [followState, { reviews, totalPages }] = await Promise.all([
		getFollowState(id, user?.id ?? null),
		getPublicReviewsByAuthor(id, page),
	]);

	return (
		<main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<AuthorAvatar
						author={profile.displayName}
						avatarUrl={profile.avatarUrl}
						sizeClass="h-10 w-10 text-lg"
					/>
					<div>
						<h1 className="text-xl font-semibold text-foreground">
							{profile.displayName}
						</h1>
						<p className="text-xs text-muted-foreground">
							{followState.followerCount} 位追蹤者
						</p>
					</div>
				</div>
				{user && user.id !== id && (
					<FollowButton
						targetUserId={id}
						initialFollowing={followState.followingByMe}
					/>
				)}
			</div>

			{reviews.length === 0 && (
				<p className="text-sm text-muted-foreground">
					{profile.displayName} 還沒有心得分享。
				</p>
			)}

			<LikeCountReviewGrid reviews={reviews} maxItemsPerPage={9} />

			<Pagination
				currentPage={page}
				totalPages={totalPages}
				buildHref={(p) => `/users/${id}?page=${p}`}
			/>
		</main>
	);
}
