import { PATH, MENTOR_PATH } from "./path";
import { useRoutes } from "react-router-dom";
import CreateCoursePage from "../pages/CreateCoursePage";
import MyCoursesPage from "../pages/MyCoursesPage";
import TestPage from "../pages/TestPage";

const useRouterElements = () => {
    const elements = useRoutes([
        {
            path: "/",
            element: <TestPage />
        },
        {
            path: "/test",
            element: <TestPage />
        },
        {
            path: PATH.MENTOR,
            children: [
                {
                    path: MENTOR_PATH.COURSES,
                    element: <MyCoursesPage />
                },
                {
                    path: MENTOR_PATH.CREATE_COURSE,
                    element: <CreateCoursePage />
                }
            ]
        }
    ]);

    return elements;
};

export default useRouterElements;
