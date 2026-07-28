"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface CoverImageProps {
	src: string;
	alt: string;
	width: number;
	height: number;
	className?: string;
}

// 封面圖載入失敗時（連結失效、Storage 物件被刪除等）顯示佔位圖示，取代瀏覽器預設的破圖圖示
function CoverImageInner({ src, alt, width, height, className }: CoverImageProps): ReactElement {
	const [failed, setFailed] = useState(false);

	if (failed) {
		return (
			<div
				data-slot="cover-image"
				className={cn("flex items-center justify-center bg-background text-3xl", className)}
			>
				🎤
			</div>
		);
	}

	return (
		<Image
			data-slot="cover-image"
			src={src}
			alt={alt}
			width={width}
			height={height}
			className={className}
			onError={() => setFailed(true)}
		/>
	);
}

// src 換成新網址時（例如剛上傳完的圖片）要重新嘗試載入，不能沿用上一張圖的
// failed 狀態，否則剛上傳的圖片若第一次請求剛好撲空（Storage CDN 還沒同步
// 完成），會永遠卡在佔位圖，即使圖片其實已經可以正常存取。用 key={src} 讓
// CoverImageInner 在 src 改變時整個重新掛載，state 自然重置，不需要在
// effect 裡手動 setState（React Compiler 會擋下 effect 內同步 setState 的寫法）
export function CoverImage(props: CoverImageProps): ReactElement {
	return <CoverImageInner key={props.src} {...props} />;
}
