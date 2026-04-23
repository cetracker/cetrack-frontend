# Feature: Responsive Design

Improve displaying on small screens like a mobile phone.

---

## Implementation Plan

### Files to Change

| File | Change |
|------|--------|
| `components/layout/AppShell.tsx` | Hamburger menu + temporary Drawer on mobile |
| `components/common/FormDialog.tsx` | `fullScreen` on xs |
| `components/partTypes/PartTypeDetail.tsx` | Full-width drawer on mobile |
| `components/parts/PartDetail.tsx` | Full-width drawer on mobile |
| `components/common/DataTable.tsx` | Horizontal scroll + `meta.hideOnMobile` support |
| `components/parts/PartList.tsx` | Mark mobile-hidden columns |
| `components/partTypes/PartTypeList.tsx` | Mark mobile-hidden columns |
| `components/bikes/BikeList.tsx` | Mark mobile-hidden columns |
| `components/tours/TourList.tsx` | Mark mobile-hidden columns |
| `components/report/ReportList.tsx` | Mark mobile-hidden columns |
| `components/tours/TourImport.tsx` | Responsive drop-zone padding |

### 1. `AppShell.tsx` — Mobile nav drawer

- Hamburger `IconButton` in `AppBar`, visible only on mobile (`sx={{ display: { md: 'none' } }}`)
- `Drawer` switches to `variant="temporary"` on mobile (`useMediaQuery(theme.breakpoints.down('md'))`)
- `AppBar` width/margin-left responds to breakpoint: full-width on mobile, offset by sidebar width on desktop
- Main content area `ml` mirrors the AppBar offset

### 2. `FormDialog.tsx` — Full-screen on mobile

- `useMediaQuery(theme.breakpoints.down('sm'))` → `fullScreen` prop on `<Dialog>`

### 3. Detail Drawers — Full-width on mobile

- `PartTypeDetail` (620px) and `PartDetail` (560px): `width: { xs: '100vw', sm: DRAWER_WIDTH }`

### 4. `DataTable.tsx` — Horizontal scroll + column hiding

- Add `hideOnMobile?: boolean` to `ColumnMeta` type
- Compute hidden overrides from `meta.hideOnMobile` when `useMediaQuery(down('sm'))` is true
- Merge overrides into column visibility state (caller-supplied visibility takes precedence)
- Wrap `<Table>` in `<Box sx={{ overflowX: 'auto' }}>` for horizontal scroll on overflow

### 5. Column `hideOnMobile` per list

| List | Hidden columns on mobile |
|------|--------------------------|
| PartList | `purchaseDate`, `retiredAt`, `lastUsedAt` |
| PartTypeList | `mandatory`, `currentlyUsedPart` |
| BikeList | `purchaseDate` |
| TourList | `durationMoving`, `elevationUp`, `elevationDown`, `power` |
| ReportList | `durationMoving`, `uphillM`, `downhillM`, `sumPowerKwh` |

### 6. `TourImport.tsx` — Responsive padding

- Drop-zone padding reduced on mobile: `{ xs: '16px 12px', sm: '36px 24px' }`

---

## Verification Checklist (375px / iPhone SE)

- [ ] Hamburger icon visible; tap opens nav; tapping a nav link closes it
- [ ] Desktop (>960px): sidebar always visible, no hamburger
- [ ] FormDialogs open full-screen on mobile
- [ ] PartTypeDetail / PartDetail drawers fill full width on mobile
- [ ] List views show reduced columns; table scrolls horizontally if content overflows
- [ ] TourImport drop zone comfortable on mobile
