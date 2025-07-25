import { PATH, AUTH_PATH, ADMIN_PATH, MENTEE_PATH, MENTOR_PATH, PLATFORM_PATH } from "./path";
import { useRoutes, Navigate } from "react-router-dom";
import HeaderAuth from "../components/common/header";
// import SignUp from "../pages/SignUp";
// import Login from "../pages/Login";
import WelcomePage from "../pages/WelcomePage";
import HomeScreen from "../pages/HomeScreen"
import PlatformInterface from "../components/layout/PlatformInterface";

const useRouterElements = () => {
    const elements = useRoutes([
        {
            path: "/",
            element: <WelcomePage /> 
        },
        {
            path: PATH.MENTEE,
            element: <PlatformInterface />,
            children: [
                {
                    path: MENTEE_PATH.HOME,
                    element: <HomeScreen />
                }
            ]
        }
    ]);

    return elements;
};

export default useRouterElements;
