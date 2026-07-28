import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

// 表單分區的小標籤（全大寫、細線分隔上一組），取代單純用 <hr> 分隔欄位的做法，
// 讓表單內的邏輯段落有清楚層次，但仍維持單一卡片的整體感（不是多張獨立卡片）
// noTopBorder：分區是表單中第一個區塊時，不需要頂部分隔線
interface FormSectionProps {
	label: string;
	children: ReactNode;
	noTopBorder?: boolean;
}

export function FormSection({ label, children, noTopBorder }: FormSectionProps): ReactElement {
	return (
		<div className={cn("border-t border-border pt-5", noTopBorder && "border-t-0 pt-0")}>
			<span className="mb-4 block text-xs font-bold tracking-wider text-muted-foreground uppercase">
				{label}
			</span>
			<div className="flex flex-col gap-4">{children}</div>
		</div>
	);
}
