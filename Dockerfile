# Stage 1 — build (runs natively, handles all npm operations)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build && npm prune --omit=dev

# Stage 2 — runtime (no npm calls, avoids QEMU cross-compilation issues)
FROM node:20-alpine
RUN apk add --no-cache socat
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./
USER node
ENTRYPOINT ["node", "dist/index.js"]
