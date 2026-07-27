import React, { useState } from "react";
import style from "./Register.module.css";
import { useForm } from "react-hook-form";
import { Button } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { sendRegisterData } from "./RegisterApi";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

const schema = zod
  .object({
    name: zod
      .string()
      .min(3, "Name must be at least 3 characters")
      .max(15, "Name cannot exceed 15 characters")
      .regex(/^[A-Za-z\s]+$/, "Name must contain only letters and spaces"),
    username: zod
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username can be at most 20 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Username must contain only letters, numbers, and underscores"),
    email: zod.string().min(1, "Email is required").email("Invalid email format"),
    gender: zod.enum(["male", "female"], {
      errorMap: () => ({ message: "Please select a gender" }),
    }),
    dateOfBirth: zod
      .string()
      .min(1, "Date of birth is required")
      .refine(
        (val) => {
          const today = new Date();
          const birthDate = new Date(val);
          if (isNaN(birthDate.getTime())) return false;
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          return age >= 18;
        },
        { message: "You must be at least 18 years old" }
      ),

    password: zod
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    rePassword: zod.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.rePassword, {
    message: "Passwords don't match",
    path: ["rePassword"],
  });

export default function Register() {
  const [apiError, setApiError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const {
    handleSubmit,
    register,
    formState: { errors, touchedFields, dirtyFields },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      name: "",
      username: "",
      email: "",
      dateOfBirth: "",
      gender: "",

      password: "",
      rePassword: "",
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

  async function signUp(values) {
    setIsLoading(true);
    setApiError(null);
    setApiSuccess(null);

    const response = await sendRegisterData(values);
    setIsLoading(false);

    const isSuccess = response?.success || response?.message === "success";

    if (isSuccess) {
      setApiSuccess("Account created successfully!");
      setTimeout(() => setApiSuccess(null), 4000);
      navigate("/login");
    } else if (response?.errors) {
      setApiError(response.errors);
      setTimeout(() => setApiError(null), 4000);
    } else if (response?.message) {
      setApiError(response.message);
      setTimeout(() => setApiError(null), 4000);
    } else if (response?.error) {
      setApiError(response.error);
      setTimeout(() => setApiError(null), 4000);
    } else {
      setApiError("Please try again later.");
      setTimeout(() => setApiError(null), 4000);
    }
  }

  return <>
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
            Registration failed: {typeof apiError === "string" ? apiError : JSON.stringify(apiError)}
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
            className="text-5xl xl:text-6xl font-black text-slate-800 leading-[1.1] mb-8">
            Join Socialix Today! <br />
            Ready to <span className="text-[#016630]">Connect</span> and <span className="text-[#016630]">Share</span>?
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl text-slate-500 leading-relaxed max-w-xl"
          >
            Create an account and start connecting with people who matter. Share your thoughts, grow your network, and be part of
            something amazing.
          </motion.p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center py-10 px-4 overflow-y-auto">
        <div className="w-full max-w-[480px] m-auto p-6 md:p-8 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl border border-slate-100">
          <div className="mb-8 text-left">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">
              Create <span className="text-[#016630]">New Account</span>
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Join our community and start sharing your moments</p>
          </div>
          <form onSubmit={handleSubmit(signUp)}>
            <div className="flex flex-col gap-5">
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
                  <input placeholder="Full name" {...register("name")} className={getInputClass("name")} type="text" name="name" />
                </div>
                {errors.name?.message && <p className="text-red-500 text-xs mt-1 text-left font-medium">{errors.name?.message}</p>}
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
                      className="lucide lucide-at-sign"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="4"></circle>
                      <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"></path>
                    </svg>
                  </span>

                  <input
                    placeholder="Username"
                    {...register("username")}
                    className={getInputClass("username")}
                    type="text"
                    name="username"
                  />
                </div>
                {errors.username?.message && <p className="text-red-500 text-xs mt-1 text-left font-medium">{errors.username?.message}</p>}
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
                      className="lucide lucide-at-sign"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="4"></circle> <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"></path>
                    </svg>
                  </span>

                  <input placeholder="Email address" {...register("email")} className={getInputClass("email")} type="email" name="email" />
                </div>
                {errors.email?.message && <p className="text-red-500 text-xs mt-1 text-left font-medium">{errors.email?.message}</p>}
              </div>

              <div className="flex flex-col sm:flex-row gap-5">
                <div className="flex flex-col flex-1 w-full relative">
                  <div className="relative">
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
                      className="lucide lucide-users pointer-events-none
                    absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      aria-hidden="true">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <path d="M16 3.128a4 4 0 0 1 0 7.744"></path>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                    </svg>

                    <select name="gender" {...register("gender")} className={getInputClass("gender")}>
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  {errors.gender?.message && <p className="text-red-500 text-xs mt-1 text-left font-medium">{errors.gender?.message}</p>}
                </div>

                <div className="flex flex-col flex-1 w-full relative">
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
                        className="lucide lucide-calendar"
                        aria-hidden="true"
                      >
                        <path d="M8 2v4"></path>
                        <path d="M16 2v4"></path>
                        <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                        <path d="M3 10h18"></path>
                      </svg>
                    </span>

                    <input
                      placeholder="Date of birth"
                      {...register("dateOfBirth")}
                      className={getInputClass("dateOfBirth")}
                      type="date"
                      name="dateOfBirth"
                    />
                  </div>
                  {errors.dateOfBirth?.message && (
                    <p className="text-red-500 text-xs mt-1 text-left font-medium">{errors.dateOfBirth?.message}</p>
                  )}
                </div>
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
                      <path
                        d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1
                      0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"
                      ></path>
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
                    placeholder="Confirm password"
                    {...register("rePassword")}
                    className={getInputClass("rePassword")}
                    type="password"
                    name="rePassword"
                  />
                </div>
                {errors.rePassword?.message && (
                  <p className="text-red-500 text-xs mt-1 text-left font-medium">{errors.rePassword?.message}</p>
                )}
              </div>

              <Button
                type="submit"
                isLoading={isLoading}
                className=" w-full rounded-xl py-6 font-extrabold text-white transition disabled:opacity-60
              bg-[#016630] hover:bg-[#0d542b]"
              >
                Register
              </Button>
              <p className="relative -top-2 text-center">
                Already have an account?{" "}
                <Link to={"/login"} className="text-green-800 no-underline hover:underline font-bold">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

    </div>
  </>

}
