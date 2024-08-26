import { createBrowserRouter } from "react-router-dom";
import DefaultPage from "../pages/default";
import ListOfDemosPage from "../pages/ListOfDemos";


export const router = createBrowserRouter([
  { path: "/", element: <ListOfDemosPage /> },
  { path: "/general", element: <DefaultPage /> }
]);