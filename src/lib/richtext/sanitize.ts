import "server-only";

import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";

// 原本用 isomorphic-dompurify（內部依賴 jsdom@29）在 Vercel 的 Turbopack serverless
// 環境下會炸掉：jsdom@29 的 html-encoding-sniffer 依賴鏈拉到一個純 ESM 套件
// （@exodus/bytes），被 require() 載入時直接丟 ERR_REQUIRE_ESM，導致每個渲染
// 心得內文的頁面在 module 載入階段（連函式都還沒執行）就 500。
//
// 曾試過改用 linkedom 取代 jsdom（更輕量、沒有這個包裝問題），但實測發現
// linkedom 的 window 缺少 DOMPurify 需要的 NodeFilter 建構子，導致
// DOMPurify.isSupported 判定為 false，sanitize() 靜默地什麼都不清理——
// 是比 500 更危險的靜默 XSS 防線失效，已驗證排除。
//
// 改成直接依賴 dompurify + 釘死 jsdom@26.1.0（isomorphic-dompurify 內部鎖定
// jsdom@^29，無法只換掉這一層）：jsdom@26 的 html-encoding-sniffer 還是
// ^4.0.0，沒有那個 ESM-only 依賴，且行為上是完整、經過驗證的 DOM 實作，
// 用實際 XSS payload 測過會正確過濾 <script>/on* 事件屬性
const { window } = new JSDOM("<!DOCTYPE html><html><body></body></html>");
export const DOMPurify = createDOMPurify(window);

// 心得內文編輯器（Tiptap）目前只支援的排版：段落、換行、粗體、斜體、清單、圖片。
// 白名單只放這些 tag，其餘一律濾掉；img 只允許 src/alt，擋掉 onerror 等事件屬性
const ALLOWED_TAGS = ["p", "br", "strong", "em", "ul", "ol", "li", "img"];
const ALLOWED_ATTR = ["src", "alt"];

// 寫入前（Server Action）與顯示前都要各自呼叫一次（縱深防禦）：即使寫入時
// 已經清過，顯示端也不該無條件信任資料庫內容直接塞進 dangerouslySetInnerHTML，
// 避免未來其他寫入路徑（例如 admin 後台）忘記做這一步時整個防線失守
export function sanitizeReviewHtml(html: string): string {
	return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
}
