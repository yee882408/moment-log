import { createClient } from "@/lib/supabase/client";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB，需與 Storage bucket 設定一致

export type UploadImageResult = { url: string } | { error: string };

// 共用的圖片上傳邏輯，供 ImageUpload（封面圖選擇器）與 ReviewEditor（心得內文
// 貼上/拖曳圖片）共用，避免兩處各自維護一份幾乎一樣的上傳流程
export async function uploadImageToBucket(bucket: string, file: File): Promise<UploadImageResult> {
	// 前端先擋（Storage policy 是最終防線）
	if (!file.type.startsWith("image/")) {
		return { error: "只能上傳圖片" };
	}
	if (file.size > MAX_SIZE) {
		return { error: "檔案需小於 5MB" };
	}

	const supabase = createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return { error: "尚未登入" };
	}

	// 路徑第一段 = uid，才符合 Storage RLS（各 bucket 的 xxx_insert_own policy）
	const ext = file.name.split(".").pop() ?? "jpg";
	const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
	const { error: upErr } = await supabase.storage.from(bucket).upload(path, file);
	if (upErr) {
		return { error: upErr.message };
	}

	const { data } = supabase.storage.from(bucket).getPublicUrl(path);
	return { url: data.publicUrl };
}
