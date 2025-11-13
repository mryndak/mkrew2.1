# Deployment Guide - mkrew Frontend

## Overview

This guide covers deployment of the mkrew frontend application with RCKiK Details View to production environments.

---

## Table of Contents
1. [Environment Setup](#environment-setup)
2. [Build Process](#build-process)
3. [Deployment Platforms](#deployment-platforms)
4. [Environment Variables](#environment-variables)
5. [Monitoring & Analytics](#monitoring--analytics)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Rollback Procedures](#rollback-procedures)
8. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Environment Setup

### Development
```bash
# Local development server
npm run dev
# Runs on http://localhost:4321
```

### Staging
```bash
# Build for staging
npm run build

# Preview build
npm run preview
# Runs on http://localhost:4322
```

### Production
```bash
# Build optimized bundle
npm run build

# Deploy to hosting platform
# (Vercel, Netlify, Cloudflare Pages, etc.)
```

---

## Build Process

### 1. Pre-build Checks
```bash
# Run tests
npm test

# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Build
npm run build
```

### 2. Build Output
```
dist/
├── _astro/           # JS/CSS bundles
├── assets/           # Static assets
├── rckik/
│   └── [id]/        # Pre-rendered pages
├── index.html        # Entry point
└── 404.html          # 404 page
```

### 3. Build Optimization
**Astro automatically:**
- Minifies HTML/CSS/JS
- Optimizes images
- Generates source maps
- Splits code by route
- Tree-shakes unused code

---

## Deployment Platforms

### Vercel (Recommended)

**Setup:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Configuration**: `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "astro",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/$1"
    }
  ],
  "headers": [
    {
      "source": "/_astro/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**Features:**
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Automatic deployments from Git
- ✅ Preview deployments for PRs
- ✅ ISR support (5-minute revalidation)

---

### Netlify

**Setup:**
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

**Configuration**: `netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/404.html"
  status = 404

[[headers]]
  for = "/_astro/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

---

### Cloudflare Pages

**Setup:**
1. Connect GitHub repository
2. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Framework preset**: Astro

**Features:**
- ✅ Global edge network
- ✅ Unlimited bandwidth
- ✅ Free SSL
- ✅ Git-based deployments

---

### Docker (Self-hosted)

**Dockerfile:**
```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf:**
```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /_astro/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
}
```

**Deploy:**
```bash
# Build image
docker build -t mkrew-frontend:latest .

# Run container
docker run -d -p 80:80 \
  -e PUBLIC_API_BASE_URL=https://api.mkrew.pl \
  mkrew-frontend:latest
```

---

## Environment Variables

### .env.example
```bash
# API Configuration
PUBLIC_API_BASE_URL=http://localhost:8080/api/v1

# Feature Flags
PUBLIC_ENABLE_FAVORITES=true
PUBLIC_ENABLE_SCRAPER_STATUS=true
PUBLIC_ENABLE_ANALYTICS=false

# Analytics (Optional)
PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx

# Environment
PUBLIC_ENV=production
```

### Development (.env.development)
```bash
PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
PUBLIC_ENV=development
PUBLIC_ENABLE_ANALYTICS=false
```

### Staging (.env.staging)
```bash
PUBLIC_API_BASE_URL=https://api-staging.mkrew.pl/api/v1
PUBLIC_ENV=staging
PUBLIC_ENABLE_ANALYTICS=true
PUBLIC_GA_TRACKING_ID=G-STAGING-ID
```

### Production (.env.production)
```bash
PUBLIC_API_BASE_URL=https://api.mkrew.pl/api/v1
PUBLIC_ENV=production
PUBLIC_ENABLE_ANALYTICS=true
PUBLIC_GA_TRACKING_ID=G-PRODUCTION-ID
PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

**⚠️ Important:**
- Never commit `.env` files with secrets
- Use platform-specific env var management (Vercel/Netlify dashboard)
- Prefix public vars with `PUBLIC_` for Astro

---

## Monitoring & Analytics

### 1. Error Tracking - Sentry

**Installation:**
```bash
npm install @sentry/astro
```

**Configuration**: `astro.config.mjs`
```javascript
import { defineConfig } from 'astro/config';
import sentry from '@sentry/astro';

export default defineConfig({
  integrations: [
    sentry({
      dsn: import.meta.env.PUBLIC_SENTRY_DSN,
      environment: import.meta.env.PUBLIC_ENV,
      release: process.env.npm_package_version,
    }),
  ],
});
```

**Usage:**
```typescript
import * as Sentry from '@sentry/astro';

try {
  await fetchData();
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

---

### 2. Analytics - Google Analytics 4

**Installation:**
```bash
npm install @astrojs/partytown
```

**Configuration**: `astro.config.mjs`
```javascript
import partytown from '@astrojs/partytown';

export default defineConfig({
  integrations: [
    partytown({
      config: {
        forward: ['dataLayer.push'],
      },
    }),
  ],
});
```

**Component**: `src/components/Analytics.astro`
```astro
---
const gaId = import.meta.env.PUBLIC_GA_TRACKING_ID;
const enabled = import.meta.env.PUBLIC_ENABLE_ANALYTICS === 'true';
---

{enabled && gaId && (
  <>
    <script
      type="text/partytown"
      async
      src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
    />
    <script type="text/partytown">
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        dataLayer.push(arguments);
      }
      gtag('js', new Date());
      gtag('config', '{gaId}');
    </script>
  </>
)}
```

---

### 3. Performance Monitoring

**Web Vitals Tracking:**
```typescript
// src/lib/analytics/webVitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  const body = JSON.stringify(metric);
  const url = '/api/analytics';

  // Use `navigator.sendBeacon()` if available, falling back to `fetch()`
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, body);
  } else {
    fetch(url, { body, method: 'POST', keepalive: true });
  }
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

---

### 4. Uptime Monitoring

**Recommended Tools:**
- **Uptime Robot**: https://uptimerobot.com (Free tier available)
- **Pingdom**: https://www.pingdom.com
- **Better Uptime**: https://betteruptime.com

**Setup:**
1. Add monitoring for `https://mkrew.pl`
2. Add monitoring for `/rckik/1` (dynamic page)
3. Add monitoring for `/api/health` (backend)
4. Configure alerts (email, Slack, SMS)
5. Set check interval: 1-5 minutes

---

## CI/CD Pipeline

### GitHub Actions

**File**: `.github/workflows/deploy.yml`
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # Test job
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Run tests
        working-directory: ./frontend
        run: npm test

      - name: Type check
        working-directory: ./frontend
        run: npx tsc --noEmit

  # Build job
  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Build
        working-directory: ./frontend
        run: npm run build
        env:
          PUBLIC_API_BASE_URL: ${{ secrets.API_BASE_URL }}
          PUBLIC_ENV: production

      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: frontend/dist

  # Deploy job (only on main branch)
  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://mkrew.pl
    steps:
      - name: Download artifact
        uses: actions/download-artifact@v3
        with:
          name: dist
          path: dist

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./dist

      - name: Notify deployment
        if: success()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Frontend deployed to production 🚀'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Rollback Procedures

### Vercel
```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback <deployment-url>
```

### Netlify
```bash
# List deployments
netlify deploy:list

# Rollback to specific deployment
netlify deploy --alias <deployment-id>
```

### Docker
```bash
# Pull previous version
docker pull mkrew-frontend:v1.0.0

# Stop current container
docker stop mkrew-frontend

# Start previous version
docker run -d --name mkrew-frontend \
  -p 80:80 mkrew-frontend:v1.0.0
```

---

## Post-Deployment Checklist

### Immediate Checks (within 5 minutes)
- [ ] Site is accessible (https://mkrew.pl)
- [ ] Home page loads correctly
- [ ] RCKiK list page works (/rckik)
- [ ] RCKiK details page works (/rckik/1)
- [ ] API calls succeed (check Network tab)
- [ ] No console errors
- [ ] SSL certificate valid
- [ ] CDN caching working

### Functional Tests (within 30 minutes)
- [ ] Search functionality works
- [ ] Filters work (blood group, date range)
- [ ] Pagination works
- [ ] Chart displays correctly
- [ ] Table sorting works
- [ ] Favorite toggle works (authenticated)
- [ ] Mobile responsiveness works
- [ ] Breadcrumbs navigation works

### Performance Checks
- [ ] Lighthouse score > 90
- [ ] FCP < 1.8s
- [ ] TTI < 3.5s
- [ ] LCP < 2.5s
- [ ] No layout shifts (CLS < 0.1)

### Monitoring Setup
- [ ] Sentry receiving events
- [ ] Google Analytics tracking pageviews
- [ ] Uptime monitoring active
- [ ] Error alerts configured
- [ ] Performance monitoring active

### Documentation
- [ ] Deployment notes recorded
- [ ] Known issues documented
- [ ] Rollback plan confirmed
- [ ] Team notified

---

## Troubleshooting

### Issue: Build fails with "Module not found"
**Solution**: Clear node_modules and reinstall
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

### Issue: Environment variables not working
**Solution**:
1. Ensure vars are prefixed with `PUBLIC_`
2. Rebuild after env var changes
3. Check platform-specific env var settings

---

### Issue: 404 on dynamic routes
**Solution**: Configure rewrites/redirects in platform config

---

### Issue: Slow page loads
**Solution**:
1. Check CDN caching headers
2. Verify image optimization
3. Check bundle size (npm run build --report)
4. Enable compression (gzip/brotli)

---

## Security Checklist

- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] API endpoints use CORS properly
- [ ] No sensitive data in console.log
- [ ] No secrets in environment variables
- [ ] Content Security Policy configured
- [ ] XSS protection enabled
- [ ] CSRF protection on API

---

## Support & Escalation

### On-Call Rotation
- **Primary**: DevOps Team
- **Secondary**: Frontend Team
- **Escalation**: Tech Lead

### Contact Methods
- **Slack**: #mkrew-alerts
- **Email**: devops@mkrew.pl
- **Phone**: Emergency only

---

**Last Updated**: January 2025
**Version**: 2.1.0
**Maintained by**: DevOps Team
