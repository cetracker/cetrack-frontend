/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { NotFound } from './components/NotFound'

const Index = lazy(() =>
  import('./components/Index').then((m) => ({ default: m.Index })),
)
const PartList = lazy(() =>
  import('./components/parts/PartList').then((m) => ({ default: m.PartList })),
)
const PartTypeList = lazy(() =>
  import('./components/partTypes/PartTypeList').then((m) => ({ default: m.PartTypeList })),
)
const BikeList = lazy(() =>
  import('./components/bikes/BikeList').then((m) => ({ default: m.BikeList })),
)
const TourList = lazy(() =>
  import('./components/tours/TourList').then((m) => ({ default: m.TourList })),
)
const TourImport = lazy(() =>
  import('./components/tours/TourImport').then((m) => ({ default: m.TourImport })),
)
const MyTourbookImportReview = lazy(() =>
  import('./components/tours/MyTourbookImportReview').then((m) => ({
    default: m.MyTourbookImportReview,
  })),
)
const ReportList = lazy(() =>
  import('./components/report/ReportList').then((m) => ({ default: m.ReportList })),
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Index /> },
      { path: 'parts', element: <PartList /> },
      { path: 'partTypes', element: <PartTypeList /> },
      { path: 'bikes', element: <BikeList /> },
      { path: 'tours', element: <TourList /> },
      { path: 'tourImport', element: <TourImport /> },
      { path: 'mytourbookImport', element: <MyTourbookImportReview /> },
      { path: 'report', element: <ReportList /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
