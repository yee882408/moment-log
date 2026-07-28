// 留言時間戳等場景用的簡易相對時間格式化，不引入額外套件（date-fns/dayjs）
// 只為了這種輕量需求。超過 30 天直接顯示日期，避免「N 個月前」這種粗略區間
export function formatRelativeTime(isoString: string): string {
	const diffMs = Date.now() - new Date(isoString).getTime();
	const diffMinutes = Math.floor(diffMs / 60_000);

	if (diffMinutes < 1) {
		return "剛剛";
	}
	if (diffMinutes < 60) {
		return `${diffMinutes} 分鐘前`;
	}
	const diffHours = Math.floor(diffMinutes / 60);
	if (diffHours < 24) {
		return `${diffHours} 小時前`;
	}
	const diffDays = Math.floor(diffHours / 24);
	if (diffDays < 30) {
		return `${diffDays} 天前`;
	}
	return new Date(isoString).toLocaleDateString("zh-TW");
}
