---
name: vercel-deploy
description: Checklist and best practices for deploying Next.js applications to Vercel. Use this skill when setting up a new project for Vercel deployment, troubleshooting deploy failures, configuring environment variables, setting up git-push-to-deploy workflows, or debugging Vercel serverless function issues (timeouts, cold starts, API route errors). Also trigger when the user mentions "deploy", "Vercel", "production", "push to prod", or encounters build/deploy errors.
---

# Vercel Deployment Skill

## Deploy-First Philosophy

Always deploy the skeleton BEFORE building features. The workflow is: scaffold → deploy empty app → build features → push incrementally. Every feature branch should end with a working deploy. Never accumulate undeployed changes.

## Initial Setup Checklist

### 1. Scaffold and Connect

```bash
# Create Next.js app
npx create-next-app@latest project-name --typescript --tailwind --app --eslint

# Initialize git and push to GitHub
cd project-name
git init
git add .
git commit -m "chore: scaffold Next.js app"
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

Then connect in Vercel:
- Go to vercel.com/new
- Import the GitHub repository
- Vercel auto-detects Next.js — accept defaults
- Click Deploy

Your app is now live. Every `git push origin main` triggers a new deploy automatically.

### 2. Environment Variables

Set these in Vercel Dashboard → Project → Settings → Environment Variables. Mark each for the appropriate environment (Production, Preview, Development).

Never commit `.env` files. Always use `.env.local` for local development and add it to `.gitignore`.

For local dev, create `.env.local`:
```
API_KEY=your-api-key
DATABASE_URL=your-database-url
OTHER_SECRET=your-secret
```

In Vercel, add the same keys via the dashboard. These are injected at build time and runtime.

To access in API routes (server-side only):
```typescript
const apiKey = process.env.API_KEY;
```

For client-side access (rarely needed, be careful with secrets):
```typescript
// Prefix with NEXT_PUBLIC_ — this exposes the value to the browser
const publicValue = process.env.NEXT_PUBLIC_SOME_VALUE;
```

Never prefix API keys with `NEXT_PUBLIC_`. They must stay server-side.

### 3. API Routes (App Router)

Create server-side API endpoints in `app/api/`:

```typescript
// app/api/query/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();
    // Your logic here
    return NextResponse.json({ answer: "response" });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Common Gotchas

### Serverless Function Timeout
Vercel's free tier has a 10-second timeout for serverless functions. If your API route involves multiple external calls (e.g., database query + LLM generation), you may hit a 504 error.

Mitigations:
- Use faster models or services where possible
- Reduce the number of sequential external calls
- Stream responses instead of waiting for full completion
- If all else fails, upgrade to Vercel Pro (25-second timeout)

### Build Failures
Common causes:
- TypeScript errors that pass locally but fail in strict mode
- Missing environment variables (build-time vs runtime)
- Dependencies not in `package.json` (installed globally on your machine)

Always test with `npm run build` locally before pushing.

### Environment Variable Issues
- Variables added after deploy require a redeployment to take effect
- Use `vercel env pull` to sync Vercel env vars to local `.env.local`
- Server-side API routes can access all env vars; client components can only access `NEXT_PUBLIC_` prefixed vars

## Deploy Workflow

The standard cycle for shipping features:

```bash
# 1. Make changes locally
# 2. Test locally
npm run dev

# 3. Build check
npm run build

# 4. Commit and push
git add .
git commit -m "feat(scope): description"
git push origin main

# 5. Verify deploy
# Check Vercel dashboard or visit your URL
```

## Debugging Deploys

If a deploy fails:
1. Check Vercel Dashboard → Deployments → click the failed deploy → read the build log
2. Check Functions tab for runtime errors
3. Reproduce locally with `npm run build` (catches most issues)
4. Check that all required env vars are set in Vercel dashboard
