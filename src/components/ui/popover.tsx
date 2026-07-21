"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import type { ComponentProps, ReactElement } from "react";
import { cn } from "@/lib/utils";

function Popover(props: ComponentProps<typeof PopoverPrimitive.Root>): ReactElement {
	return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger(props: ComponentProps<typeof PopoverPrimitive.Trigger>): ReactElement {
	return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
	className,
	align = "start",
	sideOffset = 4,
	...props
}: ComponentProps<typeof PopoverPrimitive.Content>): ReactElement {
	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Content
				data-slot="popover-content"
				align={align}
				sideOffset={sideOffset}
				className={cn(
					// z-index 需高於 SpotItemsPanel 浮動側欄的 z-1000，否則會被側欄蓋住
					"z-1100 w-72 rounded-xl border border-border bg-card p-3 text-foreground shadow-lg outline-none",
					"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
					className,
				)}
				{...props}
			/>
		</PopoverPrimitive.Portal>
	);
}

export { Popover, PopoverTrigger, PopoverContent };
