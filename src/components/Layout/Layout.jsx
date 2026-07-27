import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./../Navbar/Navbar";
import LeftSidebar from "../LeftSidebar/LeftSidebar";
import RightSidebar from "../RightSidebar/RightSidebar";
import Footer from "./../Footer/Footer";

export default function Layout() {
  const currentPathLocation = useLocation();
  const isSuggestionsPageRoute = currentPathLocation.pathname === "/suggestions";
  const isProfilePage = currentPathLocation.pathname.startsWith("/profile");

  return (
    <>
      <div className="min-h-screen bg-[#f0f2f5] flex flex-col">
        {/* Top Navigation Bar */}
        <Navbar />

        {/* Dynamic Main Layout */}
        <main className="flex-1 pt-4 pb-10 px-4">
          <div className={`max-w-[1400px] mx-auto gap-6 items-start ${
            (isSuggestionsPageRoute || isProfilePage)
              ? "block" 
              : "grid grid-cols-1 lg:grid-cols-[280px_1fr_320px]"
          }`}>

            {/* Left Sidebar - Hidden on Suggestions & Profile Page */}
            {(!isSuggestionsPageRoute && !isProfilePage) && (
              <div className="hidden lg:block sticky top-20">
                <LeftSidebar />
              </div>
            )}

            {/* Main Content Area (Center Feed) */}
            <div className="w-full min-w-0">
              <Outlet />
            </div>

            {/* Right Sidebar - Hidden on Suggestions & Profile Page */}
            {(!isSuggestionsPageRoute && !isProfilePage) && (
              <div className="hidden lg:block sticky top-20 max-h-[calc(100vh-100px)] overflow-y-auto scrollbar-hide">
                <RightSidebar />
              </div>
            )}

          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
