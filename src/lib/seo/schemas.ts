import type { PublicReviewDetail } from "@/lib/data/reviews";
import type { SpotListWithItems } from "@/lib/data/spots";

// Review schema：itemReviewed 用 Event 描述被評論的演唱會本身，
// reviewRating 選填（使用者可以不評分），沒有評分就不放這個欄位，
// 避免 Google Rich Results 拿到不存在的評分資料
export function buildReviewJsonLd(review: PublicReviewDetail): object {
	return {
		"@context": "https://schema.org",
		"@type": "Review",
		itemReviewed: {
			"@type": "Event",
			name: review.title,
			startDate: review.date,
			location: {
				"@type": "Place",
				name: review.venue_name,
			},
			performer: {
				"@type": "MusicGroup",
				name: review.artist,
			},
		},
		author: {
			"@type": "Person",
			name: review.author ?? "匿名",
		},
		...(review.rating != null && {
			reviewRating: {
				"@type": "Rating",
				ratingValue: review.rating,
				bestRating: 5,
				worstRating: 1,
			},
		}),
		...(review.review && { reviewBody: review.review }),
	};
}

// ItemList schema：清單底下每個地點視為一個 ItemListElement，
// itemListElement 需要 position（1-based）才符合規範
export function buildSpotListJsonLd(list: SpotListWithItems): object {
	return {
		"@context": "https://schema.org",
		"@type": "ItemList",
		name: list.title,
		description: list.description ?? undefined,
		itemListElement: list.items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			item: {
				"@type": "Place",
				name: item.place_name,
				description: item.description ?? undefined,
			},
		})),
	};
}
