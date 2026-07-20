FROM node:22-alpine AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

FROM node:22-alpine AS prod
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app && mkdir -p /data && chown app:app /data
COPY --from=deps /app/node_modules ./node_modules
COPY package.json index.js ./
ENV PORT=3001
ENV DB_PATH=/data/leaderboard.db
EXPOSE 3001
USER app
CMD ["node", "index.js"]
