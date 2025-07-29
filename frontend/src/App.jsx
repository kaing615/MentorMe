import useRouterElements from "./routes/elements";

function App() {
  try {
    const elements = useRouterElements();
    return elements;
  } catch (error) {
    console.error("Error in App component:", error);
    return (
      <div style={{ padding: "20px", color: "red" }}>
        <h1>🚨 Routing Error</h1>
        <p>{error.message}</p>
        <a href="/" style={{ color: "blue" }}>← Back to Home</a>
      </div>
    );
  }
}

export default App;
