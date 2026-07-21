"use client";

import { useState } from "react";
import type { KeyboardEvent, ReactElement } from "react";
import { searchVenues } from "@/lib/actions/geocode";
import type { VenueResult } from "@/lib/types/venue";
import { inputClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface VenueSearchProps {
	// 選定一個結果後通知父表單（父表單負責 setValue 寫進自己的欄位）
	onPick: (label: string, lat: number, lng: number) => void;
}

export function VenueSearch({ onPick }: VenueSearchProps): ReactElement {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<VenueResult[]>([]);
	const [searching, setSearching] = useState(false);
	// 區分「還沒搜尋過」與「搜尋了但沒結果」，後者才顯示提示，避免使用者以為沒反應
	const [searched, setSearched] = useState(false);

	const handleSearch = async (): Promise<void> => {
		if (!query.trim()) {
			return;
		}
		setSearching(true);
		const found = await searchVenues(query);
		setResults(found);
		setSearched(true);
		setSearching(false);
	};

	const handlePick = (r: VenueResult): void => {
		// display_name 很長，取第一段當場館名
		onPick(r.label.split(",")[0].trim(), r.lat, r.lng);
		setResults([]);
		setSearched(false);
		setQuery("");
	};

	// 這個 input 通常被外層表單包住，Enter 預設會送出整份表單；
	// 攔截後改成觸發搜尋，才符合「Enter = 搜尋」的直覺，也避免其他欄位還沒填就誤送出
	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
		if (e.key === "Enter") {
			e.preventDefault();
			void handleSearch();
		}
	};

	return (
		<div className="flex flex-col gap-2 rounded-lg border border-border p-3">
			<span className="text-sm font-medium text-foreground">
				搜尋場館定位
			</span>
			<div className="flex gap-2">
				<input
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="例：台北小巨蛋"
					className={inputClass}
				/>
				<Button
					type="button"
					variant="secondary"
					onClick={handleSearch}
					disabled={searching}
					className="shrink-0"
				>
					{searching && <Spinner />}
					{searching ? "搜尋中…" : "搜尋"}
				</Button>
			</div>
			{results.length > 0 && (
				<ul className="flex flex-col gap-1">
					{results.map((r) => (
						<li key={`${r.lat},${r.lng}`}>
							<button
								type="button"
								onClick={() => handlePick(r)}
								className="w-full cursor-pointer rounded px-2 py-1 text-left text-xs text-foreground hover:bg-background"
							>
								{r.label}
							</button>
						</li>
					))}
				</ul>
			)}
			{searched && !searching && results.length === 0 && (
				<p className="text-xs text-muted-foreground">找不到符合的地點，換個關鍵字試試。</p>
			)}
		</div>
	);
}
