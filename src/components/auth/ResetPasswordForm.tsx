"use client";

import { useEffect, useState, useTransition } from "react";
import type { FormEvent, ReactElement } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { resetPassword, finishPasswordReset } from "@/lib/actions/auth";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { Field, inputClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const REDIRECT_DELAY_MS = 3000;

export function ResetPasswordForm(): ReactElement {
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [passwordError, setPasswordError] = useState<string | undefined>();
	const [confirmError, setConfirmError] = useState<string | undefined>();
	const [succeeded, setSucceeded] = useState(false);
	const [isPending, startTransition] = useTransition();

	// 更新成功後停留幾秒讓使用者看到「已完成」的訊息，才呼叫 finishPasswordReset()
	// 把 session 登出並導回首頁。刻意不在密碼更新的當下就登出：Server Action 執行完
	// 會讓目前頁面的 Server Component 自動重新渲染一次，若這時候已經沒有 session，
	// 頁面自己的守門邏輯會搶先把使用者導去登入頁、蓋掉這則成功訊息（實測踩過這個坑：
	// 密碼其實已經改成功，畫面卻顯示「連結失效」）。把登出+導頁合併在同一個 action，
	// Next.js 才會當成「離開這一頁」處理，不會被半路攔截
	useEffect(() => {
		if (!succeeded) {
			return;
		}
		const timer = setTimeout(() => {
			startTransition(() => {
				void finishPasswordReset();
			});
		}, REDIRECT_DELAY_MS);
		return () => clearTimeout(timer);
	}, [succeeded]);

	const handleSubmit = (e: FormEvent): void => {
		e.preventDefault();

		const parsed = resetPasswordSchema.safeParse({ password });
		if (!parsed.success) {
			setPasswordError(parsed.error.issues[0]?.message);
			return;
		}
		setPasswordError(undefined);

		if (password !== confirmPassword) {
			setConfirmError("兩次輸入的密碼不一致");
			return;
		}
		setConfirmError(undefined);

		startTransition(async () => {
			const result = await resetPassword({ password: parsed.data.password });
			if ("error" in result) {
				toast.error(result.error);
				return;
			}
			setSucceeded(true);
		});
	};

	if (succeeded) {
		return (
			<div className="flex flex-col items-center gap-2 py-4 text-center">
				<CheckCircle2 className="h-10 w-10 text-green-600" />
				<p className="font-medium text-foreground">密碼已更新成功</p>
				<p className="text-sm text-muted-foreground">即將為你導回首頁，請用新密碼重新登入</p>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">
			<fieldset disabled={isPending} className="flex flex-col gap-4">
				<Field label="新密碼" error={passwordError}>
					{(fieldProps) => (
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className={inputClass}
							{...fieldProps}
						/>
					)}
				</Field>
				<Field label="確認新密碼" error={confirmError}>
					{(fieldProps) => (
						<input
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							className={inputClass}
							{...fieldProps}
						/>
					)}
				</Field>
				<Button type="submit" disabled={isPending} className="w-full">
					{isPending ? "更新中…" : "更新密碼"}
				</Button>
			</fieldset>
		</form>
	);
}
