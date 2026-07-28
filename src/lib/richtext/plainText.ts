import "server-only";

import { DOMPurify } from "@/lib/richtext/sanitize";

// 心得內文從純文字 textarea 改成 Tiptap 富文本編輯器後，資料庫裡新舊格式並存：
// 舊資料是使用者輸入的純文字（沒有任何標籤），新資料是 Tiptap 輸出的 HTML。
// 用「內容裡有沒有出現過 <」這個最簡單的判斷法區分兩者——純文字不可能含有效的
// HTML 標籤語法，這個判斷不需要真的解析 HTML，因為誤判的唯一後果是顯示層選錯
// 渲染路徑（純文字被當 HTML 解析、或反過來），不是安全性判斷（安全性一律靠
// sanitizeReviewHtml，不管走哪個分支都會過這關）
export function looksLikeHtml(value: string): boolean {
	return value.includes("<");
}

// 供 generateMetadata 的 OG description、JSON-LD 的 reviewBody 共用：
// 兩者都需要「純文字摘要」，如果內容其實是 HTML，直接 slice 會截出破損的
// 標籤片段或把標籤本身當文字顯示，所以統一先轉成純文字（ALLOWED_TAGS: []
// 等同去除所有標籤只留文字節點）再讓呼叫端自行 slice
export function htmlToPlainText(value: string): string {
	if (!looksLikeHtml(value)) {
		return value;
	}
	return DOMPurify.sanitize(value, { ALLOWED_TAGS: [] });
}
