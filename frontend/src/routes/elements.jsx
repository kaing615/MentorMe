import { PATH, AUTH_PATH, ADMIN_PATH, MENTEE_PATH, MENTOR_PATH } from "./path";
import { useRoutes, Navigate } from "react-router-dom";
// import Home from "../pages/Home";
import Header from "../components/Layout/Header";

const useRouterElements = () => {
    const elements = useRoutes([
        {
            path: "/",
            element: <Header />
        },
    ]);

    return elements;
};

export default useRouterElements;
