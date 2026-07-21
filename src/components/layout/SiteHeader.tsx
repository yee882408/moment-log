import type { ReactElement } from "react";
import Link from "next/link";
import { isCurrentUserAdmin, getCurrentUserProfile } from "@/lib/data/profile";
import { Button } from "@/components/ui/Button";
import { NavLinks } from "@/components/layout/NavLinks";
import { UserMenu } from "@/components/layout/UserMenu";
import { NotificationBell } from "@/components/layout/NotificationBell";

export async function SiteHeader(): Promise<ReactElement> {
	const profile = await getCurrentUserProfile();
	const admin = profile ? await isCurrentUserAdmin() : false;

	return (
		<header className="sticky top-0 z-10 border-b border-border bg-card">
			<div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
				<Link href="/" className="text-base font-semibold text-foreground">
					🎤 moment-log
				</Link>

				<NavLinks loggedIn={Boolean(profile)} admin={admin} profile={profile} />

				{/* 手機版帳號功能已整合進 NavLinks 的漢堡選單，這裡只在 md 以上寬螢幕顯示 */}
				<div className="hidden items-center gap-3 md:flex">
					{profile ? (
						<>
							<NotificationBell />
							<UserMenu
								email={profile.email}
								displayName={profile.displayName}
								avatarUrl={profile.avatarUrl}
							/>
						</>
					) : (
						<Button asChild>
							<Link href="/login">登入 / 註冊</Link>
						</Button>
					)}
				</div>
			</div>
		</header>
	);
}
