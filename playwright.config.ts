import { defineConfig, devices } from "@playwright/test";

// .env.test.local 放測試帳密，不進版控（見 .gitignore 的 .env* 規則）
try {
	process.loadEnvFile(".env.test.local");
} catch {
	// 檔案不存在時讓測試在執行階段給出更明確的錯誤（見 e2e/helpers/auth.ts）
}

export default defineConfig({
	testDir: "./e2e",
	// 這批測試共用同一個測試帳號登入、而且會打真實的 Nominatim 外部地理編碼服務——
	// 平行跑多個測試時，同一帳號的資料互相干擾、外部 API 也可能因為短時間內大量
	// 請求而變慢或有速率限制，實測過會導致操作卡住直到逾時。序列執行（worker: 1）
	// 犧牲一點速度換取穩定，這個規模的測試量還不構成問題
	workers: 1,
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: "html",
	use: {
		baseURL: "http://localhost:3000",
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	// 假設 dev server 已經在跑（這個專案平常開發時就常駐著），不用每次測試都重新啟動
	webServer: {
		command: "npm run dev",
		url: "http://localhost:3000",
		reuseExistingServer: true,
		timeout: 30_000,
	},
});
