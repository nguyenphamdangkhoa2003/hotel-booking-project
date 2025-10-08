FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm i --frozen-lockfile


FROM node:20-alpine AS build
WORKDIR /app
COPY . .
RUN corepack enable && pnpm i --frozen-lockfile && pnpm build


FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build . .
EXPOSE 3000
CMD ["pnpm","start"]