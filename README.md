# moment-log 🎤

記錄每一場演唱會的回憶，心得與評分可選擇公開分享的個人演唱會紀錄平台。

## 功能

- **個人紀錄**：新增/編輯演唱會紀錄（場館、藝人、票價、評分、心得），可選擇公開或私密
- **心得分享**：瀏覽他人公開的演唱會心得，支援全文搜尋（Postgres tsvector）、標籤篩選、多種排序
- **互動**：留言、按讚、追蹤其他使用者
- **標籤系統**：自由新增標籤並附加到紀錄，支援 autocomplete
- **通知**：追蹤/留言/按讚的站內通知
- **個人統計**：總場次、花費、評分、常去場館/藝人排行、標籤分佈、月度趨勢、年度回顧、票價統計、場次間隔統計
- **分享卡片**：把公開心得產生可下載的圖卡（`next/og` 的 `ImageResponse`）
- **追星地圖**：建立地點清單（場館周邊景點、餐廳等），可公開分享，支援地圖顯示
- **後台管理**：管理員可維護演唱會範本、管理使用者角色/停權

## 技術棧

- [Next.js 16](https://nextjs.org)（App Router、Server Components、Server Actions）
- [TypeScript](https://www.typescriptlang.org)
- [Supabase](https://supabase.com)（Postgres、Auth、Storage、RLS）
- [Tailwind CSS 4](https://tailwindcss.com) + [Radix UI](https://www.radix-ui.com)
- [react-hook-form](https://react-hook-form.com) + [Zod](https://zod.dev)
- [Recharts](https://recharts.org)（統計圖表）
- [Playwright](https://playwright.dev)（E2E 測試）
- Cloudflare Turnstile（登入/註冊人機驗證）

## 開始使用

### 安裝依賴

```bash
pnpm install
```

### 環境變數

複製 `.env.local.example` 為 `.env.local`，填入 Supabase 專案與 Cloudflare Turnstile 的金鑰。

### 資料庫

`supabase/schema.sql`、`supabase/storage.sql` 是完整的資料庫 schema（資料表、RLS policy、RPC function），貼到 Supabase Dashboard 的 SQL Editor 執行即可初始化資料庫。

### 開發

```bash
pnpm dev
```

開啟 [http://localhost:3000](http://localhost:3000) 查看結果。

### 型別檢查 / Lint / 測試

```bash
npx tsc --noEmit
pnpm lint
pnpm exec playwright test
```

## 部署

專案設定 `output: "standalone"`，可用附帶的 `Dockerfile` 建置容器，或直接部署到 [Vercel](https://vercel.com)。CI（`.github/workflows/ci.yml`）會在 push/PR 時自動執行型別檢查與 lint。
