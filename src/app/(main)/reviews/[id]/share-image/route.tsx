import type { ReactElement } from "react";
import { ImageResponse } from "next/og";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicReviewById } from "@/lib/data/reviews";

export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;

interface RouteParams {
	params: Promise<{ id: string }>;
}

// Satori 預設字型不含 ★/☆ 這類符號字元（會渲染成方框），改用行內 SVG 畫星星，不依賴字型
function StarIcon({ filled }: { filled: boolean }): ReactElement {
	return (
		<svg width="32" height="32" viewBox="0 0 24 24" style={{ display: "flex" }}>
			<path
				d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.2l7.1-.6z"
				fill={filled ? "#f59e0b" : "#e4e4e7"}
			/>
		</svg>
	);
}

function RatingStars({ rating }: { rating: number }): ReactElement {
	return (
		<div style={{ display: "flex", gap: 4 }}>
			{Array.from({ length: 5 }, (_, i) => (
				<StarIcon key={i} filled={i < rating} />
			))}
		</div>
	);
}

// 產生一篇公開心得的分享卡片圖片（1200x630，OG 圖片標準比例）
// 只回傳呼叫者請求的內容，不需要登入：跟 /reviews/[id] 本身一樣是公開資料
export async function GET(
	_request: NextRequest,
	{ params }: RouteParams,
): Promise<NextResponse | ImageResponse> {
	const { id } = await params;
	const review = await getPublicReviewById(id);
	if (!review) {
		return new NextResponse(null, { status: 404 });
	}

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					backgroundColor: "#ffffff",
					fontFamily: "sans-serif",
				}}
			>
				{review.cover_image_url ? (
					// eslint-disable-next-line @next/next/no-img-element -- Satori 只吃純 <img>，不能用 next/image
					<img
						src={review.cover_image_url}
						alt=""
						width={WIDTH}
						height={360}
						style={{ width: WIDTH, height: 360, objectFit: "cover" }}
					/>
				) : (
					<div
						style={{
							width: WIDTH,
							height: 360,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							backgroundColor: "#eef2ff",
							fontSize: 96,
						}}
					>
						🎤
					</div>
				)}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						flex: 1,
						padding: "40px 56px",
						gap: 12,
					}}
				>
					<div style={{ display: "flex", fontSize: 56, fontWeight: 700, color: "#18181b" }}>
						{review.title}
					</div>
					<div style={{ display: "flex", fontSize: 32, color: "#52525b" }}>{review.artist}</div>
					<div style={{ display: "flex", fontSize: 24, color: "#71717a" }}>
						{review.venue_name} · {review.date}
					</div>
					{review.rating != null && <RatingStars rating={review.rating} />}
				</div>
			</div>
		),
		{
			width: WIDTH,
			height: HEIGHT,
			headers: {
				"Cache-Control": "public, max-age=3600",
			},
		},
	);
}
