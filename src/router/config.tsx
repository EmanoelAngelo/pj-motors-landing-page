import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import Simulacao from "../pages/simulacao/page";
import Catalogo from "../pages/catalogo/page";
import Admin from "../pages/admin/page";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/simulacao",
    element: <Simulacao />,
  },
  {
    path: "/catalogo",
    element: <Catalogo />,
  },
  {
    path: "/admin",
    element: <Admin />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;