import type { ReactElement } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMySpotLists, getPublicSpotLists } from "@/lib/data/spots";
import { SpotBrowser } from "@/components/spots/SpotBrowser";
import { Button } from "@/components/ui/Button";

export default async function SpotsPage(): Promise<ReactElement> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const initialListsPage = user
		? await getMySpotLists(user.id, 1)
		: await getPublicSpotLists(1);

	return (
		<main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-semibold text-foreground">追星地圖</h1>
				{user && (
					<Button asChild>
						<Link href="/spots/new">+ 新增清單</Link>
					</Button>
				)}
			</div>
			<SpotBrowser
				loggedIn={Boolean(user)}
				initialTab={user ? "mine" : "public"}
				initialListsPage={initialListsPage}
			/>
		</main>
	);
}
