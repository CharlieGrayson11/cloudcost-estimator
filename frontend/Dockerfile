# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx template
COPY nginx.conf.template /etc/nginx/templates/nginx.conf.template

# Default backend URL for local Docker Compose
ENV BACKEND_URL=http://backend:8000

# nginx template engine uses this to know where to output
ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]