import { QueryClient } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider
} from "react-router-dom";
import App from './App';
import BikeList, { loader as bikesLoader } from './components/Bikes/BikeList';
import NotFoundPage from './components/Error404/Error404';
import PartList, { loader as partsLoader } from './components/Parts/PartList';
import PartTypeList, { loader as partTypesLoader } from './components/Parts/PartTypeList';
import TourList, { loader as toursLoader } from './components/Tours/TourList';

export const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <NotFoundPage />,
    children: [
      {
        errorElement: <NotFoundPage />,
        children:[
          { index: true, element: <App /> },
          {
            path: "/parts",
            element: <PartList/>,
            loader: partsLoader(queryClient)
          },
          {
            path: "/partTypes",
            element: <PartTypeList />,
            loader: partTypesLoader(queryClient)
          },
          {
            path: "/bikes",
            element: <BikeList />,
            loader: bikesLoader(queryClient)
          },
          {
            path: "/tours",
            element: <TourList />,
            loader: toursLoader(queryClient)
          },
        ]
      }
    ]
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>,
)
