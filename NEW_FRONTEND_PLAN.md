# CETracker — New Frontend Plan

## Problem Statement

`mantine-react-table` has no version compatible with Mantine v7+ (the current v6 ecosystem is end-of-life). Rather than patching around this, a new frontend is designed from scratch using a stack with no wrapper-library coupling issues.

---

## Technology Stack

| Concern | Choice | Rationale |
|---|---|---|
| Bundler | **Vite 6** | Keep existing; fast, proven |
| Language | **TypeScript 5** | Type-safe API contracts, better IDE support (see rationale below) |
| UI Framework | **React 18** | Keep existing |
| CSS-in-JS | **Emotion** (`@emotion/react`, `@emotion/styled`) | Industry standard; used natively by MUI |
| Component Library | **MUI v6** (Material UI) | Emotion-native, mature, complete form + date-picker ecosystem |
| Data Grid / Tables | **TanStack Table v8** (headless) + MUI components | Eliminates wrapper-library coupling; built-in sort, filter, group, global search |
| Server State | **TanStack Query v5** | Upgrade from v4; same API, better types |
| Forms | **React Hook Form v7** + **Zod** | Declarative validation, minimal re-renders |
| Date Pickers | **MUI X Date Pickers v7** (`@mui/x-date-pickers`) | First-party MUI integration; replaces Mantine DateInput |
| HTTP Client | **Axios** | Keep existing |
| Routing | **React Router v6** | Keep existing |
| Date utilities | **date-fns v3** | Lightweight; required adapter for MUI X date pickers |
| Icons | **MUI Icons** (`@mui/icons-material`) | Consistent with MUI; replaces Tabler icons |

**Not included:** Redux, Zustand, GraphQL — all state is either local (`useState`) or server-state via TanStack Query, matching the existing architecture.

### TypeScript Rationale

Switching from JavaScript to TypeScript is strongly recommended for this rewrite:

- The OpenAPI specs define exact request/response shapes — these map directly to TypeScript interfaces, catching mismatches at compile time rather than at runtime.
- React Hook Form + Zod + TypeScript is an especially tight combination: the Zod schema infers the form's TypeScript type automatically (`z.infer<typeof schema>`), so form fields and API payloads stay in sync with zero duplication.
- MUI and TanStack Table ship first-class TypeScript types; column definitions (`ColumnDef<Tour>`) make table configuration self-documenting.
- The existing backend is already strongly typed (Kotlin); TypeScript closes the loop on the frontend side.
- Vite's `--template react-ts` scaffold requires no extra configuration beyond adding `tsconfig.json`.

API types will be hand-written from the OpenAPI specs (one `src/types/api.ts` file). Generating them from the YAML (via `openapi-typescript`) is an option to explore but not required for the initial build.

---

## Project Setup

```bash
# Scaffold alongside the existing frontend
npm create vite@latest cetrack-frontend-v2 -- --template react-ts
cd cetrack-frontend-v2

npm install \
  @mui/material @mui/icons-material @emotion/react @emotion/styled \
  @mui/x-date-pickers \
  @tanstack/react-table \
  @tanstack/react-query @tanstack/react-query-devtools \
  react-hook-form zod @hookform/resolvers \
  axios \
  react-router-dom \
  date-fns

npm install -D typescript @types/react @types/react-dom @types/date-fns
```

**Vite proxy** (keep identical to existing `vite.config.js`):
```js
server: { proxy: { '/api': 'http://localhost:8080' } }
```

---

## Architecture

