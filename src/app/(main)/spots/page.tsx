import type { ReactElement } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMySpotLists, getPublicSpotLists, type SpotListSort } from "@/lib/data/spots";
import { parseSearchStateFromServerParams } from "@/lib/hooks/searchState";
import { SpotBrowser } from "@/components/spots/SpotBrowser";
import { Button } from "@/components/ui/Button";

interface PageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SpotsPage({ searchParams }: PageProps): Promise<ReactElement> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const params = await searchParams;
	const state = parseSearchStateFromServerParams(params, "newest");
	const filters = { keyword: state.keyword || undefined };
	const sort = state.sort as SpotListSort;

	const { lists, totalPages } = user
		? await getMySpotLists(user.id, state.page, filters, sort)
		: await getPublicSpotLists(state.page, filters, sort);

	return (
		<main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<span className="mb-1 flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-primary uppercase">
						<span className="h-px w-4.5 bg-primary" />
						追星足跡地圖
					</span>
					<h1 className="text-2xl leading-tight font-semibold tracking-tight text-foreground">
						追星地圖
					</h1>
				</div>
				{user && (
					<Button asChild className="rounded-sm">
						<Link href="/spots/new">+ 新增清單</Link>
					</Button>
				)}
			</div>
			<SpotBrowser
				loggedIn={Boolean(user)}
				initialTab={user ? "mine" : "public"}
				initialLists={lists}
				initialTotalPages={totalPages}
				initialState={state}
			/>
		</main>
	);
}
