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
export function CoverImage({ src, alt, width, height, className }: CoverImageProps): ReactElement {
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
