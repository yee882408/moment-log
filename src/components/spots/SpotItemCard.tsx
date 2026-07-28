"use client";

import type { ReactElement } from "react";
import { Landmark, MapPin, Navigation, Pencil, Trash2, Utensils } from "lucide-react";
import { deleteSpotListItem } from "@/lib/actions/spots";
import type { SpotListItem } from "@/lib/data/spots";
import { CoverImage } from "@/components/ui/CoverImage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useConfirmDelete } from "@/lib/hooks/useConfirmDelete";

// 類型配色跟 SpotMapInner.tsx 的 marker 顏色一致（橘/紫/藍），讓側欄卡片跟地圖上的
// 圖釘顏色可以互相對應；label/icon 沿用既有分類（未指定/other 一律歸類 other）
const placeTypeConfig: Record<
	string,
	{ label: string; icon: typeof MapPin; textClassName: string; gradientClassName: string }
> = {
	restaurant: {
		label: "餐廳",
		icon: Utensils,
		textClassName: "text-orange-500",
		gradientClassName: "from-orange-400/80 to-orange-600/80",
	},
	attraction: {
		label: "景點",
		icon: Landmark,
		textClassName: "text-violet-500",
		gradientClassName: "from-violet-400/80 to-violet-600/80",
	},
	other: {
		label: "其他",
		icon: MapPin,
		textClassName: "text-blue-500",
		gradientClassName: "from-blue-400/80 to-blue-600/80",
	},
};

interface SpotItemCardProps {
	item: SpotListItem;
	listId: string;
	canEdit: boolean;
	isFocused: boolean; // 目前是否為地圖上聚焦中的地點，用來在清單卡片標示選中狀態
	onDeleted: () => void;
	onEdit: () => void; // 點擊編輯按鈕時通知父層開啟編輯 Modal
	onFocus: () => void; // 點擊卡片時通知父層，讓地圖平移過去並開啟該地點的 popup
}

export function SpotItemCard({
	item,
	listId,
	canEdit,
	isFocused,
	onDeleted,
	onEdit,
	onFocus,
}: SpotItemCardProps): ReactElement {
	const { busy, dialogRef, handleConfirm } = useConfirmDelete(
		() => deleteSpotListItem(item.id, listId),
		{ onSuccess: onDeleted },
	);

	const typeConfig = placeTypeConfig[item.place_type ?? "other"] ?? placeTypeConfig.other;
	const TypeIcon = typeConfig.icon;

	return (
		<div
			onClick={onFocus}
			className={`relative flex cursor-pointer flex-col overflow-hidden rounded-sm border bg-card transition-colors ${
				isFocused ? "border-primary ring-2 ring-primary/25" : "border-border hover:border-primary/35"
			}`}
		>
			{/* 頂部橫幅：這張圖代表「去過這個地點的紀錄照片」，而非地點的身份 icon，
			    所以改用整張卡片頂部橫幅呈現（比照 ReviewGrid 票根卡片手法），
			    不再用圓形頭像位置暗示成 avatar */}
			<div className="relative h-20 w-full shrink-0">
				{item.cover_image_url ? (
					<CoverImage
						src={item.cover_image_url}
						alt={item.place_name}
						width={380}
						height={80}
						className="absolute inset-0 h-full w-full object-cover"
					/>
				) : (
					<div
						className={`absolute inset-0 flex items-center justify-center bg-linear-to-br ${typeConfig.gradientClassName}`}
					>
						<TypeIcon className="h-6 w-6 text-white/80" strokeWidth={1.75} />
					</div>
				)}
				<div className="absolute top-1.5 right-1.5 flex items-center gap-1">
					<a
						href={`https://www.google.com/maps/dir/?api=1&destination=${item.place_lat},${item.place_lng}`}
						target="_blank"
						rel="noopener noreferrer"
						onClick={(e) => e.stopPropagation()}
						aria-label="在 Google Maps 開路線"
						title="在 Google Maps 開路線"
						className="flex h-6.5 w-6.5 shrink-0 cursor-pointer items-center justify-center rounded-full bg-card/85 text-muted-foreground backdrop-blur-sm transition-colors hover:text-primary"
					>
						<Navigation className="h-3.5 w-3.5" strokeWidth={2} />
					</a>
					{canEdit && (
						<>
							<button
								type="button"
								aria-label="編輯地點"
								title="編輯地點"
								onClick={(e) => {
									e.stopPropagation();
									onEdit();
								}}
								className="flex h-6.5 w-6.5 shrink-0 cursor-pointer items-center justify-center rounded-full bg-card/85 text-muted-foreground backdrop-blur-sm transition-colors hover:text-primary"
							>
								<Pencil className="h-3.5 w-3.5" strokeWidth={2} />
							</button>
							<button
								type="button"
								aria-label="刪除地點"
								title="刪除地點"
								onClick={(e) => {
									e.stopPropagation();
									dialogRef.current?.open();
								}}
								className="flex h-6.5 w-6.5 shrink-0 cursor-pointer items-center justify-center rounded-full bg-card/85 text-muted-foreground backdrop-blur-sm transition-colors hover:text-destructive"
							>
								<Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
							</button>
							<ConfirmDialog
								ref={dialogRef}
								title="確定刪除這個地點？"
								description="此動作無法復原。"
								busy={busy}
								onConfirm={handleConfirm}
							/>
						</>
					)}
				</div>
			</div>

			<div className="p-3">
				<span className={`block text-xs font-bold tracking-wider uppercase ${typeConfig.textClassName}`}>
					{typeConfig.label}
				</span>
				<span className="mt-0.5 line-clamp-1 block text-base leading-snug font-semibold text-foreground">
					{item.place_name}
				</span>
				{item.description && (
					<p title={item.description} className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
						{item.description}
					</p>
				)}
			</div>
		</div>
	);
}
