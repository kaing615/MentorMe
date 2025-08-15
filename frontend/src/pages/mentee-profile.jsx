import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import facebookImg from "../assets/facebook.png";
import twitterImg from "../assets/twitter.png";
import googleImg from "../assets/google.png";
import minatoImg from "../assets/minato.webp";
import menteeProfileApi from "../api/modules/menteeProfile.api";
// Đã xoá mock data, chỉ dùng dữ liệu từ backend

const MenteeProfile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");

  // TODO: Replace with API call - fetch user profile data
  // const fetchUserProfile = async (userId) => {
  //   const response = await fetch(`/api/users/${userId}/profile`);
  //   return response.json();
  // };

  // State chỉ lấy dữ liệu từ backend
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    headline: "",
    bio: "",
    website: "",
    twitter: "",
    linkedin: "",
    facebook: "",
  });
  const [profileImage, setProfileImage] = useState("");

  console.log("MenteeProfile component mounted");
  useEffect(() => {
    console.log("Fetching profile...");
    async function fetchProfile() {
      try {
        const res = await menteeProfileApi.getProfile();
        const data = res.data;
        console.log("API profile data:", data);
        if (data && data.user) {
          const user = data.user;
          const profile = data.profile || {};
          // Log các trường để debug
          console.log("user:", user);
          console.log("profile:", profile);
          console.log("links:", profile.links);
          setFormData((prev) => ({
            ...prev,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            headline: profile.headline || "",
            bio: profile.bio || "",
            website: profile.links?.website || "",
            twitter: profile.links?.twitter || "",
            linkedin: profile.links?.linkedin || "",
            facebook: profile.links?.facebook || ""
          }));
          if (user.avatarUrl) setProfileImage(user.avatarUrl);
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      }
    }
    fetchProfile();
  }, []);

  // Course management state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 6;

  // Các state dữ liệu động, nếu chưa có API thì để mảng rỗng để không lỗi
  const [allCourses] = useState([]);
  const [allMentors] = useState([]);
  const [allReviews] = useState([]);
  // Các state khác giữ nguyên
  const [mentorSearchTerm, setMentorSearchTerm] = useState("");
  const [mentorFilterBy, setMentorFilterBy] = useState("all");
  const [mentorCurrentPage, setMentorCurrentPage] = useState(1);
  const mentorsPerPage = 6;
  const [selectedChatMentor, setSelectedChatMentor] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [reviewsToShow, setReviewsToShow] = useState(6);
  const [reviewCurrentPage, setReviewCurrentPage] = useState(1);
  const reviewsPerPage = 4;

  // Filter and search logic for mentors
  const getFilteredMentors = () => {
    let filtered = allMentors.filter(
      (mentor) =>
        mentor.name.toLowerCase().includes(mentorSearchTerm.toLowerCase()) ||
        mentor.specialty
          .toLowerCase()
          .includes(mentorSearchTerm.toLowerCase()) ||
        mentor.skills.some((skill) =>
          skill.toLowerCase().includes(mentorSearchTerm.toLowerCase())
        )
    );

    switch (mentorFilterBy) {
      case "online":
        filtered = filtered.filter((mentor) => mentor.isOnline);
        break;
      case "top-rated":
        filtered = filtered.filter((mentor) => mentor.rating >= 4.5);
        break;
      case "available":
        filtered = filtered.filter(
          (mentor) =>
            new Date(mentor.nextAvailable) <=
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        );
        break;
      default:
        break;
    }

    return filtered.sort((a, b) => b.rating - a.rating);
  };

  // Pagination logic for mentors
  const filteredMentors = getFilteredMentors();
  const totalMentorPages = Math.ceil(filteredMentors.length / mentorsPerPage);
  const mentorStartIndex = (mentorCurrentPage - 1) * mentorsPerPage;
  const currentMentors = filteredMentors.slice(
    mentorStartIndex,
    mentorStartIndex + mentorsPerPage
  );

  const handleMentorPageChange = (page) => {
    setMentorCurrentPage(page);
  };

  const handleConnectMentor = (mentorId) => {
    console.log("Connect to mentor:", mentorId);
    // TODO: Implement connect functionality
  };

  const handleStartChat = (mentor) => {
    // TODO: Replace with API call to start/fetch chat
    // const startChat = async (mentorId) => {
    //   const response = await fetch('/api/chats/start', {
    //     method: 'POST',
    //     body: JSON.stringify({ mentorId, userId: currentUserId })
    //   });
    //   return response.json();
    // };

    setSelectedChatMentor(mentor);
    setActiveTab("messages");
    // Scroll to main content area, not the very top
    setTimeout(() => {
      const mainContent = document.querySelector(".flex-1.min-w-0");
      if (mainContent) {
        mainContent.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
    // Initialize chat with some sample messages using mockup for now
    setChatMessages([
      {
        id: 1,
        senderId: "mentor",
        senderName: mentor.name,
        content: `Hello! I'm ${mentor.name}. How can I help you today?`,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        avatar: mentor.avatar,
      },
    ]);
  };

  const handleSendMessage = () => {
    // TODO: Replace with API call to send message
    // const sendMessage = async (chatId, message) => {
    //   const response = await fetch('/api/chats/messages', {
    //     method: 'POST',
    //     body: JSON.stringify({ chatId, message, senderId: currentUserId })
    //   });
    //   return response.json();
    // };

    if (newMessage.trim() && selectedChatMentor) {
      const message = {
        id: chatMessages.length + 1,
        senderId: "mentee",
        senderName: "Minato Namikaze",
        content: newMessage,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        avatar: minatoImg,
      };
      setChatMessages([...chatMessages, message]);
      setNewMessage("");
    }
  };

  const handleBackToMessages = () => {
    setSelectedChatMentor(null);
    setChatMessages([]);
  };

  // Filter reviews by type
  const getFilteredReviews = () => {
    switch (reviewFilter) {
      case "course":
        return allReviews.filter((review) => review.type === "course");
      case "mentor":
        return allReviews.filter((review) => review.type === "mentor");
      default:
        return allReviews;
    }
  };

  const filteredReviews = getFilteredReviews();

  // Calculate pagination for reviews
  const totalReviewPages = Math.ceil(filteredReviews.length / reviewsPerPage);
  const reviewStartIndex = (reviewCurrentPage - 1) * reviewsPerPage;
  const reviewEndIndex = reviewStartIndex + reviewsPerPage;
  const currentPageReviews = filteredReviews.slice(
    reviewStartIndex,
    reviewEndIndex
  );

  // Handle review page change
  const handleReviewPageChange = (page) => {
    setReviewCurrentPage(page);
  };

  // Handle load more reviews
  const handleLoadMoreReviews = () => {
    setReviewsToShow((prev) => prev + 6);
  };

  // Reset reviews to show when filter changes
  const handleReviewFilterChange = (newFilter) => {
    setReviewFilter(newFilter);
    setReviewsToShow(6);
    setReviewCurrentPage(1); // Reset to first page when filter changes
  };

  // Filter and search logic for courses
  const getFilteredCourses = () => {
    let filtered = allCourses.filter(
      (course) =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
    );

    switch (filterBy) {
      case "completed":
        filtered = filtered.filter((course) => course.isCompleted);
        break;
      case "available":
        filtered = filtered.filter((course) => !course.isCompleted);
        break;
      default:
        break;
    }

    return filtered;
  };

  // Pagination logic for courses
  const filteredCourses = getFilteredCourses();
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);
  const startIndex = (currentPage - 1) * coursesPerPage;
  const currentCourses = filteredCourses.slice(
    startIndex,
    startIndex + coursesPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveImage = () => {
    // TODO: Replace with API call to upload profile image
    // const uploadProfileImage = async (imageFile) => {
    //   const formData = new FormData();
    //   formData.append('profileImage', imageFile);
    //   const response = await fetch('/api/users/profile/image', {
    //     method: 'POST',
    //     body: formData
    //   });
    //   return response.json();
    // };

    if (profileImage) {
      // Auto update sidebar avatar when image is saved - using mockup for now
      console.log("Image saved successfully");
    }
  };

  // TODO: Add API-ready function for profile updates
  // const updateProfile = async (profileData) => {
  //   const response = await fetch('/api/users/profile', {
  //     method: 'PUT',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(profileData)
  //   });
  //   return response.json();
  // };

  return (
    <>
      {/* Header */}
      <header className="w-full bg-slate-800 text-white py-3 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h1
              className="text-lg font-bold cursor-pointer hover:text-gray-300 transition-colors"
              onClick={() => navigate("/home")}
            >
              MentorMe
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm">Welcome, {formData?.firstName || "Mentee"}!</span>
          </div>
        </div>
      </header>

      <div className="min-h-screen bg-white-100">
        {/* Main Layout Container */}
        <div className="flex max-w-7xl mx-auto pt-10 gap-8 px-8 min-h-screen">
          {/* Sidebar - Fixed width and height */}
          <div
            style={{ width: 280, minWidth: 280 }}
            className="bg-slate-50 rounded-2xl shadow-sm p-8 flex flex-col items-center sticky top-10 self-start"
          >
            <img
              src={profileImage || minatoImg}
              alt="Minato Namikaze"
              className="w-24 h-24 rounded-full object-cover mb-4"
            />
            <h2 className="font-semibold text-xl text-gray-900 mb-3">
              Minato Namikaze
            </h2>
            <button className="bg-blue-600 text-white border-none rounded-lg px-6 py-1.5 mb-6 font-medium text-base">
              Mentee
            </button>

            {/* Navigation Menu */}
            <nav className="w-full mt-6">
              <ul className="list-none p-0 m-0 flex flex-col gap-2">
                <li
                  className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                    activeTab === "profile"
                      ? "bg-gray-200 hover:bg-gray-300 hover:shadow-sm"
                      : "hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm hover:scale-105"
                  }`}
                  onClick={() => {
                    setActiveTab("profile");
                    setTimeout(() => {
                      const mainContent =
                        document.querySelector(".flex-1.min-w-0");
                      if (mainContent) {
                        mainContent.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }
                    }, 100);
                  }}
                >
                  Profile
                </li>
                <li
                  className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                    activeTab === "mycourses"
                      ? "bg-gray-200 hover:bg-gray-300 hover:shadow-sm"
                      : "hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm hover:scale-105"
                  }`}
                  onClick={() => {
                    setActiveTab("mycourses");
                    setTimeout(() => {
                      const mainContent =
                        document.querySelector(".flex-1.min-w-0");
                      if (mainContent) {
                        mainContent.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }
                    }, 100);
                  }}
                >
                  My Courses
                </li>
                <li
                  className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                    activeTab === "mentors"
                      ? "bg-gray-200 hover:bg-gray-300 hover:shadow-sm"
                      : "hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm hover:scale-105"
                  }`}
                  onClick={() => {
                    setActiveTab("mentors");
                    setTimeout(() => {
                      const mainContent =
                        document.querySelector(".flex-1.min-w-0");
                      if (mainContent) {
                        mainContent.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }
                    }, 100);
                  }}
                >
                  Mentors
                </li>
                <li
                  className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                    activeTab === "messages"
                      ? "bg-gray-200 hover:bg-gray-300 hover:shadow-sm"
                      : "hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm hover:scale-105"
                  }`}
                  onClick={() => {
                    setActiveTab("messages");
                    // Reset chat state to go back to chat list
                    setSelectedChatMentor(null);
                    setChatMessages([]);
                    // Scroll to main content area when switching to messages tab
                    setTimeout(() => {
                      const mainContent =
                        document.querySelector(".flex-1.min-w-0");
                      if (mainContent) {
                        mainContent.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }
                    }, 100);
                  }}
                >
                  Message
                </li>
                <li
                  className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                    activeTab === "reviews"
                      ? "bg-gray-200 hover:bg-gray-300 hover:shadow-sm"
                      : "hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm hover:scale-105"
                  }`}
                  onClick={() => {
                    setActiveTab("reviews");
                    setTimeout(() => {
                      const mainContent =
                        document.querySelector(".flex-1.min-w-0");
                      if (mainContent) {
                        mainContent.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }
                    }, 100);
                  }}
                >
                  My Reviews
                </li>
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {activeTab === "profile" && (
              <form className="space-y-6">
                {/* Personal Information Section */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Headline
                    </label>
                    <input
                      type="text"
                      name="headline"
                      placeholder="Your professional headline"
                      value={formData.headline}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      placeholder="Tell us about yourself and your goals"
                      rows={3}
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Profile Image
                  </h3>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Preview
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center mb-4 bg-gray-50">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Preview"
                        className="w-24 h-24 object-cover mx-auto rounded"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gray-300 rounded mx-auto flex items-center justify-center">
                        <svg
                          width="24"
                          height="24"
                          fill="none"
                          stroke="currentColor"
                          className="text-gray-500"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 items-end mb-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Add/Change Image
                      </label>
                      <input
                        type="text"
                        placeholder="Image path"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        readOnly
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="imageUpload"
                      />
                    </div>
                    <label
                      htmlFor="imageUpload"
                      className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition cursor-pointer"
                    >
                      Upload Image
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveImage}
                    className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 transition"
                  >
                    Save Image
                  </button>
                </div>

                {/* Links Section */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Social Links
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <img
                          src={googleImg}
                          alt="Website"
                          className="w-5 h-5"
                        />
                        Website
                      </label>
                      <input
                        type="url"
                        name="website"
                        placeholder="https://your-website.com"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <img
                          src={twitterImg}
                          alt="Twitter"
                          className="w-5 h-5"
                        />
                        Twitter
                      </label>
                      <input
                        type="url"
                        name="twitter"
                        placeholder="https://twitter.com/username"
                        value={formData.twitter}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <img
                          src={googleImg}
                          alt="LinkedIn"
                          className="w-5 h-5"
                        />
                        LinkedIn
                      </label>
                      <input
                        type="url"
                        name="linkedin"
                        placeholder="https://linkedin.com/in/username"
                        value={formData.linkedin}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <img
                          src={facebookImg}
                          alt="Facebook"
                          className="w-5 h-5"
                        />
                        Facebook
                      </label>
                      <input
                        type="url"
                        name="facebook"
                        placeholder="https://facebook.com/username"
                        value={formData.facebook}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </form>
            )}

            {activeTab === "mycourses" && (
              <div className="space-y-6">
                {/* My Courses Section */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  {/* Header with course count and stats */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        My Courses ({filteredCourses.length})
                      </h3>
                    </div>
                  </div>

                  {/* Search and Filter Bar */}
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Search Courses"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <svg
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={filterBy}
                        onChange={(e) => {
                          setFilterBy(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Courses</option>
                        <option value="completed">Completed</option>
                        <option value="available">Available</option>
                      </select>
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setFilterBy("all");
                          setCurrentPage(1);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                          />
                        </svg>
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Course Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {currentCourses.length > 0 ? (
                      currentCourses.map((course) => (
                        <div
                          key={course.id}
                          className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                        >
                          <img
                            src={course.image}
                            alt={course.title}
                            className="w-full h-48 object-cover"
                          />
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2 flex-1">
                                {course.title}
                              </h4>
                              {course.isCompleted && (
                                <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                                  ✓ Completed
                                </span>
                              )}
                            </div>

                            <p className="text-sm text-gray-600 mb-2">
                              By {course.instructor}
                            </p>

                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex text-yellow-400 text-sm">
                                {"★".repeat(Math.floor(course.rating))}
                                {course.rating % 1 !== 0 && "☆"}
                              </div>
                              <span className="text-sm text-gray-600">
                                ({course.ratingsCount} Ratings)
                              </span>
                            </div>

                            <p className="text-sm text-gray-600 mb-3">
                              {course.totalHours} Total Hours •{" "}
                              {course.lectures} Lectures • {course.level}
                            </p>

                            <div className="flex gap-2">
                              <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                                View Course
                              </button>
                              {course.isCompleted && course.certificate && (
                                <button className="px-3 py-2 border border-green-300 text-green-600 rounded-lg hover:bg-green-50 transition text-sm">
                                  📜 Certificate
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <p className="text-gray-500 text-lg mb-2">
                          No courses found
                        </p>
                        <p className="text-gray-400">
                          Try adjusting your search or filter criteria
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-8">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 hover:bg-gray-100 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>

                      {[...Array(totalPages)].map((_, index) => {
                        const page = index + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 rounded transition ${
                              currentPage === page
                                ? "bg-blue-600 text-white"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 hover:bg-gray-100 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "mentors" && (
              <div className="space-y-6">
                {/* Mentors Section */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  {/* Header with mentor count */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Mentors ({filteredMentors.length})
                      </h3>
                    </div>
                  </div>

                  {/* Search and Filter Bar */}
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Search Mentors by name, specialty, or skills"
                        value={mentorSearchTerm}
                        onChange={(e) => {
                          setMentorSearchTerm(e.target.value);
                          setMentorCurrentPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <svg
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={mentorFilterBy}
                        onChange={(e) => {
                          setMentorFilterBy(e.target.value);
                          setMentorCurrentPage(1);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Mentors</option>
                        <option value="online">Online Now</option>
                        <option value="top-rated">Top Rated (4.5+)</option>
                        <option value="available">Available This Week</option>
                      </select>
                      <button
                        onClick={() => {
                          setMentorSearchTerm("");
                          setMentorFilterBy("all");
                          setMentorCurrentPage(1);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                          />
                        </svg>
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Mentors Grid */}
                  <div
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 content-start"
                    style={{
                      minHeight: "900px",
                    }}
                  >
                    {currentMentors.length > 0 ? (
                      currentMentors.map((mentor) => (
                        <div
                          key={mentor.id}
                          className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-4 mb-4">
                            <div className="relative">
                              <img
                                src={mentor.avatar}
                                alt={mentor.name}
                                className="w-16 h-16 rounded-full object-cover"
                              />
                              {mentor.isOnline && (
                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-1">
                                    {mentor.name}
                                  </h4>
                                  <p className="text-sm text-blue-600 font-medium">
                                    {mentor.specialty}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {mentor.company} • {mentor.yearsExperience}{" "}
                                    years
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="flex items-center gap-1 mb-1">
                                    <span className="text-yellow-400">★</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                      {mentor.rating.toFixed(1)}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      ({mentor.reviewsCount})
                                    </span>
                                  </div>
                                  <p className="text-sm font-semibold text-green-600">
                                    ${mentor.hourlyRate}/hr
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Bio */}
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {mentor.bio}
                          </p>

                          {/* Skills */}
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-1">
                              {mentor.skills.slice(0, 4).map((skill, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                              {mentor.skills.length > 4 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  +{mentor.skills.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                            <span>📚 {mentor.sessionsCompleted} sessions</span>
                            <span>
                              📅 Next:{" "}
                              {new Date(
                                mentor.nextAvailable
                              ).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <button className="flex-1 bg-gray-900 text-white py-2 px-3 rounded-lg hover:bg-gray-800 transition text-sm font-medium">
                              View Profile
                            </button>
                            <button
                              onClick={() => handleStartChat(mentor)}
                              className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                            >
                              💬 Message
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg
                              className="w-8 h-8 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-gray-500 text-lg mb-2">
                              No mentors found
                            </p>
                            <p className="text-gray-400">
                              Try adjusting your search or filter criteria
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  {totalMentorPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-12 pt-6 border-t border-gray-100">
                      <button
                        onClick={() =>
                          handleMentorPageChange(mentorCurrentPage - 1)
                        }
                        disabled={mentorCurrentPage === 1}
                        className="p-2 hover:bg-gray-100 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>

                      {[...Array(totalMentorPages)].map((_, index) => {
                        const page = index + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => handleMentorPageChange(page)}
                            className={`px-3 py-1 rounded transition ${
                              mentorCurrentPage === page
                                ? "bg-blue-600 text-white"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}

                      <button
                        onClick={() =>
                          handleMentorPageChange(mentorCurrentPage + 1)
                        }
                        disabled={mentorCurrentPage === totalMentorPages}
                        className="p-2 hover:bg-gray-100 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "messages" && (
              <div className="space-y-6">
                {/* Messages Section */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  {!selectedChatMentor ? (
                    <>
                      {/* Header with Search and Filter */}
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Messages
                        </h3>
                        <div className="flex gap-4 items-center">
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Search conversations..."
                              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <svg
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              />
                            </svg>
                          </div>

                          <div className="flex gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">
                                Sort By
                              </span>
                              <select className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                                <option>Relevance</option>
                                <option>Latest</option>
                                <option>Oldest</option>
                              </select>
                            </div>

                            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                                />
                              </svg>
                              Filter
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Messages List */}
                      <div
                        className="space-y-4 overflow-y-auto pr-2"
                        style={{ maxHeight: "560px" }}
                      >
                        {generateMenteeMessages(8).map((message) => (
                          <div
                            key={message.id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => {
                              // Create mentor object from message data
                              const mentor = {
                                id: message.id,
                                name: message.mentorName,
                                avatar: message.mentorAvatar,
                                specialty: message.mentorSpecialty,
                                isOnline: message.isOnline,
                                company: "Tech Company",
                                yearsExperience: 5,
                                rating: 4.8,
                                reviewsCount: 120,
                                hourlyRate: 75,
                                bio: "Experienced mentor ready to help with your learning journey.",
                                skills: ["JavaScript", "React", "Node.js"],
                              };
                              handleStartChat(mentor);
                            }}
                          >
                            <div className="flex items-start gap-4">
                              <div className="relative">
                                <img
                                  src={message.mentorAvatar}
                                  alt={message.mentorName}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                                {message.isOnline && (
                                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-semibold text-gray-900">
                                    {message.mentorName}
                                  </h4>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">
                                      {message.timestamp}
                                    </span>
                                    {message.unreadCount > 0 && (
                                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                                        {message.unreadCount}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm text-blue-600 mb-2">
                                  {message.mentorSpecialty}
                                </p>
                                <p className="text-sm text-gray-600 truncate">
                                  {message.lastMessage}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <svg
                                      className="w-3 h-3"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                      />
                                    </svg>
                                    {message.totalMessages} messages
                                  </span>
                                  <span>
                                    Last session: {message.lastSessionDate}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Individual Chat View */}
                      {/* Chat Header */}
                      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200">
                        <button
                          onClick={handleBackToMessages}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                          <svg
                            className="w-5 h-5 text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </button>
                        <div className="relative">
                          <img
                            src={selectedChatMentor.avatar}
                            alt={selectedChatMentor.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          {selectedChatMentor.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {selectedChatMentor.name}
                          </h3>
                          <p className="text-sm text-blue-600">
                            {selectedChatMentor.specialty}
                          </p>
                          <p className="text-xs text-gray-500">
                            {selectedChatMentor.isOnline
                              ? "Online now"
                              : "Offline"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                            Schedule Call
                          </button>
                          <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition">
                            View Profile
                          </button>
                        </div>
                      </div>

                      {/* Chat Messages */}
                      <div className="h-96 overflow-y-auto mb-4 space-y-4 bg-gray-50 rounded-lg p-4">
                        {chatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex gap-3 ${
                              msg.senderId === "mentee"
                                ? "flex-row-reverse"
                                : ""
                            }`}
                          >
                            <img
                              src={msg.avatar}
                              alt={msg.senderName}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                msg.senderId === "mentee"
                                  ? "bg-blue-600 text-white"
                                  : "bg-white border border-gray-200"
                              }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  msg.senderId === "mentee"
                                    ? "text-blue-100"
                                    : "text-gray-500"
                                }`}
                              >
                                {msg.timestamp}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Message Input */}
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleSendMessage()
                          }
                          placeholder="Type your message..."
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Send
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-6">
                {/* My Reviews Section */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  {/* Header with search and sort */}
                  <div className="mb-6">
                    {/* Title and Rating Row */}
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        My Reviews ({allReviews.length})
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="flex text-yellow-400 text-sm">
                          ★★★★★
                        </div>
                        <span className="text-sm text-gray-600">
                          4.7 average rating
                        </span>
                      </div>
                    </div>

                    {/* Search and Controls Row */}
                    <div className="flex gap-3 items-center">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Search Reviews"
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full"
                        />
                        <svg
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                      <select className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                        <option>Latest</option>
                        <option>Oldest First</option>
                        <option>Highest Rating</option>
                        <option>Lowest Rating</option>
                      </select>
                      <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                          />
                        </svg>
                        Clear
                      </button>
                    </div>
                  </div>
                  {/* Filter tabs */}
                  <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
                    <button
                      onClick={() => handleReviewFilterChange("all")}
                      className={`px-4 py-2 rounded-md transition text-sm font-medium ${
                        reviewFilter === "all"
                          ? "bg-white shadow-sm text-gray-900"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      All Reviews ({allReviews.length})
                    </button>
                    <button
                      onClick={() => handleReviewFilterChange("course")}
                      className={`px-4 py-2 rounded-md transition text-sm font-medium ${
                        reviewFilter === "course"
                          ? "bg-white shadow-sm text-gray-900"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Course Reviews (
                      {allReviews.filter((r) => r.type === "course").length})
                    </button>
                    <button
                      onClick={() => handleReviewFilterChange("mentor")}
                      className={`px-4 py-2 rounded-md transition text-sm font-medium ${
                        reviewFilter === "mentor"
                          ? "bg-white shadow-sm text-gray-900"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Mentor Reviews (
                      {allReviews.filter((r) => r.type === "mentor").length})
                    </button>
                  </div>
                  {/* Scrollable Reviews List */}
                  <div
                    style={{ maxHeight: "560px", overflowY: "auto" }}
                    className="pr-2"
                  >
                    <div className="space-y-6">
                      {currentPageReviews.length > 0 ? (
                        currentPageReviews.map((review) => (
                          <div
                            key={review.id}
                            className="border border-gray-200 rounded-lg p-6"
                          >
                            <div className="flex items-start gap-4">
                              <img
                                src={review.targetImage}
                                alt={review.targetTitle}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h4 className="font-semibold text-gray-900 mb-1">
                                      {review.targetTitle}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      {review.type === "course"
                                        ? `By ${review.instructor}`
                                        : review.mentorSpecialty}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <div className="flex text-yellow-400 text-sm">
                                        {"★".repeat(review.rating)}
                                        {"☆".repeat(5 - review.rating)}
                                      </div>
                                      <span className="text-xs text-gray-500">
                                        {review.date}
                                      </span>
                                    </div>
                                  </div>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      review.type === "course"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {review.type === "course"
                                      ? "Course"
                                      : "Mentor"}
                                  </span>
                                </div>

                                <p className="text-gray-700 mb-4 leading-relaxed">
                                  {review.comment}
                                </p>

                                {/* Review stats */}
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                                      />
                                    </svg>
                                    {review.helpfulCount} helpful
                                  </span>
                                  {review.mentorReply && (
                                    <span className="text-blue-600">
                                      ↳ Mentor replied
                                    </span>
                                  )}
                                  <button className="text-blue-600 hover:text-blue-700 transition">
                                    Edit
                                  </button>
                                </div>

                                {/* Mentor reply if exists */}
                                {review.mentorReply && (
                                  <div className="mt-4 pl-4 border-l-2 border-blue-200 bg-blue-50 p-3 rounded-r-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                      <img
                                        src={review.mentorAvatar}
                                        alt="Mentor"
                                        className="w-6 h-6 rounded-full"
                                      />
                                      <span className="font-medium text-sm text-gray-900">
                                        {review.mentorName} replied:
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700">
                                      {review.mentorReply}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <svg
                              className="w-8 h-8 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                              />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No {reviewFilter === "all" ? "" : reviewFilter}{" "}
                            reviews yet
                          </h3>
                          <p className="text-gray-600">
                            {reviewFilter === "all"
                              ? "Start learning and leave your first review!"
                              : `You haven't written any ${reviewFilter} reviews yet.`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pagination */}
                  {totalReviewPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-gray-200">
                      <button
                        onClick={() =>
                          handleReviewPageChange(reviewCurrentPage - 1)
                        }
                        disabled={reviewCurrentPage === 1}
                        className="flex items-center px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>

                      {[...Array(totalReviewPages)].map((_, index) => {
                        const pageNum = index + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handleReviewPageChange(pageNum)}
                            className={`min-w-[40px] h-10 px-3 py-2 text-sm font-medium rounded-lg transition ${
                              reviewCurrentPage === pageNum
                                ? "bg-blue-600 text-white"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        onClick={() =>
                          handleReviewPageChange(reviewCurrentPage + 1)
                        }
                        disabled={reviewCurrentPage === totalReviewPages}
                        className="flex items-center px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <svg
                          className="w-4 h-4 ml-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MenteeProfile;
