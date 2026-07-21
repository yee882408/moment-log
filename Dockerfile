# --- deps：只裝依賴，靠 layer cache 避免每次重新下載套件 ---
FROM node:22-alpine AS deps

WORKDIR /app

# 啟用 corepack 讓 pnpm 版本跟專案 lockfile 對齊
RUN corepack enable

# 只複製 lockfile 相關檔案；只要它們沒變，下面 RUN 這層就會被 Docker cache 命中
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# --- builder：組合原始碼 + 依賴，跑 next build 產出 .next/standalone ---
FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable

# 從 deps 階段拿裝好的 node_modules，不用重新 install
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV BUILD_STANDALONE=true
RUN pnpm build

# --- runner：最終部署用的乾淨 image，只放 standalone 產物 ---
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# 不用 root 執行應用程式，降低容器被入侵後的權限風險
RUN addgroup --system --gid 1001 nodejs \
	&& adduser --system --uid 1001 nextjs

# public/ 跟 .next/static 不含在 standalone 產物內，要另外複製
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