```
cetrack-frontend-v2/src/
├── main.tsx                 # Router, QueryClientProvider
├── App.tsx                  # MUI ThemeProvider, layout shell
├── theme.ts                 # MUI theme (palette, typography, component overrides)
├── types/
│   └── api.ts               # TypeScript interfaces derived from OpenAPI specs
├── api/                     # One file per API domain
│   ├── client.ts            # Axios instance + response interceptor (error parsing)
│   ├── parts.ts             # GET/POST/PUT/DELETE /parts, /partTypes, /parts/report
│   ├── bikes.ts             # GET/POST/PUT/DELETE /bikes
│   └── tours.ts             # GET /tours, POST /tours/import
├── hooks/
│   ├── useNotify.ts         # Thin wrapper around MUI Snackbar/Alert
│   └── useConfirm.ts        # Reusable confirmation dialog hook
├── utils/
│   ├── formatters.ts        # formatDuration, formatDistance, formatPower, bikeName
│   └── dateSort.ts          # Custom date comparator for TanStack Table
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx     # Permanent left drawer + top AppBar
│   │   └── NavList.tsx      # Navigation links
│   ├── common/
│   │   ├── DataTable.tsx    # Generic TanStack Table wrapper (see below)
│   │   ├── FormDialog.tsx   # Generic modal dialog for create/edit forms
│   │   ├── ConfirmDialog.tsx
│   │   └── BikeSelect.tsx   # Reusable bike dropdown (React Hook Form compatible)
│   ├── parts/
│   │   ├── PartList.tsx
│   │   ├── PartForm.tsx
│   │   ├── PartDetail.tsx
│   │   ├── RelationTable.tsx
│   │   └── RelationForm.tsx
│   ├── partTypes/
│   │   ├── PartTypeList.tsx
│   │   ├── PartTypeForm.tsx
│   │   └── PartTypeDetail.tsx   # rendered as a right-side Drawer (see below)
│   ├── bikes/
│   │   ├── BikeList.tsx
│   │   └── BikeForm.tsx
│   ├── tours/
│   │   ├── TourList.tsx
│   │   └── TourImport.tsx
│   └── report/
│       └── ReportList.tsx
```

### Detail Drawers — Part and Part Type

Both the Part detail (relation history for a part) and the Part Type detail (part history for a type) are implemented as **right-side MUI `Drawer`** panels that slide in over the list. Neither triggers a route change. The list behind the drawer remains mounted, so search terms, active filters, sort order, and grouping state are fully preserved across open/close cycles.

**State persistence rule**: `DataTable` accepts its table state (`globalFilter`, `columnFilters`, `sorting`, `grouping`) as **controlled props** managed by the parent list component (`PartList`, `PartTypeList`, etc.). Because the parent is never unmounted when a drawer opens, its state is never lost.

#### Drawer Trigger UX

Row click on any list always opens the **edit dialog** — this matches universal CRUD list expectations. The relation drawer is opened via a dedicated **`LinkIcon` action button** in the row actions column (alongside edit and delete). A MUI `Tooltip` labels it "Show relations".

```
Row actions column:  [🔗 relations]  [✏ edit]  [🗑 delete]
```

The same principle applies to both `PartList` and `PartTypeList`.

#### Part Detail Drawer

```
┌───────────────────────────────────┬────────────────────────────────────┐
│  Parts list  🔍[search...]        │  "KMC X12"          Drawer    ✕   │
│  ───────────────────────────────  │  ────────────────────────────────  │
│  KMC X12     active  [🔗][✏][🗑] │  Part Type    From      Until      │
│  KMC X11     2024-01 [🔗][✏][🗑] │  Chain MTB    2024-01   active     │
│  Shimano     2022-03 [🔗][✏][🗑] │  Chain MTB    2022-03   2024-01    │
│                                   │  Chain Road   2020-01   2022-03    │
│                                   │                                    │
│                                   │  [+ Add relation]                  │
└───────────────────────────────────┴────────────────────────────────────┘
```

- **Row click** → opens edit `PartForm` dialog (pre-filled)
- **`🔗` icon** → opens Part detail drawer (no route change)
- Drawer shows the part's full relation history sorted by `validFrom` descending
- `[+ Add relation]` opens `RelationForm` (select part type, set validFrom/validUntil)
- Edit and delete icons on each relation row inside the drawer
- The dedicated `/parts/:id` route is **removed**; `PartDetail` becomes a drawer-only component

#### Part Type Detail Drawer

```
┌───────────────────────────────────┬────────────────────────────────────┐
│  Part Types list                  │  "Chain MTB"        Drawer    ✕    │
│  ───────────────────────────────  │  ────────────────────────────────  │
│  Chain MTB   KMC X12  [🔗][✏][🗑] │    Part       From      Until      │
│  Chain Road  KMC X9   [🔗][✏][🗑] │    KMC X12    2024-01   active     │
│  Handlebar   —        [🔗][✏][🗑] │  + KMC X11    2022-03   2024-01    │
│                                   │  + KMC X10    2020-01   2022-03    │
│                                   │                                    │
└───────────────────────────────────┴────────────────────────────────────┘
```

