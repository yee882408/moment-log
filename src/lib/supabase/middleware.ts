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

	// 每個請求都檢查封鎖狀態，確保封鎖後既有 session 立即失效，不用等自然過期
	if (user) {
		const { data: banned } = await supabase.rpc("is_current_user_banned");
		if (banned) {
			await supabase.auth.signOut();
			const url = request.nextUrl.clone();
			url.pathname = "/login";
			url.search = "?error=banned";
			return NextResponse.redirect(url);
		}
	}

	return supabaseResponse;
}
