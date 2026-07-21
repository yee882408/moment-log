import type { ReactElement, ReactNode } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";

interface MainLayoutProps {
	children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps): ReactElement {
	return (
		<>
			<SiteHeader />
			{children}
		</>
	);
}
