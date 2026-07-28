import type { ReactElement } from "react";
import Link from "next/link";
import { getTemplates } from "@/lib/data/concerts";
import { DeleteTemplateButton } from "@/components/admin/DeleteTemplateButton";
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
				<div>
					<span className="flex items-center gap-2 text-xs font-bold tracking-wider text-primary uppercase">
						演唱會範本
					</span>
					<div className="mt-1 flex items-center gap-2">
						<h1 className="text-2xl font-semibold tracking-tight text-foreground">範本管理</h1>
						<Badge variant="admin">管理後台</Badge>
					</div>
				</div>
				<Button asChild>
					<Link href="/admin/concerts/new">+ 新增範本</Link>
				</Button>
			</div>

			{templates.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					還沒有任何範本，點右上角「+ 新增範本」開始建立。
				</p>
			) : (
				<div className="relative rounded-sm border border-border bg-card">
					<div className="pointer-events-none absolute inset-1.5 rounded-xs border border-dashed border-border opacity-60" />
					<ul className="relative flex flex-col">
						{templates.map((t) => (
							<li
								key={t.id}
								className="flex flex-col flex-wrap items-start justify-between gap-3 border-b border-border p-4 last:border-b-0 sm:flex-row sm:items-center"
							>
								<div className="flex items-center gap-3">
									<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg">
										🎫
									</span>
									<div className="flex flex-col">
										<span className="font-medium text-foreground">{t.title}</span>
										<span className="text-xs text-muted-foreground">
											{t.artist} · {t.venue_name} · {t.date}
										</span>
									</div>
								</div>
								<div className="flex flex-wrap items-center gap-4 pl-13 text-sm sm:pl-0">
									<Link href={`/admin/concerts/${t.id}/edit`} className="text-foreground hover:underline">
										編輯
									</Link>
									<DeleteTemplateButton
										templateId={t.id}
										className="border-0 bg-transparent p-0 text-destructive hover:bg-transparent hover:underline"
									/>
								</div>
							</li>
						))}
					</ul>
				</div>
			)}

			<Pagination
				currentPage={page}
				totalPages={totalPages}
				buildHref={(p) => `/admin/concerts?page=${p}`}
			/>
		</main>
	);
}
