import { useEffect } from "react";
import useRouterElements from "./routes/elements";
import LoadingPage from "./components/common/loadingPage";
import { useSelector, useDispatch } from "react-redux";
import { initializeAuth } from "./redux/features/auth.slice";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const dispatch = useDispatch();
  const elements = useRouterElements();
  const isLoading = useSelector(state => state.loading?.isLoading || false);

  useEffect(() => {
    // Initialize authentication state on app load
    dispatch(initializeAuth());
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
