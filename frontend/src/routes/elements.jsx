import { PATH, AUTH_PATH, ADMIN_PATH, MENTEE_PATH, MENTOR_PATH } from "./path";
import { useRoutes, Navigate } from "react-router-dom";
import AllPagesLayout from "../components/layout/AllPagesLayout";
import MentorPage from "../pages/mentor-page";
import MentorProfile from "../pages/mentor-profile";
import MentorCourses from "../pages/CreateCoursePage";
import EditCoursePage from "../pages/EditCoursePage";

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
      path: "edit-course/:courseId",
      element: <EditCoursePage />
    },
        { 
            path: MENTOR_PATH.PROFILE, 
            element: <MentorProfile /> 
        },
        {
            path: MENTOR_PATH.COURSES,
            element: <MentorCourses />
        },
      ],
    },
    {
        
    }
  ]);

  return elements;
};

export default useRouterElements;
