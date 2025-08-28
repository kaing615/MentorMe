import useRouterElements from "./routes/elements";
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

  // Check and restore user session on app load (only if previously logged in)
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
    <>
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
    </>
  );
}

export default App;
