import { PATH, AUTH_PATH, ADMIN_PATH, MENTEE_PATH, MENTOR_PATH } from "./path";
import { useRoutes, Navigate } from "react-router-dom";

const useRouterElements = () => {
    const elements = useRoutes([
        {
            path: "/",
            element: <Navigate to={`${PATH.MENTEE}`} replace />
        },
    ]);

    return elements;
};

export default useRouterElements;
