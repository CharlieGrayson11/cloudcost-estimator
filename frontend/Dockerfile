# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built frontend
COPY --from=builder /app/dist /usr/share/nginx/html

# Correct nginx template location and name
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Backend URL (overridden in ACA)
ENV BACKEND_URL=http://backend:8000

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
