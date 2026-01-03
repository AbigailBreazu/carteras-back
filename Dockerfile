FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# Install deps and build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /usr/src/app

# Production dependencies
COPY package*.json ./
RUN npm ci --production

# Copy built app
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/uploads ./uploads

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main"]
