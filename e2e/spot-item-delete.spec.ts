import { test, expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { loginAsTestUser } from "./helpers/auth";

// 這支測試涵蓋「新增地點 → 刪除地點」的 happy path，以及圍繞著它的幾個 edge case：
// 取消刪除不會誤刪、名稱空白會被前端擋下、搜尋不到結果會有提示文字。
//
// 測試資料原則：不能假設帳號裡已經有現成的清單可用（第一次跑這支測試時就撞到這個
// 錯誤——測試帳號底下什麼清單都沒有）。測試需要的每一筆資料都要由測試自己建立、
// 自己清乾淨，不依賴任何人工預先準備好的環境狀態，也不能弄髒帳號裡其他真實資料。
const LIST_TITLE = `Playwright 測試清單 ${Date.now()}`;

// 比對「/spots/{清單 id}」這個真正的詳情頁網址時，不能用寬鬆的 [^/]+（任何非斜線
// 字元）——這個寫法會連 /spots/new 都判定為符合（"new" 本身也是「一段不含斜線的
// 字元」），導致 waitForURL 在表單都還沒送出成功、頁面其實還停在 /spots/new 時
// 就提前通過。清單 id 是資料庫 gen_random_uuid() 產生的標準 UUID，比對這個格式
// 才能準確排除 /spots/new、/spots/[id]/edit 這些固定路徑名稱的誤判
const SPOT_LIST_DETAIL_URL =
	/\/spots\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

async function createTestList(page: Page): Promise<void> {
	await page.goto("/spots/new");
	await page.getByLabel("清單標題").fill(LIST_TITLE);
	await page.getByLabel("藝人").fill("測試藝人");
	await page.locator('button[type="submit"]', { hasText: "建立清單" }).click();
	// 成功會被 Server Action redirect 到 /spots/{id}
	await page.waitForURL(SPOT_LIST_DETAIL_URL);
}

async function deleteTestList(page: Page): Promise<void> {
	// afterEach 裡呼叫，用來保證清理一定會執行；如果連清單都沒建立成功
	// （例如 createTestList 本身就失敗了），這裡直接跳過，不用製造第二個錯誤
	if (!SPOT_LIST_DETAIL_URL.test(page.url())) {
		return;
	}

	// 防禦性清理：如果測試主體失敗/漏收尾，留下一個還開著的 Dialog（例如某支測試
	// 忘記關掉自己打開的 Modal），它的全螢幕遮罩會擋住畫面，讓底下這行點「刪除清單」
	// 永遠點不到、重試到超時——親身經歷過這個坑：afterEach 卡住的錯誤訊息只會顯示
	// 「等不到刪除清單按鈕」，完全看不出真正原因是某個 Dialog 忘記關。
	// 這裡先確認並清掉任何殘留的 Dialog，讓 afterEach 更不容易被測試主體的疏漏拖累，
	// 但這只是防禦網——真正該做的還是每支測試自己收好尾（見下面的測試案例）。
	const openDialog = page.getByRole("dialog");
	if ((await openDialog.count()) > 0 && (await openDialog.first().isVisible())) {
		const closeButton = openDialog.first().getByRole("button", { name: "關閉" });
		if ((await closeButton.count()) > 0) {
			await closeButton.click();
		}
	}

	await page.locator('button[type="button"]', { hasText: "刪除清單" }).click();
	const confirmDialog = page.getByRole("dialog").filter({ hasText: "確定刪除這個清單？" });
	await confirmDialog.locator('button[type="button"]', { hasText: "確定刪除" }).click();
	await page.waitForURL("/spots");
}

// 開啟「新增地點」Modal 並搜尋出至少一筆結果、選定第一筆——這是好幾個測試共同的
// 前置動作（新增成功、名稱驗證失敗、取消不刪除，都得先走到「表單已經定位好座標」
// 這個狀態），抽成共用函式避免同樣的步驟在每個測試裡重複貼三四次
async function openAddModalWithVenuePicked(page: Page): Promise<Locator> {
	await page.getByRole("button", { name: "新增地點" }).first().click();

	const dialog = page.getByRole("dialog");
	await expect(dialog.getByRole("heading", { name: "新增地點" })).toBeVisible();

	await dialog.getByPlaceholder("例：台北小巨蛋").fill("台北車站");
	await dialog.getByRole("button", { name: "搜尋" }).click();
	await dialog.locator("ul button").first().click();

	return dialog;
}

test.describe("追星地圖地點刪除", () => {
	test.beforeEach(async ({ page }) => {
		await loginAsTestUser(page);
		await createTestList(page);
	});

	test.afterEach(async ({ page }) => {
		await deleteTestList(page);
	});

	test("新增地點後可以刪除，刪除後地圖不會意外移動", async ({ page }) => {
		// beforeEach 已經把頁面帶到剛建立的清單詳情頁
		const dialog = await openAddModalWithVenuePicked(page);

		const placeName = `Playwright 測試地點 ${Date.now()}`;
		// 地點名稱欄位會被搜尋結果帶入，這裡覆寫成好辨識的測試專用名稱
		await dialog.getByLabel("地點名稱").fill(placeName);
		await dialog.locator('button[type="submit"]', { hasText: "新增地點" }).click();

		// 送出成功後 Modal 會自動關閉
		await expect(dialog).not.toBeVisible();

		// 新地點應該出現在清單卡片裡。定位這張卡片時特意不用「往上爬 N 層 DOM」
		// （例如 locator("..").locator("..")）：那種寫法綁死在目前剛好長這樣的巢狀
		// 結構，元件內部包裝方式一改（哪怕行為沒變）測試就會默默失效或抓錯元素。
		// 改用 Card 元件自帶的樣式 class 當定位依據，是介面（視覺契約）而不是實作
		// 細節（子元素怎麼排列），相對穩定。
		//
		// :visible：SpotItemsPanel 手機版/桌面版兩份 DOM 同時存在（用 CSS 切換可見度，
		// 不是條件渲染），這張卡片在 DOM 裡其實有兩份。一開始用 .first() 挑，結果
		// 剛好挑到 CSS 隱藏的那份而失敗——DOM 順序不保證「看得到的排前面」，.first()
		// 賭的是順序，不是真正在講「畫面上看得到」，改用 :visible 才是精準表達
		const card = page.locator(".rounded-2xl:visible").filter({ hasText: placeName });
		await expect(card).toBeVisible();

		// 刪除流程：點卡片上的「刪除」按鈕 → 跳出確認對話框 → 按「確定刪除」
		await card.locator('button[type="button"]', { hasText: "刪除" }).click();
		const confirmDialog = page.getByRole("dialog").filter({ hasText: "確定刪除這個地點？" });
		await expect(confirmDialog).toBeVisible();

		// 記錄地圖目前的平移狀態，等等刪除完要確認地圖沒有被意外移動
		// （這是先前修過的 bug：刪除後 focusedId 沒清空，導致 flyTo 被意外觸發）
		//
		// 注意：不能用 .leaflet-container 的 boundingBox() 來判斷——那量的是這個
		// <div> 在頁面上的版面位置（CSS layout），跟地圖「往哪裡平移/縮放到多少」是
		// 兩回事，flyTo 不會移動這個 div 本身。Leaflet 實際是靠平移內部的
		// .leaflet-map-pane 這一層（用 transform: translate3d(...) 位移）來做 pan/fly
		// 動畫，所以要讀的是它的 transform 值有沒有變化。
		const mapPane = page.locator(".leaflet-map-pane").first();
		const transformBefore = await mapPane.evaluate((el) => el.style.transform);

		await confirmDialog.locator('button[type="button"]', { hasText: "確定刪除" }).click();
		await expect(confirmDialog).not.toBeVisible();

		// 注意：不能用 .not.toBeVisible()——手機版/桌面版兩份 DOM 都有這個地點名稱，
		// Playwright strict mode 在「解析定位器」這一步就會因為抓到兩個元素報錯，
		// 跟這兩個元素實際上可不可見無關（.not.toBeVisible() 一樣要求先解析到唯一
		// 元素才能判斷它可不可見）。用 toHaveCount(0) 才是精準表達「這兩份都該消失」
		await expect(page.getByText(placeName)).toHaveCount(0);

		// flyTo 是動畫，若真的被誤觸會逐幀改變 transform；給一點緩衝時間讓動畫跑完
		// 再讀值，確保不是「查的時機太早、動畫還沒開始」造成的偽陰性
		await page.waitForTimeout(500);
		const transformAfter = await mapPane.evaluate((el) => el.style.transform);
		expect(transformAfter).toBe(transformBefore);
	});

	// happy path 是「肯定路徑」：一路點到底最後真的刪除成功。
	// 這支反過來測「否定路徑」：使用者點了刪除、看到確認對話框、但改變心意按了取消，
	// 這時候地點必須還在——這種「使用者中途反悔」的操作跟成功路徑一樣常見，
	// 但很容易在只顧著測「功能做得到」時被忽略。
	test("點確認對話框的取消，地點不會被刪除", async ({ page }) => {
		const dialog = await openAddModalWithVenuePicked(page);
		const placeName = `Playwright 取消測試 ${Date.now()}`;
		await dialog.getByLabel("地點名稱").fill(placeName);
		await dialog.locator('button[type="submit"]', { hasText: "新增地點" }).click();
		await expect(dialog).not.toBeVisible();

		const card = page.locator(".rounded-2xl:visible").filter({ hasText: placeName });
		await card.locator('button[type="button"]', { hasText: "刪除" }).click();

		const confirmDialog = page.getByRole("dialog").filter({ hasText: "確定刪除這個地點？" });
		await expect(confirmDialog).toBeVisible();
		await confirmDialog.locator('button[type="button"]', { hasText: "取消" }).click();

		// 對話框關閉，但地點還在——這是跟 happy path 唯一分岔的地方
		await expect(confirmDialog).not.toBeVisible();
		await expect(card).toBeVisible();
	});

	// 地點名稱是必填欄位（zod: z.string().min(1)），這支確認前端驗證確實擋下空白送出，
	// 而不是讓請求打到後端才失敗（那樣使用者要多等一次網路往返才看得到錯誤）。
	test("地點名稱空白送出會被前端擋下，並顯示錯誤訊息", async ({ page }) => {
		const dialog = await openAddModalWithVenuePicked(page);

		// 地點名稱欄位在選定搜尋結果後，會被 VenueSearch 帶入的地名自動填入，
		// 這裡先清空才能測試「真的沒填」的情境
		const nameInput = dialog.getByLabel("地點名稱");
		await nameInput.fill("");
		await dialog.locator('button[type="submit"]', { hasText: "新增地點" }).click();

		// Modal 應該還開著（表單驗證沒過，不會真的送出）
		await expect(dialog).toBeVisible();
		await expect(dialog.getByText("請輸入地點名稱")).toBeVisible();

		// aria-invalid 是 Field 元件用來讓螢幕閱讀器知道「這個欄位有錯」的關聯屬性
		// （見 interview_prep 第 13 點），這裡順便確認這個 a11y 屬性真的有被設成 true，
		// 不是只有視覺上的紅字而沒有語意關聯
		await expect(nameInput).toHaveAttribute("aria-invalid", "true");

		// 這支測試刻意讓 Modal 保持開啟去驗證錯誤訊息，測試結束前要自己關掉它——
		// 這裡曾經漏掉這一步，導致 afterEach 想點「刪除清單」時被還開著的 Modal
		// 遮罩擋住、重試 30 幾次直到超時，錯誤訊息卻只顯示在 afterEach 那一層，
		// 完全看不出真正的原因出在測試主體本身沒收尾。每支測試都該對自己開出來的
		// UI 狀態負責，不能留著爛攤子讓下一步操作（甚至下一支測試）承擔後果。
		await dialog.locator('button[type="button"]', { hasText: "取消" }).click();
		await expect(dialog).not.toBeVisible();
	});

	// VenueSearch 打的是真實的 Nominatim 地理編碼服務（見 src/lib/actions/geocode.ts），
	// 搜尋一個現實中不存在的地名字串，確認「找不到結果」的提示文字有正確顯示，
	// 而不是讓使用者對著空白畫面猜「是不是還在搜尋中」。
	test("搜尋不到結果時顯示提示文字", async ({ page }) => {
		await page.getByRole("button", { name: "新增地點" }).first().click();
		const dialog = page.getByRole("dialog");
		await expect(dialog.getByRole("heading", { name: "新增地點" })).toBeVisible();

		// 刻意搜尋一串不像任何真實地名的亂碼字串，降低 Nominatim 剛好比對到結果的機率
		await dialog.getByPlaceholder("例：台北小巨蛋").fill("asdkfjlqwepoxznvzxcvlkqwj12345");
		await dialog.getByRole("button", { name: "搜尋" }).click();

		await expect(dialog.getByText("找不到符合的地點，換個關鍵字試試。")).toBeVisible();
		// 順便確認真的沒有結果列表被渲染出來
		await expect(dialog.locator("ul button")).toHaveCount(0);

		await dialog.locator('button[type="button"]', { hasText: "取消" }).click();
	});
});

// 這支獨立在上面的 describe 之外：它不需要（也不該）用測試帳號登入態，
// 情境本身就是「訪客沒有登入」。清單資料改用另一個已登入的 page 建立（設成公開），
// 再用完全乾淨、沒有登入 cookie 的 context 去訪問，確保這支測試也不依賴任何
// 人工預先準備好的公開清單。
test.describe("未登入造訪追星地圖清單詳情頁", () => {
	let publicListUrl: string;

	test.beforeAll(async ({ browser }) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		await loginAsTestUser(page);

		await page.goto("/spots/new");
		await page.getByLabel("清單標題").fill(`Playwright 公開測試清單 ${Date.now()}`);
		await page.getByLabel("藝人").fill("測試藝人");
		// SpotListForm 的公開勾選框改用 shadcn Checkbox（Radix），底層是
		// <button role="checkbox">，不是原生 <input type="checkbox">，用 role 定位
		await page.getByRole("checkbox").check();
		await page.locator('button[type="submit"]', { hasText: "建立清單" }).click();
		await page.waitForURL(SPOT_LIST_DETAIL_URL);
		publicListUrl = page.url();

		await context.close();
	});

	test.afterAll(async ({ browser }) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		await loginAsTestUser(page);
		await page.goto(publicListUrl);
		await deleteTestList(page);
		await context.close();
	});

	test("未登入看不到編輯/刪除/新增地點按鈕", async ({ browser }) => {
		// 明確開一個全新、沒有任何 storage state 的 context，
		// 保證這個 page 絕對沒有繼承到其他測試留下的登入 cookie
		const guestContext = await browser.newContext();
		const guestPage = await guestContext.newPage();

		await guestPage.goto(publicListUrl);

		// SpotListDetailPage 的 canEdit 是 user?.id === list.user_id，訪客沒有 user，
		// canEdit 一定是 false，這幾個只有清單擁有者才看得到的操作入口都不該出現
		await expect(guestPage.getByRole("link", { name: "編輯" })).toHaveCount(0);
		await expect(guestPage.locator('button[type="button"]', { hasText: "刪除清單" })).toHaveCount(
			0
		);
		await expect(guestPage.getByRole("button", { name: "新增地點" })).toHaveCount(0);

		// 未登入時讚按鈕會換成連到 /login 的文字連結，而不是可互動的按鈕
		await expect(guestPage.getByRole("link", { name: /請登入/ })).toBeVisible();

		await guestContext.close();
	});
});
