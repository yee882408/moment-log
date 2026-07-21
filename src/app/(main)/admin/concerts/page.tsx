import type { ReactElement } from "react";
import Link from "next/link";
import { getTemplates } from "@/lib/data/concerts";
import { DeleteTemplateButton } from "@/components/admin/DeleteTemplateButton";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";

interface PageProps {
	searchParams: Promise<{ page?: string }>;
}

export default async function AdminConcertsPage({
	searchParams,
}: PageProps): Promise<ReactElement> {
	const { page: pageParam } = await searchParams;
	const page = Math.max(1, Number(pageParam) || 1);
	const { templates, totalPages } = await getTemplates(page);

	return (
		<main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
			<div className="flex flex-col flex-wrap items-start justify-between gap-3 sm:flex-row sm:items-center">
				<div className="flex items-center gap-2">
					<h1 className="text-xl font-semibold text-foreground">
						範本管理
					</h1>
					<Badge variant="admin">管理後台</Badge>
				</div>
				<Button asChild>
					<Link href="/admin/concerts/new">+ 新增範本</Link>
				</Button>
			</div>

			{templates.length === 0 && (
				<p className="text-sm text-muted-foreground">
					還沒有任何範本，點右上角「+ 新增範本」開始建立。
				</p>
			)}

			<ul className="flex flex-col gap-3">
				{templates.map((t) => (
					<li key={t.id}>
						<Card className="flex flex-col flex-wrap items-start justify-between gap-3 sm:flex-row sm:items-center">
							<div className="flex flex-col">
								<span className="font-medium text-foreground">
									{t.title}
								</span>
								<span className="text-xs text-muted-foreground">
									{t.artist} · {t.venue_name} · {t.date}
								</span>
							</div>
							<div className="flex flex-wrap items-center gap-2">
								<Button asChild variant="secondary" className="px-3 py-1.5 text-xs">
									<Link href={`/admin/concerts/${t.id}/edit`}>編輯</Link>
								</Button>
								<DeleteTemplateButton templateId={t.id} />
							</div>
						</Card>
					</li>
				))}
			</ul>

			<Pagination
				currentPage={page}
				totalPages={totalPages}
				buildHref={(p) => `/admin/concerts?page=${p}`}
			/>
		</main>
	);
}
