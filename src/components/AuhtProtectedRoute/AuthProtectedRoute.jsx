import { useContext, useState } from "react";
import React from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../Context/AuthContext";

export default function AuhProtectedRoute({ children }) {
  const { isLoggedIn, setisLoggedIn } = useContext(AuthContext);
  return !isLoggedIn ? children : <Navigate to={"/"} />;
}
