// 共用的 schema.org 結構化資料渲染元件：各頁面只需要在 lib/seo/schemas.ts
// 組出符合 schema.org 型別的物件，這裡統一負責序列化成 <script> 標籤，
// 不用每個頁面各自重複寫 dangerouslySetInnerHTML 樣板
export function JsonLd({ data }: { data: object }): React.ReactElement {
	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
		/>
	);
}
