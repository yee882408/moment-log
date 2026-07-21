import type { ReactElement } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSpotListForEdit } from "@/lib/data/spots";
import { SpotListForm } from "@/components/spots/SpotListForm";
import { Card } from "@/components/ui/Card";

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function EditSpotListPage({ params }: PageProps): Promise<ReactElement> {
	const { id } = await params;
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	const list = await getSpotListForEdit(user.id, id);
	if (!list) {
		notFound();
	}

	return (
		<main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-semibold text-foreground">編輯清單</h1>
				<Link href={`/spots/${list.id}`} className="text-sm text-muted-foreground hover:underline">
					← 返回清單
				</Link>
			</div>
			<Card>
				<SpotListForm
					listId={list.id}
					defaultValues={{
						title: list.title,
						artist: list.artist,
						description: list.description ?? undefined,
						isPublic: list.is_public,
					}}
				/>
			</Card>
		</main>
	);
}
