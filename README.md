# CETracker Frontend (v2)

Web React App Frontend for CETracker (Cycling Equipment Usage Tracker).
For more information about the project see the [project's homepage](https://cetracker.github.io/).

## Stack

This is a ground-up rewrite of the original frontend. The previous version used Mantine + mantine-react-table, which no longer has a release compatible with current Mantine versions. The new frontend is built on a stack without that coupling:

- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) as the dev / build tool
- [MUI v6](https://mui.com/material-ui/) component library (CSS-in-JS via [Emotion](https://emotion.sh/))
- [TanStack Table v8](https://tanstack.com/table) — headless table, wraps into a single reusable `DataTable` component
- [TanStack Query v5](https://tanstack.com/query) for server-state
- [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) for forms and validation
- [MUI X Date Pickers](https://mui.com/x/react-date-pickers/) with `date-fns`

It consumes the same REST API as the previous frontend (no backend changes).

## Running locally

Requires Node.js ≥ 20.

```bash
npm install
npm run dev      # dev server on http://localhost:3002 (proxies /api → http://localhost:8080)
npm run build    # type-check + production build to dist/
npm run lint     # ESLint, fails on any warning
npm run typecheck
```

Backend location can be overridden via `.env.development` (see [DEVELOPING.md](./doc/DEVELOPING.md)).

The old frontend keeps running on port 3001, so both can be used side by side during the migration.

## Running the app as a Container Image

A container image will be available at `https://ghcr.io/cetracker/cetrack-frontend:VERSION`. The recommended way to run the full stack is via the compose file in the [cetrack-compose repository](https://github.com/cetracker/cetrack-compose).

### Building a container image locally

#### Docker

```bash
docker build -t ghcr.io/cetracker/cetrack-frontend:0.3.0-SNAPSHOT .
```

#### Podman / Buildah

```bash
buildah build -t ghcr.io/cetracker/cetrack-frontend:0.3.0-SNAPSHOT
```

## Further reading

- [doc/DEVELOPING.md](./doc/DEVELOPING.md) — developer setup, project layout, contributing
