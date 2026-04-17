import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "axios";

import Logo from "../components/layout/Logo";
import InputField from "../components/ui/InputField";
import LeftPanel from "../components/layout/LeftPanel";
import { toast } from "react-toastify";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const handleGoogleSignIn = () => {
    window.location.href = "/auth/google";
  };

  const submitHandler = async (data) => {
  try {
    setLoading(true);

    const res = await axios.post(
      "/user/login",
      data,
      { withCredentials: true }
    );

    console.log(res.data);
    toast.success(res.data?.message);

    const user = res.data?.user || res.data?.data;
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
    if (user?.role === "host") {
      navigate("/host/HostDashboard");
    } else if (user?.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/");
    }

    // navbar update
    window.location.reload();

  } catch (error) {
    console.log(error);
    toast.error(error.response?.data?.message);
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="min-h-screen flex justify-center items-center bg-[#f5f3ec] p-4">
      <div className="grid lg:grid-cols-2 bg-white rounded-3xl shadow-xl max-w-4xl w-full overflow-hidden">
        <LeftPanel />

        <div className="p-10">
          <Logo />

          <h1 className="text-2xl font-bold mt-6 text-[#2d3a1e]">
            Welcome back
          </h1>

          <form
            onSubmit={handleSubmit(submitHandler)}
            className="space-y-4 mt-6"
          >
            <InputField
              label="Email"
              icon={Mail}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Invalid email",
                },
              })}
              autoComplete="email"
              error={errors.email?.message}
              placeholder="rahul@example.com"
            />

            <InputField
              label="Password"
              type={showPassword ? "text" : "password"}
              icon={Lock}
              {...register("password", {
                required: "Password is required",
              })}
              autoComplete="current-password"
              error={errors.password?.message}
              placeholder="Enter your password"
              rightEl={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={16} className="text-[#8aab5c]" />
                  ) : (
                    <Eye size={16} className="text-[#8aab5c]" />
                  )}
                </button>
              }
            />

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-xs text-[#6b8c3e] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className={`w-full mt-2 bg-[#6b8c3e] text-white py-3 rounded-xl hover:bg-[#5a7a30] transition-colors shadow-sm ${loading && "opacity-50"}`}
              disabled={loading}
            >
              {loading ? "Please wait..." : "Sign in"}
            </button>
          </form>

          {/* OR Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[#e0dbd0]"></div>
            <span className="text-sm text-[#b0aa9a]">or</span>
            <div className="flex-1 h-px bg-[#e0dbd0]"></div>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full mt-6 border text-sm border-[#d6cebc] py-3 rounded-xl flex items-center justify-center gap-4 hover:bg-[#f5f3ec] transition-colors text-[#3d5028]"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              className="w-5 h-5"
            />
            Sign in with Google
          </button>

          <p className="text-sm mt-6 text-center text-[#5a7a30]">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-[#3d5028] font-semibold hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
