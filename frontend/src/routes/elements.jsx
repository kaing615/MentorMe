import { PATH, AUTH_PATH, ADMIN_PATH, MENTEE_PATH, MENTOR_PATH } from "./path";
import { useRoutes, Navigate } from "react-router-dom";
import HeaderAuth from "../components/common/header";
// import SignUp from "../pages/SignUp";
// import Login from "../pages/Login";
import PlatformInterface from "../components/layout/PlatformInterface";

const useRouterElements = () => {
    const elements = useRoutes([
            {
            path: PATH.PLATFORM,
            element: <PlatformInterface />,
            children: [
                // bỏ vô đây
            ]
        }
    ]);

    return elements;
};

export default useRouterElements;
