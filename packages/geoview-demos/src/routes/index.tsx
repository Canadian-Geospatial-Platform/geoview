import { createBrowserRouter } from "react-router-dom";
import DefaultPage from "../pages/default";
import ListOfDemosPage from "../pages/ListOfDemos";
import PackageSwiperPage from "../pages/package-swiper";
import GeoViewPage from "../components/GeoViewPage";


export const router = createBrowserRouter([
  { path: "/", element: <ListOfDemosPage /> },
  { path: "/general", element: <DefaultPage /> },
  { path: "/package-swiper", element: <GeoViewPage><PackageSwiperPage /></GeoViewPage> }
]);