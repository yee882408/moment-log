import type { ReactElement } from "react";
import Link from "next/link";
import { getCurrentUserProfile } from "@/lib/data/profile";
import { Button } from "@/components/ui/Button";

export default async function Home(): Promise<ReactElement> {
	const profile = await getCurrentUserProfile();

	return (
		<main className="flex flex-1 flex-col items-center justify-center gap-6 bg-linear-to-b from-indigo-50 to-white px-4 py-24 text-center">
			<h1 className="text-3xl font-semibold text-foreground">🎤 moment-log</h1>
			<p className="text-muted-foreground">
				{profile ? `歡迎回來，${profile.displayName || profile.email}` : "記錄每一場演唱會的回憶"}
			</p>
			<div className="flex flex-wrap items-center justify-center gap-3">
				{profile ? (
					<Button asChild>
						<Link href="/concerts">個人紀錄</Link>
					</Button>
				) : (
					<Button asChild>
						<Link href="/login">登入 / 註冊</Link>
					</Button>
				)}
				<Button asChild variant="secondary">
					<Link href="/reviews">瀏覽心得分享</Link>
				</Button>
			</div>
		</main>
	);
}
