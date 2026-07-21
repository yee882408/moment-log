import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthForm } from "@/components/auth/AuthForm";

interface PageProps {
	searchParams: Promise<{ error?: string; message?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps): Promise<ReactElement> {
	const { error, message } = await searchParams;
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	// 已登入就不需要再看登入頁
	if (user) {
		redirect("/");
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-linear-to-b from-indigo-50 to-white p-4">
			<div className="flex flex-col items-center gap-6">
				<span className="text-lg font-semibold text-foreground">
					🎤 moment-log
				</span>
				{error === "banned" && (
					<p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
						帳號已被停用
					</p>
				)}
				{error === "reset-link-invalid" && (
					<p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
						重設密碼連結無效或已過期，請重新申請
					</p>
				)}
				{message === "password-reset" && (
					<p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
						密碼已重設成功，請用新密碼登入
					</p>
				)}
				<AuthForm />
			</div>
		</main>
	);
}
