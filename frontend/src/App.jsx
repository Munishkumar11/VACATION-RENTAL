import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";  // ← add this line, might be missing
import AppRouter from "./router/AppRouter";
import axios from "axios";

axios.defaults.baseURL = "";
axios.defaults.withCredentials = true;

function App() {
  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar={true}
      />
      <AppRouter />
    </>
  );
}

export default App;  // ← make sure this line exists
