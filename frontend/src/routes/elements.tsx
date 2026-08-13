import { PATH, AUTH_PATH, MENTEE_PATH, MENTOR_PATH, PLATFORM_PATH } from "./path";
import { Navigate, useRoutes } from "react-router-dom";

import WelcomePage from "../pages/WelcomePage";
import HomeScreen from "../pages/homeScreen";
import SendHelpRequest from "../components/common/SendHelpRequest";
import ProtectedRoute from "../components/common/ProtectedRoute";
import AllPagesLayout from "../components/layout/AllPagesLayout";
import SignUp_SignIn_layout from "../components/layout/SignUp_SignIn_layout";

import MenteeProfile from "../pages/mentee-profile";
import AllCoursePage from "../pages/AllCoursepage";
import AllMentors from "../pages/AllMentors";
import OrderCompleteCourse from "../pages/order-complete-course";
import SearchPage from "../pages/SearchPage";

import MentorPage from "../pages/mentor-page";
import CreateCoursePage from "../pages/CreateCoursePage";
import CourseDetail from "../pages/CourseDetail";
import EditCoursePage from "../pages/EditCoursePage";

import SignUp from "../pages/SignUp";
import Login from "../pages/Login";
import ApplyAsMentor from "../pages/ApplyAsMentor";
import VerifyEmailPage from "../pages/VerifyEmailPage";
import Checkout from "../pages/checkout";
import OrderComplete from "../pages/order_complete";
import ShoppingCart from "../pages/shoppingcart";
import PaymentReturnPage from "../pages/PaymentReturnPage";
import FavoritesPage from "../pages/FavoritesPage";
import NotificationsPage from "../pages/NotificationsPage";
import MentorDashboard from "../pages/MentorDashboard";
import AdminDashboard from "../pages/AdminDashboard";

const useRouterElements = () => {
  const elements = useRoutes([
    {
      path: "/",
      element: <WelcomePage />,
    },
    {
      path: "/payment/vnpay/return",
      element: <PaymentReturnPage provider="vnpay" />,
    },
    {
      path: "/payment/momo/return",
      element: <PaymentReturnPage provider="momo" />,
    },
    {
      path: "/notifications",
      element: (
        <ProtectedRoute>
          <AllPagesLayout />
        </ProtectedRoute>
      ),
      children: [{ index: true, element: <NotificationsPage /> }],
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
          element: <ProtectedRoute requiredRole="mentee"><MenteeProfile /></ProtectedRoute>,
        },
        {
          path: MENTEE_PATH.SHOPPINGCART,
          element: <ProtectedRoute requiredRole="mentee"><ShoppingCart /></ProtectedRoute>,
        },
        {
          path: MENTEE_PATH.ORDERCOMPLETECOURSE,
          element: <ProtectedRoute requiredRole="mentee"><OrderCompleteCourse /></ProtectedRoute>,
        },
        {
          path: `${MENTEE_PATH.ORDERCOMPLETECOURSE}/:id`,
          element: <ProtectedRoute requiredRole="mentee"><OrderCompleteCourse /></ProtectedRoute>,
        },
        {
          path: MENTEE_PATH.CHECKOUT,
          element: <ProtectedRoute requiredRole="mentee"><Checkout /></ProtectedRoute>,
        },
        {
          path: MENTEE_PATH.ORDERDETAIL,
          element: <ProtectedRoute requiredRole="mentee"><OrderComplete /></ProtectedRoute>,
        },
        {
          path: `${MENTEE_PATH.COURSEDETAIL}/:id`,
          element: <CourseDetail />,
        },
        {
          path: `${MENTEE_PATH.MENTOR}/:id`,
          element: <MentorPage />,
        },
        {
          path: MENTEE_PATH.ALLCOURSEPAGE,
          element: <AllCoursePage />,
        },
        {
          path: MENTEE_PATH.ALLMENTORS,
          element: <AllMentors />,
        },
        {
          path: MENTEE_PATH.FAVORITES,
          element: <ProtectedRoute requiredRole="mentee"><FavoritesPage /></ProtectedRoute>,
        },
      ],
    },

    {
      path: PATH.PLATFORM,
      element: <AllPagesLayout />,
      children: [
        {
          path: PLATFORM_PATH.HOMESCREEN,
          element: <HomeScreen />,
        },
        {
          path: PLATFORM_PATH.FINDMENTOR,
          element: <SearchPage />,
        },
        {
          path: PLATFORM_PATH.SEARCH,
          element: <SearchPage />,
        },
      ],
    },

    {
      path: PATH.MENTOR,
      element: (
        <ProtectedRoute requiredRole="mentor">
          <AllPagesLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          path: MENTOR_PATH.DASHBOARD,
          element: <MentorDashboard />,
        },
        {
          path: MENTOR_PATH.HOME,
          element: <HomeScreen />,
        },
        {
          path: MENTOR_PATH.PROFILE,
          element: <Navigate to="/mentor/dashboard" replace />,
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
        {
          path: MENTOR_PATH.ALLCOURSE,
          element: <AllCoursePage />,
        },
        {
          path: MENTOR_PATH.ALLMENTORS,
          element: <AllMentors />,
        },
      ],
    },

    {
      path: PATH.ADMIN,
      element: (
        <ProtectedRoute requiredRole="admin">
          <AllPagesLayout />
        </ProtectedRoute>
      ),
      children: [{ index: true, element: <AdminDashboard /> }],
    },

    {
      path: PATH.PLATFORM,
      element: <AllPagesLayout />,
      children: [
        {
          path: PLATFORM_PATH.HELP_REQUEST,
          element: (
            <ProtectedRoute>
              <SendHelpRequest />
            </ProtectedRoute>
          )
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
