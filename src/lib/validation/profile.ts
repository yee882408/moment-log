import { z } from "zod";

export const profileSchema = z.object({
	displayName: z
		.string()
		.trim()
		.min(1, "請輸入顯示名稱")
		.max(50, "顯示名稱不可超過 50 字"),
});

export type ProfileInput = z.infer<typeof profileSchema>;
