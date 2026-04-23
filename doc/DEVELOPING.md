# Developing

Developer setup and day-to-day workflow for `cetrack-frontend-v2`.

## Prerequisites

- Node.js ≥ 20
- npm (comes with Node)
- A running backend on `http://localhost:8080` (see [cetrack-backend](https://github.com/cetracker/cetrack-backend))

## First-time setup

```bash
git clone <this-repo>
cd cetrack-frontend-v2
npm install
```

## Running the dev server

```bash
npm run dev
```

The dev server runs on `http://localhost:3002` and proxies all `/api/*` requests to `http://localhost:8080` (the backend). Configure the target in `vite.config.ts` if the backend runs elsewhere.

### Environment variables

- `VITE_API_BASE_URL` — base path for the API. Defaults to `/api` (behind the Vite proxy in development, behind the nginx reverse proxy in production).

Override per environment via `.env.development`, `.env.production`, or `.env.local` (untracked).

## Backend profiles

For development the backend is usually run with the `h2db` or `demo` Spring profile:

```bash
# from the cetrack-backend directory
./gradlew bootRun -Dspring.profiles.active=demo
```

The `demo` profile seeds sample data — useful when working on list / grouping / filtering UI.

## Useful scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Full type-check (`tsc -b`) + production bundle |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run lint` | ESLint (fails on any warning, same rule as CI) |
| `npm run typecheck` | `tsc --noEmit` |

## Project layout

```
src/
├── main.tsx                  # React entry
├── App.tsx                   # Theme + providers (ColorMode, Query, Notify, Router)
├── router.tsx                # react-router-dom route definitions
├── theme.ts                  # MUI light + dark themes
├── types/api.ts              # Hand-written TS types mirroring the OpenAPI specs
├── api/
│   ├── client.ts             # Shared axios instance + error interceptor
│   ├── bikes.ts
│   ├── parts.ts              # parts, partTypes, report
│   └── tours.ts
├── hooks/
│   ├── NotifyProvider.tsx    # Global snackbar for notifications
│   ├── useNotify.ts
│   ├── useApiMutation.ts     # Wrapper that reports mutation errors as snackbars
│   └── useColorMode.ts       # Light/dark mode context
├── utils/formatters.ts       # formatDate, formatDuration, formatDistanceKm, bikeName, ...
└── components/
    ├── layout/               # AppShell, NavList
    ├── common/               # DataTable, FormDialog, ConfirmDialog, BikeSelect, RowActions
    ├── bikes/
    ├── parts/                # list, form, detail drawer, relation form, relation table
    ├── partTypes/            # list, form, detail drawer (with re-use shortcut)
    ├── tours/                # list, import (drag-and-drop)
    └── report/
```

## Architectural notes

### DataTable

All five list views (`PartList`, `PartTypeList`, `BikeList`, `TourList`, `ReportList`) use a single generic `DataTable` built on TanStack Table v8. Filter / sort / grouping state is owned by the **parent list component** and passed in as controlled props, which is why opening a detail drawer does not reset search or filter state.

### Detail Drawers

Parts and Part Types each have a right-side drawer showing relation history. The trigger is a dedicated `🔗` icon in the row actions column — *row click opens the edit dialog*, matching common CRUD list expectations. The `/parts/:id` and `/partTypes/:id` routes from the previous frontend are intentionally gone.

Inside the Part Type drawer, past-part rows have a copy icon that creates a fresh relation with the same part; the backend auto-terminates the currently active relation.

### Errors

All API errors are normalised by the Axios interceptor in `api/client.ts` into an `ApiError` type. Mutations run through `useApiMutation`, which surfaces the error message as a snackbar. Form validation errors are shown inline via React Hook Form. Failed list fetches render an inline `Alert` with a Retry button.

### Tours

`TourList` supports user-triggered grouping (toolbar icon), defaults to sort by `startedAt` DESC, and exposes a per-row "Assign bike" action via the `⋮` overflow menu — hidden by default to keep the UI clean.

`TourImport` accepts a dropped JSON file (MyTourBook → DBeaver export), validates it client-side, and shows a preview list before upload.

## Contributing

- Keep the API types in `src/types/api.ts` in sync with the OpenAPI specs under `cetrack-backend/api/`.
- Before opening a PR, run `npm run build` (which type-checks and bundles) and `npm run lint`.
- Commits made by Claude Code include `[Claude Code - model: <model id>]` on the last line of the commit message.
