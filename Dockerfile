FROM node:22-alpine AS node_modules
WORKDIR /app
COPY package-lock.json package.json ./
RUN npm ci
COPY . .

FROM node_modules AS prod_builder
ARG VITE_GAME_NAME=Wordle
ARG VITE_GAME_DESCRIPTION=Wordle auf Deutsch
ENV VITE_GAME_NAME=$VITE_GAME_NAME
ENV VITE_GAME_DESCRIPTION=$VITE_GAME_DESCRIPTION
RUN npm run build

## Production image
FROM nginx:1.28-alpine AS prod
COPY docker/etc/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf
COPY --from=prod_builder /app/dist /usr/share/nginx/html
COPY docker/build_system.sh .
RUN chmod +x build_system.sh && \
    ./build_system.sh && \
    rm build_system.sh
# Port used by Nginx within the Docker network (Traefik proxies here).
EXPOSE 8080
USER wordle

## Development image
FROM node_modules AS dev
EXPOSE 3000
CMD npm run dev -- --host 0.0.0.0 --port 3000
