import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// 每個 request 刷新 Supabase session，並把更新後的 auth cookie 寫回 response
export async function updateSession(request: NextRequest) {
	let supabaseResponse = NextResponse.next({ request });

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
					supabaseResponse = NextResponse.next({ request });
					cookiesToSet.forEach(({ name, value, options }) =>
						supabaseResponse.cookies.set(name, value, options)
					);
				},
			},
		}
	);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	// 每個請求都檢查封鎖狀態，確保封鎖後既有 session 立即失效，不用等自然過期。
	// 這支 RPC 呼叫失敗（Supabase 暫時連不上、行動網路逾時等）時放行而非拋出例外，
	// 否則單次網路波動會讓整個請求直接變成 500，比起延遲一次封鎖檢查嚴重得多——
	// 下一次請求還會再檢查，不會讓被封鎖的帳號因此永久繞過
	if (user) {
		try {
			const { data: banned, error } = await supabase.rpc("is_current_user_banned");
			if (error) {
				console.error("is_current_user_banned RPC failed:", error.message);
			} else if (banned) {
				await supabase.auth.signOut();
				const url = request.nextUrl.clone();
				url.pathname = "/login";
				url.search = "?error=banned";
				return NextResponse.redirect(url);
			}
		} catch (err) {
			console.error("is_current_user_banned RPC threw:", err);
		}
	}

	return supabaseResponse;
}
