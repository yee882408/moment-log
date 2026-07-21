"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";
import type { ComponentProps, ReactElement } from "react";
import { cn } from "@/lib/utils";

function Checkbox({
	className,
	...props
}: ComponentProps<typeof CheckboxPrimitive.Root>): ReactElement {
	return (
		<CheckboxPrimitive.Root
			data-slot="checkbox"
			className={cn(
				"peer size-4 shrink-0 cursor-pointer rounded-[4px] border border-border bg-card outline-none transition-shadow",
				"focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
				"data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
				"disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		>
			<CheckboxPrimitive.Indicator
				data-slot="checkbox-indicator"
				className="flex items-center justify-center text-current"
			>
				<CheckIcon className="size-3.5" />
			</CheckboxPrimitive.Indicator>
		</CheckboxPrimitive.Root>
	);
}

export { Checkbox };
