import { PATH, AUTH_PATH, ADMIN_PATH, MENTEE_PATH, MENTOR_PATH } from "./path";
import { useRoutes, Navigate } from "react-router-dom";
import HeaderFooter from "../components/layout/AllPagesLayout";
import CourseDetail from "../pages/CourseDetail.jsx";

const useRouterElements = () => {
    const elements = useRoutes([
        {
            path:PATH.MENTEE,
            element: <HeaderFooter />,
            children: [
                {
                    path: MENTEE_PATH.COURSE_DETAILS,
                    element: <CourseDetail />
                }
            ]
        }
    ]);

    return elements;
};

export default useRouterElements;
