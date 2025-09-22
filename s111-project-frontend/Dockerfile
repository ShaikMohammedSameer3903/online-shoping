# syntax=docker/dockerfile:1

# ---- Build stage: compile static assets with Vite ----
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Build
COPY . .
RUN npm run build

# ---- Runtime stage: serve with Nginx ----
FROM nginx:alpine

# Replace default server config with SPA-friendly routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx","-g","daemon off;"]
