import { QueryCache, QueryClient } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider
} from "react-router-dom";
import App from './App';
import BikeList, { loader as bikesLoader } from './components/Bikes/BikeList';
import NotFoundPage from './components/Error404/Error404';
import Part, { loader as partLoader } from './components/Parts/Part';
import PartList, { loader as partsLoader } from './components/Parts/PartList';
import PartTypeList, { loader as partTypesLoader } from './components/Parts/PartTypeList';
import TourList, { loader as toursLoader } from './components/Tours/TourList';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => console.warn(`Query ${query.queryKey} to the backend run into an error, ${error.response.status}:${error.code}!`)
  })
});

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
            path: "parts",
            element: <PartList/>,
            loader: partsLoader(queryClient)
          },
          {
            path: "parts/:id",
            element: <Part />,
            loader: partLoader(queryClient)
          },
          {
            path: "partTypes",
            element: <PartTypeList />,
            loader: partTypesLoader(queryClient)
          },
          {
            path: "bikes",
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
