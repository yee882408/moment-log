import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// standalone 輸出只給 Docker 部署用；Vercel 有自己的打包機制，
	// 設定 standalone 反而會讓 Vercel 找不到頁面路由（回 404），
	// 用 BUILD_STANDALONE 這個環境變數只在 Dockerfile 裡的 build 開啟它
	...(process.env.BUILD_STANDALONE === "true" ? { output: "standalone" as const } : {}),
	images: {
		// 允許 next/image 載入 Supabase Storage 的公開圖片
		remotePatterns: [
			{
				protocol: "https",
				hostname: "gjjafasaogmxodaedzri.supabase.co",
				pathname: "/storage/v1/object/public/**",
			},
		],
	},
};

export default nextConfig;
