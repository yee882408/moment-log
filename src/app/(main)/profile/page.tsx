import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/data/profile";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";

// createdAt（yyyy-mm-ddTHH:mm:ssZ）→「yyyy 年 M 月」，加入時間只需要精確到月份
function formatJoinedMonth(isoDate: string): string {
	const d = new Date(isoDate);
	return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`;
}

export default async function ProfilePage(): Promise<ReactElement> {
	const profile = await getCurrentUserProfile();
	if (!profile) {
		redirect("/login");
	}

	return (
		<main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
			<div>
				<span className="flex items-center gap-2 text-xs font-bold tracking-wider text-primary uppercase">
					帳號設定
				</span>
				<h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">個人檔案</h1>
			</div>

			<div className="flex flex-col gap-4.5">
				<div className="relative rounded-sm border border-border bg-card p-5">
					<div className="pointer-events-none absolute inset-1.5 rounded-xs border border-dashed border-border opacity-60" />
					<div className="relative">
						<span className="mb-4 block text-sm font-bold tracking-wide text-primary">個人資訊</span>
						<div className="mb-4.5 flex flex-col gap-0.5 border-b border-dashed border-border pb-4.5 text-sm">
							{profile.email && <span className="text-muted-foreground">{profile.email}</span>}
							<span className="text-muted-foreground">
								加入時間：{formatJoinedMonth(profile.createdAt)}
							</span>
						</div>
						<ProfileForm
							initialDisplayName={profile.displayName}
							initialAvatarUrl={profile.avatarUrl}
						/>
					</div>
				</div>

				<div className="relative rounded-sm border border-border bg-card p-5">
					<div className="pointer-events-none absolute inset-1.5 rounded-xs border border-dashed border-border opacity-60" />
					<div className="relative">
						<span className="mb-4 block text-sm font-bold tracking-wide text-primary">修改密碼</span>
						<ChangePasswordForm />
					</div>
				</div>
			</div>
		</main>
	);
}
