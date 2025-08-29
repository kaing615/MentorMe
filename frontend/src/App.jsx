import useRouterElements from "./routes/elements";
import { CartProvider } from "./contexts/CartContext";
import LoadingPage from "./components/common/loadingPage";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { restoreUser } from "./redux/features/user.slice";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const elements = useRouterElements();
  const isLoading = useSelector(state => state.loading.isLoading);
  const dispatch = useDispatch();

  // Restore user state from localStorage on app load
  useEffect(() => {
    // Only attempt to restore if there's evidence of a previous login session in current tab
    const hasLoginData = sessionStorage.getItem('user') && 
                         sessionStorage.getItem('token') && 
                         sessionStorage.getItem('isLoggedIn') === 'true';
    
    if (hasLoginData) {
      dispatch(restoreUser());
    }
  }, [dispatch]);

  return (
    <CartProvider>
      <LoadingPage loading={isLoading} />
      {elements}
      <ToastContainer
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
    </CartProvider>
  );
}

export default App;
