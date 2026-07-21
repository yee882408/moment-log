import { z } from "zod";

// 登入不限制密碼複雜度：帳密是否正確交給 Supabase 驗證。若套用註冊的新規則，
// 用舊規則設定密碼的既有帳號會被前端驗證擋下、連登入表單都送不出去
export const loginSchema = z.object({
	email: z.string().email("請輸入有效的 email"),
	password: z.string().min(1, "請輸入密碼"),
});

// 密碼複雜度規則抽出共用：註冊、重設密碼都要求同一組規則
export const passwordSchema = z
	.string()
	.min(8, "密碼至少 8 碼")
	.regex(/[A-Z]/, "密碼需包含大寫英文字母")
	.regex(/[a-z]/, "密碼需包含小寫英文字母")
	.regex(/[0-9]/, "密碼需包含數字");

export const registerSchema = z.object({
	email: z.string().email("請輸入有效的 email"),
	password: passwordSchema,
	displayName: z.string().min(1, "請輸入顯示名稱").max(50, "顯示名稱過長"),
});

export const forgotPasswordSchema = z.object({
	email: z.string().email("請輸入有效的 email"),
});

export const resetPasswordSchema = z.object({
	password: passwordSchema,
});

// 已登入狀態下主動修改密碼：跟 resetPasswordSchema（email 連結重設）不同，
// 這裡需要額外驗證使用者輸入的目前密碼是否正確
export const changePasswordSchema = z.object({
	oldPassword: z.string().min(1, "請輸入目前密碼"),
	newPassword: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
