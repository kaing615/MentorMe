import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import useRouterElements from "./routes/elements";
import { CartProvider } from "./contexts/CartContext";
import LoadingPage from "./components/common/loadingPage";
import { useSelector, useDispatch } from "react-redux";
import { restoreUser } from "./redux/features/user.slice";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MascotQuickHelp from "./components/common/MascotQuickHelp";
import { shouldShowMascot } from "./utils/mascot-actions";
import useNavigationLoading from "./hooks/useNavigationLoading";
import {
  getInitialTheme,
  THEME_CHANGE_EVENT,
  type Theme,
} from "./utils/theme";

function App() {
  const { pathname } = useLocation();
  const elements = useRouterElements();
  const isLoading = useSelector((state: any) => state.loading.isLoading);
  const isNavigationLoading = useNavigationLoading();
  const user = useSelector((state: any) => state.user);
  const dispatch = useDispatch();
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const hasLoginData = Boolean(
    localStorage.getItem("user") &&
    (localStorage.getItem("actkn") || localStorage.getItem("token")) &&
    localStorage.getItem("isLoggedIn") === "true"
  );

  // Restore user state from localStorage on app load
  useEffect(() => {
    // Only attempt to restore if there's evidence of a previous login session (persistent across tabs)
    const hasLoginData = localStorage.getItem('user') && 
                         (localStorage.getItem('actkn') || localStorage.getItem('token')) && 
                         localStorage.getItem('isLoggedIn') === 'true';
    
    if (hasLoginData) {
      dispatch(restoreUser());
    }
  }, [dispatch]);

  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const nextTheme = (event as CustomEvent<Theme>).detail;
      if (nextTheme === "light" || nextTheme === "dark") setTheme(nextTheme);
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
  }, []);

  return (
    <CartProvider>
      <div className="app-shell" data-theme={theme}>
        <LoadingPage loading={isLoading || isNavigationLoading} />
        {elements}
        {shouldShowMascot(
          pathname,
          user,
          hasLoginData,
          localStorage.getItem("mentorMode") === "true",
        ) && <MascotQuickHelp />}
        <ToastContainer
          theme={theme}
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </CartProvider>
  );
}

export default App;
