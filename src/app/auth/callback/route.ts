import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase 的 email 連結（密碼重設、之後的信箱驗證）都會導回這裡，帶著一個
// 一次性的 code。exchangeCodeForSession 把它換成真正的登入 session，這一步
// 需要寫入 cookie，只能在 Route Handler 執行（Server Component 渲染階段不能設 cookie）
export async function GET(request: NextRequest): Promise<NextResponse> {
	const { searchParams, origin } = request.nextUrl;
	const code = searchParams.get("code");
	// next 決定換到 session 後要導去哪裡；沒帶就預設回首頁，避免被亂帶去不存在的路徑
	const next = searchParams.get("next") ?? "/";

	if (code) {
		const supabase = await createClient();
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			return NextResponse.redirect(`${origin}${next}`);
		}
	}

	// code 不存在或交換失敗（連結過期/已使用過）都導回登入頁並提示重新申請
	return NextResponse.redirect(`${origin}/login?error=reset-link-invalid`);
}
