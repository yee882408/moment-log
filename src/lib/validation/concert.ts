import { z } from "zod";
import { optionalNumber } from "@/lib/validation/utils";

// 演唱會「範本」表單 schema（管理員建立）。座標必填，但因來自隱藏欄位，
// 用 optionalNumber 解析，再於 Server Action 內檢查是否真有值
export const concertSchema = z.object({
	title: z.string().min(1, "請輸入標題").max(200, "標題不可超過 200 字"),
	artist: z.string().min(1, "請輸入藝人").max(200, "藝人不可超過 200 字"),
	venueName: z.string().min(1, "請輸入場館名稱").max(200, "場館名稱不可超過 200 字"),
	venueLat: optionalNumber(z.number()),
	venueLng: optionalNumber(z.number()),
	date: z.string().min(1, "請選擇日期"),
});

export type ConcertInput = z.infer<typeof concertSchema>;
