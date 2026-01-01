# Build Stage
FROM node:20-alpine as build

WORKDIR /app

# Copy package files separately to leverage caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Serve Stage
FROM nginx:alpine

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built artifacts from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
