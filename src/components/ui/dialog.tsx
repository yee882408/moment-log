"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import type { ComponentProps, ReactElement } from "react";
import { cn } from "@/lib/utils";

function Dialog(props: ComponentProps<typeof DialogPrimitive.Root>): ReactElement {
	return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogPortal(props: ComponentProps<typeof DialogPrimitive.Portal>): ReactElement {
	return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogOverlay({ className, onClick, ...props }: ComponentProps<typeof DialogPrimitive.Overlay>): ReactElement {
	return (
		<DialogPrimitive.Overlay
			data-slot="dialog-overlay"
			className={cn(
				// z-index 需高於 SpotItemsPanel 浮動側欄的 z-1000，否則 Dialog 會被側欄蓋住
				"fixed inset-0 z-1100 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
				className,
			)}
			onClick={(e) => {
				// React 合成事件沿 JSX 樹（非實際 DOM 樹）冒泡：Dialog 若巢狀在可點擊卡片內，
				// 即使內容被 Portal 傳送到 document.body，點擊仍會冒泡回卡片的 onClick，這裡擋下
				e.stopPropagation();
				onClick?.(e);
			}}
			{...props}
		/>
	);
}

function DialogContent({
	className,
	children,
	showCloseButton = true,
	...props
}: ComponentProps<typeof DialogPrimitive.Content> & { showCloseButton?: boolean }): ReactElement {
	return (
		<DialogPortal data-slot="dialog-portal">
			<DialogOverlay />
			<DialogPrimitive.Content
				data-slot="dialog-content"
				className={cn(
					// z-index 需高於 SpotItemsPanel 浮動側欄的 z-1000，否則 Dialog 會被側欄蓋住
					"fixed top-1/2 left-1/2 z-1100 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
					className,
				)}
				{...props}
			>
				{children}
				{showCloseButton && (
					<DialogPrimitive.Close className="absolute top-4 right-4 cursor-pointer rounded-lg text-muted-foreground transition-colors hover:text-foreground focus:outline-none disabled:pointer-events-none">
						<XIcon className="h-4 w-4" />
						<span className="sr-only">關閉</span>
					</DialogPrimitive.Close>
				)}
			</DialogPrimitive.Content>
		</DialogPortal>
	);
}

function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>): ReactElement {
	return (
		<DialogPrimitive.Title
			data-slot="dialog-title"
			className={cn("text-lg font-semibold text-foreground", className)}
			{...props}
		/>
	);
}

function DialogDescription({
	className,
	...props
}: ComponentProps<typeof DialogPrimitive.Description>): ReactElement {
	return (
		<DialogPrimitive.Description
			data-slot="dialog-description"
			className={cn("mt-2 text-sm text-muted-foreground", className)}
			{...props}
		/>
	);
}

export { Dialog, DialogContent, DialogTitle, DialogDescription };
