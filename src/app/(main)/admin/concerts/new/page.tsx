import type { ReactElement } from "react";
import Link from "next/link";
import { ConcertForm } from "@/components/admin/ConcertForm";
import { Card } from "@/components/ui/Card";

export default function NewTemplatePage(): ReactElement {
	return (
		<main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-semibold text-foreground">
					新增範本
				</h1>
				<Link
					href="/admin/concerts"
					className="text-sm text-muted-foreground hover:underline"
				>
					← 返回
				</Link>
			</div>
			<Card>
				<ConcertForm />
			</Card>
		</main>
	);
}
