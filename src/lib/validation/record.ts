import { z } from "zod";
import { optionalNumber } from "@/lib/validation/utils";
import { TICKET_CURRENCIES, DEFAULT_TICKET_CURRENCY } from "@/lib/currency";

// 新增／編輯紀錄共用一份 schema
export const recordSchema = z.object({
	title: z.string().min(1, "請輸入標題").max(200, "標題不可超過 200 字"),
	artist: z.string().min(1, "請輸入藝人").max(200, "藝人不可超過 200 字"),
	venueName: z.string().min(1, "請輸入場館名稱").max(200, "場館名稱不可超過 200 字"),
	venueLat: optionalNumber(z.number()), // 由 geocoding 搜尋帶入，選填
	venueLng: optionalNumber(z.number()),
	date: z.string().min(1, "請選擇日期"), // yyyy-mm-dd
	seatInfo: z.string().max(200, "座位區域不可超過 200 字").optional(), // 當天實際坐的座位/區域，選填
	ticketPrice: optionalNumber(z.number().int("須為整數").min(0, "不可為負")),
	ticketCurrency: z.enum(TICKET_CURRENCIES).default(DEFAULT_TICKET_CURRENCY),
	rating: optionalNumber(z.number().int().min(1).max(5)),
	// 心得改用 Tiptap 富文本編輯器後存的是 HTML 字串，標籤本身也佔字數，
	// 原本針對純文字的 5000 字上限對應到含排版標籤/圖片 URL 的內容太緊，
	// 放寬到 20000（約可容納原本 5000 字內容再加上排版標籤與少量圖片 URL）
	review: z.string().max(20000, "心得內容過長").optional(),
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
