import { z } from "zod";

export const placeTypeValues = ["restaurant", "attraction", "other"] as const;

// 新增／編輯清單共用一份 schema（清單本身：標題、藝人 tag、公開設定）
export const spotListSchema = z.object({
	title: z.string().min(1, "請輸入清單標題"),
	artist: z.string().min(1, "請輸入藝人"),
	description: z.string().optional(),
	isPublic: z.boolean(),
});

export type SpotListInput = z.infer<typeof spotListSchema>;

// 新增／編輯清單內地點共用一份 schema（地點不獨立設定公開性，跟隨所屬清單）
export const spotItemSchema = z.object({
	placeName: z.string().min(1, "請輸入地點名稱"),
	placeLat: z.number(), // 由 geocoding 搜尋帶入
	placeLng: z.number(),
	// <select> 未選擇時原生值是空字串，不是 undefined；z.enum().optional() 不接受
	// 空字串，會誤判成「填了但不合法」。先接受空字串再轉成 undefined，讓「保留預設
	// 選項不指定」這個最常見的操作能正常通過驗證
	placeType: z
		.union([z.enum(placeTypeValues), z.literal("")])
		.optional()
		.transform((v) => (v === "" ? undefined : v)),
	description: z.string().optional(),
	coverImageUrl: z.string().optional(), // 上傳後的 public URL
});

// z.input（而非 z.infer/z.output）：placeType 有 transform，表單實際持有的是
// transform 前的型別（含空字串），resolver 驗證通過後才會轉成 transform 後的型別
export type SpotItemInput = z.input<typeof spotItemSchema>;
