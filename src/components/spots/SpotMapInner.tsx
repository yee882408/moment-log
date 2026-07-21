"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { Check, Copy, Layers, X } from "lucide-react";
import type { ReactElement } from "react";

// Leaflet 預設 marker icon 走相對路徑找圖片，經過 bundler 打包後路徑會失效，
// 這裡改用 CDN 上跟套件版本一致的圖檔位址，是 react-leaflet 官方文件建議的修法
function buildIcon(color: string): L.Icon {
	return L.icon({
		iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
		shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
		iconSize: [25, 41],
		iconAnchor: [12, 41],
		popupAnchor: [1, -34],
		shadowSize: [41, 41],
	});
}

// marker 顏色依地點類型區分（比照 SpotItemCard.tsx 的 placeTypeIcons/placeTypeLabels 分類）
const restaurantIcon = buildIcon("orange");
const attractionIcon = buildIcon("violet");
const otherIcon = buildIcon("blue");

const placeTypeIcons: Record<string, L.Icon> = {
	restaurant: restaurantIcon,
	attraction: attractionIcon,
	other: otherIcon,
};

const placeTypeLabels: Record<string, string> = {
	restaurant: "餐廳",
	attraction: "景點",
	other: "其他",
};

// 綠色 marker：搜尋後尚未送出的暫定新增點，跟既有地點的顏色都不同，維持獨立語意
const previewIcon = buildIcon("green");

const legendItems: { type: string; color: string; label: string }[] = [
	{ type: "restaurant", color: "#f97316", label: "餐廳" },
	{ type: "attraction", color: "#8b5cf6", label: "景點" },
	{ type: "other", color: "#3b82f6", label: "其他" },
];

export interface SpotMapPoint {
	id: string;
	artist: string;
	placeName: string;
	placeType: string | null;
	description: string | null;
	lat: number;
	lng: number;
}

interface SpotMapInnerProps {
	points: SpotMapPoint[];
	// 表單搜尋後、尚未送出的暫定選點；有值時地圖會平移過去讓使用者立刻看到
	previewPoint?: { lat: number; lng: number; label: string } | null;
	// 使用者點擊地點卡片時要聚焦的既有 point id；地圖會平移過去並開啟該 marker 的 popup
	focusedPointId?: string | null;
	// 外層容器高度，預設維持單欄版面的 h-96；側欄版面會傳 h-full 撐滿父層
	heightClassName?: string;
}

const DEFAULT_CENTER: [number, number] = [25.033, 121.5654]; // 台北市中心，無資料時的預設視角

// 暫定選點變動時，把地圖視角移過去（搜尋一個離目前畫面很遠的地點時，
// 使用者才不用自己拖地圖找 pin）
function FlyToPreview({ previewPoint }: { previewPoint: SpotMapInnerProps["previewPoint"] }) {
	const map = useMap();
	useEffect(() => {
		if (previewPoint) {
			map.flyTo([previewPoint.lat, previewPoint.lng], map.getZoom());
		}
	}, [previewPoint, map]);
	return null;
}

// 複製座標到剪貼簿，讓使用者可以貼到其他地圖服務或傳給朋友，不用手動選取文字
function CopyCoordsButton({ lat, lng }: { lat: number; lng: number }): ReactElement {
	const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

	const handleCopy = (): void => {
		navigator.clipboard.writeText(`${lat}, ${lng}`).then(
			() => {
				setStatus("copied");
				setTimeout(() => setStatus("idle"), 1500);
			},
			// 剪貼簿權限可能被瀏覽器拒絕（例如分頁失焦、瀏覽器設定限制），
			// 這裡明確回報失敗，避免使用者以為複製成功了但其實剪貼簿是空的
			() => {
				setStatus("failed");
				setTimeout(() => setStatus("idle"), 1500);
			},
		);
	};

	return (
		<button
			type="button"
			onClick={handleCopy}
			title={`複製座標（${lat.toFixed(5)}, ${lng.toFixed(5)}）`}
			className={`mt-1 flex cursor-pointer items-center gap-1 text-xs hover:underline ${
				status === "failed" ? "text-red-600" : "text-primary"
			}`}
		>
			{status === "copied" && (
				<>
					<Check className="h-3 w-3" />
					已複製
				</>
			)}
			{status === "failed" && (
				<>
					<Copy className="h-3 w-3" />
					複製失敗
				</>
			)}
			{status === "idle" && (
				<>
					<Copy className="h-3 w-3" />
					複製座標
				</>
			)}
		</button>
	);
}

