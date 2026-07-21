"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface ShareCardButtonProps {
	recordId: string;
}

// 點擊後彈出 Dialog 預覽分享卡片圖片，內含下載按鈕；圖片由 /reviews/[id]/share-image
//這個 Route Handler 產生，Dialog 未開啟時 DialogContent 不會 render，
// 不會在頁面載入時就默默觸發一次圖片產生請求
export function ShareCardButton({ recordId }: ShareCardButtonProps): ReactElement {
	const [open, setOpen] = useState(false);
	const [imgLoaded, setImgLoaded] = useState(false);
	const imageUrl = `/reviews/${recordId}/share-image`;

	// 關閉時重置 loading 狀態，避免下次開啟時瞬間顯示上一次殘留的已載入畫面
	const handleOpenChange = (next: boolean): void => {
		setOpen(next);
		if (!next) {
			setImgLoaded(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<Button type="button" variant="secondary" onClick={() => setOpen(true)}>
				分享卡片
			</Button>
			<DialogContent className="max-w-xl">
				<DialogTitle>分享卡片</DialogTitle>
				<div className="mt-4 flex flex-col gap-4">
					<div className="relative aspect-1200/630 w-full overflow-hidden rounded-xl border border-border bg-muted">
						{!imgLoaded && (
							<div className="absolute inset-0 flex items-center justify-center">
								<Spinner />
							</div>
						)}
						{/* eslint-disable-next-line @next/next/no-img-element -- Route Handler 產生的動態圖片，非靜態資源，不透過 next/image 優化 */}
						<img
							src={imageUrl}
							alt="分享卡片預覽"
							onLoad={() => setImgLoaded(true)}
							onError={() => setImgLoaded(true)}
							className={`h-full w-full object-cover transition-opacity ${imgLoaded ? "opacity-100" : "opacity-0"}`}
						/>
					</div>
					<Button asChild className="w-full">
						<a href={imageUrl} download={`moment-log-${recordId}.png`}>
							下載圖片
						</a>
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
