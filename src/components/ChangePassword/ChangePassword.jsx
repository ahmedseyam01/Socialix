import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { sendChangePasswordData } from "./ChangePasswordApi";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const schema = zod
  .object({
    password: zod.string().min(1, "Current password is required"),
    newPassword: zod
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    rePassword: zod.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.rePassword, {
    message: "Passwords don't match",
    path: ["rePassword"],
  });

export default function ChangePassword() {
  const [apiError, setApiError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const {
    handleSubmit,
    register,
    reset,
    formState: { errors, touchedFields, dirtyFields },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      password: "",
      newPassword: "",
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

  async function submitPasswordChange(values) {
    setIsLoading(true);
    setApiError(null);
    setApiSuccess(null);

    const response = await sendChangePasswordData(values);
    setIsLoading(false);

    if (response?.message === "success" || response?.token || response?.data?.token) {
      setApiSuccess("Password changed successfully! Please login again.");
      reset(); // clear the form

      // Log the user out by removing the old token
      localStorage.removeItem("token");

      setTimeout(() => {
        setApiSuccess(null);
        navigate("/login");
      }, 3000);
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

  return (
    <>
      <AnimatePresence>
        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-10 left-1/2 z-[9999] flex items-center mt-[-1.75rem] bg-white shadow-xl rounded-xl px-5 py-4 gap-3 w-max max-w-lg border border-slate-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-500 shrink-0">
              <path
                fillRule="evenodd"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm font-medium text-slate-800">
              Update failed: {typeof apiError === "string" ? apiError : JSON.stringify(apiError)}
            </p>
          </motion.div>
        )}

        {apiSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-10 left-1/2 z-[9999] flex items-center mt-[-1.75rem] bg-white shadow-xl rounded-xl px-5 py-4 gap-3 w-max max-w-lg border border-slate-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-green-500 shrink-0">
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm font-medium text-slate-800">{apiSuccess}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-gray-100 min-h-screen text-center flex justify-center items-center py-10 px-4">
        <div className="w-full sm:w-3/4 md:w-2/3 lg:w-1/2 max-w-[25rem] m-auto p-6 md:p-8 bg-white shadow-xl rounded-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-green-800 mb-1">Change Password</h1>
            <p className="text-slate-500 text-sm font-medium">Update to a strong and secure password</p>
          </div>

          <form onSubmit={handleSubmit(submitPasswordChange)}>
            <div className="flex flex-col gap-4">
              {/* Current Password Field */}
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
                    placeholder="Current Password"
                    {...register("password")}
                    className={getInputClass("password")}
                    type="password"
                    name="password"
                  />
                </div>
                {errors.password?.message && <p className="text-red-500 text-xs mt-1 text-left font-medium">{errors.password?.message}</p>}
              </div>

              {/* New Password Field */}
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
                      className="lucide lucide-shield-check"
                      aria-hidden="true"
                    >
                      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2-1 4-3 4-3s2 2 4 3c1 0 1 1 1 1v7z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </span>
                  <input
                    placeholder="New Password"
                    {...register("newPassword")}
                    className={getInputClass("newPassword")}
                    type="password"
                    name="newPassword"
                  />
                </div>
                {errors.newPassword?.message && (
                  <p className="text-red-500 text-xs mt-1 text-left font-medium">{errors.newPassword?.message}</p>
                )}
              </div>

              {/* Confirm New Password Field */}
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
                      className="lucide lucide-shield-check"
                      aria-hidden="true"
                    >
                      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2-1 4-3 4-3s2 2 4 3c1 0 1 1 1 1v7z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </span>
                  <input
                    placeholder="Confirm New Password"
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
                className="mt-2 w-full rounded-xl py-6 font-extrabold text-white transition disabled:opacity-60
              bg-[#016630] hover:bg-[#0d542b]"
              >
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
