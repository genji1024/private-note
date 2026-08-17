# Multi-stage Dockerfile for private-note (Next.js 14 App Router)
#
# Stage 1  — deps    : install all dependencies (dev + prod) for the build
# Stage 2  — builder : run `next build` (standalone output)
# Stage 3  — runner  : minimal production image, runs `.next/standalone/server.js`
#
# The runner runs as non-root user `nextjs:nodejs`.

# ---- Stage 1: deps ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- Stage 2: builder ----
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_* values are inlined at build time. Provide them as build args
# with empty defaults so the image is always buildable; docker-compose passes
# real values via `build.args`.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ARG NEXT_PUBLIC_BASE_PATH
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY \
    NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY \
    NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Stage 3: runner ----
FROM node:22-alpine AS runner
WORKDIR /app
# PORT は .env（docker-compose の build.args）が単一の情報源で、デフォルト値は持たない。
# 単独で `docker build` する場合は `--build-arg PORT=<port>` を必ず指定すること。
ARG PORT
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=$PORT \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Only the standalone output is needed for the app itself.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Static assets and public files are served directly by the standalone server.
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE $PORT

# busybox wget (included in alpine) is used for the health check.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:$PORT/ || exit 1

CMD ["node", "server.js"]
