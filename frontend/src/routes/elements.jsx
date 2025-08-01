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
import SignUp_SignIn_layout from "../components/layout/SignUp_SignIn_layout";
import SignUp from "../pages/SignUp";
import Login from "../pages/Login";
import ApplyAsMentor from "../pages/ApplyAsMentor";
import VerifyEmailPage from "../pages/VerifyEmailPage";

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
      ],
    },
    {
      path: PATH.AUTH,
      element: <SignUp_SignIn_layout />,
      children: [
        {
          path: AUTH_PATH.SIGNUP,
          element: <SignUp />,
        },
        {
          path: AUTH_PATH.SIGNIN,
          element: <Login />,
        },
        {
          path: AUTH_PATH.APPLY_AS_MENTOR,
          element: <ApplyAsMentor />,
        },
        {
          path: AUTH_PATH.VERIFY_EMAIL,
          element: <VerifyEmailPage />,
        },
      ],
    },
  ]);

  return elements;
};

export default useRouterElements;
