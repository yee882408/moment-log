import type { ReactElement } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound(): ReactElement {
	return (
		<main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
			<span className="text-5xl">🎤</span>
			<h1 className="text-xl font-semibold text-foreground">找不到這個頁面</h1>
			<p className="text-sm text-muted-foreground">
				可能已被刪除，或連結有誤。
			</p>
			<Button asChild>
				<Link href="/">回首頁</Link>
			</Button>
		</main>
	);
}
