import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { IoSearch, IoCartOutline } from 'react-icons/io5';
import { FaRegHeart, FaRegBell } from 'react-icons/fa';
import { MdOutlineShoppingCart } from 'react-icons/md';

const Header = () => {
  const [showCategories, setShowCategories] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname;
    const shouldShowCategories =
      currentPath.includes('/auth/signin') || currentPath.includes('/auth/apply-as-men');

    setShowCategories(shouldShowCategories);
    localStorage.setItem('mentorMode', shouldShowCategories.toString());

    const loginStatus = localStorage.getItem('isLoggedIn');
    setIsLoggedIn(loginStatus === 'true');

    const handleStorageChange = (e) => {
      if (e.key === 'mentorMode') {
        setShowCategories(e.newValue === 'true');
      }
      if (e.key === 'isLoggedIn') {
        setIsLoggedIn(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [location.pathname]);

  const handleAPICall = (id, action) => {
    console.log(`API Call - ID: ${id}, Action: ${action}`);
  };

  const toggleLoginStatus = () => {
    const newStatus = !isLoggedIn;
    setIsLoggedIn(newStatus);
    localStorage.setItem('isLoggedIn', newStatus.toString());
  };

  return (
    <>
      <header className="relative w-full h-16 bg-white">
        <div className="relative flex items-center w-full h-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-20">
          {/* Logo */}
          <div
            className="text-slate-500 text-xl md:text-2xl font-inter font-bold mr-4 md:mr-9 min-w-[100px] cursor-pointer hover:text-slate-600 transition-colors duration-200"
            onClick={() => {
              localStorage.setItem('mentorMode', 'false');
              setShowCategories(false);
              navigate('/home');
            }}
          >
            MentorMe
          </div>

          {/* Categories or Mentors */}
          <div className="hidden md:block text-slate-500 text-[14px] md:text-[16px] font-inter font-light leading-5 mr-6 md:mr-10 whitespace-nowrap cursor-pointer hover:text-slate-600 transition-colors duration-200">
            {showCategories ? 'Categories' : 'Mentors'}
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-full sm:max-w-[400px] md:max-w-[500px] lg:max-w-[580px] xl:max-w-[680px] p-2.5 rounded-lg border border-slate-500 flex items-center gap-2.5 mr-2 sm:mr-4 md:mr-6">
            <IoSearch className="text-xl text-slate-500" />
            <input
              type="text"
              placeholder="Search courses"
              className="flex-1 text-sm md:text-base font-medium bg-transparent border-none outline-none text-slate-500 placeholder:text-slate-500"
            />
          </div>

          {/* Right section */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6 ml-2 sm:ml-4">
            {/* Mentor with MentorMe */}
            <div className="hidden md:block text-slate-500 text-sm lg:text-base font-inter font-light leading-5 whitespace-nowrap cursor-pointer hover:text-slate-600 transition-colors duration-200">
              Mentor with MentorMe
            </div>

            {/* Action area */}
            {!isLoggedIn ? (
              <>
                <button
                  onClick={() => {
                    localStorage.setItem('mentorMode', 'true');
                    setShowCategories(true);
                    navigate('/auth/signin');
                  }}
                  className="px-2 sm:px-3 py-2 text-xs sm:text-sm border border-slate-500 bg-transparent text-slate-500 font-light rounded hover:bg-slate-500 hover:text-white transition-all duration-200"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('mentorMode', 'false');
                    setShowCategories(false);
                    navigate('/auth/signup');
                  }}
                  className="px-2 sm:px-3 py-2 text-xs sm:text-sm bg-slate-700 border border-slate-500 text-white font-light rounded hover:bg-slate-600 hover:border-slate-600 transition-all duration-200"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center cursor-pointer"
                  onClick={() => handleAPICall('demo-mentor-id', 'Favorite')}
                >
                  <FaRegHeart size={20} className="text-slate-500 hover:text-red-500 transition-colors duration-200" />
                </div>
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center cursor-pointer"
                  onClick={() => handleAPICall('cart-mentor-id', 'Cart')}
                >
                  <MdOutlineShoppingCart size={20} className="text-slate-500 hover:text-slate-600 transition-colors duration-200" />
                </div>
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center cursor-pointer"
                  onClick={() => handleAPICall('bell-mentor-id', 'Bell')}
                >
                  <FaRegBell size={20} className="text-slate-500 hover:text-blue-500 transition-colors duration-200" />
                </div>
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-slate-700 text-white text-sm font-bold cursor-pointer select-none hover:bg-slate-600 transition-colors duration-200"
                  onClick={() => handleAPICall('avatar-mentor-id', 'Avatar')}
                  title="User Profile"
                >
                  V
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-slate-300" />
      </header>
      <Outlet />
    </>
  );
};

export default Header;