export function SpotMapInner({
	points,
	previewPoint,
	focusedPointId,
	heightClassName = "h-96",
}: SpotMapInnerProps): ReactElement {
	const center: [number, number] =
		points.length > 0 ? [points[0].lat, points[0].lng] : DEFAULT_CENTER;
	// key = point id，供點擊地點卡片時取出對應 marker 呼叫 openPopup()
	const markerRefs = useRef<Map<string, L.Marker>>(new Map());
	const map = useRef<L.Map | null>(null);
	const [legendOpen, setLegendOpen] = useState(true);

	useEffect(() => {
		if (!focusedPointId) {
			return;
		}
		const point = points.find((p) => p.id === focusedPointId);
		const marker = markerRefs.current.get(focusedPointId);
		if (point && marker && map.current) {
			map.current.flyTo([point.lat, point.lng], map.current.getZoom());
			marker.openPopup();
		}
	}, [focusedPointId, points]);

	return (
		<div className={`relative w-full ${heightClassName}`}>
			<MapContainer
				ref={map}
				center={center}
				zoom={12}
				scrollWheelZoom
				className="h-full w-full rounded-xl"
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
				{points.map((p) => (
					<Marker
						key={p.id}
						position={[p.lat, p.lng]}
						icon={placeTypeIcons[p.placeType ?? "other"] ?? otherIcon}
						ref={(marker) => {
							if (marker) {
								markerRefs.current.set(p.id, marker);
							} else {
								markerRefs.current.delete(p.id);
							}
						}}
					>
						{/* minWidth 讓說明文字有空間換行，不然長一點的說明會被 Leaflet 預設寬度硬擠成一長串 */}
						<Popup minWidth={200}>
							<span className="font-medium">{p.placeName}</span>
							<br />
							{placeTypeLabels[p.placeType ?? "other"] ?? "其他"} · {p.artist}
							{p.description && (
								// select-text：Leaflet popup 內文字預設可選取，這裡明確加上避免被
								// 其他全域樣式意外設成 user-select: none，確保使用者能選取複製說明
								<p className="mt-1 max-h-24 overflow-y-auto text-xs whitespace-pre-wrap text-muted-foreground select-text">
									{p.description}
								</p>
							)}
							<CopyCoordsButton lat={p.lat} lng={p.lng} />
						</Popup>
					</Marker>
				))}
				{previewPoint && (
					<Marker
						position={[previewPoint.lat, previewPoint.lng]}
						icon={previewIcon}
					>
						<Popup>
							<span className="font-medium">{previewPoint.label}</span>
							<br />
							尚未送出
						</Popup>
					</Marker>
				)}
				<FlyToPreview previewPoint={previewPoint} />
			</MapContainer>
			{legendOpen ? (
				<div className="absolute top-2 right-2 z-1000 flex flex-col gap-1 rounded-lg bg-white/90 px-2.5 py-2 text-xs text-foreground shadow-sm backdrop-blur-sm">
					<button
						type="button"
						onClick={() => setLegendOpen(false)}
						aria-label="收合圖例"
						title="收合圖例"
						className="mb-1 flex cursor-pointer items-center justify-end text-muted-foreground hover:text-foreground"
					>
						<X className="h-3.5 w-3.5" />
					</button>
					{legendItems.map((item) => (
						<div key={item.type} className="flex items-center gap-1.5">
							<span
								className="h-2.5 w-2.5 shrink-0 rounded-full"
								style={{ backgroundColor: item.color }}
							/>
							{item.label}
						</div>
					))}
				</div>
			) : (
				<button
					type="button"
					onClick={() => setLegendOpen(true)}
					aria-label="展開圖例"
					title="展開圖例"
					className="absolute top-2 right-2 z-1000 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border bg-white/90 text-foreground shadow-sm backdrop-blur-sm hover:bg-background"
				>
					<Layers className="h-4 w-4" />
				</button>
			)}
		</div>
	);
}
