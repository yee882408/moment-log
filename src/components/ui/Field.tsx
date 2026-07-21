import { useId } from "react";
import type { ReactElement } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// 表單欄位共用樣式與外框，給各表單重用。維持字串常數（非元件）：呼叫端直接
// `<input className={inputClass}>`，跟 shadcn 官方的 Input 元件是分開的兩件事——
// 這個專案的表單沒有走 shadcn Form/FormField 那套 react-hook-form 整合模式，
// 硬套用會牽動所有表單元件內部寫法，這裡只對齊視覺規格（圓角、border、focus ring）
export const inputClass = cn(
	"w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none transition-colors",
	"focus:border-primary focus:ring-2 focus:ring-primary/20",
	"disabled:cursor-not-allowed disabled:bg-background disabled:text-muted-foreground",
);

// 傳給 children render prop 的欄位屬性：接上 input 後可讓螢幕閱讀器讀到錯誤訊息
export interface FieldInputProps {
	id: string;
	"aria-invalid": boolean;
	"aria-describedby": string | undefined;
}

interface FieldProps {
	label: string;
	error?: string;
	children: (fieldProps: FieldInputProps) => ReactElement;
}

export function Field({ label, error, children }: FieldProps): ReactElement {
	const inputId = useId();
	const errorId = error ? `${inputId}-error` : undefined;

	return (
		<div data-slot="field" className="flex flex-col gap-1">
			<Label htmlFor={inputId}>{label}</Label>
			{children({
				id: inputId,
				"aria-invalid": Boolean(error),
				"aria-describedby": errorId,
			})}
			{error && (
				<span id={errorId} className="text-xs text-destructive">
					{error}
				</span>
			)}
		</div>
	);
}
