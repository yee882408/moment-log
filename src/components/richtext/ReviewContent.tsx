import type { ReactElement } from "react";
import { Card } from "@/components/ui/Card";
import { sanitizeReviewHtml } from "@/lib/richtext/sanitize";
import { looksLikeHtml } from "@/lib/richtext/plainText";

interface ReviewContentProps {
	review: string;
	// card（預設）＝ /reviews/[id] 用的白底圓角卡片；plain ＝ /concerts/[id] 雜誌風
	// 用的無邊框襯線排版（見 globals.css 的 .article 規則），兩者互不影響
	variant?: "card" | "plain";
}

// 心得內文的顯示元件：資料庫裡新舊格式並存（舊資料是純文字、新資料是 Tiptap
// 輸出的 HTML），用 looksLikeHtml 判斷走哪個渲染路徑。HTML 內容即使寫入時
// 已經 sanitize 過，顯示端仍再過一次 sanitizeReviewHtml（縱深防禦，避免未來
// 其他寫入路徑忘記做這一步時完全沒有防線）
export function ReviewContent({ review, variant = "card" }: ReviewContentProps): ReactElement {
	if (variant === "plain") {
		if (!looksLikeHtml(review)) {
			return <p className="article article-drop whitespace-pre-wrap">{review}</p>;
		}
		const safeHtml = sanitizeReviewHtml(review);
		return (
			<div
				className="article rich-text article-drop"
				dangerouslySetInnerHTML={{ __html: safeHtml }}
			/>
		);
	}

	if (!looksLikeHtml(review)) {
		return (
			<Card className="whitespace-pre-wrap text-sm leading-7 text-foreground">{review}</Card>
		);
	}

	const safeHtml = sanitizeReviewHtml(review);
	return (
		<Card
			className="rich-text text-sm leading-7 text-foreground"
			dangerouslySetInnerHTML={{ __html: safeHtml }}
		/>
	);
}
