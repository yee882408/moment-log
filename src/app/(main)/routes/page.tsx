import type { ReactElement } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRouteVenues } from "@/lib/data/routes";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";

interface PageProps {
	searchParams: Promise<{ page?: string }>;
}

export default async function RoutesPage({
	searchParams,
}: PageProps): Promise<ReactElement> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	const { page: pageParam } = await searchParams;
	const page = Math.max(1, Number(pageParam) || 1);
	const { venues, totalPages } = await getRouteVenues(user.id, page);

	return (
		<main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
			<h1 className="text-xl font-semibold text-foreground">路線規劃</h1>
			<p className="text-sm text-muted-foreground">
				選一個場館用 Google Maps 導航（起點自動用你的目前位置）。
			</p>

			{venues.length === 0 && (
				<p className="text-sm text-muted-foreground">
					目前沒有可選場館，
					<Link href="/concerts/new" className="text-primary hover:underline">
						去新增一筆含場館定位的紀錄
					</Link>
					。
				</p>
			)}

			<ul className="flex flex-col gap-3">
				{venues.map((v) => (
					<li key={v.name}>
						<Card className="flex items-center justify-between">
							<span className="font-medium text-foreground">
								📍 {v.name}
							</span>
							<Button asChild>
								<a
									href={`https://www.google.com/maps/dir/?api=1&destination=${v.lat},${v.lng}`}
									target="_blank"
									rel="noopener noreferrer"
								>
									在 Google Maps 開路線
								</a>
							</Button>
						</Card>
					</li>
				))}
			</ul>

			<Pagination
				currentPage={page}
				totalPages={totalPages}
				buildHref={(p) => `/routes?page=${p}`}
			/>
		</main>
	);
}
