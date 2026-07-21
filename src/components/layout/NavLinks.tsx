"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";
import type { ReactElement } from "react";
import { useSignOut } from "@/lib/hooks/useSignOut";
import type { CurrentUserProfile } from "@/lib/data/profile";
import { CoverImage } from "@/components/ui/CoverImage";
import { Button } from "@/components/ui/Button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";

interface NavLinksProps {
	loggedIn: boolean;
	admin: boolean;
	profile: CurrentUserProfile | null;
}

interface NavItem {
	href: string;
	label: string;
}

// 目前頁面的判斷用「前綴相符」，讓子頁面（如 /concerts/new）也保持對應導覽項目 active
function isActive(pathname: string, href: string): boolean {
	return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({ loggedIn, admin, profile }: NavLinksProps): ReactElement {
	const pathname = usePathname();
	const [open, setOpen] = useState(false);

	const items: NavItem[] = [
		...(loggedIn ? [{ href: "/concerts", label: "個人紀錄" }] : []),
		{ href: "/reviews", label: "心得分享" },
		{ href: "/spots", label: "追星地圖" },
		...(loggedIn ? [{ href: "/stats", label: "統計" }] : []),
		...(admin ? [{ href: "/admin/concerts", label: "範本管理" }] : []),
		...(admin ? [{ href: "/admin/users", label: "使用者管理" }] : []),
	];

	const signOut = useSignOut();
	// 手機版漢堡選單內的帳號區塊登出：登出前先收起選單
	const handleSignOut = (): void => {
		void signOut(() => setOpen(false));
	};

	const initial = (profile?.displayName || profile?.email || "匿")[0];

	return (
		<>
			<nav className="hidden items-center gap-4 text-sm text-muted-foreground md:flex">
				{items.map((item) => (
					<Link
						key={item.href}
						href={item.href}
						className={isActive(pathname, item.href) ? "font-medium text-primary" : "hover:text-foreground"}
					>
						{item.label}
					</Link>
				))}
			</nav>

			<Sheet open={open} onOpenChange={setOpen}>
				<SheetTrigger
					aria-label="開啟導覽選單"
					className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
				>
					<Menu className="h-5 w-5" />
				</SheetTrigger>
				<SheetContent side="right">
					<SheetHeader>
						<SheetTitle>導覽選單</SheetTitle>
					</SheetHeader>

					{profile && (
						<div className="flex items-center gap-3 border-b border-border pb-4">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-background text-sm font-medium text-muted-foreground">
								{profile.avatarUrl ? (
									<CoverImage
										src={profile.avatarUrl}
										alt={profile.displayName || "使用者頭像"}
										width={40}
										height={40}
										className="h-10 w-10 rounded-full object-cover"
									/>
								) : (
									initial
								)}
							</div>
							<div className="flex min-w-0 flex-col">
								<span className="truncate text-sm font-medium text-foreground">
									{profile.displayName || "使用者"}
								</span>
								{profile.email && (
									<span className="truncate text-xs text-muted-foreground">{profile.email}</span>
								)}
							</div>
						</div>
					)}

					<nav className="flex flex-col gap-1">
						{items.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								onClick={() => setOpen(false)}
								className={
									isActive(pathname, item.href)
										? "rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
										: "rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
								}
							>
								{item.label}
							</Link>
						))}
					</nav>

					<div className="mt-auto flex flex-col gap-1 border-t border-border pt-4">
						{profile ? (
							<>
								<Link
									href="/profile"
									onClick={() => setOpen(false)}
									className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
								>
									個人檔案
								</Link>
								<button
									type="button"
									onClick={handleSignOut}
									className="cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
								>
									登出
								</button>
							</>
						) : (
							<Button asChild className="w-full">
								<Link href="/login" onClick={() => setOpen(false)}>
									登入 / 註冊
								</Link>
							</Button>
						)}
					</div>
				</SheetContent>
			</Sheet>
		</>
	);
}
