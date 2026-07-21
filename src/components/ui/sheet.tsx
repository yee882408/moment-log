"use client";

import * as SheetPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import type { ComponentProps, ReactElement } from "react";
import { cn } from "@/lib/utils";

function Sheet(props: ComponentProps<typeof SheetPrimitive.Root>): ReactElement {
	return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger(props: ComponentProps<typeof SheetPrimitive.Trigger>): ReactElement {
	return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose(props: ComponentProps<typeof SheetPrimitive.Close>): ReactElement {
	return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal(props: ComponentProps<typeof SheetPrimitive.Portal>): ReactElement {
	return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({
	className,
	...props
}: ComponentProps<typeof SheetPrimitive.Overlay>): ReactElement {
	return (
		<SheetPrimitive.Overlay
			data-slot="sheet-overlay"
			className={cn(
				"fixed inset-0 z-1100 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
				className,
			)}
			{...props}
		/>
	);
}

interface SheetContentProps extends ComponentProps<typeof SheetPrimitive.Content> {
	side?: "top" | "right" | "bottom" | "left";
}

// 跟 dialog.tsx 的做法一樣：z-index 需高於 SpotItemsPanel 浮動側欄的 z-1000，
// 否則從追星地圖詳情頁打開時會被側欄蓋住
function SheetContent({
	className,
	children,
	side = "right",
	...props
}: SheetContentProps): ReactElement {
	return (
		<SheetPortal>
			<SheetOverlay />
			<SheetPrimitive.Content
				data-slot="sheet-content"
				className={cn(
					"fixed z-1100 flex flex-col gap-4 bg-card p-6 shadow-lg transition ease-in-out",
					"data-[state=closed]:duration-300 data-[state=open]:duration-500",
					"data-[state=closed]:animate-out data-[state=open]:animate-in",
					side === "right" &&
						"inset-y-0 right-0 h-full w-3/4 border-l border-border data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
					side === "left" &&
						"inset-y-0 left-0 h-full w-3/4 border-r border-border data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
					side === "top" &&
						"inset-x-0 top-0 h-auto border-b border-border data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
					side === "bottom" &&
						"inset-x-0 bottom-0 h-auto border-t border-border data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
					className,
				)}
				{...props}
			>
				{children}
				<SheetPrimitive.Close className="absolute top-4 right-4 cursor-pointer rounded-lg text-muted-foreground transition-colors hover:text-foreground focus:outline-none disabled:pointer-events-none">
					<XIcon className="h-4 w-4" />
					<span className="sr-only">關閉</span>
				</SheetPrimitive.Close>
			</SheetPrimitive.Content>
		</SheetPortal>
	);
}

function SheetHeader({ className, ...props }: ComponentProps<"div">): ReactElement {
	return <div data-slot="sheet-header" className={cn("flex flex-col gap-1.5", className)} {...props} />;
}

function SheetTitle({
	className,
	...props
}: ComponentProps<typeof SheetPrimitive.Title>): ReactElement {
	return (
		<SheetPrimitive.Title
			data-slot="sheet-title"
			className={cn("text-lg font-semibold text-foreground", className)}
			{...props}
		/>
	);
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle };
