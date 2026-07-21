"use client";

import { useEffect } from "react";
import type { ReactElement } from "react";
import { Button } from "@/components/ui/Button";

interface ErrorPageProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps): ReactElement {
	useEffect(() => {
		// 先印在 console 方便除錯；之後接上錯誤追蹤服務（如 Sentry）可以在這裡送出
		console.error(error);
	}, [error]);

	return (
		<main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
			<span className="text-5xl">⚠️</span>
			<h1 className="text-xl font-semibold text-foreground">發生了一些問題</h1>
			<p className="text-sm text-muted-foreground">請稍後再試一次。</p>
			<Button onClick={reset}>重試</Button>
		</main>
	);
}
