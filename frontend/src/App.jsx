import { useEffect } from "react";
import useRouterElements from "./routes/elements";
import { CartProvider } from "./contexts/CartContext";
import LoadingPage from "./components/common/loadingPage";
import { useSelector, useDispatch } from "react-redux";
import { restoreUser } from "./redux/features/user.slice";
import { initializeAuth } from "./redux/features/auth.slice";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const elements = useRouterElements();
  const isLoading = useSelector(state => state.loading.isLoading);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(initializeAuth()).then((result) => {
      if (result.meta.requestStatus === "fulfilled") dispatch(restoreUser());
    });
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
