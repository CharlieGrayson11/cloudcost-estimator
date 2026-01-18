# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM nginx:alpine

# Copy built frontend
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config template
COPY default.conf.template /etc/nginx/templates/default.conf.template

# Default backend URL (overridden in Azure via env var)
ENV BACKEND_URL=http://backend:8000

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
