import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Card } from "@/components/ui/Card";

export default async function ResetPasswordPage(): Promise<ReactElement> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	// 沒有 user 代表不是從 /auth/callback 換到合法 session 進來的
	// （例如直接打這個網址、或重設連結已經過期/被使用過），導回登入頁重新申請
	if (!user) {
		redirect("/login?error=reset-link-invalid");
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-linear-to-b from-indigo-50 to-white p-4">
			<div className="flex w-full max-w-sm flex-col items-center gap-6">
				<span className="text-lg font-semibold text-foreground">🎤 moment-log</span>
				<Card className="w-full">
					<h1 className="mb-4 text-lg font-semibold text-foreground">設定新密碼</h1>
					<ResetPasswordForm />
				</Card>
			</div>
		</main>
	);
}
