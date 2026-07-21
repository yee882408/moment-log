import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactElement } from "react";
import { cn } from "@/lib/utils";

const cardVariants = cva("rounded-2xl border border-border bg-card p-4 shadow-sm", {
	variants: {
		hover: {
			true: "transition-all hover:-translate-y-0.5 hover:shadow-md",
			false: "",
		},
	},
	defaultVariants: {
		hover: false,
	},
});

interface CardProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

export function Card({ children, className, hover, ...props }: CardProps): ReactElement {
	return (
		<div data-slot="card" className={cn(cardVariants({ hover }), className)} {...props}>
			{children}
		</div>
	);
}
