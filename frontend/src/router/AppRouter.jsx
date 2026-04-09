import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

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

// ✅ Protected Route Component 
const ProtectedRoute = ({ children, hostOnly = false }) => {
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
  if (hostOnly && user.role !== "host") return <Navigate to="/" replace />;
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
      { path: "/profile", element: <ProfileSettings /> },
      { path: "/settings", element: <ProtectedRoute><AccountSettings /></ProtectedRoute> },
      

      // ✅ Protected user routes
      { path: "/checkout",  element: <ProtectedRoute><BookingCheckout /></ProtectedRoute> },
      { path: "/booking/success", element: <ProtectedRoute><BookingSuccess /></ProtectedRoute> },
      { path: "/booking/failed", element: <ProtectedRoute><BookingFailed /></ProtectedRoute> },
      { path: "/bookings",  element: <ProtectedRoute><MyBookings /></ProtectedRoute> },
      { path: "/messages",  element: <ProtectedRoute><Messages /></ProtectedRoute> },
      { path: "/wishlist",  element: <ProtectedRoute><Wishlist /></ProtectedRoute> },

      // ✅ Protected host routes
      { path: "/host/HostDashboard", element: <ProtectedRoute hostOnly><HostDashboard /></ProtectedRoute> },
      { path: "/host/HostListings",  element: <ProtectedRoute hostOnly><HostListings /></ProtectedRoute> },
      { path: "/hostearnings",       element: <ProtectedRoute hostOnly><HostEarnings /></ProtectedRoute> },
      { path: "/host/earnings",      element: <ProtectedRoute hostOnly><HostEarnings /></ProtectedRoute> },
      { path: "/AddListing",         element: <ProtectedRoute hostOnly><AddListing /></ProtectedRoute> },
      { path: "/host/AddListing",    element: <ProtectedRoute hostOnly><AddListing /></ProtectedRoute> },
      { path: "/Managecalendar",     element: <ProtectedRoute hostOnly><Managecalendar /></ProtectedRoute> },
      { path: "/Managepayouts",      element: <ProtectedRoute hostOnly><Managepayouts /></ProtectedRoute> },
      { path: "/profile", element: <ProfileSettings /> },
      { path: "/settings", element: <ProtectedRoute><AccountSettings /></ProtectedRoute> },
      { path: "/payment", element: <ProtectedRoute><Payment /></ProtectedRoute> },
    ],
  },

  // ADMIN ROUTE
  { path: "/admin", element: <AdminSidebar /> },

]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
