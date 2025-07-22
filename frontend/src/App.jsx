import useRouterElements from "./routes/elements";

function App() {
  const elements = useRouterElements();
  return (
    <>
      {elements}
    </>
  )
}

export default App;
