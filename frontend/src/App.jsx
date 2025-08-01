import useRouterElements from "./routes/elements";
import { CartProvider } from "./contexts/CartContext";
import LoadingPage from "./components/common/loadingPage";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { setUser } from "./redux/features/user.slice";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const elements = useRouterElements();
  const isLoading = useSelector(state => state.loading.isLoading);
  const dispatch = useDispatch();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (storedUser && isLoggedIn) {
      try {
        const userData = JSON.parse(storedUser);
        dispatch(setUser({
          ...userData,
          isLoggedIn: true
        }));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
      }
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
