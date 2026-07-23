// 成功時多半是 redirect 或單純完成（不回傳）；失敗才回傳 error 字串給前端顯示
export type ActionResult = { error: string } | undefined;

// Supabase/PostgREST 的 error.message 常帶 constraint 名稱、欄位名稱等內部實作
// 細節（例如 duplicate key value violates unique constraint "xxx_pkey"），不該
// 直接回傳給前端：即使不算高敏感資訊，仍等於把資料庫 schema 結構暴露給任何呼叫
// 這支 action 的人探測。這裡統一記錄完整訊息到 server log（Vercel Runtime Logs
// 找得到），只把通用訊息回給前端。回傳型別故意只寫 { error: string }（不是
// ActionResult）：CreateCommentResult 這類自訂 result 型別的 error 分支結構相同，
// 呼叫端可以直接 return 這個結果，不需要額外轉型
export function toGenericActionError(error: { message: string }, context: string): { error: string } {
	console.error(`[${context}] ${error.message}`);
	return { error: "操作失敗，請稍後再試" };
}
