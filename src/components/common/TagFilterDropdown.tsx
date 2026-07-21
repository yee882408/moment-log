"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import { useTagSearch } from "@/lib/hooks/useTagSearch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/Spinner";
import type { TagOption } from "@/lib/data/tags";

interface TagFilterDropdownProps {
	selected: TagOption[]; // 目前已套用的篩選標籤（維持 id+name 才能顯示觸發按鈕文字，不用另外查名稱）
	onApply: (tags: TagOption[]) => void;
}

// 搜尋頁的標籤篩選：下拉開啟時預設顯示建議清單（使用者用過的+熱門標籤），
// 輸入文字後改搜尋全站既有標籤；只能勾選既有標籤，不支援建立新標籤
// （篩選一個從未被使用過的標籤沒有意義，結果必定是空的）
// 供 /concerts（RecordSearch）與 /reviews（ReviewSearch）共用
export function TagFilterDropdown({ selected, onApply }: TagFilterDropdownProps): ReactElement {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [draft, setDraft] = useState<TagOption[]>(selected);
	const { results, loading } = useTagSearch(query);

	const toggle = (tag: TagOption): void => {
		setDraft((prev) =>
			prev.some((t) => t.id === tag.id) ? prev.filter((t) => t.id !== tag.id) : [...prev, tag],
		);
	};

	const handleApply = (): void => {
		onApply(draft);
		setOpen(false);
	};

	return (
		<Popover
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (next) {
					// 每次開啟都以目前已套用的篩選為準，避免上次沒按「套用」就關閉的暫存選取殘留
					setDraft(selected);
					setQuery("");
				}
			}}
		>
			<PopoverTrigger asChild>
				<Button type="button" variant="secondary">
					標籤{selected.length > 0 ? `（${selected.length}）` : ""}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="flex flex-col gap-2">
				<input
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="搜尋標籤"
					className="w-full rounded-lg border border-border px-3 py-1.5 text-sm outline-none focus:border-primary"
				/>
				<div className="flex max-h-60 flex-col gap-1 overflow-y-auto">
					{loading ? (
						<div className="flex justify-center py-3">
							<Spinner />
						</div>
					) : results.length === 0 ? (
						<p className="px-1 py-2 text-xs text-muted-foreground">沒有符合的標籤</p>
					) : (
						results.map((tag) => (
							<label
								key={tag.id}
								className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-background"
							>
								<Checkbox
									checked={draft.some((t) => t.id === tag.id)}
									onCheckedChange={() => toggle(tag)}
								/>
								{tag.name}
							</label>
						))
					)}
				</div>
				<Button type="button" onClick={handleApply} className="w-full">
					套用
				</Button>
			</PopoverContent>
		</Popover>
	);
}
