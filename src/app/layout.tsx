import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

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
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col">
				{children}
				<Toaster position="top-center" richColors />
				<Analytics />
			</body>
		</html>
	);
}
