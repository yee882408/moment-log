import type { ReactElement } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SpotListForm } from "@/components/spots/SpotListForm";
import { Card } from "@/components/ui/Card";

export default async function NewSpotListPage(): Promise<ReactElement> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	return (
		<main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-semibold text-foreground">新增清單</h1>
				<Link href="/spots" className="text-sm text-muted-foreground hover:underline">
					← 返回列表
				</Link>
			</div>
			<Card>
				<SpotListForm />
			</Card>
		</main>
	);
}
