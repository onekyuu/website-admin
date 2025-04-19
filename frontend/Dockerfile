# frontend/Dockerfile
FROM node:22-alpine AS builder

WORKDIR /app
COPY . .
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install && pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app ./
RUN corepack enable && corepack prepare pnpm@latest --activate
EXPOSE 3000
CMD ["pnpm", "start"]