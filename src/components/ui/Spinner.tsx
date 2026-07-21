import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
	className?: string;
}

// 純 CSS 旋轉圓環，搭配文字使用（如「儲存中…」），比純文字更明顯傳達處理中狀態
export function Spinner({ className }: SpinnerProps): ReactElement {
	return (
		<span
			data-slot="spinner"
			role="status"
			aria-label="處理中"
			className={cn(
				"inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent",
				className,
			)}
		/>
	);
}
