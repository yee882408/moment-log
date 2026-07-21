import type { ReactElement } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTemplateOptions } from "@/lib/data/concerts";
import { RecordForm } from "@/components/concerts/RecordForm";
import { Card } from "@/components/ui/Card";

export default async function NewConcertPage(): Promise<ReactElement> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	const templates = await getTemplateOptions();

	return (
		<main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-semibold text-foreground">
					新增紀錄
				</h1>
				<Link
					href="/concerts"
					className="text-sm text-muted-foreground hover:underline"
				>
					← 返回列表
				</Link>
			</div>
			<Card>
				<RecordForm templates={templates} />
			</Card>
		</main>
	);
}
