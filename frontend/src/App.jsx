import useRouterElements from "./routes/elements";
import { CartProvider } from "./contexts/CartContext";

function App() {
  const elements = useRouterElements();
  return <CartProvider>{elements}</CartProvider>;
}

export default App;
