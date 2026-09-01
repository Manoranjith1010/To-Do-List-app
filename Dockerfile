# ---------- build stage ----------
FROM node:20-slim AS build

WORKDIR /app

# openssl is required by Prisma; build-essential/python3 by argon2 (native addon)
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends openssl python3 build-essential && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# drop dev dependencies for the runtime image
RUN npm prune --omit=dev

# ---------- runtime stage ----------
FROM node:20-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update -y && \
    apt-get install -y --no-install-recommends openssl && \
    rm -rf /var/lib/apt/lists/*

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
COPY docker/api-entrypoint.sh /usr/local/bin/api-entrypoint.sh
RUN chmod +x /usr/local/bin/api-entrypoint.sh

# run as the built-in non-root user
USER node

EXPOSE 3000

ENTRYPOINT ["api-entrypoint.sh"]
CMD ["node", "dist/server.js"]
