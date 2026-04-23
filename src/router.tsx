import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Index } from './components/Index'
import { NotFound } from './components/NotFound'
import { PartList } from './components/parts/PartList'
import { PartTypeList } from './components/partTypes/PartTypeList'
import { BikeList } from './components/bikes/BikeList'
import { TourList } from './components/tours/TourList'
import { TourImport } from './components/tours/TourImport'
import { ReportList } from './components/report/ReportList'

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
      { path: 'report', element: <ReportList /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
