/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { NotFound } from './components/NotFound'

const Index = lazy(() =>
  import('./components/Index').then((m) => ({ default: m.Index })),
)
const ComponentList = lazy(() =>
  import('./components/components/ComponentList').then((m) => ({ default: m.ComponentList })),
)
const CatalogPage = lazy(() =>
  import('./components/catalog/CatalogPage').then((m) => ({ default: m.CatalogPage })),
)
const BikeList = lazy(() =>
  import('./components/bikes/BikeList').then((m) => ({ default: m.BikeList })),
)
const BikeDetail = lazy(() =>
  import('./components/bikes/BikeDetail').then((m) => ({ default: m.BikeDetail })),
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
const MileageReport = lazy(() =>
  import('./components/report/MileageReport').then((m) => ({ default: m.MileageReport })),
)
const AssemblyList = lazy(() =>
  import('./components/assemblies/AssemblyList').then((m) => ({ default: m.AssemblyList })),
)
const AssemblyDetail = lazy(() =>
  import('./components/assemblies/AssemblyDetail').then((m) => ({ default: m.AssemblyDetail })),
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Index /> },
      { path: 'components', element: <ComponentList /> },
      { path: 'catalog', element: <CatalogPage /> },
      { path: 'bikes', element: <BikeList /> },
      { path: 'bikes/:bikeId', element: <BikeDetail /> },
      { path: 'assemblies', element: <AssemblyList /> },
      { path: 'assemblies/:assemblyId', element: <AssemblyDetail /> },
      { path: 'tours', element: <TourList /> },
      { path: 'tourImport', element: <TourImport /> },
      { path: 'mytourbookImport', element: <MyTourbookImportReview /> },
      { path: 'report', element: <MileageReport /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
