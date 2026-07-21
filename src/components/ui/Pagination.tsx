import type { ReactElement } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	// 給定頁碼，回傳該頁的網址（呼叫端決定要帶哪些既有的查詢參數，如 artist/year 篩選）
	buildHref: (page: number) => string;
}

// 純展示用的頁碼式分頁列，靠 <Link> 換頁（不需要 client state）
export function Pagination({
	currentPage,
	totalPages,
	buildHref,
}: PaginationProps): ReactElement | null {
	if (totalPages <= 1) {
		return null;
	}

	return (
		<nav data-slot="pagination" className="flex items-center justify-center gap-2" aria-label="分頁">
			{currentPage > 1 ? (
				<Button asChild variant="secondary">
					<Link href={buildHref(currentPage - 1)}>← 上一頁</Link>
				</Button>
			) : (
				<Button asChild variant="secondary" className="pointer-events-none opacity-50">
					<span aria-disabled="true">← 上一頁</span>
				</Button>
			)}
			<span className="text-sm text-muted-foreground">
				第 {currentPage} / {totalPages} 頁
			</span>
			{currentPage < totalPages ? (
				<Button asChild variant="secondary">
					<Link href={buildHref(currentPage + 1)}>下一頁 →</Link>
				</Button>
			) : (
				<Button asChild variant="secondary" className="pointer-events-none opacity-50">
					<span aria-disabled="true">下一頁 →</span>
				</Button>
			)}
		</nav>
	);
}
