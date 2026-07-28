import type { ReactElement } from "react";
import Link from "next/link";
import { buildPageItems } from "@/lib/pagination";
import { cn } from "@/lib/utils";

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	// 給定頁碼，回傳該頁的網址（呼叫端決定要帶哪些既有的查詢參數，如 artist/year 篩選）
	buildHref: (page: number) => string;
}

// 純展示用的數字頁碼列，靠 <Link> 換頁（不需要 client state），
// 視覺跟 PaginationControls（client state 換頁）共用同一套數字頁碼列排版
export function Pagination({ currentPage, totalPages, buildHref }: PaginationProps): ReactElement | null {
	if (totalPages <= 1) {
		return null;
	}

	const items = buildPageItems(currentPage, totalPages);

	return (
		<nav data-slot="pagination" className="flex items-center justify-center gap-1" aria-label="分頁">
			{currentPage > 1 ? (
				<Link
					href={buildHref(currentPage - 1)}
					aria-label="上一頁"
					className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
				>
					←
				</Link>
			) : (
				<span
					aria-disabled="true"
					className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-muted-foreground opacity-40"
				>
					←
				</span>
			)}

			{items.map((item, i) =>
				typeof item === "number" ? (
					<Link
						key={item}
						href={buildHref(item)}
						aria-label={`第 ${item} 頁`}
						aria-current={item === currentPage ? "page" : undefined}
						className={cn(
							"flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm transition-colors",
							item === currentPage
								? "bg-primary font-medium text-primary-foreground"
								: "text-foreground hover:bg-background",
						)}
					>
						{item}
					</Link>
				) : (
					<span key={`${item}-${i}`} className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground">
						…
					</span>
				),
			)}

			{currentPage < totalPages ? (
				<Link
					href={buildHref(currentPage + 1)}
					aria-label="下一頁"
					className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
				>
					→
				</Link>
			) : (
				<span
					aria-disabled="true"
					className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-muted-foreground opacity-40"
				>
					→
				</span>
			)}
		</nav>
	);
}
