import React, { useState, useEffect } from "react";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { PATH, MENTOR_PATH } from "../routes/path";
import youtubeImg from "../assets/youtube.png";
import profileApi from "../api/modules/profile.api";
import facebookImg from "../assets/facebook.png";
import linkedinImg from "../assets/linkedin.png";
import twitterImg from "../assets/twitter.png";
import googleImg from "../assets/google.png";
import courseApi from "../api/modules/course.api";

const MentorProfile = () => {
  // State lưu thông tin profile
  const [profile, setProfile] = useState(null);
  // CRUD API integration for Profile
  const handleUpdateProfile = async (updatedData) => {
    setLoading(true);
    setError(null);
    const { response, error } = await profileApi.updateProfile(updatedData);
    if (error) {
      setError("Cập nhật profile thất bại");
    } else if (response && response.data) {
      setProfile(response.data);
      alert("Cập nhật profile thành công!");
    }
    setLoading(false);
  };

  const handleGetProfileDetail = async () => {
    setLoading(true);
    setError(null);
    const { response, error } = await profileApi.getProfileDetail();
    if (error) {
      setError("Không thể tải chi tiết profile");
    } else if (response && response.data) {
      setProfile(response.data);
    }
    setLoading(false);
  };

  // CRUD API integration for Course
  const handleCreateCourse = async (courseData) => {
    setLoading(true);
    setError(null);
    const { response, error } = await courseApi.createCourse(courseData);
    if (error) {
      setError("Tạo khóa học thất bại");
    } else if (response && response.data) {
      setAllCourses((prev) => [response.data, ...prev]);
      alert("Tạo khóa học thành công!");
    }
    setLoading(false);
  };

  const handleUpdateCourse = async (courseId, updatedData) => {
    setLoading(true);
    setError(null);
    const { response, error } = await courseApi.updateCourse(
      courseId,
      updatedData
    );
    if (error) {
      setError("Cập nhật khóa học thất bại");
    } else if (response && response.data) {
      setAllCourses((prev) =>
        prev.map((c) => (c._id === courseId ? response.data : c))
      );
      alert("Cập nhật khóa học thành công!");
    }
    setLoading(false);
  };

  const handleGetCourseDetail = async (courseId) => {
    setLoading(true);
    setError(null);
    if (!courseId) {
      setError("Course ID is undefined!");
      setLoading(false);
      return;
    }
    const { response, error } = await courseApi.getDetail({ courseId });
    if (error) {
      setError("Không thể tải chi tiết khóa học");
    } else if (response && response.data) {
      // You can set a state for selected course detail if needed
      alert("Đã tải chi tiết khóa học");
    }
    setLoading(false);
  };

  // Replace mock delete with API delete
  const handleDeleteCourse = async (course) => {
    const courseId = course._id || course.id;
    if (!courseId) {
      alert("Invalid course id!");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      setLoading(true);
      const { response, error } = await courseApi.deleteCourse({ courseId });
      if (error) {
        setError("Xóa khóa học thất bại");
        alert("Delete failed - API error");
      } else {
        setAllCourses((prev) =>
          prev.filter((c) => (c._id || c.id) !== courseId)
        );
        alert("Course deleted successfully!");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed - network error");
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();
  const location = useLocation();
  // Đọc tab từ localStorage khi load, ưu tiên location.state.tab nếu có
  const getInitialTab = () => {
    if (location.state && location.state.tab) return location.state.tab;
    const savedTab = localStorage.getItem("mentorProfileTab");
    return savedTab || "profile";
  };
  const [activeTab, setActiveTab] = useState(getInitialTab());

  // Khi location.state.tab thay đổi (navigate từ CreateCoursePage), tự động chuyển tab
  // Lấy thông tin profile khi mount
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      const { response, error } = await profileApi.getProfile();
      if (error) {
        setError("Không thể tải thông tin profile");
        setProfile(null);
      } else if (response && response.data) {
        setProfile(response.data);
      } else {
        setProfile(null);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (location.state && location.state.tab) {
      setActiveTab(location.state.tab);
      localStorage.setItem("mentorProfileTab", location.state.tab);
    }
  }, [location.state]);

  // Khi activeTab thay đổi, lưu vào localStorage
  useEffect(() => {
    localStorage.setItem("mentorProfileTab", activeTab);
  }, [activeTab]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    headline: "",
    bio: "",
    website: "",
    twitter: "",
    linkedin: "",
    youtube: "",
    facebook: "",
  });

  // Sửa trong mentor-profile.jsx

  const [profileImage, setProfileImage] = useState(null);

  // Course management state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [filterBy, setFilterBy] = useState("relevance");
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 9;

  // Mentee management state
  const [menteeSearchTerm, setMenteeSearchTerm] = useState("");
  const [menteeSortBy, setMenteeSortBy] = useState("latest");
  const [menteeCurrentPage, setMenteeCurrentPage] = useState(1);
  const menteesPerPage = 8;

  // Message management state
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchMessages, setSearchMessages] = useState("");

  // Reviews management state
  const [reviewSearchTerm, setReviewSearchTerm] = useState("");
  const [reviewSortBy, setReviewSortBy] = useState("latest");
  const [reviewCurrentPage, setReviewCurrentPage] = useState(1);
  const reviewsPerPage = 6;

  // Real courses data from MongoDB API
  // No mock data, empty courses array
  const [allCourses, setAllCourses] = useState([]);

  // Real mentees data - TODO: Replace with API data
  const [allMentees] = useState([]);

  // Real conversations data - TODO: Replace with API data
  const [conversations] = useState([]);

  // Real reviews data from MongoDB API
  // No mock data, empty reviews array
  const [allReviews, setAllReviews] = useState([]);

  // Load courses from MongoDB
  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const { response, error } = await courseApi.getAllCourses();

      if (error) {
        console.error("API Error:", error);
        setError("Failed to load courses");
        setAllCourses([]);
      } else if (response && response.data) {
        // The API returns response.data directly, which contains the courses array
        if (response.data.courses && Array.isArray(response.data.courses)) {
          setAllCourses(response.data.courses);
        } else if (Array.isArray(response.data)) {
          // In case the API returns courses array directly in data
          setAllCourses(response.data);
        } else {
          console.error("Unexpected response structure:", response.data);
          setAllCourses([]);
        }
      } else {
        console.error("No response data");
        setAllCourses([]);
      }
    } catch (err) {
      console.error("Error loading courses:", err);
      setError("Failed to load courses");
      setAllCourses([]);
    } finally {
      setLoading(false);
    }
  };

  // Load reviews from MongoDB
  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const { response, error } = await courseApi.getAllReviews();
      console.log("Reviews API Response:", { response, error });

      if (error) {
        console.error("Reviews API Error:", error);
        setError("Failed to load reviews");
        setAllReviews([]);
      } else if (response && response.data) {
        if (response.data.reviews && Array.isArray(response.data.reviews)) {
          setAllReviews(response.data.reviews);
        } else if (Array.isArray(response.data)) {
          setAllReviews(response.data);
        } else {
          console.error(
            "Unexpected reviews response structure:",
            response.data
          );
          setAllReviews([]);
        }
      } else {
        console.error("No reviews response data");
        setAllReviews([]);
      }
    } catch (err) {
      console.error("Error loading reviews:", err);
      setError("Failed to load reviews");
      setAllReviews([]);
    } finally {
      setLoading(false);
    }
  };

  // Load courses and reviews on component mount
  // Không gọi API courses/reviews nữa, chỉ dùng dữ liệu mock

  // Filter and search logic
  const getFilteredAndSortedCourses = () => {
    let filtered = allCourses.filter(
      (course) =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.description &&
          course.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Sort courses
    switch (sortBy) {
      case "latest":
        filtered = filtered.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        break;
      case "oldest":
        filtered = filtered.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        break;
      case "popular":
        filtered = filtered.sort(
          (a, b) => (b.mentees?.length || 0) - (a.mentees?.length || 0)
        );
        break;
      default:
        break;
    }

    // Filter by price/rating
    switch (filterBy) {
      case "price-low":
        filtered = filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered = filtered.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        filtered = filtered.sort((a, b) => (b.rate || 0) - (a.rate || 0));
        break;
      default:
        break;
    }

    return filtered;
  };

  // Pagination logic
  const filteredCourses = getFilteredAndSortedCourses();
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);
  const startIndex = (currentPage - 1) * coursesPerPage;
  const currentCourses = filteredCourses.slice(
    startIndex,
    startIndex + coursesPerPage
  );

  // Mentee filter and search logic
  const getFilteredAndSortedMentees = () => {
    let filtered = allMentees.filter(
      (mentee) =>
        mentee.name.toLowerCase().includes(menteeSearchTerm.toLowerCase()) ||
        mentee.email.toLowerCase().includes(menteeSearchTerm.toLowerCase()) ||
        mentee.enrolledCourses.some((course) =>
          course.courseName
            .toLowerCase()
            .includes(menteeSearchTerm.toLowerCase())
        )
    );

    // Sort mentees
    switch (menteeSortBy) {
      case "latest":
        filtered = filtered.sort(
          (a, b) => new Date(b.lastActive) - new Date(a.lastActive)
        );
        break;
      case "oldest":
        filtered = filtered.sort(
          (a, b) => new Date(a.joinedDate) - new Date(b.joinedDate)
        );
        break;
      case "most-courses":
        filtered = filtered.sort((a, b) => b.totalCourses - a.totalCourses);
        break;
      case "name":
        filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return filtered;
  };

  // Mentee pagination logic
  const filteredMentees = getFilteredAndSortedMentees();
  const totalMenteePages = Math.ceil(filteredMentees.length / menteesPerPage);
  const menteeStartIndex = (menteeCurrentPage - 1) * menteesPerPage;
  const currentMentees = filteredMentees.slice(
    menteeStartIndex,
    menteeStartIndex + menteesPerPage
  );

  const handleMenteePageChange = (page) => {
    setMenteeCurrentPage(page);
  };

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
    // TODO: Implement save image functionality
    console.log("Save image functionality to be implemented");
  };

  // Message handlers
  const handleSendMessage = () => {
    if (messageInput.trim() && selectedConversation) {
      // TODO: Implement send message functionality with API
      console.log("Sending message:", messageInput);
      setMessageInput("");
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleSendMessageToMentee = (menteeId) => {
    // Find or create conversation with this mentee
    const existingConversation = conversations.find(
      (conv) => conv.menteeId === menteeId
    );
    if (existingConversation) {
      setSelectedConversation(existingConversation);
    } else {
      // Create new conversation - TODO: Implement with API
      const mentee = allMentees.find((m) => m.id === menteeId);
      if (mentee) {
        const newConversation = {
          id: conversations.length + 1,
          menteeId: mentee.id,
          menteeName: mentee.name,
          menteeAvatar: mentee.avatar,
          lastMessage: "",
          lastMessageTime: "Now",
          isOnline: false,
          unreadCount: 0,
          messages: [],
        };
        setSelectedConversation(newConversation);
      }
    }
    setActiveTab("messages");
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter((conv) =>
    conv.menteeName.toLowerCase().includes(searchMessages.toLowerCase())
  );

  // Reviews filter and search logic
  const getFilteredAndSortedReviews = () => {
    let filtered = allReviews.filter((review) => {
      const studentName = review.author
        ? `${review.author.firstName || ""} ${
            review.author.lastName || ""
          }`.trim() || review.author.userName
        : "";
      const courseName = review.target ? review.target.title : "";
      const reviewText = review.content || "";

      return (
        studentName.toLowerCase().includes(reviewSearchTerm.toLowerCase()) ||
        courseName.toLowerCase().includes(reviewSearchTerm.toLowerCase()) ||
        reviewText.toLowerCase().includes(reviewSearchTerm.toLowerCase())
      );
    });

    // Sort reviews
    switch (reviewSortBy) {
      case "latest":
        return filtered.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      case "oldest":
        return filtered.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      case "highest-rating":
        return filtered.sort((a, b) => (b.rate || 0) - (a.rate || 0));
      case "lowest-rating":
        return filtered.sort((a, b) => (a.rate || 0) - (b.rate || 0));
      case "most-helpful":
        return filtered.sort(
          (a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0)
        );
      default:
        return filtered;
    }
  };

  // Reviews pagination logic
  const filteredReviews = getFilteredAndSortedReviews();
  const totalReviewPages = Math.ceil(filteredReviews.length / reviewsPerPage);
  const reviewStartIndex = (reviewCurrentPage - 1) * reviewsPerPage;
  const currentReviews = filteredReviews.slice(
    reviewStartIndex,
    reviewStartIndex + reviewsPerPage
  );

  const handleReviewPageChange = (page) => {
    setReviewCurrentPage(page);
  };

  // Scroll lên đầu trang (bao gồm cả header) khi chuyển tab
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Tab handler: set tab, lưu localStorage, cuộn lên đầu
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem("mentorProfileTab", tab);
    scrollToTop();
  };

  return (
    <div className="min-h-screen bg-white-100">
      {/* Main Layout Container */}
      <div className="flex max-w-7xl mx-auto pt-10 gap-8 px-8 min-h-screen">
        {/* Sidebar - Fixed width and height */}
        <div
          style={{ width: 280, minWidth: 280 }}
          className="bg-slate-50 rounded-2xl shadow-sm p-8 flex flex-col items-center sticky top-10 self-start"
        >
          {profileImage ? (
            <img
              src={profileImage}
              alt={
                formData.firstName || formData.lastName
                  ? `${formData.firstName} ${formData.lastName}`
                  : "Default Avatar"
              }
              className="w-24 h-24 rounded-full object-cover mb-4"
            />
          ) : (
            <FaUserCircle className="w-24 h-24 text-gray-300 mb-4" />
          )}
          <h2 className="font-semibold text-xl text-gray-900 mb-3">
            {formData.firstName || formData.lastName
              ? `${formData.firstName} ${formData.lastName}`.trim()
              : "Name"}
          </h2>
          <button className="bg-blue-600 text-white border-none rounded-lg px-6 py-1.5 mb-6 font-medium text-base">
            Mentor
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
                onClick={() => handleTabChange("profile")}
              >
                Profile
              </li>
              <li
                className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                  activeTab === "mycourses"
                    ? "bg-gray-200 hover:bg-gray-300 hover:shadow-sm"
                    : "hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm hover:scale-105"
                }`}
                onClick={() => handleTabChange("mycourses")}
              >
                My Courses
              </li>
              <li
                className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                  activeTab === "mentees"
                    ? "bg-gray-200 hover:bg-gray-300 hover:shadow-sm"
                    : "hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm hover:scale-105"
                }`}
                onClick={() => handleTabChange("mentees")}
              >
                Mentees
              </li>
              <li
                className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                  activeTab === "messages"
                    ? "bg-gray-200 hover:bg-gray-300 hover:shadow-sm"
                    : "hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm hover:scale-105"
                }`}
                onClick={() => {
                  handleTabChange("messages");
                  setSelectedConversation(null); // Reset to messages list when clicking tab
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
                onClick={() => handleTabChange("reviews")}
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
                      placeholder="Label"
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
                      placeholder="Label"
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
                    placeholder="Label"
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
                    placeholder="Label"
                    rows={3}
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
              </div>

              {/* Image Upload Section - Chỉ còn ô preview, click để upload */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Profile Image
                </h3>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center mb-4 bg-gray-50 cursor-pointer flex items-center justify-center"
                  onClick={() => document.getElementById("imageUpload").click()}
                  style={{ minHeight: 120 }}
                  title="Click to upload/change avatar"
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Preview"
                      className="w-24 h-24 object-cover mx-auto rounded"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-300 rounded mx-auto flex items-center justify-center">
                      <svg
                        width="32"
                        height="32"
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
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="imageUpload"
                  />
                </div>
              </div>

              {/* Links Section */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Social Links
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <img src={googleImg} alt="Website" className="w-5 h-5" />
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
                      <img src={twitterImg} alt="Twitter" className="w-5 h-5" />
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
                        src={linkedinImg}
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
                      <img src={youtubeImg} alt="Youtube" className="w-5 h-5" />
                      Youtube
                    </label>
                    <input
                      type="url"
                      name="youtube"
                      placeholder="https://youtube.com/channel/channelid"
                      value={formData.youtube}
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
              {/* Nút lưu profile ở cuối form */}
              <button
                type="button"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold mt-8 float-right"
                onClick={() => {
                  // Giả lập cập nhật tên và avatar, bạn cần thay bằng API thực tế
                  alert("Profile updated!");
                  // TODO: Gọi API cập nhật tên và avatar ở đây
                }}
              >
                Save Profile
              </button>
            </form>
          )}

          {activeTab === "mycourses" && (
            <div className="space-y-6">
              {/* Courses Section - TODO: Connect to real API for fetching mentor's courses */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                {/* Header with course count and search/filter */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Courses ({filteredCourses.length})
                    </h3>
                    <button
                      onClick={() =>
                        navigate(`${PATH.MENTOR}/${MENTOR_PATH.CREATECOURSE}`)
                      }
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                    >
                      New Course
                    </button>
                  </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Search Course"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); // Reset to page 1 when searching
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
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="latest">Latest</option>
                      <option value="oldest">Oldest</option>
                      <option value="popular">Most Popular</option>
                    </select>
                    <select
                      value={filterBy}
                      onChange={(e) => {
                        setFilterBy(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="rating">Rating</option>
                    </select>
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setSortBy("latest");
                        setFilterBy("relevance");
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

                {/* Course Grid - Dynamic rendering based on filtered data */}
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">
                      Loading courses...
                    </span>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <div className="text-red-600 mb-4">⚠️ {error}</div>
                    <button
                      onClick={loadCourses}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Retry Loading Courses
                    </button>
                  </div>
                ) : (
                  <div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start content-start"
                    style={{
                      height: "1500px",
                    }}
                  >
                    {currentCourses.length > 0 ? (
                      currentCourses.map((course) => {
                        return (
                          <div
                            key={course._id || course.id}
                            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow min-h-[520px] flex flex-col cursor-pointer"
                            onClick={() =>
                              navigate(`/courses/${course._id || course.id}`)
                            }
                          >
                            <img
                              src={
                                course.thumbnail
                                  ? course.thumbnail.startsWith("http")
                                    ? course.thumbnail
                                    : `http://localhost:4000/${course.thumbnail}`
                                  : "/placeholder-course.jpg"
                              }
                              alt={course.title}
                              className="w-full h-48 object-cover"
                            />
                            <div
                              className="w-full h-px bg-gray-200 mb-3"
                              style={{ marginTop: 0 }}
                            />
                            <div className="flex-1 flex flex-col p-4 pb-0">
                              <div
                                className="flex flex-col"
                                style={{
                                  minHeight: "120px",
                                  justifyContent: "flex-start",
                                }}
                              >
                                <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                  {course.title}
                                </h4>
                                <p className="text-sm text-gray-600 mb-2">
                                  By{" "}
                                  {course.mentor?.userName || "Unknown Mentor"}
                                </p>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="flex text-yellow-400 text-sm">
                                    {"★".repeat(Math.floor(course.rate || 0))}
                                    {(course.rate || 0) % 1 !== 0 && "☆"}
                                  </div>
                                  <span className="text-sm text-gray-600">
                                    ({course.numberOfRatings || 0} Ratings)
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  {course.duration || 0} Hours.{" "}
                                  {course.lectures || 0} Lectures.{" "}
                                  {course.category}
                                </p>
                                {(course.overview || course.description) && (
                                  <p
                                    className="text-gray-400 text-sm mb-2 line-clamp-2"
                                    style={{
                                      display: "-webkit-box",
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: "vertical",
                                      overflow: "hidden",
                                    }}
                                    title={
                                      course.overview || course.description
                                    }
                                  >
                                    {course.overview || course.description}
                                  </p>
                                )}
                              </div>
                              <p className="font-bold text-xl text-gray-900 mb-2 mt-auto">
                                ${course.price}
                              </p>
                            </div>
                            <div className="flex gap-2 p-4 pt-0 mt-auto">
                              <button
                                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(
                                    `/mentor/edit-course` //${course._id || course.id}
                                  );
                                }}
                              >
                                Edit Course
                              </button>
                              <button
                                className="flex-1 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition text-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCourse(course);
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })
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
                )}

                {/* Pagination - Dynamic based on filtered results */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-12 pt-6 border-t border-gray-100">
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

          {activeTab === "mentees" && (
            <div className="space-y-6">
              {/* Mentees Section - TODO: Connect to real API for fetching mentor's mentees */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                {/* Header with mentee count and search */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Mentees ({filteredMentees.length})
                    </h3>
                  </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Search Mentees"
                      value={menteeSearchTerm}
                      onChange={(e) => {
                        setMenteeSearchTerm(e.target.value);
                        setMenteeCurrentPage(1); // Reset to page 1 when searching
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
                      value={menteeSortBy}
                      onChange={(e) => {
                        setMenteeSortBy(e.target.value);
                        setMenteeCurrentPage(1);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="latest">Most Active</option>
                      <option value="oldest">Oldest Member</option>
                      <option value="most-courses">Most Courses</option>
                      <option value="name">Name A-Z</option>
                    </select>
                    <button
                      onClick={() => {
                        setMenteeSearchTerm("");
                        setMenteeSortBy("latest");
                        setMenteeCurrentPage(1);
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

                {/* Mentees Grid - Dynamic rendering based on filtered data */}
                <div
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start content-start"
                  style={{ height: "2220px" }}
                >
                  {currentMentees.length > 0 ? (
                    currentMentees.map((mentee) => (
                      <div
                        key={mentee.id}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-4 mb-4">
                          <img
                            src={mentee.avatar}
                            alt={mentee.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {mentee.name}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {mentee.email}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>
                                Joined:{" "}
                                {new Date(
                                  mentee.joinedDate
                                ).toLocaleDateString()}
                              </span>
                              <span>
                                Last Active:{" "}
                                {new Date(
                                  mentee.lastActive
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <h5 className="font-medium text-gray-900 mb-2">
                            Enrolled Courses ({mentee.totalCourses})
                          </h5>
                          <div className="space-y-2">
                            {mentee.enrolledCourses.map((course, index) => (
                              <div
                                key={index}
                                className="bg-gray-50 rounded-lg p-3"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h6 className="font-medium text-sm text-gray-900">
                                    {course.courseName}
                                  </h6>
                                  <span className="text-xs text-gray-500">
                                    {course.progress}%
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                  <span>
                                    Enrolled:{" "}
                                    {new Date(
                                      course.enrolledDate
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${course.progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* TODO: Add message/contact functionality with API calls */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSendMessageToMentee(mentee.id)}
                            className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                          >
                            Send Message
                          </button>
                          <button className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition text-sm">
                            View Profile
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <p className="text-gray-500 text-lg mb-2">
                        No mentees found
                      </p>
                      <p className="text-gray-400">
                        Try adjusting your search criteria
                      </p>
                    </div>
                  )}
                </div>

                {/* Pagination - Dynamic based on filtered results */}
                {totalMenteePages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8 pt-6 border-t border-gray-200">
                    <button
                      onClick={() =>
                        handleMenteePageChange(menteeCurrentPage - 1)
                      }
                      disabled={menteeCurrentPage === 1}
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

                    {[...Array(totalMenteePages)].map((_, index) => {
                      const page = index + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handleMenteePageChange(page)}
                          className={`px-3 py-1 rounded transition ${
                            menteeCurrentPage === page
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
                        handleMenteePageChange(menteeCurrentPage + 1)
                      }
                      disabled={menteeCurrentPage === totalMenteePages}
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

          {activeTab === "messages" && !selectedConversation && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                {/* Header with Search and Filter */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Messages
                  </h3>
                  <div className="flex gap-4 items-center">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search User"
                        value={searchMessages}
                        onChange={(e) => setSearchMessages(e.target.value)}
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
                        <span className="text-sm text-gray-600">Sort By</span>
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

                {/* Conversations List */}
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => handleSelectConversation(conversation)}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="relative">
                        <img
                          src={conversation.menteeAvatar}
                          alt={conversation.menteeName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        {conversation.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {conversation.menteeName}
                        </h4>
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">
                          {conversation.lastMessageTime}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "messages" && selectedConversation && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-[600px] flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
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
                  <img
                    src={selectedConversation.menteeAvatar}
                    alt={selectedConversation.menteeName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {selectedConversation.menteeName}
                    </h4>
                    {selectedConversation.isOnline && (
                      <p className="text-sm text-green-600">Online</p>
                    )}
                  </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderId === "mentor"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-lg ${
                          message.senderId === "mentor"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div
                          className={`text-xs mt-1 ${
                            message.senderId === "mentor"
                              ? "text-blue-100"
                              : "text-gray-500"
                          }`}
                        >
                          {message.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type Your Message"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-6">
              {/* Reviews Section - TODO: Connect to real API for fetching mentor's reviews */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                {/* Header with review count and search/filter */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      My Reviews ({filteredReviews.length})
                    </h3>
                  </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Search Reviews"
                      value={reviewSearchTerm}
                      onChange={(e) => {
                        setReviewSearchTerm(e.target.value);
                        setReviewCurrentPage(1); // Reset to page 1 when searching
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
                      value={reviewSortBy}
                      onChange={(e) => {
                        setReviewSortBy(e.target.value);
                        setReviewCurrentPage(1);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="latest">Latest</option>
                      <option value="oldest">Oldest</option>
                      <option value="highest-rating">Highest Rating</option>
                      <option value="lowest-rating">Lowest Rating</option>
                      <option value="most-helpful">Most Helpful</option>
                    </select>
                    <button
                      onClick={() => {
                        setReviewSearchTerm("");
                        setReviewSortBy("latest");
                        setReviewCurrentPage(1);
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

                {/* Reviews Grid - Dynamic rendering based on filtered data */}
                <div
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start content-start"
                  style={{ minHeight: "900px" }}
                >
                  {currentReviews.length > 0 ? (
                    currentReviews.map((review) => (
                      <div
                        key={review._id || review.id}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        {/* Review Header */}
                        <div className="flex items-start gap-4 mb-4">
                          <img
                            src={
                              review.author?.avatarUrl ||
                              "/placeholder-avatar.jpg"
                            }
                            alt={
                              review.author
                                ? `${review.author.firstName} ${review.author.lastName}`
                                : "User"
                            }
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-1">
                                  {review.author
                                    ? `${review.author.firstName || ""} ${
                                        review.author.lastName || ""
                                      }`.trim() || review.author.userName
                                    : "Unknown User"}
                                </h4>
                                <p className="text-sm text-blue-600 font-medium">
                                  {review.target?.name || "Unknown Course"}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex text-yellow-400 text-sm">
                                  {"★".repeat(review.rate || 0)}
                                  {"☆".repeat(5 - (review.rate || 0))}
                                </div>
                                <span className="text-sm text-gray-600">
                                  {review.rate || 0}/5
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Review Content */}
                        <div className="mb-4">
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {review.content}
                          </p>
                        </div>

                        {/* Review Footer */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <button className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition">
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
                                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V18m-7-8a2 2 0 01-2-2V6a2 2 0 012-2h2.343M11 7L9 5l2-2m0 4l2-2 2 2m-2 2h6"
                                />
                              </svg>
                              <span>{review.helpfulCount} found helpful</span>
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <button className="text-blue-600 hover:text-blue-700 transition text-sm font-medium">
                              Reply
                            </button>
                            <button className="text-gray-500 hover:text-gray-700 transition text-sm">
                              Report
                            </button>
                          </div>
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
                              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-500 text-lg mb-2">
                            No reviews found
                          </p>
                          <p className="text-gray-400">
                            Try adjusting your search criteria
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pagination - Dynamic based on filtered results */}
                {totalReviewPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8 pt-6 border-t border-gray-200">
                    <button
                      onClick={() =>
                        handleReviewPageChange(reviewCurrentPage - 1)
                      }
                      disabled={reviewCurrentPage === 1}
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

                    {[...Array(totalReviewPages)].map((_, index) => {
                      const page = index + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handleReviewPageChange(page)}
                          className={`px-3 py-1 rounded transition ${
                            reviewCurrentPage === page
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
                        handleReviewPageChange(reviewCurrentPage + 1)
                      }
                      disabled={reviewCurrentPage === totalReviewPages}
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
        </div>
      </div>
    </div>
  );
};

export default MentorProfile;
