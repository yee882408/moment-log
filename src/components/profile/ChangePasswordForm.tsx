"use client";

import { useState, useTransition } from "react";
import type { FormEvent, ReactElement } from "react";
import { toast } from "sonner";
import { changePassword } from "@/lib/actions/auth";
import { changePasswordSchema } from "@/lib/validation/auth";
import { Field, inputClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function ChangePasswordForm(): ReactElement {
	const [oldPassword, setOldPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [oldPasswordError, setOldPasswordError] = useState<string | undefined>();
	const [newPasswordError, setNewPasswordError] = useState<string | undefined>();
	const [confirmError, setConfirmError] = useState<string | undefined>();
	const [isPending, startTransition] = useTransition();

	const handleSubmit = (e: FormEvent): void => {
		e.preventDefault();
		setOldPasswordError(undefined);
		setNewPasswordError(undefined);
		setConfirmError(undefined);

		const parsed = changePasswordSchema.safeParse({ oldPassword, newPassword });
		if (!parsed.success) {
			for (const issue of parsed.error.issues) {
				if (issue.path[0] === "oldPassword") {
					setOldPasswordError(issue.message);
				} else if (issue.path[0] === "newPassword") {
					setNewPasswordError(issue.message);
				}
			}
			return;
		}
		if (newPassword !== confirmPassword) {
			setConfirmError("兩次輸入的新密碼不一致");
			return;
		}

		startTransition(async () => {
			const result = await changePassword(parsed.data);
			if ("error" in result) {
				toast.error(result.error);
				return;
			}
			toast.success("密碼已更新");
			setOldPassword("");
			setNewPassword("");
			setConfirmPassword("");
		});
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">
			<fieldset disabled={isPending} className="flex flex-col gap-4">
				<Field label="目前密碼" error={oldPasswordError}>
					{(fieldProps) => (
						<input
							type="password"
							value={oldPassword}
							onChange={(e) => setOldPassword(e.target.value)}
							className={inputClass}
							{...fieldProps}
						/>
					)}
				</Field>
				<Field label="新密碼" error={newPasswordError}>
					{(fieldProps) => (
						<input
							type="password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
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
				<Button type="submit" disabled={isPending} className="self-start">
					{isPending ? "更新中…" : "更新密碼"}
				</Button>
			</fieldset>
		</form>
	);
}
