import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { PATH, MENTOR_PATH } from "../routes/path";
import youtubeImg from "../assets/youtube.png";
import profileApi from "../api/modules/profile.api";
import { FaFacebook } from "react-icons/fa6";
import { FaXTwitter } from "react-icons/fa6";
import { FaLinkedin } from "react-icons/fa";
import { FaGoogle } from "react-icons/fa";
import courseApi from "../api/modules/course.api";

// Capitalize initials of each word
function capitalizeWords(str) {
  if (!str) return "";
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

const MentorProfile = () => {
  // State lưu thông tin profile
  const navigate = useNavigate(); // Hook to navigate between routes
  const location = useLocation();
  // --- AUTH & ROLE CHECK ---
  useEffect(() => {
    // Check token
    const token =
      sessionStorage.getItem("actkn") || localStorage.getItem("actkn") || 
      sessionStorage.getItem("token") || localStorage.getItem("token");
    const userStr =
      sessionStorage.getItem("user") || localStorage.getItem("user");
    console.log("Token:", token);
    let user = null;
    if (!token) {
      navigate("/auth/signin");
      return;
    }
    // Check user object
    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      user = null;
    }
    if (!user || !user.role) {
      navigate("/auth/signin");
      return;
    }
    // Check role
    if (user.role === "mentor") {
      return;
    }
    if (user.role === "mentee") {
      navigate("/home");
      return;
    }
    if (user.role === "admin") {
      navigate("/admin/profile");
      return;
    }
  }, [navigate]);

  // Save profilepl
  const handleUpdateProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      // Gom dữ liệu từ formData và avatar
      const payload = { ...formData };
      if (profileImage) {
        payload.avatar = profileImage;
      }
      const response = await profileApi.updateMentorProfile(payload);
      if (response && response.data) {
        setProfileImage(null); // Reset local image preview để sidebar lấy avatar từ backend
        toast.success("Cập nhật profile thành công!", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      setError(error.message || "Cập nhật profile thất bại");
      toast.error(error.message || "Cập nhật profile thất bại", {
        position: "top-right",
        autoClose: 4000,
      });
    }
    setLoading(false);
  };

  const handleGetProfileDetail = async () => {
    setLoading(true);
    setError(null);
    const { response, error } = await profileApi.getProfileDetail();
    if (error) {
      setError("Không thể tải chi tiết profile");
    }
    setLoading(false);
  };

  // CRUD API integration for Course
  const handleCreateCourse = async (courseData) => {
    setLoading(true);
    setError(null);
    try {
      const formData = courseApi.createCourseFormData(courseData);
      const { response, error } = await courseApi.createCourse(formData);
      if (error) {
        setError("Tạo khóa học thất bại");
      } else if (response && response.data) {
        // Sau khi tạo thành công, reload lại danh sách courses
        if (formData?._id) {
          const mentorId = formData._id;
          if (!mentorId) {
            setError("Mentor ID không hợp lệ!");
            setAllCourses([]);
          } else {
            const courses = await courseApi.getCoursesByMentor(mentorId);
            setAllCourses(courses);
          }
        }
        alert("Tạo khóa học thành công!");
      }
    } catch (err) {
      setError("Tạo khóa học thất bại");
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
      setError("Course ID không hợp lệ!");
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
      toast.error("Invalid course id!", {
        position: "top-right",
        autoClose: 4000,
      });
      return;
    }
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      setLoading(true);
      const { response, error } = await courseApi.deleteCourse({ courseId });
      if (error) {
        setError("Xóa khóa học thất bại");
        toast.error("Xóa khóa học thất bại", {
          position: "top-right",
          autoClose: 4000,
        });
      } else {
        setAllCourses((prev) =>
          prev.filter((c) => (c._id || c.id) !== courseId)
        );
        toast.success("Xóa khóa học thành công!", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Delete failed - network error", {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  // ...existing code...
  // Tab logic: luôn vào tab 'profile' khi vào mentor/profile lần đầu, reload thì giữ tab hiện tại
  const [activeTab, setActiveTab] = useState(() => {
    // Nếu có tab lưu trong localStorage thì lấy, không thì mặc định là 'profile'
    return localStorage.getItem("mentorProfileTab") || "profile";
  });

  // Khi activeTab thay đổi, lưu vào localStorage
  useEffect(() => {
    localStorage.setItem("mentorProfileTab", activeTab);
  }, [activeTab]);

  // Khi vào mentor/profile lần đầu (mount), luôn về tab 'profile'
  useEffect(() => {
    if (!localStorage.getItem("mentorProfileTab")) {
      setActiveTab("profile");
      localStorage.setItem("mentorProfileTab", "profile");
    }
  }, []);

  // Lấy thông tin profile khi mount
  useEffect(() => {
    const fetchProfileAndCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await profileApi.getProfile();
        const profileData = data?.data;
        console.log("Profile API response:", profileData);
        if (!profileData || !profileData.user) {
          setError(
            "Không nhận được dữ liệu profile từ API hoặc thiếu thông tin user."
          );
          setFormData({
            userName: "",
            firstName: "",
            lastName: "",
            jobTitle: "",
            category: "",
            bio: "",
            mentorReason: "",
            headline: "",
            website: "",
            twitter: "",
            linkedin: "",
            youtube: "",
            facebook: "",
          });
          setProfileImage(null);
          setAllCourses([]);
        } else {
          // ...existing code...
          setFormData({
            userName: profileData?.user?.userName || "",
            firstName: profileData?.user?.firstName || "",
            lastName: profileData?.user?.lastName || "",
            bio: profileData?.bio || profileData?.user?.bio || "",
            jobTitle:
              profileData?.jobTitle || profileData?.user?.jobTitle || "",
            category:
              profileData?.category || profileData?.user?.category || "",
            skills:
              Array.isArray(profileData?.skills) &&
              profileData.skills.length > 0
                ? profileData.skills
                : Array.isArray(profileData?.user?.skills)
                ? profileData.user.skills
                : [],
            experience:
              profileData?.experience || profileData?.user?.experience || "",
            location:
              profileData?.location || profileData?.user?.location || "",
            mentorReason:
              profileData?.mentorReason ||
              profileData?.user?.mentorReason ||
              "",
            greatestAchievement:
              profileData?.greatestAchievement ||
              profileData?.user?.greatestAchievement ||
              "",
            introVideo:
              profileData?.introVideo || profileData?.user?.introVideo || "",
            headline:
              profileData?.headline || profileData?.user?.headline || "",
            website: profileData?.links?.website || "",
            twitter: profileData?.links?.X || "",
            linkedin: profileData?.user?.linkedinUrl || "",
            youtube: profileData?.links?.youtube || "",
            facebook: profileData?.links?.facebook || "",
            avatarUrl: profileData?.user?.avatarUrl || "",
          });
          setProfileImage(profileData?.user?.avatarUrl || null);
          // Lấy đúng danh sách khóa học của mentor
          if (profileData?.user?._id) {
            const mentorId = profileData.user._id;
            if (!mentorId) {
              setError("Mentor ID không hợp lệ!");
              setAllCourses([]);
            } else {
              const courses = await courseApi.getCoursesByMentor(mentorId);
              setAllCourses(courses);
            }
          }
        }
      } catch (error) {
        setError("Không thể tải thông tin profile hoặc courses");
        // ...existing code...
        setAllCourses([]);
      }
      setLoading(false);
    };
    fetchProfileAndCourses();
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    userName: "",
    firstName: "",
    lastName: "",
    jobTitle: "",
    category: "",
    bio: "",
    mentorReason: "",
    headline: "",
    website: "",
    twitter: "",
    linkedin: "",
    youtube: "",
    facebook: "",
  });

  // Sửa trong mentor-profile.jsx
  const [profileImage, setProfileImage] = useState(null);

  // Đổi avatar khi upload ảnh mới
  const handleChangeAvatar = async (file) => {
    try {
      const res = await profileApi.changeAvatar(file);
      if (res && res.avatarUrl) {
        setProfileImage(res.avatarUrl);
        // ...existing code...
      }
    } catch (err) {
      alert("Đổi avatar thất bại!");
    }
  };

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

  // Schedule management state
  const [scheduleMode, setScheduleMode] = useState("list"); // 'list' | 'builder' | 'review'
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null); // Schedule being edited

  // Function to handle editing a schedule
  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setScheduleMode("builder");
  };

  // Function to save edited schedule
  const handleSaveEditedSchedule = (scheduleData) => {
    if (editingSchedule) {
      // Update existing schedule
      setSchedules(prev => prev.map(s => 
        s.id === editingSchedule.id 
          ? {
              ...s,
              availability: scheduleData.slots,
              totalDays: Object.keys(scheduleData.slots).length,
              totalSlots: Object.values(scheduleData.slots).reduce((total, times) => total + times.length, 0),
              updatedAt: new Date().toISOString()
            }
          : s
      ));
      setEditingSchedule(null);
    } else {
      // Create new schedule
      const newSchedule = {
        id: Date.now().toString(),
        name: `Schedule ${Date.now().toString().slice(-6)}`,
        availability: scheduleData.slots,
        status: "active",
        createdAt: scheduleData.createdAt,
        totalDays: Object.keys(scheduleData.slots).length,
        totalSlots: Object.values(scheduleData.slots).reduce((total, times) => total + times.length, 0)
      };
      setSchedules(prev => [...prev, newSchedule]);
    }
    setScheduleMode("list");
  };

  // Auto-cleanup expired schedules
  useEffect(() => {
    const cleanupExpiredSchedules = () => {
      const today = todayKey();
      setSchedules(prevSchedules => {
        const activeSchedules = prevSchedules.filter(schedule => {
          // Check if schedule has any future dates
          const futureDates = Object.keys(schedule.availability).filter(date => !isPast(date));
          return futureDates.length > 0;
        });
        
        // Log if any schedules were removed
        const removedCount = prevSchedules.length - activeSchedules.length;
        if (removedCount > 0) {
          console.log(`Automatically removed ${removedCount} expired schedule(s)`);
        }
        
        return activeSchedules;
      });
    };

    // Run cleanup on component mount and every minute
    cleanupExpiredSchedules();
    const interval = setInterval(cleanupExpiredSchedules, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Response/Booking management state
  const [bookings, setBookings] = useState([
    // Mock data for demonstration
    {
      id: "1",
      menteeName: "Alice Johnson",
      menteeEmail: "alice@example.com",
      date: "2025-08-31",
      time: "14:00",
      status: "pending",
      message: "I would like to discuss career development in web development.",
      createdAt: "2025-08-30T10:00:00Z"
    },
    {
      id: "2", 
      menteeName: "Bob Smith",
      menteeEmail: "bob@example.com",
      date: "2025-09-01",
      time: "16:30",
      status: "pending",
      message: "Need guidance on transitioning to a senior role.",
      createdAt: "2025-08-30T11:30:00Z"
    },
    {
      id: "3",
      menteeName: "Carol Davis",
      menteeEmail: "carol@example.com", 
      date: "2025-09-02",
      time: "10:00",
      status: "pending",
      message: "Looking for advice on freelancing best practices.",
      createdAt: "2025-08-30T09:15:00Z"
    }
  ]);

  // Booking filter state
  const [bookingFilter, setBookingFilter] = useState("all"); // 'all', 'pending', 'accepted', 'declined'

  // Function to filter bookings based on current filter
  const getFilteredBookings = () => {
    if (bookingFilter === "all") return bookings;
    return bookings.filter(booking => booking.status === bookingFilter);
  };

  // Booking response handlers
  const handleAcceptBooking = (bookingId) => {
    setBookings(prev => prev.map(booking => 
      booking.id === bookingId 
        ? { ...booking, status: "accepted", respondedAt: new Date().toISOString() }
        : booking
    ));
    console.log("Booking accepted:", bookingId);
    // TODO: Call API to update booking status
  };

  const handleDeclineBooking = (bookingId) => {
    setBookings(prev => prev.map(booking => 
      booking.id === bookingId 
        ? { ...booking, status: "declined", respondedAt: new Date().toISOString() }
        : booking
    ));
    console.log("Booking declined:", bookingId);
    // TODO: Call API to update booking status
  };

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
      if (error || !response?.data) {
        setError("Failed to load courses");
        setAllCourses([]);
        setLoading(false);
        return;
      }
      if (response.data.courses && Array.isArray(response.data.courses)) {
        setAllCourses(response.data.courses);
      } else if (Array.isArray(response.data)) {
        setAllCourses(response.data);
      } else {
        setError("Unexpected response structure");
        setAllCourses([]);
      }
    } catch (err) {
      setError("Error loading courses");
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
          {formData.avatarUrl ? (
            <img
              src={formData.avatarUrl}
              alt={
                formData.firstName || formData.lastName
                  ? `${capitalizeWords(
                      formData.firstName || ""
                    )} ${capitalizeWords(formData.lastName || "")}`.trim()
                  : "Default Avatar"
              }
              className="w-24 h-24 rounded-full object-cover mb-4"
            />
          ) : (
            <FaUserCircle className="w-24 h-24 text-gray-300 mb-4" />
          )}
          <h2 className="font-semibold text-xl text-gray-900 mb-3">
            {formData.firstName || formData.lastName
              ? `${capitalizeWords(formData.firstName || "")} ${capitalizeWords(
                  formData.lastName || ""
                )}`.trim()
              : "Mentor"}
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
              <li
                className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                  activeTab === "schedule"
                    ? "bg-gray-200 hover:bg-gray-300 hover:shadow-sm"
                    : "hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm hover:scale-105"
                }`}
                onClick={() => handleTabChange("schedule")}
              >
                My Schedule
              </li>
              <li
                className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                  activeTab === "response"
                    ? "bg-gray-200 hover:bg-gray-300 hover:shadow-sm"
                    : "hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm hover:scale-105"
                }`}
                onClick={() => handleTabChange("response")}
              >
                Response
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
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Job Title & Category row */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title
                    </label>
                    <input
                      type="text"
                      name="jobTitle"
                      value={formData.jobTitle || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category (Expertise)
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Skills, Experience, Mentor Reason, Greatest Achievement */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Skills (comma separated)
                    </label>
                    <input
                      type="text"
                      name="skills"
                      value={
                        Array.isArray(formData.skills)
                          ? formData.skills.join(", ")
                          : formData.skills || ""
                      }
                      onChange={(e) =>
                        handleInputChange({
                          target: {
                            name: "skills",
                            value: e.target.value.split(/,\s*/),
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. React, Node.js, MongoDB"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Experience
                    </label>
                    <input
                      type="text"
                      name="experience"
                      value={formData.experience || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason to become a mentor
                  </label>
                  <textarea
                    name="mentorReason"
                    rows={2}
                    value={formData.mentorReason || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Greatest Achievement
                  </label>
                  <input
                    type="text"
                    name="greatestAchievement"
                    value={formData.greatestAchievement || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
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
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Intro Video (URL)
                  </label>
                  <input
                    type="url"
                    name="introVideo"
                    value={formData.introVideo || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://..."
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="City, Country"
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
                    onChange={(e) => {
                      handleImageUpload(e);
                      if (e.target.files[0])
                        handleChangeAvatar(e.target.files[0]);
                    }}
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
                      <FaGoogle className="w-5 h-5 text-[#4285F4]" />
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
                      <FaXTwitter className="w-5 h-5 text-[#1DA1F2]" />
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
                      <FaLinkedin className="w-5 h-5 text-[#0077B5]" />
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
                      <FaFacebook className="w-5 h-5 text-[#1877F3]" />
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
                className={`bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold mt-8 float-right transition-all duration-200 ${
                  loading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-blue-700 hover:scale-105"
                }`}
                onClick={loading ? undefined : handleUpdateProfile}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Profile"}
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
                      currentCourses.map((course) => (
                        <div
                          key={course._id || course.id}
                          className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow min-h-[340px] flex flex-col cursor-pointer"
                          onClick={() => {
                            navigate(
                              `/mentor/course-detail/${course._id || course.id}`
                            );
                          }}
                        >
                          <img
                            src={
                              course.thumbnail
                                ? /cloudinary\.com|res\.cloudinary\.com/.test(
                                    course.thumbnail
                                  )
                                  ? course.thumbnail
                                  : course.thumbnail.startsWith("http")
                                  ? course.thumbnail
                                  : `http://localhost:4000/${course.thumbnail}`
                                : "/placeholder-course.jpg"
                            }
                            alt={course.title}
                            className="w-full h-48 object-cover"
                          />
                          {/* Đã bỏ phần ngăn cách lớn, chỉ giữ card nhỏ gọn */}
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
                                {(() => {
                                  const capitalizeWords = (str) =>
                                    str
                                      ? str
                                          .split(" ")
                                          .map(
                                            (word) =>
                                              word.charAt(0).toUpperCase() +
                                              word.slice(1)
                                          )
                                          .join(" ")
                                      : "";
                                  if (course.mentor?.userName)
                                    return capitalizeWords(
                                      course.mentor.userName
                                    );
                                  if (course.mentor?.firstName)
                                    return `${capitalizeWords(
                                      course.mentor.firstName
                                    )} ${capitalizeWords(
                                      course.mentor.lastName
                                    )}`;
                                  return "Unknown Mentor";
                                })()}
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
                              {/* Đã bỏ hiển thị course overview và key learning objectives */}
                              {/* Hiển thị level nếu có */}
                              {course.level && (
                                <p className="text-green-500 text-xs mb-2">
                                  <b>Level:</b> {course.level}
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
                                  `/mentor/edit-course/${
                                    course._id || course.id
                                  }`
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

          {activeTab === "schedule" && (
            <div className="space-y-6">
              {scheduleMode === "list" && (
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  {/* Header with create schedule button */}
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      My Schedules ({schedules.length})
                    </h3>
                    <button
                      onClick={() => setScheduleMode("builder")}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Schedule
                    </button>
                  </div>

                  {/* Schedules List */}
                  <div className="space-y-4">
                    {schedules.length > 0 ? (
                      schedules.map((schedule) => (
                        <div key={schedule.id} className={`border rounded-lg p-6 hover:shadow-md transition-shadow ${
                          schedule.status === "inactive" ? "border-gray-300 bg-gray-50 opacity-75" : "border-gray-200"
                        }`}>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className={`font-semibold text-lg mb-2 ${
                                schedule.status === "inactive" ? "text-gray-500" : "text-gray-900"
                              }`}>
                                {schedule.name}
                                {schedule.status === "inactive" && (
                                  <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                                    DISABLED
                                  </span>
                                )}
                              </h4>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>Created: {new Date(schedule.createdAt).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>{schedule.totalDays} days</span>
                                <span>•</span>
                                <span>{schedule.totalSlots} time slots</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                schedule.status === "active" 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                                {schedule.status}
                              </span>
                            </div>
                          </div>

                          {/* Schedule Preview */}
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <h5 className="font-semibold text-blue-900">Availability Preview</h5>
                            </div>
                            <div className="space-y-3">
                              {Object.entries(schedule.availability).slice(0, 3).map(([date, times]) => (
                                <div key={date} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                    <div className="font-semibold text-sm text-blue-900">
                                      {new Date(date + "T00:00:00").toLocaleDateString("en-US", { 
                                        weekday: "short", 
                                        year: "numeric", 
                                        month: "short", 
                                        day: "2-digit" 
                                      })}
                                    </div>
                                    <span className="text-blue-600 text-xs bg-blue-100 px-2 py-0.5 rounded-full">
                                      {date}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-5 gap-2">
                                    {times.slice(0, 5).map((time) => (
                                      <div key={time} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-1.5 text-xs text-center rounded-md font-medium shadow-sm">
                                        {time}
                                      </div>
                                    ))}
                                    {times.length > 5 && (
                                      <div className="bg-blue-100 border border-blue-300 text-blue-700 px-2 py-1.5 text-xs text-center rounded-md font-medium">
                                        +{times.length - 5}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {Object.keys(schedule.availability).length > 3 && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                                  <span className="text-sm text-blue-600 font-medium">
                                    +{Object.keys(schedule.availability).length - 3} more days available
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => alert("Publishing schedule... (Connect to API)")}
                              className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition text-sm font-medium flex items-center justify-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Publish
                            </button>
                            <button 
                              onClick={() => handleEditSchedule(schedule)}
                              className="px-3 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition text-sm flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm("Are you sure you want to delete this schedule?")) {
                                  setSchedules(prev => prev.filter(s => s.id !== schedule.id));
                                }
                              }}
                              className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition text-sm flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                            <button 
                              onClick={() => {
                                setSchedules(prev => prev.map(s => 
                                  s.id === schedule.id 
                                    ? { ...s, status: s.status === "active" ? "inactive" : "active" }
                                    : s
                                ));
                              }}
                              className={`px-3 py-2 border rounded-lg transition text-sm flex items-center gap-2 ${
                                schedule.status === "active"
                                  ? "border-orange-300 text-orange-600 hover:bg-orange-50"
                                  : "border-green-300 text-green-600 hover:bg-green-50"
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {schedule.status === "active" ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                )}
                              </svg>
                              {schedule.status === "active" ? "Disable" : "Enable"}
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-gray-500 text-lg mb-2">No schedules created yet</p>
                            <p className="text-gray-400 mb-4">Create your first availability schedule to start accepting bookings</p>
                            <button
                              onClick={() => setScheduleMode("builder")}
                              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                            >
                              Create Schedule
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {scheduleMode === "builder" && (
                <MentorAvailabilityBuilder 
                  onBack={() => {
                    setScheduleMode("list");
                    setEditingSchedule(null);
                  }} 
                  onSave={handleSaveEditedSchedule}
                  editingSchedule={editingSchedule}
                />
              )}

              {scheduleMode === "review" && selectedSchedule && (
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setScheduleMode("list")}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h1 className="text-2xl font-semibold">{selectedSchedule.name}</h1>
                    </div>
                    <div className="flex gap-3">
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Schedule
                      </button>
                      <button className="border border-green-600 text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition font-medium flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Publish
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                      <div>
                        <p className="text-sm text-gray-600">Created at</p>
                        <p className="font-medium">{new Date(selectedSchedule.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{selectedSchedule.totalDays} day(s) • {selectedSchedule.totalSlots} slots</p>
                        <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                          selectedSchedule.status === "active" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {selectedSchedule.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {Object.entries(selectedSchedule.availability)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([dateKey, timeSlots]) => (
                        <div key={dateKey} className="rounded-lg border p-4">
                          <div className="mb-3 font-medium">
                            {new Date(dateKey + "T00:00:00").toLocaleDateString("en-US", { 
                              weekday: "short", 
                              year: "numeric", 
                              month: "short", 
                              day: "2-digit" 
                            })} ({dateKey})
                          </div>
                          <div className="grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-6">
                            {timeSlots.map((time) => (
                              <div key={time} className="rounded-lg border px-3 py-2 text-sm text-center bg-blue-50 border-blue-200">
                                {time}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-600">
                    <p><strong>Tip:</strong> This schedule shows all your available time slots. Students can book these slots for mentoring sessions.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "response" && (
            <div className="space-y-6">
              {/* Booking Response Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-semibold text-gray-900">Booking Requests</h1>
                      <p className="text-gray-600 mt-1">Manage mentee booking requests for your available time slots</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">
                        {bookings.filter(b => b.status === "pending").length} pending requests
                      </span>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="flex gap-4 border-b border-gray-200 pb-4">
                    <button 
                      onClick={() => setBookingFilter("all")}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                        bookingFilter === "all" 
                          ? "bg-blue-100 text-blue-700" 
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      All ({bookings.length})
                    </button>
                    <button 
                      onClick={() => setBookingFilter("pending")}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                        bookingFilter === "pending" 
                          ? "bg-orange-100 text-orange-700" 
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      Pending ({bookings.filter(b => b.status === "pending").length})
                    </button>
                    <button 
                      onClick={() => setBookingFilter("accepted")}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                        bookingFilter === "accepted" 
                          ? "bg-green-100 text-green-700" 
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      Accepted ({bookings.filter(b => b.status === "accepted").length})
                    </button>
                    <button 
                      onClick={() => setBookingFilter("declined")}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                        bookingFilter === "declined" 
                          ? "bg-red-100 text-red-700" 
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      Declined ({bookings.filter(b => b.status === "declined").length})
                    </button>
                  </div>

                  {/* Booking List */}
                  <div className="space-y-4">
                    {(() => {
                      const filteredBookings = getFilteredBookings();
                      return filteredBookings.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {bookingFilter === "all" 
                              ? "No booking requests yet" 
                              : `No ${bookingFilter} booking requests`
                            }
                          </h3>
                          <p className="text-gray-600">
                            {bookingFilter === "all" 
                              ? "When mentees book your available time slots, they will appear here for your review."
                              : `No booking requests with ${bookingFilter} status found.`
                            }
                          </p>
                        </div>
                      ) : (
                        filteredBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className={`border rounded-xl p-6 transition-all duration-200 ${
                            booking.status === "pending" 
                              ? "border-orange-200 bg-orange-50/50" 
                              : booking.status === "accepted"
                              ? "border-green-200 bg-green-50/50"
                              : "border-red-200 bg-red-50/50"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-700 font-medium text-sm">
                                    {booking.menteeName.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">{booking.menteeName}</h4>
                                  <p className="text-sm text-gray-600">{booking.menteeEmail}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span className="font-medium">
                                    {new Date(booking.date).toLocaleDateString("en-US", { 
                                      weekday: "long", 
                                      year: "numeric", 
                                      month: "long", 
                                      day: "numeric" 
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="font-medium">{booking.time}</span>
                                </div>
                              </div>

                              <div className="text-xs text-gray-500">
                                Requested {new Date(booking.createdAt).toLocaleDateString()} at {new Date(booking.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                booking.status === "pending" 
                                  ? "bg-orange-100 text-orange-800" 
                                  : booking.status === "accepted"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          {booking.status === "pending" && (
                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                              <button
                                onClick={() => handleAcceptBooking(booking.id)}
                                className="flex-1 bg-green-600 text-white py-2.5 px-4 rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Accept
                              </button>
                              <button
                                onClick={() => handleDeclineBooking(booking.id)}
                                className="flex-1 bg-red-600 text-white py-2.5 px-4 rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    );
                    })()}
                  </div>

                  {/* Information */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">How booking requests work:</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-700">
                          <li>Mentees can book your available time slots from your published schedule</li>
                          <li>You will receive notifications for new booking requests</li>
                          <li>Accept or decline requests based on your availability</li>
                          <li>Accepted bookings will be added to your calendar</li>
                        </ul>
                      </div>
                    </div>
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
