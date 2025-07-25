import React, { useState, useEffect } from "react";
import { FaRegHeart, FaRegBell, FaUserCircle } from "react-icons/fa";
import { MdOutlineShoppingCart } from "react-icons/md";

const Header = () => {
  const [showCategories, setShowCategories] = useState(false);

  const handleAPICall = async (mentorId, action) => {
    try {
      const res = await getMentorInfo(mentorId);
      console.log(`${action} API result:`, res?.data);
    } catch (err) {
      console.error(`${action} API error:`, err);
    }
  };

  useEffect(() => {
    const mentorMode = localStorage.getItem("mentorMode") === "true";
    // You can use mentorMode if needed
  }, []);

  return (
    <header className="w-full h-16 relative bg-white border-b border-slate-200">
      <div className="w-full h-full flex items-center px-8 md:px-16 justify-between gap-2">
        {/* Left: Logo & Nav */}
        <div className="flex items-center gap-6 min-w-0 flex-shrink-0 pr-4">
          <div className="text-slate-500 text-2xl font-bold min-w-[130px] select-none">
            MentorMe 
          </div>
          <div className="text-slate-500 text-lg font-semibold cursor-pointer hover:text-slate-600 transition-colors duration-200 hidden md:block select-none">
            {showCategories ? "Categories" : "Mentors"}
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 flex justify-center min-w-0">
          <div className="w-full max-w-[700px] p-2 rounded-lg border border-slate-400 flex items-center gap-2 bg-white">
            <span className="text-lg text-slate-500">
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search courses"
              className="flex-1 border-none outline-none text-slate-500 text-sm font-medium bg-transparent placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-6 min-w-0 flex-shrink-0 pl-4">
          <div className="text-slate-500 text-lg font-semibold cursor-pointer hover:text-slate-600 transition-colors duration-200 hidden lg:block select-none">
            Mentor with MentorMe
          </div>
          <div className="flex items-center gap-4">
            {/* Action Icons */}
            <div
              className="w-8 h-8 flex items-center justify-center cursor-pointer"
              onClick={() => handleAPICall("demo-mentor-id", "Favorite")}
            >
              <FaRegHeart
                size={20}
                className="text-slate-500 hover:text-slate-600 transition-colors duration-200"
              />
            </div>
            <div
              className="w-8 h-8 flex items-center justify-center cursor-pointer"
              onClick={() => handleAPICall("cart-mentor-id", "Cart")}
            >
              <MdOutlineShoppingCart
                size={20}
                className="text-slate-500 hover:text-slate-600 transition-colors duration-200"
              />
            </div>
            <div
              className="w-8 h-8 flex items-center justify-center cursor-pointer"
              onClick={() => handleAPICall("bell-mentor-id", "Bell")}
            >
              <FaRegBell
                size={20}
                className="text-slate-500 hover:text-slate-600 transition-colors duration-200"
              />
            </div>
            <div
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 text-white text-base font-bold cursor-pointer select-none"
              onClick={() => handleAPICall("avatar-mentor-id", "Avatar")}
            >
              V
            </div>
          </div>
        </div>
      </div>
      {/* Bottom Border (now replaced by purple border above) */}
    </header>
  );
};

export default Header;
