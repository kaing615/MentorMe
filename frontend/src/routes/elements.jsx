import { PATH, AUTH_PATH, ADMIN_PATH, MENTEE_PATH, MENTOR_PATH } from "./path";
import { useRoutes, Navigate } from "react-router-dom";
import HeaderAuth from "../components/common/header_signup_signin";
import SignUp from "../pages/SignUp";
import Login from "../pages/Login";

const useRouterElements = () => {
    const elements = useRoutes([
        {
            path: PATH.AUTH,
            element: <HeaderAuth />,
            children: [
                {
                    path: AUTH_PATH.SIGNUP,
                    element: <SignUp />,
                },
                {
                    path: AUTH_PATH.SIGNIN,
                    element: <Login />,
                }
            ]
        }
    ]);

    return elements;
};

export default useRouterElements;
