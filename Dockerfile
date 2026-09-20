# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
ENV NODE_ENV=production
RUN npm run build

# Runtime stage — Next.js standalone
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Next.js standalone server binds to $HOSTNAME; force all interfaces so
# localhost/healthcheck/Traefik can reach it (default would be the container id).
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
RUN apk add --no-cache openssl
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
# Prisma CLI + engines for migrate deploy at startup
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
# Roster seed (prisma/seed.mjs) imports this at deploy time; standalone omits src/
COPY --from=builder /app/src/app/appData.js ./src/app/appData.js
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh
EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
