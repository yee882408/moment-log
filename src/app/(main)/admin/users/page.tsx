import type { ReactElement } from "react";
import { createClient } from "@/lib/supabase/server";
import { getAdminUsers } from "@/lib/data/admin-users";
import { SetUserRoleButton } from "@/components/admin/SetUserRoleButton";
import { SetUserBannedButton } from "@/components/admin/SetUserBannedButton";
import { AuthorAvatar } from "@/components/reviews/AuthorAvatar";
import { Card } from "@/components/ui/Card";
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
			<div className="flex items-center gap-2">
				<h1 className="text-xl font-semibold text-foreground">使用者管理</h1>
				<Badge variant="admin">管理後台</Badge>
			</div>

			<ul className="flex flex-col gap-3">
				{users.map((u) => (
					<li key={u.id}>
						<Card className="flex flex-col flex-wrap items-start justify-between gap-4 sm:flex-row sm:items-center">
							<div className="flex items-center gap-3">
								<AuthorAvatar
									author={u.displayName}
									avatarUrl={u.avatarUrl}
									sizeClass="h-10 w-10"
								/>
								<div className="flex flex-col">
									<span className="flex items-center gap-2 font-medium text-foreground">
										{u.displayName}
										{u.isBanned && (
											<span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
												已停用
											</span>
										)}
									</span>
									<span className="text-xs text-muted-foreground">{u.email}</span>
								</div>
							</div>
							<div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
								<span className="text-xs text-muted-foreground">
									{u.role === "admin" ? "管理員" : "一般使用者"}
								</span>
								{u.id !== user?.id && (
									<div className="flex flex-1 flex-wrap items-center gap-2 sm:flex-none">
										<SetUserRoleButton userId={u.id} currentRole={u.role} />
										<SetUserBannedButton userId={u.id} isBanned={u.isBanned} />
									</div>
								)}
							</div>
						</Card>
					</li>
				))}
			</ul>

			<Pagination
				currentPage={page}
				totalPages={totalPages}
				buildHref={(p) => `/admin/users?page=${p}`}
			/>
		</main>
	);
}
