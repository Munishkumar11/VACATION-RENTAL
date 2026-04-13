import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getStoredUser } from "../utils/auth";

export default function useRequireLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  return (message = "Please login first", options = {}) => {
    const { force = false } = options;

    if (force) {
      localStorage.removeItem("user");
    }

    const user = force ? null : getStoredUser();
    if (user) {
      return user;
    }

    toast.info(message);
    navigate("/login", {
      state: {
        from: `${location.pathname}${location.search}${location.hash}`,
      },
    });

    return null;
  };
}
