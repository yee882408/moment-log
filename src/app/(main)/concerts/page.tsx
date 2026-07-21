import type { ReactElement } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyRecords, type RecordSort } from "@/lib/data/records";
import { getTagsByIds } from "@/lib/data/tags";
import { parseSearchStateFromServerParams } from "@/lib/hooks/searchState";
import { Button } from "@/components/ui/Button";
import { RecordSearch } from "@/components/concerts/RecordSearch";

interface PageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ConcertsPage({ searchParams }: PageProps): Promise<ReactElement> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	const params = await searchParams;
	const state = parseSearchStateFromServerParams(params, "newest");
	const initialTags = await getTagsByIds(state.tagIds);

	const { records, totalPages } = await getMyRecords(
		user.id,
		{
			keyword: state.keyword || undefined,
			tagIds: state.tagIds.length ? state.tagIds : undefined,
		},
		state.page,
		state.sort as RecordSort,
	);

	return (
		<main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-semibold text-foreground">
					個人紀錄
				</h1>
				<Button asChild>
					<Link href="/concerts/new">+ 新增紀錄</Link>
				</Button>
			</div>

			<RecordSearch
				initialRecords={records}
				initialTotalPages={totalPages}
				initialState={state}
				initialTags={initialTags}
			/>
		</main>
	);
}
