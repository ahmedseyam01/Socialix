import "./App.css";
import Layout from "./components/Layout/Layout";
import Home from "./components/Home/Home";
import Profile from "./components/Profile/Profile";
import Login from "./components/Login/Login";
import Register from "./components/Register/Register";
import NotFound from "./components/NotFound/NotFound";
import SinglePosts from "./components/SinglePosts/SinglePosts";
import ChangePassword from "./components/ChangePassword/ChangePassword";
import Suggestions from "./components/Suggestions/Suggestions";
import Auth from "./components/Layout/Auth";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { HeroUIProvider } from "@heroui/react";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import AuhProtectedRoute from "./components/AuhtProtectedRoute/AuthProtectedRoute";

const routers = createBrowserRouter([
  {
    path: "",
    element: <Layout />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile/:userId",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "suggestions",
        element: (
          <ProtectedRoute>
            <Suggestions />
          </ProtectedRoute>
        ),
      },
      {
        path: "post/:id",
        element: (
          <ProtectedRoute>
            <SinglePosts />
          </ProtectedRoute>
        ),
      },
      {
        path: "change-password",
        element: (
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        ),
      },
      {
        path: "*",
        element: (
          <ProtectedRoute>
            <NotFound />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "",
    element: <Auth />,
    children: [
      {
        path: "register",
        element: (
          <AuhProtectedRoute>
            <Register />
          </AuhProtectedRoute>
        ),
      },
      {
        path: "login",
        element: (
          <AuhProtectedRoute>
            <Login />
          </AuhProtectedRoute>
        ),
      },
    ],
  },
]);

function App() {
  return (
    <>
      <HeroUIProvider>
        <RouterProvider router={routers} />
      </HeroUIProvider>
    </>
  );
}

export default App;
