import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const [showCategories, setShowCategories] = useState(false);
  const navigate = useNavigate();

  // Lắng nghe sự thay đổi từ localStorage khi có component khác click "Apply to be a Mentor" hoặc click nút Login
  useEffect(() => {
    // Mặc định luôn hiển thị "Mentors" khi khởi động ứng dụng
    setShowCategories(false);
    localStorage.setItem('mentorMode', 'false');

    // Lắng nghe sự thay đổi localStorage từ các tab/component khác
    const handleStorageChange = (e) => {
      if (e.key === 'mentorMode') {
        setShowCategories(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
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

        {/* Conditional rendering: Mentors hoặc Categories */}
        {!showCategories ? (
          /* Mentors */
          <div className="text-slate-500 text-[16px] font-inter font-medium leading-5 mr-10 whitespace-nowrap cursor-pointer hover:text-slate-600 transition-colors duration-200 hidden md:block">
            Mentors
          </div>
        ) : (
          /* Categories */
          <div className="text-slate-500 text-[16px] font-inter font-medium leading-5 mr-10 whitespace-nowrap cursor-pointer hover:text-slate-600 transition-colors duration-200 hidden md:block">
            Categories
          </div>
        )}


        {/* Search Bar */}
        <div className="w-full max-w-[680px] xl:w-[700px] lg:w-[400px] md:w-[250px] sm:w-[150px] p-2.5 rounded-lg border border-slate-500 flex items-center gap-2.5 mr-6">
          <div className="flex items-center justify-center flex-shrink-0 w-5 h-5">
            <span className="text-xl material-symbols-outlined text-slate-500" style={{
              fontVariationSettings: "'FILL' 0, 'wght' 700, 'GRAD' 200, 'opsz' 24"
            }}>
              search
            </span>
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
              <span className="text-2xl transition-colors duration-200 material-symbols-outlined text-slate-500 hover:text-slate-600" style={{
                fontVariationSettings: "'FILL' 0, 'wght' 700, 'GRAD' 200, 'opsz' 24"
              }}>
                shopping_cart
              </span>
            </div>

            {/* Log In Button */}
            <button onClick={() => {
              localStorage.setItem('mentorMode', 'true');
              setShowCategories(true);
              navigate("/login");
            }} className="px-2.5 py-2.5 border border-slate-500 bg-transparent text-slate-500 text-sm font-inter font-medium leading-5 cursor-pointer rounded transition-all duration-200 hover:bg-slate-500 hover:text-white sm:px-2 sm:py-2 sm:text-[15px]">
              Log In
            </button>

            {/* Sign Up Button */}
            <button onClick={() => {
              localStorage.setItem('mentorMode', 'false');
              setShowCategories(false);
              navigate("/signup");
            }} className="px-2.5 py-2.5 bg-slate-700 border border-slate-500 text-white text-sm font-inter font-medium leading-5 cursor-pointer rounded transition-all duration-200 hover:bg-slate-600 hover:border-slate-600 sm:px-2 sm:py-2 sm:text-[16px]">
              Sign Up
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Border */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-slate-300" />
    </header>
  );
};

export default Header;