import type { ReactElement } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTemplateById } from "@/lib/data/concerts";
import { ConcertForm } from "@/components/admin/ConcertForm";
import { Card } from "@/components/ui/Card";

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function EditTemplatePage({
	params,
}: PageProps): Promise<ReactElement> {
	const { id } = await params;
	const template = await getTemplateById(id);
	if (!template) {
		notFound();
	}

	return (
		<main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-semibold text-foreground">
					編輯範本
				</h1>
				<Link
					href="/admin/concerts"
					className="text-sm text-muted-foreground hover:underline"
				>
					← 返回
				</Link>
			</div>
			<Card>
				<ConcertForm
					templateId={template.id}
					defaultValues={{
						title: template.title,
						artist: template.artist,
						venueName: template.venue_name,
						venueLat: template.venue_lat,
						venueLng: template.venue_lng,
						date: template.date,
					}}
				/>
			</Card>
		</main>
	);
}
