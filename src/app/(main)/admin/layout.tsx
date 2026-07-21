import type { ReactElement, ReactNode } from "react";
import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/data/profile";

interface AdminLayoutProps {
	children: ReactNode;
}

// 整個 /admin 的閘門：非 admin 一律踢回首頁
// 真正的寫入限制在 RLS，這層只是 UX（避免非 admin 看到後台畫面）
// Header 已由外層 (main)/layout.tsx 提供，這裡只加 admin 專屬的強調色橫線
export default async function AdminLayout({ children }: AdminLayoutProps): Promise<ReactElement> {
	const admin = await isCurrentUserAdmin();
	if (!admin) {
		redirect("/");
	}
	return (
		<>
			<div className="h-1 w-full bg-accent" />
			{children}
		</>
	);
}
