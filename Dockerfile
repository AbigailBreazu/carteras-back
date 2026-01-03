FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# Ensure uploads folder exists so later stage can COPY it even if empty
RUN mkdir -p /usr/src/app/uploads

# Install deps and build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /usr/src/app

# Production dependencies
COPY package*.json ./
RUN npm ci --production

# Copy built app
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/uploads ./uploads

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/src/main.js"]