- **Row click** → opens edit `PartTypeForm` dialog (pre-filled)
- **`🔗` icon** → opens Part Type detail drawer (no route change)
- Drawer lists all historical relations sorted by `validFrom` descending
- **Re-use shortcut**: each row with a closed `validUntil` (past parts) shows a `+` icon; the currently active part (open `validUntil`) does **not** show it
- Clicking `+` on a past-part row opens `RelationForm` pre-filled with that part, `validFrom` defaulting to today; on confirm:
  1. `POST /parts/{pastPartId}/action/relate` creates the new relation
  2. Backend auto-terminates the currently active relation at midnight before the new `validFrom`
- `[+ Add new relation]` at the bottom opens a blank `RelationForm` (pick any part)
- The dedicated `/partTypes/:id` route is **removed**; `PartTypeDetail` becomes a drawer-only component

### `DataTable` — Central Table Component

All five list views (`PartList`, `PartTypeList`, `BikeList`, `TourList`, `ReportList`) use a single `DataTable` component built on TanStack Table v8. It receives a `columns` definition and `data` array and wires up:

- **Global search** — `useGlobalFilter` with a text input above the table
- **Column filters** — per-column filter inputs in a filter row (toggleable)
- **Multi-column sorting** — click column header; shift-click for secondary sort
- **Grouping** — `useGrouping`; columns opt-in via `enableGrouping: true`
- **Column visibility** — show/hide toggle via a column menu (replaces `initialState.columnVisibility` in existing app)
- **Controlled state** — `globalFilter`, `columnFilters`, `sorting`, and `grouping` are all passed in as props from the parent, so the parent (`PartList`, `PartTypeList`, etc.) owns the state; opening a detail drawer never resets the search or filters
- **Sticky header** — MUI `stickyHeader` on `<Table>`
- **Density** — compact row size (`size="small"`)
- **Footer aggregates** — distance, duration, elevation totals on TourList and ReportList
- **Loading skeletons** — shown while `isLoading`
- **Row actions** — optional `renderRowActions` prop for edit/delete icons

```tsx
// Usage example — parent owns filter/sort state
const [globalFilter, setGlobalFilter] = useState('')
const [sorting, setSorting] = useState<SortingState>([])

<DataTable
  columns={columns}
  data={parts ?? []}
  isLoading={isLoading}
  globalFilter={globalFilter}
  onGlobalFilterChange={setGlobalFilter}
  sorting={sorting}
  onSortingChange={setSorting}
  enableGrouping
  renderRowActions={(row) => <RowActions row={row} onEdit={...} onDelete={...} />}
/>
```

---

## Routes

| Path | Component | Data |
|---|---|---|
| `/` | `Index` | static |
| `/parts` | `PartList` + `PartDetail` drawer | `GET /parts`; `GET /parts/{id}` on 🔗 icon click |
| `/partTypes` | `PartTypeList` + `PartTypeDetail` drawer | `GET /partTypes`; `GET /partTypes/{id}` on 🔗 icon click |
| `/bikes` | `BikeList` | `GET /bikes` |
| `/tours` | `TourList` | `GET /tours` |
| `/tourImport` | `TourImport` | `GET /bikes` (for selector) |
| `/report` | `ReportList` | `GET /parts/report` |

The `/parts/:id` and `/partTypes/:id` routes from the existing app are **removed** — detail is shown in drawers. Route loaders pre-fetch list data using `queryClient.ensureQueryData()`; drawer data is fetched on demand when the drawer opens.

---

## Feature Parity Checklist

### Parts
- [x] List with columns: Name, Purchase Date, Retired Date, Currently In Use As, Last Used @
- [x] Create via `FormDialog` + `PartForm` (RHF+Zod: name required, dates optional)
- [x] Edit via same dialog (pre-populated)
- [x] Delete with `ConfirmDialog`
- [x] Click row → opens edit `PartForm` dialog (pre-filled)
- [x] `🔗` icon in row actions → opens `PartDetail` **drawer** (list state preserved)
- [x] Drawer shows relation table (`RelationTable`) — all part-type assignments for this part
- [x] Add relation via `RelationForm` (PartType selector, validFrom required, validUntil optional)
- [x] Edit/delete relation inside drawer

