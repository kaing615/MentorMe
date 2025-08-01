import {
  PATH,
  AUTH_PATH,
  ADMIN_PATH,
  MENTEE_PATH,
  MENTOR_PATH,
} from "./path";
import { useRoutes, Navigate } from "react-router-dom";
import WelcomePage from "../pages/WelcomePage";
import HomeScreen from "../pages/homeScreen";
import AllPagesLayout from "../components/layout/AllPagesLayout";

const useRouterElements = () => {
  const elements = useRoutes([
    {
      path: "/",
      element: <WelcomePage />,
    },
    {
      path: PATH.MENTEE,
      element: <AllPagesLayout />,
      children: [
        {
          path: MENTEE_PATH.HOME,
          element: <HomeScreen />,
        },
        {
          path: MENTEE_PATH.CHECKOUT,
          element: <Checkout />,
        },
        {
          path: MENTEE_PATH.ORDER_COMPLETE,
          element: <OrderComplete />,
        },
        {
          path: MENTEE_PATH.SHOPPING_CART,
          element: <ShoppingCart />,
        },
      ],
    },
  ]);

  return elements;
};

export default useRouterElements;
