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

	// TEMP: 排查登入延遲用的計時 log，確認完瓶頸後會移除
	const t0 = Date.now();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	console.log(`[middleware timing] ${request.nextUrl.pathname} getUser: ${Date.now() - t0}ms`);

	// 每個請求都檢查封鎖狀態，確保封鎖後既有 session 立即失效，不用等自然過期
	if (user) {
		const t1 = Date.now();
		const { data: banned } = await supabase.rpc("is_current_user_banned");
		console.log(
			`[middleware timing] ${request.nextUrl.pathname} is_current_user_banned: ${Date.now() - t1}ms`,
		);
		if (banned) {
			await supabase.auth.signOut();
			const url = request.nextUrl.clone();
			url.pathname = "/login";
			url.search = "?error=banned";
			return NextResponse.redirect(url);
		}
	}

	console.log(`[middleware timing] ${request.nextUrl.pathname} total: ${Date.now() - t0}ms`);
	return supabaseResponse;
}