### Part Types
- [x] List with columns: Name, Mandatory (flagged red if no active part), Bike, Currently Used Part
- [x] Create / Edit / Delete
- [x] `mandatory` checkbox in form
- [x] Click row → opens edit `PartTypeForm` dialog (pre-filled)
- [x] `🔗` icon in row actions → opens `PartTypeDetail` **drawer** (list state preserved)
- [x] Drawer shows relation history; past-part rows have `+` re-use shortcut; active part row does not

### Bikes
- [x] List with columns: Manufacturer, Model, Purchase Date
- [x] Create / Edit / Delete
- [x] Error notification on failed delete (referenced bike constraint)

### Tours
- [x] List with columns: Title, Year (hideable), Month (hideable), Started, Distance, Duration Moving, Up, Down, Power, Bike
- [x] Sorted by the Started column - most recent tour first.
- [x] Grouping by Year/Month/Bike — user-triggered via column header menu (not default)
- [x] Footer row with totals (distance, duration, elevation, power)
- [x] Filter by Bike (select filter on Bike column)
- [x] "Assign Bike" row action — visible only via column actions menu (hidden by default); calls `POST /tours/{id}/action/relate`

### Tour Import
- [x] Collapsible "Export Instructions" section (MUI `Accordion`)
- [x] **File upload with drag-and-drop** (`<input type="file" accept=".json">` styled with MUI + Emotion drop-zone; replaces raw textarea)
- [x] JSON content validated immediately after file selection (client-side `JSON.parse`)
- [x] **Preview list** — after successful validation, renders a compact table showing Title, Date, Distance for each tour to be imported
- [x] Bike selector (assign all imported tours to a bike, optional) — shown above the preview list
- [x] "Upload" button (enabled only after validation passes) → `POST /tours/import`
- [x] Validation errors displayed inline below the drop-zone

### Report
- [x] List with columns: Part, Distance, Duration Moving, Uphill, Downhill, Sum Power
- [x] Default sort: Distance descending
- [x] Footer totals

---

## Forms Detail

All forms use **React Hook Form** with **Zod** schemas for validation. All forms are rendered inside `FormDialog` (MUI `Dialog`).

### Part Form
```ts
z.object({
  name: z.string().min(1),
  boughtAt: z.date().nullable().optional(),
  retiredAt: z.date().nullable().optional(),
})
```
Fields: `TextField` (name), `DatePicker` (boughtAt, retiredAt)

### Part Type Form
```ts
z.object({
  name: z.string().min(1),
  bikeId: z.string().uuid().nullable().optional(),
  mandatory: z.boolean(),
})
```
Fields: `TextField` (name), `BikeSelect` (dropdown), `Checkbox` (mandatory)

### Bike Form
```ts
z.object({
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  boughtAt: z.date().nullable().optional(),
  retiredAt: z.date().nullable().optional(),
})
```

### Relation Form
```ts
z.object({
  partTypeId: z.string().uuid(),
  validFrom: z.date(),
  validUntil: z.date().nullable().optional(),
}).refine(d => !d.validUntil || d.validUntil > d.validFrom, {
  message: "Valid Until must be after Valid From",
  path: ["validUntil"],
})
```
Includes info tooltip: "An active relation for a different part with this part type will be terminated automatically."

---

## Theme & Styling

`theme.js` configures MUI with Emotion:

- **Primary colour**: teal (`#00897B`) — matches existing app
- **Typography**: Open Sans (body), Roboto (headings)
- **Dark/Light mode**: `ColorModeContext` toggled from the AppBar (same as existing)
- **Table style**: striped rows via MUI `sx` prop on `<TableRow>` with `&:nth-of-type(odd)`
- **Custom styled components** via `@emotion/styled` for any layout elements not covered by MUI

---

## Error Handling Strategy

The existing frontend logs API errors to the console and only shows a notification on bike-delete failures. The new implementation handles all errors consistently.

### Axios Interceptor (`src/api/client.ts`)

A single response interceptor on the shared Axios instance parses all non-2xx responses and normalises them into a typed `ApiError`:

```ts
interface ApiError {
  status: number
  message: string       // from backend response body, or HTTP status text
  details?: string[]    // field-level validation errors if present
}
```

