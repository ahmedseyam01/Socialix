import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

const NAVIGATION_MENU_ITEMS = [
  { 
    to: "/", 
    label: "Home", 
    icon: <i className="fa-regular fa-house text-[20px]" />, 
    end: true 
  },
  { 
    to: "/community", 
    label: "Community", 
    activeColor: "text-[#016630]",
    customIcon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users w-5 h-5 shrink-0" aria-hidden="true">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
        <path d="M16 3.128a4 4 0 0 1 0 7.744"></path>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
        <circle cx="9" cy="7" r="4"></circle>
      </svg>
    ),
    end: false 
  },
  { 
    to: "/my-posts", 
    label: "My Posts", 
    icon: <i className="fa-regular fa-image text-[20px]" />, 
    end: false 
  },
  { 
    to: "/saved", 
    label: "Saved", 
    icon: <i className="fa-regular fa-bookmark text-[20px]" />, 
    end: false 
  },
];

const QUICK_LINKS = [
  { icon: "fa-solid fa-shield-halved", label: "Privacy Settings", color: "text-blue-400", path: "/settings" },
  { icon: "fa-regular fa-circle-question", label: "Help Center", color: "text-purple-400", path: "/help" },
  { icon: "fa-regular fa-flag", label: "Report a Problem", color: "text-red-400", path: "/report" },
];

export default function LeftSidebar() {
  const navigate = useNavigate();

  return (
    <>
      <aside className="w-full flex flex-col gap-4 sticky top-20">
        {/* Navigation Card */}
        <nav className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-3 flex flex-col gap-1">
          {NAVIGATION_MENU_ITEMS.map((navigationItem) => (
            <NavLink
              key={navigationItem.to}
              to={navigationItem.to}
              end={navigationItem.end}
              className={({ isActive: isLinkActive }) => {
                const baseClasses = "flex items-center gap-3.5 px-4 py-3.5 rounded-[14px] transition-all duration-200 no-underline group";
                const activeClasses = isLinkActive ? "bg-[#e8f5ee] text-[#016630]" : "text-gray-500 hover:bg-gray-50 hover:text-[#016630]";
                return `${baseClasses} ${activeClasses}`;
              }}
            >
              {({ isActive: isLinkActive }) => (
                <>
                  <div className={`transition-transform duration-200 group-hover:scale-110 flex items-center justify-center ${isLinkActive ? "text-[#016630]" : "text-gray-400"}`}>
                    {navigationItem.customIcon ? navigationItem.customIcon : navigationItem.icon}
                  </div>
                  <span className={`font-bold text-[15px] ${isLinkActive ? "text-[#016630]" : ""}`}>
                    {navigationItem.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Quick Links Card */}
        <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-5">
          <p className="text-[12px] font-black uppercase tracking-widest text-gray-400 mb-4 px-1">Quick Links</p>
          <div className="flex flex-col gap-1">
            {QUICK_LINKS.map((quickLinkItem) => (
              <button
                key={quickLinkItem.label}
                onClick={() => navigate(quickLinkItem.path)}
                className="flex items-center gap-3 text-gray-500 hover:text-[#016630] hover:bg-gray-50 px-3 py-2.5 rounded-xl text-[14px] font-semibold transition-all group w-full text-left"
              >
                <i className={`${quickLinkItem.icon} ${quickLinkItem.color} text-[16px] transition-transform group-hover:scale-110`} />
                {quickLinkItem.label}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
