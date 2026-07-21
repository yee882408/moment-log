import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

// Server Component / Route Handler 用的 Supabase client
// 透過 cookie 讀取登入狀態，故 RLS 的 auth.uid() 在伺服器端也有效
export async function createClient() {
	const cookieStore = await cookies();

	return createServerClient<Database>(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return cookieStore.getAll();
				},
				setAll(cookiesToSet) {
					try {
						cookiesToSet.forEach(({ name, value, options }) =>
							cookieStore.set(name, value, options),
						);
					} catch {
						// 在 Server Component 內呼叫 setAll 會丟錯，可忽略：
						// session 的刷新交給 middleware 處理
					}
				},
			},
		},
	);
}
