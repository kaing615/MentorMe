import { PATH, AUTH_PATH, MENTEE_PATH, MENTOR_PATH } from "./path";
import { useRoutes } from "react-router-dom";

import WelcomePage from "../pages/WelcomePage";
import HomeScreen from "../pages/homeScreen";
import AllPagesLayout from "../components/layout/AllPagesLayout";
import SignUp_SignIn_layout from "../components/layout/SignUp_SignIn_layout";

// Mentee pages
import MenteeProfile from "../pages/mentee-profile";
import AllCoursePage from "../pages/AllCoursepage";
import AllMentors from "../pages/AllMentors";
import OrderCompleteCourse from "../pages/order-complete-course";

// Mentor pages (nếu các file này còn tồn tại trong repo)
import MentorProfile from "../pages/mentor-profile";
import MentorPage from "../pages/mentor-page";
import CreateCoursePage from "../pages/CreateCoursePage";
import CourseDetail from "../pages/CourseDetail";
import EditCoursePage from "../pages/EditCoursePage";

// Auth pages
import SignUp from "../pages/SignUp";
import Login from "../pages/Login";
import ApplyAsMentor from "../pages/ApplyAsMentor";
import VerifyEmailPage from "../pages/VerifyEmailPage";
import Checkout from "../pages/checkout";
import OrderComplete from "../pages/order_complete";
import ShoppingCart from "../pages/shoppingcart";

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
          path: MENTEE_PATH.SHOPPINGCART,
          element: <ShoppingCart />,
        },
        {
          path: `${MENTEE_PATH.COURSEDETAIL}/:id`,
          element: <CourseDetail />,
        }
      ],
    },

    {
      path: PATH.MENTOR,
      element: <AllPagesLayout />,
      children: [
        {
          path: MENTOR_PATH.HOME,
          element: <HomeScreen />,
        },
        {
          path: MENTOR_PATH.PROFILE,
          element: <MentorProfile />,
        },
        {
          path: MENTOR_PATH.HOMEPAGE,
          element: <MentorPage />,
        },
        {
          path: MENTOR_PATH.CREATECOURSE,
          element: <CreateCoursePage />,
        },
        {
          path: `${MENTOR_PATH.COURSEDETAIL}/:id`,
          element: <CourseDetail />,
        },
        {
          path: `${MENTOR_PATH.EDITCOURSE}/:id`,
          element: <EditCoursePage />,
        },
      ],
    },

    {
      path: PATH.AUTH,
      element: <SignUp_SignIn_layout />,
      children: [
        { path: AUTH_PATH.SIGNUP, element: <SignUp /> },
        { path: AUTH_PATH.SIGNIN, element: <Login /> },
        { path: AUTH_PATH.APPLY_AS_MENTOR, element: <ApplyAsMentor /> },
        { path: AUTH_PATH.VERIFY_EMAIL, element: <VerifyEmailPage /> },
      ],
    },
  ]);

  return elements;
};

export default useRouterElements;
