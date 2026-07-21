import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

// Client Component / 瀏覽器端用的 Supabase client（帶 Database 型別 → 查詢有型別檢查）
export function createClient() {
	return createBrowserClient<Database>(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
	);
}
