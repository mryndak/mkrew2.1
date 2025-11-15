# Multi-stage build for Astro application

# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# Build arguments for PUBLIC_ prefixed environment variables
# These are injected at BUILD TIME by Astro/Vite
ARG PUBLIC_API_BASE_URL=https://api.mkrew.pl/api/v1
ARG PUBLIC_SITE_URL=https://mkrew.pl
ARG PUBLIC_ENV=production
ARG PUBLIC_APP_VERSION=2.1.0
ARG PUBLIC_ENABLE_FAVORITES=true
ARG PUBLIC_ENABLE_SCRAPER_STATUS=true
ARG PUBLIC_ENABLE_ANALYTICS=true
ARG PUBLIC_RECAPTCHA_SITE_KEY
ARG PUBLIC_GA_TRACKING_ID
ARG PUBLIC_SENTRY_DSN
ARG PUBLIC_SENTRY_ENVIRONMENT=production
ARG PUBLIC_CACHE_DURATION=300000
ARG PUBLIC_API_TIMEOUT=30000

# Set environment variables for build
ENV PUBLIC_API_BASE_URL=$PUBLIC_API_BASE_URL
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL
ENV PUBLIC_ENV=$PUBLIC_ENV
ENV PUBLIC_APP_VERSION=$PUBLIC_APP_VERSION
ENV PUBLIC_ENABLE_FAVORITES=$PUBLIC_ENABLE_FAVORITES
ENV PUBLIC_ENABLE_SCRAPER_STATUS=$PUBLIC_ENABLE_SCRAPER_STATUS
ENV PUBLIC_ENABLE_ANALYTICS=$PUBLIC_ENABLE_ANALYTICS
ENV PUBLIC_RECAPTCHA_SITE_KEY=$PUBLIC_RECAPTCHA_SITE_KEY
ENV PUBLIC_GA_TRACKING_ID=$PUBLIC_GA_TRACKING_ID
ENV PUBLIC_SENTRY_DSN=$PUBLIC_SENTRY_DSN
ENV PUBLIC_SENTRY_ENVIRONMENT=$PUBLIC_SENTRY_ENVIRONMENT
ENV PUBLIC_CACHE_DURATION=$PUBLIC_CACHE_DURATION
ENV PUBLIC_API_TIMEOUT=$PUBLIC_API_TIMEOUT

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application with injected environment variables
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine AS runtime
WORKDIR /app

# Create non-root user
RUN addgroup -S astro && adduser -S astro -G astro

# Copy built assets from build stage
COPY --from=build --chown=astro:astro /app/dist ./dist
COPY --from=build --chown=astro:astro /app/node_modules ./node_modules
COPY --from=build --chown=astro:astro /app/package.json ./package.json

# Switch to non-root user
USER astro:astro

# Expose port
EXPOSE 4321

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "require('http').get('http://localhost:4321', (r) => {if (r.statusCode !== 200) process.exit(1)})" || exit 1

# Run application
CMD ["node", "./dist/server/entry.mjs"]
