import { PATH, AUTH_PATH, ADMIN_PATH, MENTEE_PATH, MENTOR_PATH } from "./path";
import { useRoutes, Navigate } from "react-router-dom";
import Header from "../components/layout/header_signup_signin";
import SignUp from "../pages/SignUp";
import Login from "../pages/Login";

const useRouterElements = () => {
    const elements = useRoutes([
        {
            path: "/",
            element: (
                <>
                    <Header />
                    <SignUp />
                </>
            )
        },
        {
            path: "/signup",
            element: (
                <>
                    <Header />
                    <SignUp />
                </>
            )
        },
        {
            path: "/login",
            element: (
                <>
                    <Header />
                    <Login />
                </>
            )
        }
    ]);

    return elements;
};

export default useRouterElements;