The interceptor re-throws as a rejected promise so TanStack Query's `isError` / `error` states work normally.

### Mutation Error Display

All mutations (`useMutation`) receive a shared `onError` handler via a wrapper hook `useApiMutation`:

```ts
const { mutate } = useApiMutation(createPart, {
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parts'] }),
  // onError handled globally: shows MUI Snackbar with error.message
})
```

Errors appear as a **MUI `Snackbar` + `Alert`** (severity `"error"`) at the bottom of the screen, auto-dismissing after 6 seconds. Multiple errors stack.

### Form Submission Errors

If the backend returns 400 with field-level errors, these are mapped back to React Hook Form's `setError` so they appear inline under the relevant field. A generic fallback message is shown if the error cannot be mapped to a specific field.

### Query (fetch) Errors

`isError` on each query renders an **inline `Alert`** replacing the table skeleton, with the error message and a "Retry" button that calls `refetch()`.

## Data Layer

### Query Keys Convention
```js
['parts']              // list
['parts', id]          // single
['partTypes']
['partTypes', id]
['bikes']
['tours']
['report']
```

### API Module Pattern (`src/api/parts.ts`)
```ts
import { client } from './client'
import type { Part, PartPartTypeRelation } from '../types/api'

export const partsQuery = () => ({
  queryKey: ['parts'] as const,
  queryFn: (): Promise<Part[]> => client.get('/parts').then(r => r.data),
})

export const createPart = (data: Omit<Part, 'id' | 'createdAt'>) =>
  client.post<Part>('/parts', data).then(r => r.data)
export const updatePart = (id: string, data: Part) =>
  client.put<Part>(`/parts/${id}`, data).then(r => r.data)
export const deletePart = (id: string) =>
  client.delete(`/parts/${id}`)
export const relatePart = (id: string, relation: PartPartTypeRelation) =>
  client.post<Part>(`/parts/${id}/action/relate`, relation).then(r => r.data)
```

Mutations invalidate the relevant query key on `onSuccess`.

---

## Migration Strategy

1. Build within `cetrack-frontend-v2/` as a sibling to `cetrack-frontend/` on a git branch named `v2`. Do not change anything inside `cetrack-frontend/`.
2. Both frontends can run simultaneously during development (`v2` on port 3002)
3. The existing backend is unchanged — same API contracts
4. Once feature-complete and tested, swap the Docker build target in `cetracker-compose/docker-compose.yaml`
5. Archive (do not delete) `cetrack-frontend/`

### Commit Convention

All commits made during development of `cetrack-frontend-v2` will use the message suffix but on the last line  of the commit message.
```
[Claude Code - model: claude-sonnet-4-6]
```
The model shall reflect the model actually running.

The commit messages shall follow the form 
This commit will - Caption of the commit -
but ommit the "This commit will" part.
E.g.
```
Setup the layout structure
```

Commit messages shall preferably explain why something was done rather what was done.


It can contain a brief summary up to maximal three more lines this makes the commit message clearer. 

```
Fix error during validation of tour import

Optional json nodes where treated as mandatory.
[Claude Code - model: claude-sonnet-4-6]
```

Commits will be made at logical checkpoints: after scaffolding, after each feature module is complete (parts, bikes, tours, report, tour-import), and after cross-cutting concerns (error handling, theme, layout).

### Documentation Convention

The main README.md from the previous implementation shall be used as a base but adjusted where needed.
A doc folder shall be created and a developer setup guide `DEVELOPING.md` shall be created within. Covering the setup as well as running the frontend locally.

---

## Resolved Decisions

| # | Question | Decision |
|---|---|---|
| 1 | Grouping in TourList | User-triggered via column header menu; no default grouping |
| 2 | Tour assign-bike action | Exposed per row, hidden by default in column actions menu |
| 3 | Tour import UX | File upload + drag-and-drop replaces textarea; preview list before upload; `/tours/upload` (plain text) not exposed |
| 4 | Part Type detail | Drawer confirmed; past-part rows show `+` re-use shortcut; active part row does not |
| 5 | TypeScript | Yes — see TypeScript Rationale section |
| 6 | Backend error display | Full error handling strategy added (see Error Handling section) |
| 7 | Commit cadence | Per feature module; message suffix `[Claude Code - model: claude-sonnet-4-6]` |

