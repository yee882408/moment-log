"use client";

import { useState } from "react";
import type { FormEvent, ReactElement } from "react";
import Link from "next/link";
import { Turnstile } from "@marsidev/react-turnstile";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { login, register as registerAccount, requestPasswordReset } from "@/lib/actions/auth";
import {
	loginSchema,
	registerSchema,
	forgotPasswordSchema,
	type RegisterInput,
} from "@/lib/validation/auth";
import { Field, inputClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Mode = "login" | "register" | "forgot";

// login 模式的 resolver 只認得 email/password，displayName 在表單層級標成可選
// 讓兩種 schema 的 resolver 都能滿足同一個 useForm 型別
type AuthFormValues = Omit<RegisterInput, "displayName"> & {
	displayName?: string;
};

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function AuthForm(): ReactElement {
	const [mode, setMode] = useState<Mode>("login");
	const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
	const [turnstileLoaded, setTurnstileLoaded] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	// forgot 模式獨立管理：schema 只有 email 一個欄位，跟 login/register 共用
	// 同一個 useForm 反而要為了型別相容硬湊，不如分開較單純
	const [forgotEmail, setForgotEmail] = useState("");
	const [forgotEmailError, setForgotEmailError] = useState<string | undefined>();
	const [forgotSent, setForgotSent] = useState(false);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<AuthFormValues>({
		resolver: zodResolver(mode === "login" ? loginSchema : registerSchema),
	});

	const switchMode = (next: Mode): void => {
		setMode(next);
		setForgotSent(false);
		setForgotEmailError(undefined);
		reset();
	};

	const onSubmit = async (values: AuthFormValues): Promise<void> => {
		if (!turnstileToken) {
			toast.error("請先完成人機驗證");
			return;
		}

		setIsSubmitting(true);

		const result =
			mode === "login"
				? await login({ email: values.email, password: values.password, turnstileToken })
				: await registerAccount({
						email: values.email,
						password: values.password,
						displayName: values.displayName ?? "",
						turnstileToken,
					});

		// 成功時 Server Action 已經 redirect，不會走到這裡；有回傳代表失敗
		if (result?.error) {
			toast.error(result.error);
			setIsSubmitting(false);
		}
	};

	const handleForgotSubmit = async (e: FormEvent): Promise<void> => {
		e.preventDefault();
		if (!turnstileToken) {
			toast.error("請先完成人機驗證");
			return;
		}

		const parsed = forgotPasswordSchema.safeParse({ email: forgotEmail });
		if (!parsed.success) {
			setForgotEmailError(parsed.error.issues[0]?.message);
			return;
		}
		setForgotEmailError(undefined);
		setIsSubmitting(true);

		const result = await requestPasswordReset({ email: parsed.data.email, turnstileToken });
		setIsSubmitting(false);
		if (result?.error) {
			toast.error(result.error);
			return;
		}
		setForgotSent(true);
	};

	const turnstileWidget = TURNSTILE_SITE_KEY && (
		// Cloudflare 的 widget 預設是固定寬度的 iframe（約 300px），在較窄的表單卡片裡
		// 會比其他欄位寬、把整個卡片撐大；options.size="flexible" 讓 widget 寬度貼合
		// 父層容器。
		//
		// widget 要向 Cloudflare 拉 script、渲染 iframe，這段時間畫面是空的，載入完成
		// 瞬間才「憑空長出」一塊區域，讓下方按鈕跟著跳動。用 min-h-16.25（Turnstile
		// 標準高度 65px）預先保留空間，骨架用 absolute 疊在上面當視覺遮罩，載入完成
		// 才移除骨架——注意 Turnstile 本身必須維持正常渲染、不能用 hidden 蓋住，
		// 隱藏的 iframe 在部分瀏覽器量測不到正確尺寸，會影響它自己判斷是否載入完成
		<div className="relative min-h-16.25 w-full">
			{!turnstileLoaded && (
				<div className="absolute inset-0 animate-pulse rounded-md bg-background" />
			)}
			<Turnstile
				siteKey={TURNSTILE_SITE_KEY}
				// theme 預設是 "auto"，會跟著使用者系統的深色模式切換成暗色 widget，
				// 強制用 "light" 讓它在任何系統設定下都跟頁面風格一致
				options={{ size: "flexible", theme: "light" }}
				onWidgetLoad={() => setTurnstileLoaded(true)}
				onSuccess={setTurnstileToken}
				onError={() => setTurnstileToken(null)}
				onExpire={() => setTurnstileToken(null)}
			/>
		</div>
	);

	// 唯一一個「返回」的入口：登入/註冊模式回首頁，忘記密碼模式回登入。
	// 之前這個連結分別放在頁面外層（返回首頁）跟卡片內（返回登入），
	// 進到忘記密碼畫面時兩個同時顯示、看起來很多餘，改成同一個位置依模式切換內容
	const backLink =
		mode === "forgot" ? (
			<Button type="button" variant="ghost" className="self-start" onClick={() => switchMode("login")}>
				← 返回登入
			</Button>
		) : (
			<Button asChild variant="ghost" className="self-start">
				<Link href="/">← 返回首頁</Link>
			</Button>
		);

	if (mode === "forgot") {
		return (
			<div className="flex w-full max-w-sm flex-col gap-4">
				{backLink}
				<div className="w-full rounded-2xl border border-border bg-white p-6 shadow-sm">
					<h2 className="mb-4 text-lg font-semibold text-foreground">忘記密碼</h2>

					{forgotSent ? (
						<p className="text-sm text-foreground">
							重設信已寄出，請檢查信箱（包含垃圾郵件夾）並點擊信中連結設定新密碼。
						</p>
					) : (
						<form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
							<fieldset disabled={isSubmitting} className="flex flex-col gap-4">
								<Field label="Email" error={forgotEmailError}>
									{(fieldProps) => (
										<input
											type="email"
											value={forgotEmail}
											onChange={(e) => setForgotEmail(e.target.value)}
											className={inputClass}
											{...fieldProps}
										/>
									)}
								</Field>

								{turnstileWidget}


								<Button
									type="submit"
									disabled={isSubmitting || !turnstileToken}
									className="mt-2 w-full"
								>
									{isSubmitting && <Spinner />}
									{isSubmitting ? "寄送中…" : "寄送重設連結"}
								</Button>
							</fieldset>
						</form>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="flex w-full max-w-sm flex-col gap-4">
			{backLink}
			<div className="w-full rounded-2xl border border-border bg-white p-6 shadow-sm">
				<Tabs
					value={mode}
					onValueChange={(v) => switchMode(v as Mode)}
					className="mb-6"
				>
					<TabsList className="w-full">
						<TabsTrigger value="login">登入</TabsTrigger>
						<TabsTrigger value="register">註冊</TabsTrigger>
					</TabsList>
				</Tabs>

				<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
					<fieldset disabled={isSubmitting} className="flex flex-col gap-4">
						{mode === "register" && (
							<Field label="顯示名稱" error={errors.displayName?.message}>
								{(fieldProps) => (
									<input
										type="text"
										{...register("displayName")}
										{...fieldProps}
										className={inputClass}
									/>
								)}
							</Field>
						)}

						<Field label="Email" error={errors.email?.message}>
							{(fieldProps) => (
								<input type="email" {...register("email")} {...fieldProps} className={inputClass} />
							)}
						</Field>

						<Field label="密碼" error={errors.password?.message}>
							{(fieldProps) => (
								<input
									type="password"
									{...register("password")}
									{...fieldProps}
									className={inputClass}
								/>
							)}
						</Field>

						{mode === "login" && (
							<button
								type="button"
								onClick={() => switchMode("forgot")}
								className="-mt-2 cursor-pointer self-end text-xs text-primary hover:underline"
							>
								忘記密碼？
							</button>
						)}

						{turnstileWidget}


						<Button
							type="submit"
							disabled={isSubmitting || !turnstileToken}
							className="mt-2 w-full"
						>
							{isSubmitting && <Spinner />}
							{isSubmitting ? "處理中…" : mode === "login" ? "登入" : "註冊"}
						</Button>
					</fieldset>
				</form>
			</div>
		</div>
	);
}
