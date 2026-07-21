import type { Page } from "@playwright/test";

// 測試帳密放在 .env.test.local（已被 .gitignore 排除，不進版控）
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

export async function loginAsTestUser(page: Page): Promise<void> {
	if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
		throw new Error(
			"缺少 TEST_USER_EMAIL / TEST_USER_PASSWORD，請確認 .env.test.local 存在且已被載入",
		);
	}

	await page.goto("/login");
	await page.getByLabel("Email").fill(TEST_USER_EMAIL);
	await page.getByLabel("密碼").fill(TEST_USER_PASSWORD);

	// AuthForm 同時有「切換到登入頁籤」跟「送出表單」兩顆按鈕文字都叫「登入」，
	// 用 role="button" 名稱去找會撞到兩個（strict mode 報錯）。
	// 送出按鈕是唯一的 type="submit"，用這個縮小範圍才精準
	await page.locator('button[type="submit"]', { hasText: "登入" }).click();

	// AuthForm 登入成功後會 router.push("/")，用這個當作登入完成的訊號
	await page.waitForURL("/");
}
