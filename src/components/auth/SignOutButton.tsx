"use client";

import type { ReactElement } from "react";
import { useSignOut } from "@/lib/hooks/useSignOut";
import { Button } from "@/components/ui/Button";

interface SignOutButtonProps {
	className?: string;
}

export function SignOutButton({ className }: SignOutButtonProps): ReactElement {
	const signOut = useSignOut();

	return (
		<Button type="button" variant="secondary" onClick={() => signOut()} className={className}>
			登出
		</Button>
	);
}
