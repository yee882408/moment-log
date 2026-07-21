// 成功時多半是 redirect 或單純完成（不回傳）；失敗才回傳 error 字串給前端顯示
export type ActionResult = { error: string } | undefined;
