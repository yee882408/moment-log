import type { ReactElement } from "react";
import { buildPageItems } from "@/lib/pagination";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
	page: number;
	totalPages: number;
	onChange: (page: number) => void;
	// 額外的 disabled 條件（如查詢進行中的 isPending），跟頭尾頁判斷疊加
	disabled?: boolean;
}

// client state 驅動的分頁列（onChange 直接觸發查詢），跟 URL/Link 驅動的
// ui/Pagination.tsx 是分開的兩種元件，用於 RecordSearch/SpotBrowser/ReviewSearch/
// CommentSection 這類「換頁時不整頁刷新，而是重新呼叫 Server Action」的場景
export function PaginationControls({
	page,
	totalPages,
	onChange,
	disabled = false,
}: PaginationControlsProps): ReactElement | null {
	if (totalPages <= 1) {
		return null;
	}

	const items = buildPageItems(page, totalPages);

	return (
		<nav data-slot="pagination-controls" className="flex items-center justify-center gap-1" aria-label="分頁">
			<button
				type="button"
				disabled={disabled || page <= 1}
				onClick={() => onChange(page - 1)}
				aria-label="上一頁"
				className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
			>
				←
			</button>

			{items.map((item, i) =>
				typeof item === "number" ? (
					<button
						key={item}
						type="button"
						disabled={disabled}
						onClick={() => onChange(item)}
						aria-label={`第 ${item} 頁`}
						aria-current={item === page ? "page" : undefined}
						className={cn(
							"flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-lg px-2 text-sm transition-colors disabled:cursor-not-allowed",
							item === page
								? "bg-primary font-medium text-primary-foreground"
								: "text-foreground hover:bg-background",
						)}
					>
						{item}
					</button>
				) : (
					<span key={`${item}-${i}`} className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground">
						…
					</span>
				),
			)}

			<button
				type="button"
				disabled={disabled || page >= totalPages}
				onClick={() => onChange(page + 1)}
				aria-label="下一頁"
				className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
			>
				→
			</button>
		</nav>
	);
}
