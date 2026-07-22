"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
	loginSchema,
	registerSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
	changePasswordSchema,
	type LoginInput,
	type RegisterInput,
	type ForgotPasswordInput,
	type ResetPasswordInput,
	type ChangePasswordInput,
} from "@/lib/validation/auth";
import type { ActionResult } from "@/lib/actions/types";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// 只在伺服器端驗證 Turnstile token 才有意義：前端 widget 只負責產生 token，
// 真正判斷「這是不是真人」要靠這支 API 用 secret key 跟 Cloudflare 對答案，
// 不然機器人可以完全略過前端、直接呼叫下面的 login/register
async function verifyTurnstileToken(token: string): Promise<boolean> {
	if (!token) {
		return false;
	}

	const secret = process.env.TURNSTILE_SECRET_KEY;
	if (!secret) {
		// 環境變數沒設定時視為驗證失敗，而不是直接放行，避免忘記設定 key
		// 反而讓人機驗證形同虛設
		return false;
	}

	const res = await fetch(TURNSTILE_VERIFY_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ secret, response: token }),
	});
	if (!res.ok) {
		return false;
	}

	const data = (await res.json()) as { success: boolean };
	return data.success;
}

export async function login(
	input: LoginInput & { turnstileToken: string },
): Promise<ActionResult> {
	const verified = await verifyTurnstileToken(input.turnstileToken);
	if (!verified) {
		return { error: "驗證失敗，請重試" };
	}

	// 伺服器端再驗一次：前端 Zod 只是 UX，可被繞過，這層才是真防線
	const parsed = loginSchema.safeParse(input);
	if (!parsed.success) {
		return { error: "資料格式錯誤" };
	}

	const supabase = await createClient();

	const { error } = await supabase.auth.signInWithPassword({
		email: parsed.data.email,
		password: parsed.data.password,
	});

	if (error) {
		// 帳密錯誤、或 custom_access_token_hook 拒絕已被封鎖的帳號，都會落在這裡；
		// 用同一句訊息不特別區分，避免讓人特意去試哪個帳號被封鎖（帳號枚舉風險）
		return { error: "登入失敗：email 或密碼錯誤，或帳號已被停用" };
	}

	redirect("/");
}

export async function register(
	input: RegisterInput & { turnstileToken: string },
): Promise<ActionResult> {
	const verified = await verifyTurnstileToken(input.turnstileToken);
	if (!verified) {
		return { error: "驗證失敗，請重試" };
	}

	const parsed = registerSchema.safeParse(input);
	if (!parsed.success) {
		return { error: "資料格式錯誤" };
	}

	const supabase = await createClient();
	const { error } = await supabase.auth.signUp({
		email: parsed.data.email,
		password: parsed.data.password,
		options: { data: { display_name: parsed.data.displayName } },
	});
	if (error) {
		return { error: error.message };
	}

	redirect("/");
}

export async function requestPasswordReset(
	input: ForgotPasswordInput & { turnstileToken: string },
): Promise<ActionResult> {
	const verified = await verifyTurnstileToken(input.turnstileToken);
	if (!verified) {
		return { error: "驗證失敗，請重試" };
	}

	const parsed = forgotPasswordSchema.safeParse(input);
	if (!parsed.success) {
		return { error: "請輸入有效的 email" };
	}

	const supabase = await createClient();
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
	await supabase.auth.resetPasswordForEmail(parsed.data.email, {
		redirectTo: `${siteUrl}/auth/callback?next=/auth/reset-password`,
	});

	// 無論 email 是否真的存在都回傳同樣的成功結果（不回傳 undefined 讓呼叫端誤判失敗，
	// 也不回傳「查無此帳號」之類的錯誤）：否則這個表單可以被用來枚舉出哪些 email
	// 已經註冊過，是密碼重設功能常見的資安坑
	return undefined;
}

export type ResetPasswordResult = { error: string } | { success: true };

// Supabase Auth 回傳的錯誤是英文，這裡把已知的幾種常見訊息轉成中文；
// 不在列表裡的錯誤用通用訊息帶過，避免把不熟悉的英文原文直接丟給使用者看
function translateUpdatePasswordError(message: string): string {
	if (message.includes("should be different from the old password")) {
		return "新密碼不能與目前的密碼相同，請設定一組不同的密碼";
	}
	if (message.includes("session") || message.includes("expired")) {
		return "驗證已過期，請重新申請密碼重設信";
	}
	return "密碼更新失敗，請稍後再試";
}

export async function resetPassword(input: ResetPasswordInput): Promise<ResetPasswordResult> {
	const parsed = resetPasswordSchema.safeParse(input);
	if (!parsed.success) {
		return { error: parsed.error.issues[0]?.message ?? "密碼格式錯誤" };
	}

	const supabase = await createClient();
	// 不需要額外驗證身份：使用者能呼叫到這裡，代表已經透過 /auth/callback 用信件裡的
	// code 換到合法 session，這個 session 本身就是「證明擁有這個信箱」的憑證
	const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
	if (error) {
		return { error: translateUpdatePasswordError(error.message) };
	}

	// 這裡刻意不 signOut：Next.js 呼叫任一 Server Action 後，會自動重新渲染目前頁面的
	// Server Component（/auth/reset-password/page.tsx）；如果在這裡就把 session 登出，
	// 那次自動重新渲染會讀到「沒有 user」，觸發頁面自己的守門邏輯把使用者導去登入頁、
	// 蓋掉還沒來得及顯示的「已更新成功」畫面（實測過：密碼其實已經改成功，畫面卻顯示
	// 連結失效，看起來像是失敗）。登出的動作挪到 finishPasswordReset()，等前端顯示完
	// 成功訊息、準備要離開這一頁時才一起做
	return { success: true };
}

// 密碼更新成功、使用者也看完提示訊息後才呼叫：把「登出」跟「導頁」合併在同一個
// action 裡（跟 login()/register() 同樣的寫法），讓 Next.js 把這次呼叫當成「離開
// 這一頁」處理，而不是「重新整理原地的頁面」，才不會被 reset-password 頁面自己的
// getUser() 守門邏輯搶先攔截、蓋掉使用者原本該看到的畫面
export async function finishPasswordReset(): Promise<void> {
	const supabase = await createClient();
	await supabase.auth.signOut();
	redirect("/");
}

// 已登入狀態下主動修改密碼（個人檔案頁用）。跟 resetPassword 不同：那支是透過
// email 連結拿到的臨時 session，本身就是「擁有此信箱」的憑證；這裡使用者是
// 一般登入狀態下自己改密碼，updateUser 不會檢查舊密碼，所以要先用
// signInWithPassword 重新驗證一次舊密碼，通過才繼續更新
export async function changePassword(input: ChangePasswordInput): Promise<ResetPasswordResult> {
	const parsed = changePasswordSchema.safeParse(input);
	if (!parsed.success) {
		return { error: parsed.error.issues[0]?.message ?? "密碼格式錯誤" };
	}

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user?.email) {
		return { error: "尚未登入" };
	}

	const { error: verifyError } = await supabase.auth.signInWithPassword({
		email: user.email,
		password: parsed.data.oldPassword,
	});
	if (verifyError) {
		return { error: "目前密碼不正確" };
	}

	const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
	if (error) {
		return { error: translateUpdatePasswordError(error.message) };
	}

	return { success: true };
}
