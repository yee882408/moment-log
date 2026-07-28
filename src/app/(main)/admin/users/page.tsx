import type { ReactElement } from "react";
import { createClient } from "@/lib/supabase/server";
import { getAdminUsers } from "@/lib/data/admin-users";
import { SetUserRoleButton } from "@/components/admin/SetUserRoleButton";
import { SetUserBannedButton } from "@/components/admin/SetUserBannedButton";
import { AuthorAvatar } from "@/components/reviews/AuthorAvatar";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";

interface PageProps {
	searchParams: Promise<{ page?: string }>;
}

export default async function AdminUsersPage({
	searchParams,
}: PageProps): Promise<ReactElement> {
	const { page: pageParam } = await searchParams;
	const page = Math.max(1, Number(pageParam) || 1);

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	const { users, totalPages } = await getAdminUsers(page);

	return (
		<main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
			<div>
				<span className="flex items-center gap-2 text-xs font-bold tracking-wider text-primary uppercase">
					<span className="h-px w-4.5 bg-primary" />
					管理後台
				</span>
				<div className="mt-1 flex items-center gap-2">
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">使用者管理</h1>
					<Badge variant="admin">管理後台</Badge>
				</div>
			</div>

			<div className="relative rounded-sm border border-border bg-card">
				<div className="pointer-events-none absolute inset-1.5 rounded-xs border border-dashed border-border opacity-60" />
				<ul className="relative flex flex-col">
					{users.map((u) => (
						<li
							key={u.id}
							className="flex flex-col flex-wrap items-start justify-between gap-4 border-b border-border p-4 last:border-b-0 sm:flex-row sm:items-center"
						>
							<div className="flex items-center gap-3">
								<AuthorAvatar author={u.displayName} avatarUrl={u.avatarUrl} sizeClass="h-10 w-10" />
								<div className="flex flex-col">
									<span className="flex items-center gap-2 font-medium text-foreground">
										{u.displayName}
										{u.role === "admin" && <Badge variant="admin">管理員</Badge>}
										{u.isBanned && (
											<span className="rounded-full bg-red-50 px-2 py-0.5 text-2xs font-medium text-red-600">
												已停用
											</span>
										)}
									</span>
									<span className="text-xs text-muted-foreground">{u.email}</span>
								</div>
							</div>
							{u.id !== user?.id && (
								<div className="flex w-full flex-wrap items-center gap-2 pl-13 sm:w-auto sm:pl-0">
									<SetUserRoleButton userId={u.id} currentRole={u.role} />
									<SetUserBannedButton userId={u.id} isBanned={u.isBanned} />
								</div>
							)}
						</li>
					))}
				</ul>
			</div>

			<Pagination
				currentPage={page}
				totalPages={totalPages}
				buildHref={(p) => `/admin/users?page=${p}`}
			/>
		</main>
	);
}
