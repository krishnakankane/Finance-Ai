# Finova — AI Personal Finance

A full-stack personal finance app with AI insights.

## Stack
- **Frontend:** React 19 + Vite, Tailwind v4, shadcn/ui, Recharts, wouter, Clerk auth, jsPDF.
- **Backend:** Express (api-server artifact) with OpenAPI-driven typed client.
- **DB:** Drizzle + Postgres. Schemas in `lib/db/src/schema`.
- **AI:** OpenAI (gpt-5.2) via Replit AI proxy through `@workspace/integrations-openai-ai-server`.

## Artifacts
- `artifacts/finance` — web app (path `/`)
- `artifacts/api-server` — REST API (path `/api`)
- `artifacts/mockup-sandbox` — component preview

## Features
- Clerk authentication (sign-in screen with gradient hero).
- Dashboard: balance / income / expense / savings stat cards, cash flow area chart, category pie chart, recent transactions, budget progress, welcome CTA.
- Transactions: CRUD with AI auto-categorize, search + type/category filters.
- Budgets: monthly upsert per category, progress bars, over-budget warnings, auto notifications.
- Goals: CRUD with progress.
- AI Insights: cached summary/suggestions/forecast with manual refresh, gated until ≥2 months of expense data.
- Reports: monthly bar (last 6 months) + weekly bar with PDF download.
- Notifications: budget-threshold alerts with mark-as-read.
- Settings: profile, currency, monthly income, theme toggle.
- Dark/light mode (persisted).
- Empty states everywhere — no fake data.

## Money handling
All amounts stored as integer **cents**. UI uses `formatMoney` / `parseMoneyToCents` helpers (`src/lib/format.ts`).

## Categories
Expenses limited to: Food, Travel, Bills, Shopping, Others (`src/lib/categories.ts`).

## Auth wiring
`@clerk/react` v6 — does NOT export `SignedIn`/`SignedOut`. Use `useAuth().isSignedIn` plus `ClerkLoaded`/`ClerkLoading`. `UserButton` does not accept `afterSignOutUrl` (set on `ClerkProvider` instead).
API client base URL set to `/api` and Clerk session token injected via `setAuthTokenGetter`.

## Required secrets
- `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- `DATABASE_URL`
- OpenAI proxy is auto-configured by integrations.
