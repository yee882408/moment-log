import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_TC } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import "./globals.css";

// 全站唯一字體：中文顯示穩定、字重齊全，取代原本 Geist Sans + 各處手刻 Georgia 的混用狀態
const notoSansTC = Noto_Sans_TC({
	variable: "--font-noto-sans-tc",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700", "800"],
});

// 保留 Geist Mono：票根風卡片的等距字體效果（ReviewGrid 票號）用途，非內文字體
const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const siteName = "moment-log";
const defaultTitle = "moment-log｜演唱會紀錄平台";
const defaultDescription = "記錄每一場演唱會的回憶，心得與評分可選擇公開分享。";

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl),
	title: {
		default: defaultTitle,
		template: `%s | ${siteName}`,
	},
	description: defaultDescription,
	openGraph: {
		type: "website",
		locale: "zh_TW",
		siteName,
		title: defaultTitle,
		description: defaultDescription,
	},
	twitter: {
		card: "summary_large_image",
		title: defaultTitle,
		description: defaultDescription,
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="zh-TW"
			className={`${notoSansTC.variable} ${geistMono.variable} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col">
				{children}
				<Toaster position="top-center" richColors />
				<Analytics />
			</body>
		</html>
	);
}
