"use client";

import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";
import { fetchSpotListItems } from "@/lib/actions/spots";
import type { SpotListItem } from "@/lib/data/spots";
import { SpotMap, type SpotMapPoint } from "@/components/spots/SpotMap";
import { SpotItemCard } from "@/components/spots/SpotItemCard";
import { SpotItemForm } from "@/components/spots/SpotItemForm";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/Spinner";

interface SpotItemsPanelProps {
	listId: string;
	artist: string;
	initialItems: SpotListItem[];
	canEdit: boolean;
}

function toMapPoints(items: SpotListItem[], artist: string): SpotMapPoint[] {
	return items.map((i) => ({
		id: i.id,
		artist,
		placeName: i.place_name,
		placeType: i.place_type,
		description: i.description,
		lat: i.place_lat,
		lng: i.place_lng,
	}));
}

export function SpotItemsPanel({
	listId,
	artist,
	initialItems,
	canEdit,
}: SpotItemsPanelProps): ReactElement {
	const [items, setItems] = useState(initialItems);
	const [previewPoint, setPreviewPoint] = useState<{
		lat: number;
		lng: number;
		label: string;
	} | null>(null);
	const [focusedId, setFocusedId] = useState<string | null>(null);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [addModalOpen, setAddModalOpen] = useState(false);
	const [isRefetching, startTransition] = useTransition();

	const refetch = (): void => {
		startTransition(async () => {
			setItems(await fetchSpotListItems(listId));
		});
	};

	// 刪除後清空聚焦狀態：避免殘留的 focusedId 剛好命中清單裡另一個地點，
	// 讓地圖在刪除操作後意外 flyTo 過去（SpotMapInner 的 useEffect 依賴 points 變動）
	const handleDeleted = (): void => {
		setFocusedId(null);
		refetch();
	};

	const handleAdded = (newItems: SpotListItem[]): void => {
		setItems(newItems);
		setAddModalOpen(false);
	};

	const listContent = (
		<>
			{canEdit && (
				<Button type="button" className="w-full" onClick={() => setAddModalOpen(true)}>
					<Plus className="h-4 w-4" />
					新增地點
				</Button>
			)}

			{isRefetching ? (
				<div className="flex justify-center py-6">
					<Spinner />
				</div>
			) : (
				<>
					{items.length === 0 && (
						<p className="text-sm text-muted-foreground">這個清單還沒有任何地點。</p>
					)}
					<div className="flex flex-col gap-3">
						{items.map((item) => (
							<SpotItemCard
								key={item.id}
								item={item}
								listId={listId}
								canEdit={canEdit}
								isFocused={focusedId === item.id}
								onDeleted={handleDeleted}
								onSaved={setItems}
								onPreviewChange={setPreviewPoint}
								onFocus={() => setFocusedId(item.id)}
							/>
						))}
					</div>
				</>
			)}
		</>
	);

	const addModal = canEdit && (
		<Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
			<DialogContent>
				<DialogTitle>新增地點</DialogTitle>
				<div className="mt-4">
					<SpotItemForm
						listId={listId}
						onSaved={handleAdded}
						onCancel={() => setAddModalOpen(false)}
						onPreviewChange={setPreviewPoint}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);

	return (
		<>
			{/* 手機版：地圖固定高度在上、清單卡片在下，靠頁面捲動；桌面版改用下方的側欄版面 */}
			<div className="flex flex-col gap-6 md:hidden">
				<SpotMap
					points={toMapPoints(items, artist)}
					previewPoint={previewPoint}
					focusedPointId={focusedId}
				/>
				{listContent}
			</div>

			{/* 桌面版：地圖撐滿可視高度，地點清單做成疊在地圖左側的浮動側欄，可獨立捲動、可收合 */}
			<div className="relative hidden h-[calc(100vh-14rem)] min-h-120 w-full overflow-hidden rounded-xl border border-border md:block">
				<SpotMap
					points={toMapPoints(items, artist)}
					previewPoint={previewPoint}
					focusedPointId={focusedId}
					heightClassName="h-full"
				/>
				<button
					type="button"
					onClick={() => setSidebarOpen((v) => !v)}
					aria-label={sidebarOpen ? "收合地點清單" : "展開地點清單"}
					title={sidebarOpen ? "收合地點清單" : "展開地點清單"}
					// left 依側欄開關狀態切換：展開時貼齊側欄右緣，收合時退到地圖左上角
					// （避開 Leaflet 內建縮放控制 .leaflet-control-zoom 固定佔用的左上角區域）
					className={`absolute top-4 z-1100 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-foreground shadow-md transition-all hover:bg-background ${
						sidebarOpen ? "left-90" : "left-16"
					}`}
				>
					{sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
				</button>
				<div
					className={`absolute inset-y-0 left-0 z-1000 flex w-96 flex-col gap-6 overflow-y-auto border-r border-border bg-white/95 p-4 pt-16 shadow-lg backdrop-blur-sm transition-transform ${
						sidebarOpen ? "translate-x-0" : "-translate-x-full"
					}`}
				>
					{listContent}
				</div>
			</div>

			{addModal}
		</>
	);
}
