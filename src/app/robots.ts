import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// /admin、/profile：僅本人/管理員可見的管理頁面
// /login：無內容價值，且是所有需登入頁面的共同導向目標
// /concerts：個人紀錄管理頁（新增/編輯/我的列表），非公開瀏覽用途，公開內容走 /reviews
export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: ["/admin", "/profile", "/login", "/concerts"],
		},
		sitemap: `${siteUrl}/sitemap.xml`,
	};
}
