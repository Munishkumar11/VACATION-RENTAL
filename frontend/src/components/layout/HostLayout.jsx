// src/components/layout/HostLayout.jsx
import { Outlet, Navigate } from "react-router-dom";
import HostNavbar from "./HostNavbar";

function HostLayout() {
  let user = null;
  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      user = JSON.parse(storedUser);
    }
  } catch (error) {
    user = null;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "host") return <Navigate to="/" replace />;

  return (
    <>
      <HostNavbar />
      <Outlet />
    </>
  );
}

export default HostLayout;