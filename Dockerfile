# ---------- build stage ----------
FROM node:22-trixie-slim AS build

WORKDIR /app

# refresh the image's bundled npm to pull in security fixes for its deps
# (tar, minimatch, brace-expansion, ip-address, ...)
RUN npm install -g npm@latest

# openssl is required by Prisma; build-essential/python3 by argon2 (native addon)
RUN apt-get update -y && \
    apt-get -y upgrade && \
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
FROM node:22-trixie-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update -y && \
    apt-get -y upgrade && \
    apt-get install -y --no-install-recommends openssl && \
    rm -rf /var/lib/apt/lists/*

# the runtime only runs `node dist/server.js` and never needs npm; removing the
# globally bundled npm drops its vulnerable transitive deps from the final image
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

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
