import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactElement } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
	{
		variants: {
			variant: {
				primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
				secondary: "border border-border bg-card text-foreground hover:bg-background",
				danger: "border border-red-200 bg-card text-destructive hover:bg-red-50",
				ghost: "text-muted-foreground hover:text-foreground",
			},
		},
		defaultVariants: {
			variant: "primary",
		},
	},
);

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	// true 時用 Radix Slot 把樣式套到唯一的子元素上（例如 <Link>），而不是渲染 <button>
	asChild?: boolean;
}

export function Button({
	variant = "primary",
	className = "",
	disabled,
	asChild = false,
	...props
}: ButtonProps): ReactElement {
	const Comp = asChild ? Slot : "button";
	return (
		<Comp
			data-slot="button"
			disabled={asChild ? undefined : disabled}
			className={cn(buttonVariants({ variant }), className)}
			{...props}
		/>
	);
}
