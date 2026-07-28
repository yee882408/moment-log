import "server-only";

import DOMPurify from "isomorphic-dompurify";

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
