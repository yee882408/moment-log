"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { useSignOut } from "@/lib/hooks/useSignOut";
import { CoverImage } from "@/components/ui/CoverImage";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
	email: string | null;
	displayName: string;
	avatarUrl: string | null;
}

export function UserMenu({ email, displayName, avatarUrl }: UserMenuProps): ReactElement {
	const signOut = useSignOut();
	const initial = (displayName || email || "匿")[0];

	// 這裡沒有直接重用 SignOutButton 元件是因為它自帶 <Button variant="secondary">
	// 的按鈕視覺，跟 DropdownMenuItem 本身的樣式疊在一起會衝突；DropdownMenuItem
	// 已經是可點擊、有 focus/hover 樣式的選單項目，不需要再包一層按鈕外殼
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-background text-sm font-medium text-muted-foreground outline-none hover:opacity-80"
				>
					{avatarUrl ? (
						<CoverImage
							src={avatarUrl}
							alt={displayName || "使用者頭像"}
							width={36}
							height={36}
							className="h-9 w-9 rounded-full object-cover"
						/>
					) : (
						initial
					)}
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{email && <DropdownMenuLabel>{email}</DropdownMenuLabel>}
				<DropdownMenuItem asChild>
					<Link href="/profile">個人檔案</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onSelect={() => signOut()}>登出</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
