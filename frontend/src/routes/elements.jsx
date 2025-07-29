import { PATH, AUTH_PATH, ADMIN_PATH, MENTEE_PATH, MENTOR_PATH } from "./path";
import { useRoutes, Navigate } from "react-router-dom";
import AllPagesLayout from "../components/layout/AllPagesLayout";
import MentorPage from "../pages/mentor-page";
import MentorProfile from "../pages/mentor-profile";

const useRouterElements = () => {
  const elements = useRoutes([
    {
      path: "/",
      element: <Navigate to={`${PATH.MENTOR}/${MENTOR_PATH.HOME}`} replace />,
    },
    {
      path: `${PATH.MENTOR}`,
      element: <AllPagesLayout />,
      children: [
        { 
            path: MENTOR_PATH.HOME, 
            element: <MentorPage /> 
        },
        { 
            path: MENTOR_PATH.PROFILE, 
            element: <MentorProfile /> 
        },
      ],
    },
    {
        
    }
  ]);

  return elements;
};

export default useRouterElements;
