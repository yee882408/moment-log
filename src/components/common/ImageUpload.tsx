"use client";

import { useRef, useState } from "react";
import type { DragEvent, ReactElement } from "react";
import { toast } from "sonner";
import { uploadImageToBucket } from "@/lib/storage/upload";
import { CoverImage } from "@/components/ui/CoverImage";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
	value?: string | null;
	onUploaded: (url: string) => void;
	onRemoved?: () => void;
	bucket: string;
	shape?: "rectangle" | "circle";
	label?: string;
	fallbackText?: string; // shape="circle" 且無圖時顯示（例如 displayName 首字）
}

export function ImageUpload({
	value,
	onUploaded,
	onRemoved,
	bucket,
	shape = "rectangle",
	label = "圖片（選填，≤ 5MB）",
	fallbackText,
}: ImageUploadProps): ReactElement {
	const [uploading, setUploading] = useState(false);
	const [dragging, setDragging] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const uploadFile = async (file: File): Promise<void> => {
		setUploading(true);
		const result = await uploadImageToBucket(bucket, file);
		setUploading(false);
		if ("error" in result) {
			toast.error(result.error);
			return;
		}
		onUploaded(result.url);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
		const file = e.target.files?.[0];
		e.target.value = ""; // 允許連續選同一個檔案也能觸發 onChange
		if (file) {
			void uploadFile(file);
		}
	};

	const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
		e.preventDefault();
		setDragging(false);
		if (uploading) {
			return;
		}
		const file = e.dataTransfer.files?.[0];
		if (file) {
			void uploadFile(file);
		}
	};

	const handleRemove = (e: React.MouseEvent): void => {
		e.stopPropagation();
		onRemoved?.();
	};

	const isCircle = shape === "circle";
	const boxSizeClass = isCircle ? "h-20 w-20 rounded-full" : "aspect-video w-full rounded-lg";

	return (
		<div className="flex flex-col gap-2">
			<Label>{label}</Label>
			<div
				onClick={() => !uploading && inputRef.current?.click()}
				onDragOver={(e) => {
					e.preventDefault();
					setDragging(true);
				}}
				onDragLeave={() => setDragging(false)}
				onDrop={handleDrop}
				className={cn(
					"relative flex cursor-pointer items-center justify-center overflow-hidden border-2 border-dashed transition-colors",
					boxSizeClass,
					dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
				)}
			>
				{value ? (
					<>
						<CoverImage
							src={value}
							alt="圖片預覽"
							width={isCircle ? 80 : 320}
							height={isCircle ? 80 : 180}
							className={cn("h-full w-full object-cover", isCircle && "rounded-full")}
						/>
						{onRemoved && !uploading && (
							<button
								type="button"
								onClick={handleRemove}
								aria-label="移除圖片"
								className="absolute top-1 right-1 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
							>
								✕
							</button>
						)}
					</>
				) : (
					<div className="flex flex-col items-center gap-1 px-2 text-center">
						{fallbackText ? (
							<span className="text-xl text-muted-foreground">{fallbackText[0]}</span>
						) : (
							<>
								{/* <span className="text-2xl text-muted-foreground">📷</span> */}
								{!isCircle && (
									<span className="text-xs text-muted-foreground">
										拖曳圖片到這裡，或點擊選擇檔案
									</span>
								)}
							</>
						)}
					</div>
				)}
				{uploading && (
					<div className="absolute inset-0 flex items-center justify-center bg-card/80">
						<Spinner />
					</div>
				)}
			</div>
			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				onChange={handleInputChange}
				disabled={uploading}
				className="hidden"
			/>
		</div>
	);
}
