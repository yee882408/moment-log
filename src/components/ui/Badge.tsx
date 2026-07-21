import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type { ReactElement, ReactNode } from "react";

const badgeVariants = cva(
	"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
	{
		variants: {
			variant: {
				public: "bg-emerald-50 text-emerald-700 border-emerald-200",
				rating: "bg-amber-50 text-amber-700 border-amber-200",
				admin: "bg-violet-50 text-violet-700 border-violet-200",
				neutral: "bg-background text-muted-foreground border-border",
			},
		},
	},
);

interface BadgeProps extends VariantProps<typeof badgeVariants> {
	variant: NonNullable<VariantProps<typeof badgeVariants>["variant"]>;
	children: ReactNode;
}

export function Badge({ variant, children }: BadgeProps): ReactElement {
	return (
		<span data-slot="badge" className={badgeVariants({ variant })}>
			{children}
		</span>
	);
}

interface StarRatingProps {
	value: number;
}

// 評分星星（1-5），實心 amber / 空心 slate
export function StarRating({ value }: StarRatingProps): ReactElement {
	return (
		<span className="inline-flex text-sm" aria-label={`評分 ${value} 分`}>
			{Array.from({ length: 5 }, (_, i) => (
				<span
					key={i}
					className={i < value ? "text-warning" : "text-slate-300"}
				>
					★
				</span>
			))}
		</span>
	);
}
