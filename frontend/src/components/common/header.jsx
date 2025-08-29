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
  const dispatch = useDispatch();
  
  // Get user data from Redux store
  const user = useSelector((state) => state.user);
  setIsLoggedIn(user?.isLoggedIn || false);

  useEffect(() => {
    const currentPath = location.pathname;
    const shouldShowCategories =
      currentPath.includes("/auth/signin") ||
      currentPath.includes("/auth/apply-as-men");

    setShowCategories(shouldShowCategories);
    localStorage.setItem('mentorMode', shouldShowCategories.toString());

    const loginStatus = localStorage.getItem('isLoggedIn');
    setIsLoggedIn(loginStatus === 'true');

    const handleStorageChange = (e) => {
      if (e.key === "mentorMode") {
        setShowCategories(e.newValue === "true");
      }
      if (e.key === 'isLoggedIn') {
        setIsLoggedIn(e.newValue === 'true');
      }
    };

    const handleClickOutside = (event) => {
      if (!event.target.closest(".dropdown-container")) {
        closeAllDropdowns();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    document.addEventListener("click", handleClickOutside);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [location.pathname]);

  const handleAPICall = (id, action) => {
    console.log(`API Call - ID: ${id}, Action: ${action}`);
  };

  // TODO: Replace with actual API call to remove item from cart
  const removeFromCart = (itemId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    // TODO: Make API call to backend
    // try {
    //   await cartAPI.removeItem(itemId);
    // } catch (error) {
    //   console.error('Failed to remove item from cart:', error);
    //   // Revert the state change if API call fails
    // }
  };

  // TODO: Replace with actual API call to add item to wishlist
  const addToWishlist = (itemId) => {
    console.log(`Adding item ${itemId} to wishlist`);
    // TODO: Make API call to backend
    // try {
    //   await wishlistAPI.addItem(itemId);
    // } catch (error) {
    //   console.error('Failed to add item to wishlist:', error);
    // }
  };

  // Calculate cart total
  const cartTotal = cartItems.reduce((total, item) => total + item.price, 0);
  const cartItemCount = cartItems.length;

  const toggleDropdown = (dropdownName) => {
    setDropdowns((prev) => ({
      cart: false,
      notifications: false,
      profile: false,
      [dropdownName]: !prev[dropdownName],
    }));
  };

  const closeAllDropdowns = () => {
    setDropdowns({
      cart: false,
      notifications: false,
      profile: false,
    });
  };

  const handleWishlist = () => {
    navigate("/wishlist");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.setItem("isLoggedIn", "false");
    closeAllDropdowns();
    navigate("/");
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
              localStorage.setItem("mentorMode", "false");
              setShowCategories(false);
              navigate('/');
            }}
          >
            MentorMe
          </div>

          {/* Categories or Mentors */}
          <div className="hidden md:block text-slate-500 text-[14px] md:text-[16px] font-inter font-light leading-5 mr-6 md:mr-10 whitespace-nowrap cursor-pointer hover:text-slate-600 transition-colors duration-200">
            {showCategories ? "Categories" : "Mentors"}
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
                    localStorage.setItem("mentorMode", "true");
                    setShowCategories(true);
                    navigate("/auth/signin");
                  }}
                  className="px-2 sm:px-3 py-2 text-xs sm:text-sm border border-slate-500 bg-transparent text-slate-500 font-light rounded hover:bg-slate-500 hover:text-white transition-all duration-200"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem("mentorMode", "false");
                    setShowCategories(false);
                    navigate("/auth/signup");
                  }}
                  className="px-2 sm:px-3 py-2 text-xs sm:text-sm bg-slate-700 border border-slate-500 text-white font-light rounded hover:bg-slate-600 hover:border-slate-600 transition-all duration-200"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                {/* Wishlist Icon */}
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center cursor-pointer group"
                  onClick={handleWishlist}
                >
                  <FaRegHeart
                    size={20}
                    className="text-slate-500 group-hover:text-red-500 group-hover:scale-110 transition-all duration-300"
                  />
                </div>

                {/* Shopping Cart Dropdown */}
                <div className="relative dropdown-container">
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center cursor-pointer group relative"
                    onClick={() => toggleDropdown("cart")}
                  >
                    <MdOutlineShoppingCart
                      size={20}
                      className="text-slate-500 group-hover:text-blue-600 group-hover:scale-110 transition-all duration-300"
                    />
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-xs text-white font-bold">
                        {cartItemCount}
                      </span>
                    </div>
                  </div>
                  {dropdowns.cart && (
                    <div className="absolute right-0 top-full mt-3 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 transform transition-all duration-300 ease-out opacity-100 scale-100 animate-fadeInUp">
                      <div className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
                        <div className="relative p-6 border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                              <MdOutlineShoppingCart
                                size={20}
                                className="text-white"
                              />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-800 text-lg">
                                Shopping Cart
                              </h3>
                              <p className="text-sm text-gray-500">
                                {cartItemCount} courses
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        {/* Dynamic Cart Items */}
                        {cartItems.map((item, index) => (
                          <div
                            key={item.id}
                            className={`p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${
                              index < cartItems.length - 1
                                ? "border-b border-gray-50"
                                : ""
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="w-20 h-14 rounded-xl object-cover shadow-md"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl"></div>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-800 mb-1">
                                  {item.title}
                                </h4>
                                <p className="text-sm text-gray-500 mb-1">
                                  By {item.instructor}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-blue-600">
                                    ${item.price}
                                  </span>
                                  <span className="text-sm text-gray-400 line-through">
                                    ${item.originalPrice}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFromCart(item.id);
                                }}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors duration-200 group"
                                title="Remove from cart"
                              >
                                <svg
                                  className="w-4 h-4 text-gray-400 group-hover:text-red-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                        {cartItems.length === 0 && (
                          <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <MdOutlineShoppingCart
                                size={24}
                                className="text-gray-400"
                              />
                            </div>
                            <p className="text-gray-500 mb-2">
                              Your cart is empty
                            </p>
                            <p className="text-sm text-gray-400">
                              Add some courses to get started!
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50"></div>
                        <div className="relative p-6">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="text-xl font-bold text-gray-800">
                              ${cartTotal.toFixed(2)}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              navigate("/cart");
                              closeAllDropdowns();
                            }}
                            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                          >
                            Go to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Messages Dropdown */}
                <div className="relative dropdown-container">
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center cursor-pointer group relative"
                    onClick={() => toggleDropdown("notifications")}
                  >
                    <FaRegBell
                      size={20}
                      className="text-slate-500 group-hover:text-yellow-500 group-hover:scale-110 transition-all duration-300"
                    />
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                      <span className="text-xs text-white font-bold">
                        {messages.filter((m) => m.isNew).length}
                      </span>
                    </div>
                  </div>
                  {dropdowns.notifications && (
                    <div className="absolute right-0 top-full mt-3 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 transform transition-all duration-300 ease-out opacity-100 scale-100 animate-fadeInUp">
                      <div className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50"></div>
                        <div className="relative p-6 border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                              <FaRegBell size={20} className="text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-800 text-lg">
                                Recent Messages
                              </h3>
                              <p className="text-sm text-gray-500">
                                {messages.filter((m) => m.isNew).length} new
                                messages
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {/* Dynamic Message Items */}
                        {messages.map((message, index) => (
                          <div
                            key={message.id}
                            className={`p-4 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 transition-all duration-200 ${
                              index < messages.length - 1
                                ? "border-b border-gray-50"
                                : ""
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                                  {message.avatar}
                                </div>
                                <div
                                  className={`absolute -bottom-1 -right-1 w-4 h-4 ${
                                    message.isOnline
                                      ? "bg-green-500"
                                      : "bg-gray-400"
                                  } rounded-full border-2 border-white`}
                                ></div>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-gray-800">
                                    {message.sender}
                                  </h4>
                                  {message.isNew && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                      New
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  {message.content}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {message.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-yellow-50 to-orange-50"></div>
                        <div className="relative p-6">
                          <button
                            onClick={() => {
                              navigate("/messages");
                              closeAllDropdowns();
                            }}
                            className="w-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                          >
                            View All Messages
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
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