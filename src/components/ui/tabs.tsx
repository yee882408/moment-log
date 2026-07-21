"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { ComponentProps, ReactElement } from "react";
import { cn } from "@/lib/utils";

function Tabs({ className, ...props }: ComponentProps<typeof TabsPrimitive.Root>): ReactElement {
	return (
		<TabsPrimitive.Root
			data-slot="tabs"
			className={cn("flex flex-col gap-2", className)}
			{...props}
		/>
	);
}

function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>): ReactElement {
	return (
		<TabsPrimitive.List
			data-slot="tabs-list"
			className={cn(
				"inline-flex w-fit items-center justify-center rounded-lg bg-background p-1",
				className,
			)}
			{...props}
		/>
	);
}

function TabsTrigger({
	className,
	...props
}: ComponentProps<typeof TabsPrimitive.Trigger>): ReactElement {
	return (
		<TabsPrimitive.Trigger
			data-slot="tabs-trigger"
			className={cn(
				"inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors",
				"hover:text-foreground",
				"data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm",
				"disabled:pointer-events-none disabled:opacity-50",
				"focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none",
				className,
			)}
			{...props}
		/>
	);
}

function TabsContent({
	className,
	...props
}: ComponentProps<typeof TabsPrimitive.Content>): ReactElement {
	return <TabsPrimitive.Content data-slot="tabs-content" className={cn("flex-1", className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
