import React, { useState, useContext } from "react";
import style from "./Login.module.css";
import { useForm } from "react-hook-form";
import { Button } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { sendLoginData } from "./LoginApi";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../Context/AuthContext";

const schema = zod.object({
  email: zod.string().min(1, "Username is required"),

  password: zod
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

export default function Login() {
  const [apiError, setApiError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setisLoggedIn } = useContext(AuthContext);
  const {
    handleSubmit,
    register,
    formState: { errors, touchedFields, dirtyFields },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(schema),
  });

  const getInputClass = (fieldName) => {
    const baseClass =
      "w-full rounded-xl border bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition-colors duration-300 focus:bg-white";
    if (errors[fieldName]) {
      return `${baseClass} border-red-500 focus:border-red-500`;
    } else if (dirtyFields[fieldName] || touchedFields[fieldName]) {
      return `${baseClass} border-green-800 focus:border-green-800`;
    }
    return `${baseClass} border-slate-200 focus:border-[#016630]`;
  };
  const navigate = useNavigate();

  async function signIn(values) {
    setIsLoading(true);
    setApiError(null);
    setApiSuccess(null);

    const response = await sendLoginData(values);
    setIsLoading(false);

    // Help debug if it still fails
    console.log("Login Response:", response);

    // Some APIs use response.success, others use response.message === "success"
    // Or if there is a token, it's a clear success
    const isSuccess = response?.success || 
                     response?.message === "success" || 
                     response?.token || 
                     response?.data?.token ||
                     response?.user?.token;

    if (isSuccess) {
      setApiSuccess("Logged in successfully!");
      setTimeout(() => setApiSuccess(null), 4000);
      
      const token = response.token || 
                    response.data?.token || 
                    response.user?.token || 
                    (typeof response.data === "string" ? response.data : null);
                    
      if (token) {
        localStorage.setItem("token", token);
        setisLoggedIn(true);
        navigate("/");
      } else {
        setApiError("Authentication succeeded but no token was found.");
      }
    } else if (response?.errors) {
      setApiError(response.errors);
      setTimeout(() => setApiError(null), 4000);
    } else if (response?.message) {
      setApiError(response.message);
      setTimeout(() => setApiError(null), 4000);
    } else if (response?.msg) {
      setApiError(response.msg);
      setTimeout(() => setApiError(null), 4000);
    } else if (response?.error) {
      setApiError(response.error);
      setTimeout(() => setApiError(null), 4000);
    } else if (response?.err) {
      setApiError(response.err);
      setTimeout(() => setApiError(null), 4000);
    } else {
      setApiError("Please try again later.");
      setTimeout(() => setApiError(null), 4000);
    }
  }

  return (
    <>
      <AnimatePresence>
        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-10 left-1/2 z-[9999] flex items-center mt-[-28px] bg-white shadow-xl rounded-xl px-5 py-4 gap-3 w-max max-w-lg border border-slate-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-500 shrink-0">
              <path
                fillRule="evenodd"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm font-medium text-slate-800">
              Login failed: {typeof apiError === "string" ? apiError.replace(/email/gi, "username") : JSON.stringify(apiError)}
            </p>
          </motion.div>
        )}

        {apiSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-10 left-1/2 z-[9999] flex items-center mt-[-28px] bg-white shadow-xl rounded-xl px-5 py-4 gap-3 w-max max-w-lg border border-slate-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-green-500 shrink-0">
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm font-medium text-slate-800">Success: {apiSuccess}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen flex flex-col lg:flex-row bg-[#fdfdfd] md:bg-[#f8fafc]">
        {/* Left Side: Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-24 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-green-50 rounded-full blur-3xl opacity-60"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-green-100 rounded-full blur-3xl opacity-40"></div>

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-5 mb-10"
            >
              <div className="w-[72px] h-[72px] bg-white rounded-[24px] flex items-center justify-center border border-slate-100 shadow-sm">
                <i className="fa-regular fa-comment-dots text-[#016630] text-[36px]"></i>
              </div>
              <span className="text-5xl font-black text-[#016630] tracking-tight">Socialix</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl xl:text-6xl font-black text-slate-800 leading-[1.1] mb-8"
            >
              Welcome Back! <br />
              Ready to <span className="text-[#016630]">Connect</span> and <span className="text-[#016630]">Share</span>?
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl text-slate-500 leading-relaxed max-w-xl"
            >
              Continue your journey with Socialix. Share your moments, connect with friends, and discover what's happening around you in
              real-time.
            </motion.p>
          </div>
        </div>

        {/* Right Side: Original Form */}
        <div className="flex-1 flex flex-col justify-center items-center py-10 px-4">
          <div className="w-full max-w-[450px] m-auto p-8 md:p-10 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl border border-slate-100">
            <div className="mb-8 text-left">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">
                Log in <span className="text-[#016630]"> to Socialix</span>
              </h2>
              <p className="text-slate-500 mt-2 font-medium">Log in to your account to continue your journey</p>
            </div>
            <form onSubmit={handleSubmit(signIn)}>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col w-full">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-user"
                        aria-hidden="true"
                      >
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </span>

                    <input placeholder="Username" {...register("email")} className={getInputClass("email")} type="text" name="email" />
                  </div>
                  {errors.email?.message && <p className="text-red-500 text-xs mt-1 text-left font-medium">{errors.email?.message}</p>}
                </div>

                <div className="flex flex-col w-full">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-key-round"
                        aria-hidden="true"
                      >
                        <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"></path>
                        <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle>
                      </svg>
                    </span>

                    <input
                      placeholder="Password"
                      {...register("password")}
                      className={getInputClass("password")}
                      type="password"
                      name="password"
                    />
                  </div>
                  {errors.password?.message && <p className="text-red-500 text-xs mt-1 text-left font-medium">{errors.password?.message}</p>}
                </div>

                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="mt-2 w-full rounded-xl py-[1.35rem] font-extrabold text-white transition disabled:opacity-60
                bg-[#016630] hover:bg-[#0d542b] text-[15px] tracking-wide"
                >
                  Login
                </Button>

                <div className="flex flex-col items-center gap-3 mt-4 pt-5 border-t border-gray-100">
                  <p className="text-[15px] text-gray-700">
                    Don't have an account?{" "}
                    <Link to={"/register"} className="text-green-800 no-underline hover:underline font-bold">
                      Sign up
                    </Link>
                  </p>
                  <p className="text-sm font-medium text-gray-500">
                    Forgot your password?{" "}
                    <Link to={"/change-password"} className="text-[#016630] hover:underline">
                      Reset it
                    </Link>
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>

      </div>
    </>
  );
}
