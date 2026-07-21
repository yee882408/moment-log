import "server-only";

import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 5;

export interface RecordComment {
	id: string;
	user_id: string;
	body: string;
	created_at: string;
	author: string | null; // profiles.display_name
}

export interface CommentsPage {
	comments: RecordComment[];
	totalCount: number;
	totalPages: number;
}

// 詳情頁的留言列表，依時間正序（舊→新），offset 分頁；page 從 1 起算
export async function getCommentsByRecordId(
	recordId: string,
	page = 1,
): Promise<CommentsPage> {
	const supabase = await createClient();
	const from = (page - 1) * PAGE_SIZE;
	const to = from + PAGE_SIZE - 1;

	const { data, error, count } = await supabase
		.from("record_comments")
		.select("id, user_id, body, created_at, profiles(display_name)", {
			count: "exact",
		})
		.eq("record_id", recordId)
		.order("created_at", { ascending: true })
		.range(from, to);

	if (error) {
		throw new Error(`讀取留言失敗：${error.message}`);
	}

	const comments: RecordComment[] = (data ?? []).map((c) => ({
		id: c.id,
		user_id: c.user_id,
		body: c.body,
		created_at: c.created_at,
		author: c.profiles?.display_name ?? null,
	}));

	const totalCount = count ?? 0;
	return {
		comments,
		totalCount,
		totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
	};
}
