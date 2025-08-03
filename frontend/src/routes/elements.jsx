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
import AllCoursePage from "../pages/AllCoursepage";
import AllMentors from "../pages/AllMentors";
import OrderCompleteCourse from "../pages/order-complete-course";

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
          path: MENTEE_PATH.PROFILE,
          element: <MenteeProfile />,
        },
        {
          path: MENTEE_PATH.ORDER_COMPLETE,
          element: <OrderCompleteCourse />,
        },
        {
          path: MENTEE_PATH.ALL_MENTORS,
          element: <AllMentors />,
        },
        {
          path: MENTEE_PATH.ALL_COURSES,
          element: <AllCoursePage />,
        },
      ],
    },
  ]);

  return elements;
};

export default useRouterElements;
