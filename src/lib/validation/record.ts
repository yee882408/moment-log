import { z } from "zod";
import { optionalNumber } from "@/lib/validation/utils";

// 新增／編輯紀錄共用一份 schema
export const recordSchema = z.object({
	title: z.string().min(1, "請輸入標題"),
	artist: z.string().min(1, "請輸入藝人"),
	venueName: z.string().min(1, "請輸入場館名稱"),
	venueLat: optionalNumber(z.number()), // 由 geocoding 搜尋帶入，選填
	venueLng: optionalNumber(z.number()),
	date: z.string().min(1, "請選擇日期"), // yyyy-mm-dd
	ticketPrice: optionalNumber(z.number().int("須為整數").min(0, "不可為負")),
	rating: optionalNumber(z.number().int().min(1).max(5)),
	review: z.string().max(5000, "心得不可超過 5000 字").optional(),
	spotifyPlaylistId: z.string().max(200, "格式不正確").optional(),
	coverImageUrl: z.string().optional(), // 上傳後的 public URL
	templateId: z.string().optional(), // 套用範本時記錄來源，手動則 undefined
	isPublic: z.boolean(),
	tags: z
		.array(z.string().trim().min(1).max(20, "單一標籤不可超過 20 字"))
		.max(10, "最多 10 個標籤")
		.optional()
		.default([]),
});

export type RecordInput = z.infer<typeof recordSchema>;
