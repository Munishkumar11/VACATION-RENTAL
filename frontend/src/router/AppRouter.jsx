import { createBrowserRouter, RouterProvider, Navigate, useLocation } from "react-router-dom";

import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Home from "../pages/Home";
import PropertyDetail from "../pages/PropertyDetail";
import BookingCheckout from "../pages/BookingCheckout";
import BookingSuccess from "../pages/BookingSuccess";
import BookingFailed from "../pages/BookingFailed";
import MyBookings from "../pages/MyBookings";
import Messages from "../pages/MessagesCenter";
import Wishlist from "../pages/Wishlist";

import HostDashboard from "../pages/host/HostDashboard";
import HostListings from "../pages/host/HostListings";
import HostBookings from "../pages/host/HostBookings";
import HostEarnings from "../pages/host/HostEarningsLive";
import AddListing from "../pages/host/AddListing";
import Managecalendar from "../pages/host/Managecalendar";
import Managepayouts from "../pages/host/Managepayouts";

import AdminSidebar from "../components/layout/AdminSidebar";
import MainLayout from "../components/layout/MainLayout";
import HostLayout from "../components/layout/HostLayout";        
import ProfileSettings from "../pages/ProfileSettings";
import AccountSettings from "../pages/AccountSettings"; 
import Payment from "../pages/Payment";
import { getStoredUser } from "../utils/auth";

// ✅ Protected Route Component 
const ProtectedRoute = ({ children, allowedRoles = null }) => {
  const location = useLocation();
  const user = getStoredUser();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const router = createBrowserRouter([

  // PUBLIC ROUTES
  { path: "/login",  element: <Login /> },
  { path: "/signup", element: <Signup /> },

  // USER + HOST ROUTES (with navbar)
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "/",             element: <Home /> },
      { path: "/property/:id", element: <PropertyDetail /> },
      { path: "/profile", element: <ProtectedRoute><ProfileSettings /></ProtectedRoute> },
      { path: "/settings", element: <ProtectedRoute><AccountSettings /></ProtectedRoute> },
      

      // ✅ Protected user routes
      { path: "/checkout",  element: <ProtectedRoute><BookingCheckout /></ProtectedRoute> },
      { path: "/booking/success", element: <ProtectedRoute><BookingSuccess /></ProtectedRoute> },
      { path: "/booking/failed", element: <ProtectedRoute><BookingFailed /></ProtectedRoute> },
      { path: "/bookings",  element: <ProtectedRoute><MyBookings /></ProtectedRoute> },
      { path: "/messages",  element: <ProtectedRoute><Messages /></ProtectedRoute> },
      { path: "/wishlist",  element: <ProtectedRoute><Wishlist /></ProtectedRoute> },

      // ✅ Protected host routes
      { path: "/host/HostDashboard", element: <ProtectedRoute allowedRoles={["host"]}><HostDashboard /></ProtectedRoute> },
      { path: "/host/HostListings",  element: <ProtectedRoute allowedRoles={["host"]}><HostListings /></ProtectedRoute> },
      { path: "/host/bookings",      element: <ProtectedRoute allowedRoles={["host"]}><HostBookings /></ProtectedRoute> },
      { path: "/hostearnings",       element: <ProtectedRoute allowedRoles={["host"]}><HostEarnings /></ProtectedRoute> },
      { path: "/host/earnings",      element: <ProtectedRoute allowedRoles={["host"]}><HostEarnings /></ProtectedRoute> },
      { path: "/AddListing",         element: <ProtectedRoute allowedRoles={["host"]}><AddListing /></ProtectedRoute> },
      { path: "/host/AddListing",    element: <ProtectedRoute allowedRoles={["host"]}><AddListing /></ProtectedRoute> },
      { path: "/Managecalendar",     element: <ProtectedRoute allowedRoles={["host"]}><Managecalendar /></ProtectedRoute> },
      { path: "/Managepayouts",      element: <ProtectedRoute allowedRoles={["host"]}><Managepayouts /></ProtectedRoute> },
      { path: "/payment", element: <ProtectedRoute><Payment /></ProtectedRoute> },
    ],
  },

  // ADMIN ROUTE
  { path: "/admin", element: <ProtectedRoute allowedRoles={["admin"]}><AdminSidebar /></ProtectedRoute> },

]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
