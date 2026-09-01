# ---------- build stage ----------
FROM node:22-trixie-slim AS build

WORKDIR /app

# refresh the image's bundled npm to pull in security fixes for its deps
RUN npm install -g npm@latest

COPY package*.json ./
RUN npm ci

COPY . .

# API base URL is baked in at build time (Vite inlines VITE_* vars).
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---------- runtime stage ----------
FROM nginx:1.29-alpine AS runtime

# apply pending Alpine security patches, and drop curl (unused by nginx serving
# static files; carries CVEs with no upstream fix yet)
RUN apk upgrade --no-cache && \
    apk --no-cache --purge del curl

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
