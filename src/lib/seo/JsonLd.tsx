// 共用的 schema.org 結構化資料渲染元件：各頁面只需要在 lib/seo/schemas.ts
// 組出符合 schema.org 型別的物件，這裡統一負責序列化成 <script> 標籤，
// 不用每個頁面各自重複寫 dangerouslySetInnerHTML 樣板
//
// data 裡的欄位可能包含使用者輸入（心得內文、清單描述等），JSON.stringify
// 不會跳脫 "</script>" 這個子字串——如果使用者故意在內文寫入
// "</script><script>...</script>"，會被瀏覽器解析成提前結束這個標籤、
// 插入一段真正會執行的 <script>，是實際可觸發的 XSS。把每個 "<" 都換成
// unicode escape "<"，輸出裡就不會再出現完整的 "</script>" 子字串，
// 其餘 JSON 語法（不受 "<" 影響）維持不變
export function JsonLd({ data }: { data: object }): React.ReactElement {
	const json = JSON.stringify(data).replace(/</g, "\\u003c");
	return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
