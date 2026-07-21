import type { ReactElement } from "react";
import { Button } from "@/components/ui/Button";

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

	return (
		<nav data-slot="pagination-controls" className="flex items-center justify-center gap-2" aria-label="分頁">
			<Button
				type="button"
				variant="secondary"
				disabled={disabled || page <= 1}
				onClick={() => onChange(page - 1)}
			>
				← 上一頁
			</Button>
			<span className="text-sm text-muted-foreground">
				第 {page} / {totalPages} 頁
			</span>
			<Button
				type="button"
				variant="secondary"
				disabled={disabled || page >= totalPages}
				onClick={() => onChange(page + 1)}
			>
				下一頁 →
			</Button>
		</nav>
	);
}
