import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Docker 部署用：只打包 runtime 實際需要的檔案到 .next/standalone
	output: "standalone",
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
