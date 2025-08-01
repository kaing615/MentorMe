import {
  PATH,
  AUTH_PATH,
  ADMIN_PATH,
  MENTEE_PATH,
  MENTOR_PATH,
  PLATFORM_PATH,
} from "./path";
import { useRoutes, Navigate } from "react-router-dom";
import WelcomePage from "../pages/WelcomePage";
import HomeScreen from "../pages/homeScreen";
import AllPagesLayout from "../components/layout/AllPagesLayout";
import MenteeProfile from "../pages/mentee-profile";
import OrderCompleteCourse from "../pages/order-complete-course";
import Footer from "../components/common/footer";

const useRouterElements = () => {
  const elements = useRoutes([
    {
      path: "/",
      element: <WelcomePage />,
    },
    {
      path: PATH.HOME,
      element: <AllPagesLayout />,
      children: [
        {
          path: PLATFORM_PATH.HOMESCREEN,
          element: <HomeScreen />,
        },
      ],
    },
    {
      path: PATH.MENTEE,
      element: <AllPagesLayout />,
      children: [
        {
          path: MENTEE_PATH.PROFILE,
          element: <MenteeProfile />,
        },
      ],
    },
    {
      path: MENTEE_PATH.ORDER_COMPLETE,
      element: (
        <>
          <OrderCompleteCourse />
          <Footer />
        </>
      ),
    },
  ]);

  return elements;
};

export default useRouterElements;
