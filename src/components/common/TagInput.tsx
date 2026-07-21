"use client";

import { useState } from "react";
import type { KeyboardEvent, ReactElement } from "react";
import { X } from "lucide-react";
import { useTagSearch } from "@/lib/hooks/useTagSearch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 20;

interface TagInputProps {
	value: string[];
	onChange: (tags: string[]) => void;
	id?: string;
}

// 紀錄表單的標籤輸入：文字框 + chip 列表，Enter/逗號建立新 chip，打字時下拉建議既有標籤
// （建立新標籤 vs 挑選既有標籤在使用者體驗上不需要區分——輸入文字若跟建議項一致，
// 送出表單時 upsertTagsByName 自然會 reuse 既有 tag，不會重複建立）
export function TagInput({ value, onChange, id }: TagInputProps): ReactElement {
	const [draft, setDraft] = useState("");
	const [open, setOpen] = useState(false);
	const { results, loading } = useTagSearch(draft);

	const addTag = (raw: string): void => {
		const name = raw.trim();
		if (!name || name.length > MAX_TAG_LENGTH || value.length >= MAX_TAGS) {
			return;
		}
		if (value.includes(name)) {
			setDraft("");
			return;
		}
		onChange([...value, name]);
		setDraft("");
	};

	const removeTag = (name: string): void => {
		onChange(value.filter((t) => t !== name));
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			addTag(draft);
			return;
		}
		// 文字框已空時按 Backspace，方便快速刪掉最後一個 chip
		if (e.key === "Backspace" && draft === "" && value.length > 0) {
			removeTag(value[value.length - 1]);
		}
	};

	// 建議清單濾掉已經選過的標籤名稱
	const suggestions = results.filter((t) => !value.includes(t.name));

	return (
		<Popover open={open && (loading || suggestions.length > 0)} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<div
					className={cn(
						"flex w-full flex-wrap items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm",
						"focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
					)}
				>
					{value.map((tag) => (
						<span
							key={tag}
							className="flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-xs text-foreground"
						>
							{tag}
							<button
								type="button"
								onClick={() => removeTag(tag)}
								aria-label={`移除標籤 ${tag}`}
								className="cursor-pointer text-muted-foreground hover:text-destructive"
							>
								<X className="h-3 w-3" />
							</button>
						</span>
					))}
					{value.length < MAX_TAGS && (
						<input
							id={id}
							value={draft}
							onChange={(e) => {
								setDraft(e.target.value);
								setOpen(true);
							}}
							onFocus={() => setOpen(true)}
							onKeyDown={handleKeyDown}
							placeholder={value.length === 0 ? "輸入標籤，按 Enter 或逗號新增" : ""}
							className="min-w-24 flex-1 bg-transparent outline-none"
						/>
					)}
				</div>
			</PopoverTrigger>
			<PopoverContent
				className="w-(--radix-popover-trigger-width) p-1"
				onOpenAutoFocus={(e) => e.preventDefault()}
			>
				{loading ? (
					<div className="flex justify-center py-2">
						<Spinner />
					</div>
				) : (
					suggestions.map((tag) => (
						<button
							key={tag.id}
							type="button"
							onClick={() => addTag(tag.name)}
							className="flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-background"
						>
							{tag.name}
						</button>
					))
				)}
			</PopoverContent>
		</Popover>
	);
}
