import React, { useContext } from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Skeleton,
} from "@heroui/react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../../Context/AuthContext";
import UserAvatar from "../UserAvatar/UserAvatar";

export default function NavbarComponent() {
  const navigate = useNavigate();
  const { isLoggedIn, setisLoggedIn, userProfile, isProfileLoading } = useContext(AuthContext);

  const currentUser = userProfile || { name: "User", username: "user", photo: "" };

  const handleLogoutAction = () => {
    localStorage.removeItem("token");
    setisLoggedIn(false);
  };

  const getNavLinkClass = ({ isActive: isLinkActive }) => {
    const baseClasses = "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 group no-underline";
    const activeClasses = isLinkActive ? "text-[#016630]" : "text-gray-500 hover:text-[#016630]";
    return `${baseClasses} ${activeClasses}`;
  };

  return (
    <>
      <Navbar className="h-16 bg-white shadow-lg" maxWidth="xl">
        {/* Left Section: Brand Logo */}
        <NavbarBrand>
          <NavLink to="/" className="flex items-center gap-1.5 no-underline">
            <i className="fa-regular fa-comment-dots text-[#016630] text-3xl" />
            <span className="text-2xl font-bold text-gray-900 tracking-tight hidden sm:block">
              {" "}
              <span className="text-[#016630] text-3xl">S</span>ocialiX
            </span>
          </NavLink>
        </NavbarBrand>

        {/* Center Section: Navigation Links */}
        <NavbarContent className="flex gap-4 sm:gap-8" justify="center">
          <NavbarItem>
            <NavLink to="/" end className={getNavLinkClass}>
              <i className="fa-regular fa-house text-xl" />
              <span className="font-bold text-[15px] hidden md:block">Home</span>
            </NavLink>
          </NavbarItem>
          <NavbarItem>
            <NavLink to="/notifications" className={getNavLinkClass}>
              <i className="fa-regular fa-bell text-xl" />
              <span className="font-bold text-[15px] hidden md:block">Notifications</span>
            </NavLink>
          </NavbarItem>
          <NavbarItem>
            <NavLink to="/profile" className={getNavLinkClass}>
              <i className="fa-regular fa-user text-xl" />
              <span className="font-bold text-[15px] hidden md:block">Profile</span>
            </NavLink>
          </NavbarItem>
        </NavbarContent>

        {/* Right Section: User Profile & Actions */}
        <NavbarContent as="div" justify="end">
          <Dropdown placement="bottom-end" className="p-0 border border-gray-100 shadow-xl rounded-2xl overflow-hidden">
            <DropdownTrigger>
              <div className="flex items-center gap-3 cursor-pointer p-1.5 rounded-full hover:bg-gray-50 transition-all group">
                <UserAvatar user={currentUser} size="sm" showSkeleton />
                <Skeleton isLoaded={!isProfileLoading} className="rounded-lg">
                  <span className="hidden lg:block font-bold text-[15px] text-gray-700 group-hover:text-[#016630] min-w-[60px]">
                    {currentUser.name}
                  </span>
                </Skeleton>
              </div>
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" className="w-60 p-2" variant="flat">
              <DropdownItem key="profile_header" className="h-14 gap-2 border-b border-gray-50 opacity-100 mb-1" isReadOnly>
                <p className="text-[11px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Signed in as</p>
                <p className="text-sm font-black text-gray-900">@{currentUser.username}</p>
              </DropdownItem>
              <DropdownItem
                key="dark_mode"
                startContent={<i className="fa-regular fa-moon w-5" />}
                className="py-3 rounded-xl font-medium text-gray-600 hover:text-[#016630]"
              >
                Dark Mode
              </DropdownItem>
              <DropdownItem
                key="my_profile"
                onClick={() => navigate("/profile")}
                startContent={<i className="fa-regular fa-user w-5" />}
                className="py-3 rounded-xl font-medium text-gray-600 hover:text-[#016630]"
              >
                My Profile
              </DropdownItem>
              <DropdownItem
                key="logout"
                color="danger"
                className="py-3 rounded-xl font-bold text-red-500 hover:bg-red-50"
                onClick={handleLogoutAction}
                startContent={<i className="fa-solid fa-arrow-right-from-bracket w-5" />}>
                Log Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarContent>
      </Navbar>
    </>
  );
}
