import { PATH, AUTH_PATH, ADMIN_PATH, MENTEE_PATH, MENTOR_PATH, PLATFORM_PATH } from "./path";
import { useRoutes, Navigate } from "react-router-dom";
import HeaderAuth from "../components/common/header_signup_signin";
// import SignUp from "../pages/SignUp";
// import Login from "../pages/Login";
import PlatformInterface from "../components/layout/PlatformInterface";
import HomeScreen from "../pages/homeScreen";
// import HomeScreen from "../pages/homeScreen";

const useRouterElements = () => {
    const elements = useRoutes([
            {
            path: PATH.PLATFORM,
            element: <PlatformInterface />,
            children: [
                {
                    path: PLATFORM_PATH.HOMESCREEN,
                    element: <HomeScreen />,
                },
            ]
        }
    ]);

    return elements;
};

export default useRouterElements;
