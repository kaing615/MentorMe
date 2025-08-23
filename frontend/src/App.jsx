import useRouterElements from "./routes/elements";
<<<<<<< HEAD

function App() {
  const elements = useRouterElements();
=======
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

  // Restore user state from localStorage on app load
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

>>>>>>> 0e92a0b1b0aa6b6f0df3f429a0d7adecbc27d9a5
  return (
    <>
      {elements}
    </>
  )
}

export default App;
