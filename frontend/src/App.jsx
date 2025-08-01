import useRouterElements from "./routes/elements";
import LoadingPage from "./components/common/loadingPage";
import { useSelector } from "react-redux";

function App() {
  const elements = useRouterElements();
  const isLoading = useSelector(state => state.loading.isLoading);

  return (
    <>
      <LoadingPage loading={isLoading} />
      {elements}
    </>
  );
}

export default App;
