import { PATH, AUTH_PATH, ADMIN_PATH, MENTEE_PATH, MENTOR_PATH, PLATFORM_PATH } from "./path";
import { useRoutes, Navigate } from "react-router-dom";
import WelcomePage from "../pages/WelcomePage";
import HomeScreen from "../pages/homeScreen";
import AllPagesLayout from "../components/layout/AllPagesLayout";

const useRouterElements = () => {
    const elements = useRoutes([
        {
            path: "/",
            element: <WelcomePage /> 
        },
        {
            path: PATH.MENTEE,
            element: <AllPagesLayout />,
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
