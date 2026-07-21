"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import type { ComponentProps, ReactElement } from "react";
import { cn } from "@/lib/utils";

function Select(props: ComponentProps<typeof SelectPrimitive.Root>): ReactElement {
	return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectValue(props: ComponentProps<typeof SelectPrimitive.Value>): ReactElement {
	return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
	className,
	children,
	...props
}: ComponentProps<typeof SelectPrimitive.Trigger>): ReactElement {
	return (
		<SelectPrimitive.Trigger
			data-slot="select-trigger"
			className={cn(
				"flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm whitespace-nowrap outline-none transition-colors",
				"focus:border-primary focus:ring-2 focus:ring-primary/20",
				"disabled:cursor-not-allowed disabled:bg-background disabled:text-muted-foreground disabled:opacity-50",
				"data-[placeholder]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0",
				className,
			)}
			{...props}
		>
			{children}
			<SelectPrimitive.Icon asChild>
				<ChevronDownIcon className="h-4 w-4 opacity-50" />
			</SelectPrimitive.Icon>
		</SelectPrimitive.Trigger>
	);
}

function SelectContent({
	className,
	children,
	position = "popper",
	...props
}: ComponentProps<typeof SelectPrimitive.Content>): ReactElement {
	return (
		<SelectPrimitive.Portal>
			<SelectPrimitive.Content
				data-slot="select-content"
				className={cn(
					"relative z-1100 max-h-96 min-w-32 overflow-hidden rounded-lg border border-border bg-card text-foreground shadow-md",
					"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
					position === "popper" &&
						"data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
					className,
				)}
				position={position}
				{...props}
			>
				<SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-1">
					<ChevronUpIcon className="h-4 w-4" />
				</SelectPrimitive.ScrollUpButton>
				<SelectPrimitive.Viewport
					className={cn(
						"p-1",
						position === "popper" &&
							"h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1",
					)}
				>
					{children}
				</SelectPrimitive.Viewport>
				<SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1">
					<ChevronDownIcon className="h-4 w-4" />
				</SelectPrimitive.ScrollDownButton>
			</SelectPrimitive.Content>
		</SelectPrimitive.Portal>
	);
}

function SelectItem({
	className,
	children,
	...props
}: ComponentProps<typeof SelectPrimitive.Item>): ReactElement {
	return (
		<SelectPrimitive.Item
			data-slot="select-item"
			className={cn(
				"relative flex w-full cursor-pointer items-center gap-2 rounded-md py-1.5 pr-8 pl-2 text-sm outline-none select-none",
				"focus:bg-background focus:text-foreground",
				"data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
				className,
			)}
			{...props}
		>
			<span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
				<SelectPrimitive.ItemIndicator>
					<CheckIcon className="h-4 w-4" />
				</SelectPrimitive.ItemIndicator>
			</span>
			<SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
		</SelectPrimitive.Item>
	);
}

export { Select, SelectValue, SelectTrigger, SelectContent, SelectItem };
