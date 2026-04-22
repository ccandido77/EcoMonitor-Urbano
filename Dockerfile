FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS build
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/db.ts ./db.ts
COPY --from=build /app/schema.ts ./schema.ts
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/shared ./shared
EXPOSE 3001
ENV NODE_ENV=production
CMD ["npx", "tsx", "server/index.ts"]
