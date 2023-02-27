import { QueryClient } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider
} from "react-router-dom";
import App from './App';
import NotFoundPage from './components/Error404/Error404';
import PartList, { loader as partsLoader } from './components/PartList/PartList';
import PartTypeList from './components/PartList/PartTypeList';

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
            element: <PartTypeList />
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
