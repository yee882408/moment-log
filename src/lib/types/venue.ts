// geocoding 搜尋結果（型別獨立放，因為 "use server" 檔只能 export async function）
export interface VenueResult {
	label: string; // 完整地址（Nominatim display_name）
	lat: number;
	lng: number;
}
