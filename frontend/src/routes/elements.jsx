import { PATH, AUTH_PATH, ADMIN_PATH, MENTEE_PATH, MENTOR_PATH } from "./path";
import { useRoutes, Navigate } from "react-router-dom";
import Header from "../components/layout/header_signup_signin";
// import Home from "../pages/Signup.jsx";

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
