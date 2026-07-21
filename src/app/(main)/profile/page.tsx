import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/data/profile";
import { Card } from "@/components/ui/Card";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";

export default async function ProfilePage(): Promise<ReactElement> {
	const profile = await getCurrentUserProfile();
	if (!profile) {
		redirect("/login");
	}

	return (
		<main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6">
			<h1 className="text-xl font-semibold text-foreground">個人檔案</h1>
			<Card>
				<ProfileForm
					initialDisplayName={profile.displayName}
					initialAvatarUrl={profile.avatarUrl}
				/>
			</Card>

			<h2 className="text-sm font-semibold text-foreground">修改密碼</h2>
			<Card>
				<ChangePasswordForm />
			</Card>
		</main>
	);
}
