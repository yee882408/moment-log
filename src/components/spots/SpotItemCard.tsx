"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import { Landmark, MapPin, Navigation, Pencil, Trash2, Utensils } from "lucide-react";
import { deleteSpotListItem } from "@/lib/actions/spots";
import type { SpotListItem } from "@/lib/data/spots";
import { SpotItemForm } from "@/components/spots/SpotItemForm";
import { Card } from "@/components/ui/Card";
import { CoverImage } from "@/components/ui/CoverImage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useConfirmDelete } from "@/lib/hooks/useConfirmDelete";

const placeTypeLabels: Record<string, string> = {
	restaurant: "餐廳",
	attraction: "景點",
	other: "其他",
};

const placeTypeIcons: Record<string, typeof MapPin> = {
	restaurant: Utensils,
	attraction: Landmark,
	other: MapPin,
};

interface SpotItemCardProps {
	item: SpotListItem;
	listId: string;
	canEdit: boolean;
	isFocused: boolean; // 目前是否為地圖上聚焦中的地點，用來在清單卡片標示選中狀態
	onDeleted: () => void;
	onSaved: (items: SpotListItem[]) => void;
	onPreviewChange: (point: { lat: number; lng: number; label: string } | null) => void;
	onFocus: () => void; // 點擊卡片時通知父層，讓地圖平移過去並開啟該地點的 popup
}

export function SpotItemCard({
	item,
	listId,
	canEdit,
	isFocused,
	onDeleted,
	onSaved,
	onPreviewChange,
	onFocus,
}: SpotItemCardProps): ReactElement {
	const [editing, setEditing] = useState(false);
	const { busy, dialogRef, handleConfirm } = useConfirmDelete(
		() => deleteSpotListItem(item.id, listId),
		{ onSuccess: onDeleted },
	);

	if (editing) {
		return (
			<Card>
				<SpotItemForm
					listId={listId}
					editItem={item}
					onSaved={(items) => {
						setEditing(false);
						onSaved(items);
					}}
					onCancel={() => {
						setEditing(false);
						onPreviewChange(null);
					}}
					onPreviewChange={onPreviewChange}
				/>
			</Card>
		);
	}

	return (
		<Card
			onClick={onFocus}
			className={`flex cursor-pointer items-center gap-3 transition-colors ${
				isFocused
					? "border-primary ring-2 ring-primary/30"
					: "hover:border-primary/40"
			}`}
		>
			{item.cover_image_url ? (
				<CoverImage
					src={item.cover_image_url}
					alt={item.place_name}
					width={64}
					height={64}
					className="h-16 w-16 shrink-0 rounded-lg object-cover"
				/>
			) : (
				<div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
					{(() => {
						const Icon = placeTypeIcons[item.place_type ?? "other"] ?? MapPin;
						return <Icon className="h-6 w-6 text-primary/40" strokeWidth={1.5} />;
					})()}
				</div>
			)}
			<div className="flex min-w-0 flex-1 flex-col">
				<span className="truncate font-medium text-foreground">{item.place_name}</span>
				{item.place_type && (
					<span className="text-xs text-muted-foreground">
						{placeTypeLabels[item.place_type] ?? item.place_type}
					</span>
				)}
				{item.description && (
					<p
						title={item.description}
						className="mt-1 line-clamp-2 min-h-0 text-sm text-muted-foreground"
					>
						{item.description}
					</p>
				)}
			</div>
			<div className="flex shrink-0 items-center gap-1.5">
				<a
					href={`https://www.google.com/maps/dir/?api=1&destination=${item.place_lat},${item.place_lng}`}
					target="_blank"
					rel="noopener noreferrer"
					onClick={(e) => e.stopPropagation()}
					aria-label="在 Google Maps 開路線"
					title="在 Google Maps 開路線"
					className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-md"
				>
					<Navigation className="h-4 w-4" strokeWidth={2} />
				</a>
				{canEdit && (
					<>
						<button
							type="button"
							aria-label="編輯地點"
							title="編輯地點"
							onClick={(e) => {
								e.stopPropagation();
								setEditing(true);
							}}
							className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-md"
						>
							<Pencil className="h-4 w-4" strokeWidth={2} />
						</button>
						<button
							type="button"
							aria-label="刪除地點"
							title="刪除地點"
							onClick={(e) => {
								e.stopPropagation();
								dialogRef.current?.open();
							}}
							className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-destructive/40 hover:text-destructive hover:shadow-md"
						>
							<Trash2 className="h-4 w-4" strokeWidth={2} />
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
		</Card>
	);
}
