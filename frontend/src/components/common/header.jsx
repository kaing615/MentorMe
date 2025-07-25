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
  

  // Lắng nghe sự thay đổi từ localStorage khi có component khác click "Apply to be a Mentor" hoặc click nút Login
  useEffect(() => {
    // Kiểm tra route hiện tại để quyết định hiển thị Categories hay Mentors
    const currentPath = location.pathname;
    const shouldShowCategories = currentPath.includes('/auth/signin') || currentPath.includes('/auth/apply-as-men');
    
    setShowCategories(shouldShowCategories);
    localStorage.setItem('mentorMode', shouldShowCategories.toString());

    // Kiểm tra trạng thái đăng nhập từ localStorage
    const loginStatus = localStorage.getItem('isLoggedIn');
    setIsLoggedIn(loginStatus === 'true');

    // Lắng nghe sự thay đổi localStorage từ các tab/component khác
    const handleStorageChange = (e) => {
      if (e.key === 'mentorMode') {
        setShowCategories(e.newValue === 'true');
      }
      if (e.key === 'isLoggedIn') {
        setIsLoggedIn(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [location.pathname]); // Thêm location.pathname vào dependency array

  // Xử lý các API calls cho các biểu tượng hành động
  const handleAPICall = (id, action) => {
    console.log(`API Call - ID: ${id}, Action: ${action}`);
    // Thêm logic API call ở đây
  };

  // Function để test login (có thể gọi từ console hoặc button test)
  const toggleLoginStatus = () => {
    const newStatus = !isLoggedIn;
    setIsLoggedIn(newStatus);
    localStorage.setItem('isLoggedIn', newStatus.toString());
  };

  // hiển thị biểu tượng hành động khi đã đăng nhập nếu chưa thì hiển thị biểu tượng đăng nhập
  

  return (
    <>
    <header className="relative w-full h-16 bg-white ">
      <div className="relative flex items-center w-full h-full px-14">
        {/* logo */}
        <div 
          className="text-slate-500 text-2xl font-inter font-bold mr-9 min-w-[120px] cursor-pointer hover:text-slate-600 transition-colors duration-200"
          onClick={() => {
            localStorage.setItem('mentorMode', 'false');
            setShowCategories(false);
            navigate("/");
          }}
        >
          MentorMe
        </div>

        {/* Conditional rendering: Mentors hoặc Categories dựa trên route */}
        {showCategories ? (
          /* Categories - hiển thị khi ở trang signin hoặc about-you */
          <div className="text-slate-500 text-[16px] font-inter font-medium leading-5 mr-10 whitespace-nowrap cursor-pointer hover:text-slate-600 transition-colors duration-200 hidden md:block">
            Categories
          </div>
        ) : (
          /* Mentors - hiển thị cho các trang khác */
          <div className="text-slate-500 text-[16px] font-inter font-medium leading-5 mr-10 whitespace-nowrap cursor-pointer hover:text-slate-600 transition-colors duration-200 hidden md:block">
            Mentors
          </div>
        )}


        {/* Search Bar */}
        <div className="w-full max-w-[680px] xl:w-[700px] lg:w-[400px] md:w-[250px] sm:w-[150px] p-2.5 rounded-lg border border-slate-500 flex items-center gap-2.5 mr-6">
          <div className="flex items-center justify-center flex-shrink-0 w-5 h-5">
            <IoSearch className="text-xl text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Search courses"
            className="flex-1 text-sm font-medium leading-5 bg-transparent border-none outline-none text-slate-500 font-inter placeholder:text-slate-500"
          />
        </div>

        {/* Right Section */}
        <div className="flex items-center ml-5 gap-7">
          <div className="text-slate-500 text-base text-[16px] font-inter font-medium leading-5 whitespace-nowrap cursor-pointer hover:text-slate-600 transition-colors duration-200 hidden lg:block">
            Mentor with MentorMe
          </div>

          <div className="flex items-center gap-6">
            {/* Notification/Cart Icon */}
            <div className="flex items-center justify-center w-6 h-6 cursor-pointer">
              <IoCartOutline className="text-2xl transition-colors duration-200 text-slate-500 hover:text-slate-600" />
            </div>

            {/* Conditional rendering based on login status */}
            {!isLoggedIn ? (
              // Show login/signup buttons when not logged in
              <>
                {/* Log In Button */}
                <button onClick={() => {
                  localStorage.setItem('mentorMode', 'true');
                  setShowCategories(true);
                  navigate("/auth/signin");
                }} className="px-2.5 py-2.5 border border-slate-500 bg-transparent text-slate-500 text-sm font-inter font-medium leading-5 cursor-pointer rounded transition-all duration-200 hover:bg-slate-500 hover:text-white sm:px-2 sm:py-2 sm:text-[15px]">
                  Log In
                </button>

                {/* Sign Up Button */}
                <button onClick={() => {
                  localStorage.setItem('mentorMode', 'false');
                  setShowCategories(false);
                  navigate("/auth/signup");
                }} className="px-2.5 py-2.5 bg-slate-700 border border-slate-500 text-white text-sm font-inter font-medium leading-5 cursor-pointer rounded transition-all duration-200 hover:bg-slate-600 hover:border-slate-600 sm:px-2 sm:py-2 sm:text-[16px]">
                  Sign Up
                </button>
              </>
            ) : (
              // Show action icons when logged in
              <div className="flex items-center gap-4">
                {/* Favorite Icon */}
                <div
                  className="w-8 h-8 flex items-center justify-center cursor-pointer"
                  onClick={() => handleAPICall("demo-mentor-id", "Favorite")}
                >
                  <FaRegHeart
                    size={20}
                    className="text-slate-500 hover:text-red-500 transition-colors duration-200"
                  />
                </div>
                
                {/* Shopping Cart Icon */}
                <div
                  className="w-8 h-8 flex items-center justify-center cursor-pointer"
                  onClick={() => handleAPICall("cart-mentor-id", "Cart")}
                >
                  <MdOutlineShoppingCart
                    size={20}
                    className="text-slate-500 hover:text-slate-600 transition-colors duration-200"
                  />
                </div>
                
                {/* Notification Bell Icon */}
                <div
                  className="w-8 h-8 flex items-center justify-center cursor-pointer"
                  onClick={() => handleAPICall("bell-mentor-id", "Bell")}
                >
                  <FaRegBell
                    size={20}
                    className="text-slate-500 hover:text-blue-500 transition-colors duration-200"
                  />
                </div>
                
                {/* User Avatar */}
                <div
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 text-white text-base font-bold cursor-pointer select-none hover:bg-slate-600 transition-colors duration-200"
                  onClick={() => handleAPICall("avatar-mentor-id", "Avatar")}
                  title="User Profile"
                >
                  V
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Border */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-slate-300" />
    </header>
    <Outlet />
    </>
  );
};

export default Header;