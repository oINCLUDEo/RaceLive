# --- builder: Debian-базированный образ (glibc) — надёжнее Alpine/musl для next SWC ---
FROM node:20-slim AS builder
WORKDIR /app
# Лок-файл НЕ копируем: он сгенерирован на Windows и мешает npm ставить linux-бинарь next.
# Версии в package.json запиннены точно, поэтому свежий resolve детерминирован.
COPY package.json ./
# Ретраи и таймауты — чтобы транзиентный сетевой/DNS-блип не убивал длинную установку.
RUN npm install --no-audit --no-fund \
    --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000
# санити-проверка: next установлен и вызывается (иначе падаем с понятной ошибкой, а не на build)
RUN test -x node_modules/.bin/next && node_modules/.bin/next --version
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- runner: тот же glibc-образ, только standalone-вывод ---
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
