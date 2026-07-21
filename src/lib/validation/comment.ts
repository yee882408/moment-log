import { z } from "zod";

// 對應 record_comments.body 的 check (char_length(body) between 1 and 1000)
export const commentSchema = z.object({
	body: z
		.string()
		.trim()
		.min(1, "請輸入留言內容")
		.max(1000, "留言不可超過 1000 字"),
});

export type CommentInput = z.infer<typeof commentSchema>;
