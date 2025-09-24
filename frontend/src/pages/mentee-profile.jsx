import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { FaFacebook } from "react-icons/fa6";
import { FaXTwitter } from "react-icons/fa6";
import { FaLinkedin } from "react-icons/fa";
import { FaGoogle } from "react-icons/fa";
import { VscEditSession } from "react-icons/vsc";
import { BsCalendarDate } from "react-icons/bs";
import { IoStar, IoStarOutline } from "react-icons/io5";
import profileApi from "../api/modules/profile.api";
import purchasedCourseApi from "../api/modules/purchasedCourse.api";
import bookingApi from "../api/modules/booking.api";
import reviewApi from "../api/modules/review.api";
import authUtils from "../utils/auth.utils";
import minatoImg from "../assets/minato.jpg";
import courseApi from "../api/modules/course.api";

// Stars render function
const renderStars = (rating) => {
  const stars = [];
  const r = Number(rating) || 0;
  const full = Math.floor(r);
  const hasHalf = r % 1 !== 0;

  for (let i = 0; i < full; i++) {
    stars.push(
      <IoStar key={`full-${i}`} className="text-yellow-500" size={16} />
    );
  }
  if (hasHalf) {
    stars.push(
      <div key="half" className="relative">
        <IoStarOutline className="text-yellow-500" size={16} />
        <IoStar
          className="text-yellow-500 absolute top-0 left-0"
          size={16}
          style={{ clipPath: "inset(0 50% 0 0)" }}
        />
      </div>
    );
  }
  const empty = 5 - Math.ceil(r);
  for (let i = 0; i < empty; i++) {
    stars.push(
      <IoStarOutline key={`empty-${i}`} className="text-yellow-500" size={16} />
    );
  }
  return stars;
};

const MenteeProfile = () => {
  const navigate = useNavigate();
  // --- AUTH & ROLE CHECK ---
  useEffect(() => {
    const token =
      localStorage.getItem("actkn") || localStorage.getItem("token");
    const userStr =
      localStorage.getItem("user") || localStorage.getItem("user");
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
    if (user.role === "mentee") {
      return;
    }
    if (user.role === "mentor") {
      navigate("/home");
      return;
    }
    // if (user.role === "admin") {
    //   navigate("/admin/profile");
    //   return;
    // }
  }, [navigate]);

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("menteeProfileTab") || "profile";
  });
  useEffect(() => {
    localStorage.setItem("menteeProfileTab", activeTab);
  }, [activeTab]);
  useEffect(() => {
    if (!localStorage.getItem("menteeProfileTab")) {
      setActiveTab("profile");
      localStorage.setItem("menteeProfileTab", "profile");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // TODO: Replace with API call - fetch user profile data
  // const fetchUserProfile = async (userId) => {
  //   const response = await fetch(`/api/users/${userId}/profile`);
  //   return response.json();
  // };

  // State lưu thông tin profile
  const [profile, setProfile] = useState(null);

  // State cho sidebar (chỉ cập nhật khi save thành công)
  const [sidebarData, setSidebarData] = useState({
    firstName: "",
    lastName: "",
    avatarUrl: "",
  });

  // State cho form (thay đổi real-time khi user nhập)
  const [formData, setFormData] = useState({
    userName: "",
    firstName: "",
    lastName: "",
    bio: "",
    location: "",
    description: "",
    goal: "",
    education: "",
    website: "",
    twitter: "",
    linkedin: "",
    facebook: "",
  });
  const [profileImage, setProfileImage] = useState(null); // preview
  const [profileImageFile, setProfileImageFile] = useState(null); // file gốc
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Booking states
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState(null);
  const [bookingFilterBy, setBookingFilterBy] = useState("all");

  // Review popup states
  const [isReviewPopupOpen, setIsReviewPopupOpen] = useState(false);
  const [reviewCourse, setReviewCourse] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Booking review popup states
  const [isBookingReviewPopupOpen, setIsBookingReviewPopupOpen] =
    useState(false);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [bookingReviewRating, setBookingReviewRating] = useState(0);
  const [bookingReviewHoverRating, setBookingReviewHoverRating] = useState(0);
  const [bookingReviewComment, setBookingReviewComment] = useState("");
  const [isSubmittingBookingReview, setIsSubmittingBookingReview] =
    useState(false);

  // Mentor rating states
  const [isMentorRatingPopupOpen, setIsMentorRatingPopupOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [mentorRating, setMentorRating] = useState(0);
  const [mentorRatingHover, setMentorRatingHover] = useState(0);
  const [mentorRatingComment, setMentorRatingComment] = useState("");
  const [isSubmittingMentorRating, setIsSubmittingMentorRating] =
    useState(false);

  // Đổi avatar khi upload ảnh mới
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImageFile(file); // lưu file gốc để gửi API
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProfileImage(ev.target.result); // preview
      };
      reader.readAsDataURL(file);
    }
  };
  const handleChangeAvatar = async () => {
    if (!profileImageFile) return;
    try {
      const res = await profileApi.changeAvatar(profileImageFile);
      if (res && res.avatarUrl) {
        setProfileImage(res.avatarUrl);
        setProfileImageFile(null);
        if (profile && profile.user) {
          setProfile((prev) => ({
            ...prev,
            user: {
              ...prev.user,
              avatarUrl: res.avatarUrl,
            },
          }));
        }
        toast.success("Đổi avatar thành công!");
      }
    } catch (err) {
      console.error("[DEBUG] Lỗi khi change avatar:", err);

      // Handle authentication errors using auth utils
      if (authUtils.isAuthError(err)) {
        authUtils.handleAuthFailure(
          navigate,
          "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!"
        );
        return;
      }

      toast.error("Đổi avatar thất bại!");
    }
  };

  // Lấy thông tin profile khi mount
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await profileApi.getProfile();
        const profileData = data?.data;
        if (!profileData || !profileData.user) {
          setError(
            "Không nhận được dữ liệu profile từ API hoặc thiếu thông tin user."
          );
          setFormData({
            userName: "",
            firstName: "",
            lastName: "",
            email: "",
            bio: "",
            description: "",
            goal: "",
            education: "",
            website: "",
            twitter: "",
            linkedin: "",
            facebook: "",
            avatarUrl: "",
            location: "",
            role: "",
          });
          setSidebarData({
            firstName: "",
            lastName: "",
            avatarUrl: "",
          });
          setProfileImage(null);
        } else {
          setProfile(profileData);
          const user = profileData.user || {};
          const profile = profileData.profile || {};
          const links = profile.links || {};

          // Set form data (có thể thay đổi khi user nhập)
          setFormData({
            userName: user?.userName || "",
            firstName: user?.firstName || "",
            lastName: user?.lastName || "",
            email: user?.email || "",
            bio: profile?.bio || user?.bio || "",
            description: profile?.description || "",
            goal: profile?.goal || "",
            education: profile?.education || "",
            website: links?.website || "",
            twitter: links?.twitter || "",
            linkedin: links?.linkedin || "",
            facebook: links?.facebook || "",
            avatarUrl: user?.avatarUrl || "",
            location: user?.location || profile?.location || "",
            role: user?.role || "",
          });

          // Set sidebar data (chỉ cập nhật khi save thành công)
          setSidebarData({
            firstName: user?.firstName || "",
            lastName: user?.lastName || "",
            avatarUrl: user?.avatarUrl || "",
          });

          setProfileImage(user?.avatarUrl || null);
        }
      } catch (error) {
        console.error("[DEBUG] Lỗi khi gọi profileApi.getProfile:", error);
        setError("Không thể tải thông tin profile");
        setProfile(null);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  // Fetch mentee's bookings
  const fetchBookings = async () => {
    setBookingsLoading(true);
    setBookingsError(null);
    try {
      const { response, error } = await bookingApi.getMenteeBookings();
      if (response) {
        setBookings(response.data || []);
      } else {
        console.error("Error fetching bookings:", error);
        setBookingsError(error?.message || "Không thể tải danh sách booking");
        setBookings([]);
      }
    } catch (err) {
      console.error("Booking fetch error:", err);
      setBookingsError("Có lỗi xảy ra khi tải booking");
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  // Fetch bookings when component mounts and when "mybookings" tab is active
  useEffect(() => {
    if (activeTab === "mybookings") {
      fetchBookings();
    }
  }, [activeTab]);

  // Fetch mentee's reviews
  const fetchMenteeReviews = async () => {
    setReviewsLoading(true);
    setReviewsError(null);
    try {
      // Fetch reviews for the authenticated user
      const { response, error } = await reviewApi.getMyReviews({
        limit: 50, // Get more reviews at once
      });

      if (response) {
        const reviews = response.data?.items || response.data || [];

        // Transform reviews to the format expected by the UI
        const transformedReviews = reviews.map((review) => ({
          id: review._id,
          type: getReviewType(review.targetType), // Map backend targetType to UI type
          targetTitle: review.targetInfo?.title || "Unknown",
          targetImage: review.targetInfo?.thumbnail || minatoImg,
          instructor: review.targetInfo?.instructor || null,
          mentorSpecialty: review.targetInfo?.mentorSpecialty || null,
          rating: review.rate || review.rating || 0,
          comment: review.content || review.comment || "",
          date: new Date(review.createdAt).toLocaleDateString("en-US"),
          helpfulCount: review.helpfulCount || 0,
          mentorReply: review.mentorReply,
          mentorAvatar: review.mentorAvatar,
          mentorName: review.mentorName,
          // Add consultation details for booking reviews
          consultationDate:
            review.targetType === "Booking" &&
            review.targetInfo?.consultationDate
              ? new Date(review.targetInfo.consultationDate).toLocaleDateString(
                  "en-US"
                )
              : null,
          consultationTime:
            review.targetType === "Booking" &&
            review.targetInfo?.consultationTime
              ? review.targetInfo.consultationTime
              : null,
        }));

        setAllReviews(transformedReviews);
      } else {
        console.error("Error fetching reviews:", error);
        setReviewsError(error?.message || "Không thể tải danh sách đánh giá");
        setAllReviews([]);
      }
    } catch (err) {
      console.error("Reviews fetch error:", err);
      setReviewsError("Có lỗi xảy ra khi tải đánh giá");
      setAllReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Helper function to map backend targetType to frontend type
  const getReviewType = (targetType) => {
    switch (targetType) {
      case "Course":
        return "course";
      case "Booking":
        return "consulting";
      case "Mentor":
        return "mentor";
      default:
        return "course";
    }
  };

  // Helper functions to extract information from review objects
  const getTargetTitle = (review) => {
    if (review.course?.title) return review.course.title;
    if (review.mentor?.firstName && review.mentor?.lastName) {
      return `${review.mentor.firstName} ${review.mentor.lastName}`;
    }
    if (review.booking?.mentor?.firstName && review.booking?.mentor?.lastName) {
      return `${review.booking.mentor.firstName} ${review.booking.mentor.lastName}`;
    }
    return "Unknown";
  };

  const getTargetImage = (review) => {
    if (review.course?.thumbnail) return review.course.thumbnail;
    if (review.mentor?.avatarUrl) return review.mentor.avatarUrl;
    if (review.booking?.mentor?.avatarUrl)
      return review.booking.mentor.avatarUrl;
    return minatoImg; // fallback
  };

  const getInstructor = (review) => {
    if (review.course?.mentor?.firstName && review.course?.mentor?.lastName) {
      return `${review.course.mentor.firstName} ${review.course.mentor.lastName}`;
    }
    return null;
  };

  const getMentorSpecialty = (review) => {
    if (review.mentor?.skills && review.mentor.skills.length > 0) {
      return review.mentor.skills.join(", ");
    }
    if (
      review.booking?.mentor?.skills &&
      review.booking.mentor.skills.length > 0
    ) {
      return review.booking.mentor.skills.join(", ");
    }
    return "Tư vấn";
  };

  // Fetch reviews when component mounts and when "reviews" tab is active
  useEffect(() => {
    if (activeTab === "reviews") {
      fetchMenteeReviews();
    }
  }, [activeTab]);

  const [purchasedCourses, setPurchasedCourses] = useState([]);

  useEffect(() => {
    async function fetchPurchasedCourses() {
      try {
        // Get current user ID for user-specific localStorage
        const userStr = localStorage.getItem("user");
        let currentUserId = null;
        try {
          const user = userStr ? JSON.parse(userStr) : null;
          currentUserId = user?.id || user?._id;
        } catch (e) {
          console.warn("Error parsing user:", e);
        }

        const { response, error } =
          await purchasedCourseApi.getPurchasedCourses();

        if (error) {
          console.error("Purchased courses fetch error:", error);

          // Handle authentication errors using auth utils
          if (authUtils.isAuthError(error)) {
            authUtils.handleAuthFailure(
              navigate,
              "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!"
            );
            return;
          }

          // Handle 404 or no purchased courses - this is normal for new users
          if (error.status === 404 || error.response?.status === 404) {
            setPurchasedCourses([]);
            return;
          }

          // Don't show error toast for other errors, just use empty array
          setPurchasedCourses([]);
          return;
        }

        const courses =
          response?.data?.courses || response?.data?.purchasedCourses || [];
        if (Array.isArray(courses)) {
          setPurchasedCourses(courses);
        } else {
          setPurchasedCourses([]);
        }
      } catch (err) {
        console.error("Purchased courses fetch error:", err);

        // Handle authentication errors using auth utils
        if (authUtils.isAuthError(err)) {
          authUtils.handleAuthFailure(
            navigate,
            "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!"
          );
          return;
        }

        // Handle 404 or no purchased courses - this is normal for new users
        if (err.response?.status === 404 || err.status === 404) {
          // No action needed
        }

        // Don't show error toast for other errors, just use empty array
        setPurchasedCourses([]);
      }
    }
    fetchPurchasedCourses();
  }, []);

  // Function to fetch detailed mentor statistics (rating and student count) based on mentor-page.jsx logic
  const fetchMentorDetailedStats = async (mentorId) => {
    try {
      // Fetch mentor course reviews
      const { response: courseReviewsResponse } =
        await reviewApi.getMentorCourseReviews(mentorId);

      // Fetch mentor courses to get student count
      const mentorCourses = await courseApi.getCoursesByMentor(mentorId);

      // Calculate student count from courses
      let estimatedMentees = 0;
      const courseMenteeIds = new Set();

      if (Array.isArray(mentorCourses)) {
        mentorCourses.forEach((course) => {
          if (course.mentees && Array.isArray(course.mentees)) {
            course.mentees.forEach((menteeId) => {
              // Handle both ObjectId string and populated object
              const id =
                typeof menteeId === "string"
                  ? menteeId
                  : menteeId._id || menteeId.id;
              if (id) {
                courseMenteeIds.add(id);
              }
            });
          }
        });
      }

      estimatedMentees = courseMenteeIds.size;

      // Calculate rating from reviews
      let allReviews = [];
      let courseReviews = [];

      if (courseReviewsResponse?.data?.items) {
        courseReviews = courseReviewsResponse.data.items;
        allReviews = [...courseReviews];
      }

      // Fetch consultation/booking reviews
      let consultationReviews = [];
      try {
        const { response: bookingReviewsResponse } =
          await reviewApi.getBookingReviews(mentorId);
        if (bookingReviewsResponse?.data?.items) {
          consultationReviews = bookingReviewsResponse.data.items;
          allReviews = [...allReviews, ...consultationReviews];
        }
      } catch (error) {
        // Ignore booking reviews error
      }

      // Calculate statistics
      const totalReviews = allReviews.length;
      const averageRating =
        totalReviews > 0
          ? allReviews.reduce((sum, review) => sum + (review.rate || 0), 0) /
            totalReviews
          : 0;

      return {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalReviews,
        studentCount: estimatedMentees,
        courseReviews: courseReviews.length,
        consultationReviews: consultationReviews.length,
      };
    } catch (error) {
      console.error("Error fetching mentor detailed stats:", error);
      return {
        averageRating: 0,
        totalReviews: 0,
        studentCount: 0,
        courseReviews: 0,
        consultationReviews: 0,
      };
    }
  };

  // Function to extract unique mentors from purchased courses and bookings
  // Lấy danh sách mentor từ purchasedCourses và bookings (không trùng lặp)
  // Lấy danh sách mentor từ purchasedCourses & bookings (unique) + tính studentCount & averageRating (courses + bookings)
  const extractMentorsFromData = async () => {
    setMentorsLoading(true);

    // Map<mentorId, mentorInfo>
    const mentorMap = new Map();

    try {
      // ===== 1) TỪ KHÓA ĐÃ MUA =====
      if (Array.isArray(purchasedCourses) && purchasedCourses.length > 0) {
        purchasedCourses.forEach((p) => {
          const course = p?.course || p?.courseInfo;
          if (!course || !course.mentor) return;

          const mentor = course.mentor;
          const mentorId = mentor._id || mentor.id;
          if (!mentorId) return;

          const existing = mentorMap.get(mentorId) || {
            _id: mentorId,
            firstName: mentor.firstName || "",
            lastName: mentor.lastName || "",
            userName: mentor.userName || "Unknown",
            avatarUrl: mentor.avatarUrl || "",
            email: mentor.email || "",
            jobTitle: mentor.jobTitle || mentor.profession || "Mentor",
            hasCoursePurchase: false,
            hasBooking: false,
          };

          existing.hasCoursePurchase = true;
          mentorMap.set(mentorId, existing);
        });
      }

      // ===== 2) TỪ BOOKING TƯ VẤN =====
      if (Array.isArray(bookings) && bookings.length > 0) {
        bookings.forEach((b) => {
          const mentor = b?.mentor;
          if (!mentor) return;

          const mentorId = mentor._id || mentor.id;
          if (!mentorId) return;

          const existing = mentorMap.get(mentorId) || {
            _id: mentorId,
            firstName: mentor.firstName || "",
            lastName: mentor.lastName || "",
            userName: mentor.userName || "Unknown",
            avatarUrl: mentor.avatarUrl || "",
            email: mentor.email || "",
            jobTitle: mentor.jobTitle || mentor.profession || "Consultant",
            hasCoursePurchase: false,
            hasBooking: false,
          };

          existing.hasBooking = true;
          mentorMap.set(mentorId, existing);
        });
      }

      // ===== 3) LẤY THỐNG KÊ CHI TIẾT CHO TỪNG MENTOR =====
      const mentorIds = Array.from(mentorMap.keys());
      const statsPromises = mentorIds.map(async (mentorId) => {
        const mentor = mentorMap.get(mentorId);
        const stats = await fetchMentorDetailedStats(mentorId);

        return {
          ...mentor,
          averageRating: stats.averageRating,
          totalReviews: stats.totalReviews,
          studentCount: stats.studentCount,
          courseReviews: stats.courseReviews,
          consultationReviews: stats.consultationReviews,
        };
      });

      const mentorsWithStats = await Promise.allSettled(statsPromises);

      // ===== 4) XUẤT MẢNG KẾT QUẢ =====
      const mentorsArray = mentorsWithStats
        .filter((result) => result.status === "fulfilled")
        .map((result) => {
          const m = result.value;
          const displayName =
            `${m.firstName} ${m.lastName}`.trim() || m.userName || "Unknown";

          return {
            _id: m._id,
            firstName: m.firstName,
            lastName: m.lastName,
            userName: m.userName,
            avatarUrl: m.avatarUrl,
            email: m.email,
            jobTitle: m.jobTitle,
            displayName,
            averageRating: m.averageRating || 0,
            totalReviews: m.totalReviews || 0,
            studentCount: m.studentCount || 0,
            hasCoursePurchase: !!m.hasCoursePurchase,
            hasBooking: !!m.hasBooking,
          };
        });

      // Sắp xếp theo rating giảm dần
      mentorsArray.sort(
        (a, b) => (b.averageRating || 0) - (a.averageRating || 0)
      );

      setAllMentors(mentorsArray);
    } catch (err) {
      console.error("Error extracting mentors:", err);
      setAllMentors([]);
    } finally {
      setMentorsLoading(false);
    }
  };

  // Extract mentors when purchased courses or bookings change
  useEffect(() => {
    // Always call extractMentorsFromData when the tab is active, even if arrays are empty
    // This ensures the loading state is properly handled and empty state is shown
    if (activeTab === "mentors") {
      extractMentorsFromData();
    }
  }, [purchasedCourses, bookings, activeTab]);

  // Fetch bookings when mentors tab is active
  useEffect(() => {
    if (activeTab === "mentors") {
      fetchBookings();
    }
  }, [activeTab]);

  // Review functions
  const openReviewPopup = (course) => {
    setReviewCourse(course);
    setReviewRating(0);
    setReviewHoverRating(0);
    setReviewComment("");
    setIsReviewPopupOpen(true);
  };

  const closeReviewPopup = () => {
    setIsReviewPopupOpen(false);
    setReviewCourse(null);
    setReviewRating(0);
    setReviewHoverRating(0);
    setReviewComment("");
  };

  const handleStarClick = (rating) => {
    setReviewRating(rating);
  };

  const submitReview = async () => {
    if (!reviewCourse || reviewRating === 0) {
      toast.error("Vui lòng chọn số sao đánh giá");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const reviewData = {
        rating: reviewRating,
        comment: reviewComment.trim(),
      };

      const { response, error } = await courseApi.addCourseReview({
        courseId: reviewCourse._id,
        reviewData,
      });

      if (error) {
        throw new Error(error.message || "Không thể gửi đánh giá");
      }

      toast.success("Đánh giá của bạn đã được gửi thành công!");
      closeReviewPopup();

      // Có thể cập nhật lại danh sách courses nếu cần
      // fetchPurchasedCourses();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error(error.message || "Có lỗi xảy ra khi gửi đánh giá");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Booking review functions
  const openBookingReviewPopup = (booking) => {
    setReviewBooking(booking);
    setBookingReviewRating(0);
    setBookingReviewHoverRating(0);
    setBookingReviewComment("");
    setIsBookingReviewPopupOpen(true);
  };

  const closeBookingReviewPopup = () => {
    setIsBookingReviewPopupOpen(false);
    setReviewBooking(null);
    setBookingReviewRating(0);
    setBookingReviewHoverRating(0);
    setBookingReviewComment("");
  };

  const handleBookingStarClick = (rating) => {
    setBookingReviewRating(rating);
  };

  const submitBookingReview = async () => {
    if (!reviewBooking || bookingReviewRating === 0) {
      toast.error("Vui lòng chọn số sao đánh giá");
      return;
    }

    // Check if booking is past consultation time
    let bookingDateTime;
    try {
      if (reviewBooking.date && reviewBooking.start) {
        const dateStr = new Date(reviewBooking.date)
          .toISOString()
          .split("T")[0];
        bookingDateTime = new Date(`${dateStr}T${reviewBooking.start}:00`);
        if (isNaN(bookingDateTime.getTime())) {
          bookingDateTime = new Date(
            `${reviewBooking.date} ${reviewBooking.start}`
          );
        }
      } else {
        bookingDateTime = new Date(reviewBooking.date);
      }
    } catch (error) {
      bookingDateTime = new Date(reviewBooking.date);
    }

    const isPastConsultation = bookingDateTime < new Date();

    // Consider booking as finished if it's past consultation time
    const isEffectivelyFinished =
      reviewBooking.status === "finished" ||
      (reviewBooking.status === "active" && isPastConsultation);

    if (!isEffectivelyFinished) {
      console.error(
        "REVIEW BLOCKED: Booking is not finished or past consultation time"
      );
      toast.error("Chỉ có thể đánh giá sau khi buổi tư vấn đã kết thúc");
      return;
    }

    setIsSubmittingBookingReview(true);
    try {
      const reviewData = {
        targetType: "Booking",
        target: reviewBooking._id,
        rate: bookingReviewRating,
        content: bookingReviewComment.trim(),
      };

      // Check user token
      const token =
        localStorage.getItem("actkn") || localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      const { response, error } = await reviewApi.createReview(reviewData);

      if (error) {
        console.error("API Error details:", error);

        // Check for duplicate review error patterns
        const errorMessage = error.message || "";
        const errorString = JSON.stringify(error).toLowerCase();

        if (
          errorMessage.includes("duplicate") ||
          errorMessage.includes("already reviewed") ||
          errorMessage.includes("đã đánh giá") ||
          errorMessage.includes("E11000") ||
          errorMessage.includes("already exists") ||
          errorString.includes("duplicate") ||
          errorString.includes("already") ||
          error.status === 409
        ) {
          // Conflict status often used for duplicates
          toast.warning("This consultation has already been reviewed");
          closeBookingReviewPopup();
          return;
        }

        if (error.status === 403) {
          toast.error(
            "Bạn không có quyền đánh giá booking này. Booking có thể chưa hoàn thành hoặc không thuộc về bạn."
          );
        } else if (error.status === 401) {
          toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        } else {
          throw new Error(error.message || "Không thể gửi đánh giá");
        }
        return;
      }

      toast.success("Đánh giá tư vấn của bạn đã được gửi thành công!");
      closeBookingReviewPopup();

      // Optionally refresh bookings to update the UI
      // fetchBookings();
    } catch (error) {
      console.error("Error submitting booking review:", error);

      // Check for specific duplicate error patterns in catch block
      const errorMessage = error.message || "";
      if (
        errorMessage.includes("duplicate") ||
        errorMessage.includes("already reviewed") ||
        errorMessage.includes("đã đánh giá") ||
        errorMessage.includes("E11000") ||
        errorMessage.includes("already exists")
      ) {
        toast.warning("This consultation has already been reviewed");
        closeBookingReviewPopup();
      } else {
        toast.error(errorMessage || "Có lỗi xảy ra khi gửi đánh giá");
      }
    } finally {
      setIsSubmittingBookingReview(false);
    }
  };

  // Mentor rating functions
  const checkMentorReviewPermission = async (mentorId) => {
    try {
      // Check 1: Booking permission
      const { response: bookingResponse } =
        await bookingApi.getMenteeBookings();
      let hasBookingPermission = false;

      if (bookingResponse?.data) {
        const bookingsWithMentor = bookingResponse.data.filter(
          (booking) =>
            (booking.mentor?._id === mentorId ||
              booking.mentor?.id === mentorId) &&
            (booking.status === "active" || booking.status === "finished")
        );
        hasBookingPermission = bookingsWithMentor.length > 0;
      }

      // If has booking permission, return true immediately
      if (hasBookingPermission) {
        return true;
      }

      // Check 2: Course purchase permission
      const { response: courseResponse } =
        await purchasedCourseApi.getPurchasedCourses(null);
      let hasCoursePermission = false;

      // API trả về {data: {courses: [...], ...}} thay vì {data: [...]}
      const purchasedCourses = courseResponse?.data?.courses;

      if (purchasedCourses && Array.isArray(purchasedCourses)) {
        const coursesFromMentor = purchasedCourses.filter((purchasedCourse) => {
          // Handle different data structures:
          // 1. purchasedCourse.course.mentor (nested structure)
          // 2. purchasedCourse.courseID.mentor (courseID field)
          // 3. purchasedCourse.courseInfo.mentor (courseInfo field)
          // 4. purchasedCourse.mentor (direct mentor field)
          const course =
            purchasedCourse.course ||
            purchasedCourse.courseID ||
            purchasedCourse.courseInfo ||
            purchasedCourse;

          // Check various mentor field formats
          const courseHasMentor =
            course?.mentor?._id === mentorId ||
            course?.mentor?.id === mentorId ||
            course?.mentor === mentorId ||
            // Check if courseID has mentor info
            purchasedCourse.courseID?.mentor?._id === mentorId ||
            purchasedCourse.courseID?.mentor?.id === mentorId ||
            purchasedCourse.courseID?.mentor === mentorId ||
            // Check if courseInfo has mentor info
            purchasedCourse.courseInfo?.mentor?._id === mentorId ||
            purchasedCourse.courseInfo?.mentor?.id === mentorId ||
            purchasedCourse.courseInfo?.mentor === mentorId;

          return courseHasMentor;
        });
        hasCoursePermission = coursesFromMentor.length > 0;
      } else {
        // No purchased courses array found
      }

      const finalPermission = hasBookingPermission || hasCoursePermission;

      // Backup check: If no direct permission found, check if this mentor appears in the mentors tab
      // This means mentee has some relationship with this mentor
      if (!finalPermission) {
        const mentorInList = allMentors.some(
          (mentor) =>
            mentor._id === mentorId ||
            mentor.id === mentorId ||
            mentor.userName === mentorId
        );

        if (mentorInList) {
          return true;
        }
      }

      return finalPermission;
    } catch (error) {
      console.error("Error checking mentor review permission:", error);
      return false;
    }
  };

  const openMentorRatingPopup = async (mentor) => {
    // Check if user has permission to review this mentor
    const hasPermission = await checkMentorReviewPermission(mentor._id);

    if (!hasPermission) {
      toast.warning(
        "You can only review mentors after purchasing their course or having an active/completed consultation booking with them."
      );
      return;
    }

    setSelectedMentor(mentor);
    setMentorRating(0);
    setMentorRatingHover(0);
    setMentorRatingComment("");
    setIsMentorRatingPopupOpen(true);
  };

  const closeMentorRatingPopup = () => {
    setIsMentorRatingPopupOpen(false);
    setSelectedMentor(null);
    setMentorRating(0);
    setMentorRatingHover(0);
    setMentorRatingComment("");
  };

  const submitMentorRating = async () => {
    if (!selectedMentor || mentorRating === 0) {
      toast.error("Please select a rating for the mentor");
      return;
    }

    setIsSubmittingMentorRating(true);

    try {
      // Debug: Check if user has permission to review this mentor
      const hasPermission = await checkMentorReviewPermission(
        selectedMentor._id
      );

      const reviewData = {
        targetType: "Mentor",
        target: selectedMentor._id,
        rate: mentorRating,
        content: mentorRatingComment.trim(),
      };

      const { response, error } = await reviewApi.createReview(reviewData);

      if (error) {
        console.error("API Error details:", error);

        // Handle specific error cases
        if (
          error.status === 400 &&
          error.message?.includes("already reviewed")
        ) {
          toast.warning("You have already reviewed this mentor");
        } else if (error.status === 403) {
          toast.error(
            "You can only review mentors after having an active or completed consultation booking with them."
          );
        } else if (error.status === 401) {
          toast.error("Your session has expired. Please log in again.");
        } else {
          throw new Error(error.message || "Unable to submit review");
        }
        return;
      }

      toast.success("Your mentor review has been submitted successfully!");
      closeMentorRatingPopup();

      // Refresh mentor data to update stats
      extractMentorsFromData();
    } catch (error) {
      console.error("Error submitting mentor review:", error);

      // Handle duplicate review error patterns
      const errorMessage = error.message || "";
      if (
        errorMessage.includes("duplicate") ||
        errorMessage.includes("already reviewed") ||
        errorMessage.includes("E11000") ||
        errorMessage.includes("already exists")
      ) {
        toast.warning("You have already reviewed this mentor");
        closeMentorRatingPopup();
      } else {
        toast.error(
          errorMessage || "An error occurred while submitting the review"
        );
      }
    } finally {
      setIsSubmittingMentorRating(false);
    }
  };

  // Course management state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 6;

  // Mentor states - extract mentors from purchased courses and bookings
  const [allMentors, setAllMentors] = useState([]);
  const [mentorsLoading, setMentorsLoading] = useState(false);

  // Review states
  const [allReviews, setAllReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);
  // Các state khác giữ nguyên
  const [mentorSearchTerm, setMentorSearchTerm] = useState("");
  const [mentorFilterBy, setMentorFilterBy] = useState("all");
  const [mentorCurrentPage, setMentorCurrentPage] = useState(1);
  const mentorsPerPage = 6;
  const [selectedChatMentor, setSelectedChatMentor] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [reviewCurrentPage, setReviewCurrentPage] = useState(1);
  const reviewsPerPage = 6;

  // Filter logic for bookings
  const getFilteredBookings = () => {
    let filtered = bookings;

    // Apply filter based on status
    switch (bookingFilterBy) {
      case "pending":
        filtered = filtered.filter((booking) => booking.status === "pending");
        break;
      case "accepted":
        filtered = filtered.filter((booking) => booking.status === "active");
        break;
      case "declined":
        filtered = filtered.filter((booking) => booking.status === "cancelled");
        break;
      case "all":
      default:
        // Show all bookings
        break;
    }

    // Sort by creation time (newest first) to show most recent bookings at the top
    return filtered.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  };

  // Filter and search logic for mentors
  const getFilteredMentors = () => {
    let filtered = allMentors.filter(
      (mentor) =>
        mentor.displayName
          .toLowerCase()
          .includes(mentorSearchTerm.toLowerCase()) ||
        mentor.jobTitle
          .toLowerCase()
          .includes(mentorSearchTerm.toLowerCase()) ||
        mentor.userName.toLowerCase().includes(mentorSearchTerm.toLowerCase())
    );

    switch (mentorFilterBy) {
      case "courses":
        filtered = filtered.filter((mentor) => mentor.hasCoursePurchase);
        break;
      case "bookings":
        filtered = filtered.filter((mentor) => mentor.hasBooking);
        break;
      case "top-rated":
        filtered = filtered.filter((mentor) => mentor.averageRating >= 4.5);
        break;
      case "all":
      default:
        // Show all mentors
        break;
    }

    return filtered.sort((a, b) => b.averageRating - a.averageRating);
  };

  // Pagination logic for mentors
  const filteredMentors = useMemo(() => {
    return getFilteredMentors();
  }, [allMentors, mentorSearchTerm, mentorFilterBy]);

  const totalMentorPages = Math.ceil(filteredMentors.length / mentorsPerPage);
  const mentorStartIndex = (mentorCurrentPage - 1) * mentorsPerPage;
  const currentMentors = filteredMentors.slice(
    mentorStartIndex,
    mentorStartIndex + mentorsPerPage
  );

  const handleMentorPageChange = (page) => {
    setMentorCurrentPage(page);
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
      case "consulting":
        return allReviews.filter((review) => review.type === "consulting");
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

  // Reset reviews when filter changes
  const handleReviewFilterChange = (newFilter) => {
    setReviewFilter(newFilter);
    setReviewCurrentPage(1); // Reset to first page when filter changes
  };

  // Filter and search logic for courses
  const getFilteredCourses = () => {
    const filtered = purchasedCourses.filter(
      (item) =>
        item.courseInfo.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.courseInfo.mentor?.firstName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.courseInfo.mentor?.lastName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        ""
    );

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
  // Hàm lưu profile vào DB khi bấm nút Save Profile
  const handleUpdateProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      // Gom dữ liệu từ formData và avatar
      const payload = { ...formData };
      if (profileImageFile) {
        payload.avatar = profileImageFile;
      }

      const response = await profileApi.updateMenteeProfile(payload);
      if (response && response.data) {
        setProfile(response.data);
        setProfileImageFile(null); // Reset file gốc

        // Cập nhật đầy đủ formData từ response để đảm bảo sync với DB
        const updatedUser = response.data.user;
        const updatedProfile = response.data.profile;
        const updatedLinks = updatedProfile?.links || {};

        setFormData({
          userName: updatedUser?.userName || "",
          firstName: updatedUser?.firstName || "",
          lastName: updatedUser?.lastName || "",
          email: updatedUser?.email || "",
          bio: updatedProfile?.bio || updatedUser?.bio || "",
          description: updatedProfile?.description || "",
          goal: updatedProfile?.goal || "",
          education: updatedProfile?.education || "",
          website: updatedLinks?.website || "",
          twitter: updatedLinks?.twitter || "",
          linkedin: updatedLinks?.linkedin || "",
          facebook: updatedLinks?.facebook || "",
          avatarUrl: updatedUser?.avatarUrl || "",
          location: updatedUser?.location || updatedProfile?.location || "",
          role: updatedUser?.role || "",
        });

        // Cập nhật sidebar data (chỉ khi save thành công)
        setSidebarData({
          firstName: updatedUser?.firstName || "",
          lastName: updatedUser?.lastName || "",
          avatarUrl: updatedUser?.avatarUrl || "",
        });

        // Cập nhật avatar hiển thị từ response
        if (updatedUser && updatedUser.avatarUrl) {
          setProfileImage(updatedUser.avatarUrl);
        } else {
          setProfileImage(null);
        }

        toast.success("Cập nhật profile thành công!", {
          position: "top-right",
          autoClose: 3000,
        });

        // Cuộn lên đầu trang sau khi save thành công
        window.scrollTo({ top: 0, behavior: "smooth" });
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
  return (
    <>
      <div className="min-h-screen bg-white-100">
        {/* Main Layout Container */}
        <div className="flex max-w-7xl mx-auto pt-10 gap-8 px-8 min-h-screen">
          {/* Sidebar - Fixed width and height */}
          <div
            style={{ width: 280, minWidth: 280 }}
            className="bg-slate-50 rounded-2xl shadow-sm p-8 flex flex-col items-center sticky top-10 self-start"
          >
            <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center mb-4 relative overflow-hidden">
              {sidebarData.avatarUrl ? (
                <img
                  src={sidebarData.avatarUrl}
                  alt={sidebarData.firstName || "Avatar"}
                  className="absolute inset-0 w-full h-full object-cover rounded-full"
                />
              ) : (
                <FaUserCircle className="w-24 h-24 text-gray-300" />
              )}
            </div>
            <h2 className="font-semibold text-xl text-gray-900 mb-3">
              {sidebarData.firstName || sidebarData.lastName
                ? `${sidebarData.firstName} ${sidebarData.lastName}`.trim()
                : "Mentee"}
            </h2>
            <button className="bg-blue-600 text-white border-none rounded-lg px-6 py-1.5 mb-6 font-medium text-base">
              Mentee
            </button>
            <nav className="w-full">
              <ul className="flex flex-col gap-2">
                <li
                  className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                    activeTab === "profile"
                      ? "bg-gray-200 hover:bg-gray-300 hover:shadow-sm"
                      : "hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm hover:scale-105"
                  }`}
                  onClick={() => {
                    setActiveTab("profile");
                    setTimeout(() => {
                      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
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
                      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
                    }, 100);
                  }}
                >
                  My Courses
                </li>
                <li
                  className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                    activeTab === "mybookings"
                      ? "bg-gray-200 hover:bg-gray-300 hover:shadow-sm"
                      : "hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm hover:scale-105"
                  }`}
                  onClick={() => {
                    setActiveTab("mybookings");
                    setTimeout(() => {
                      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
                    }, 100);
                  }}
                >
                  My Bookings
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
                      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
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
                    setSelectedChatMentor(null);
                    setChatMessages([]);
                    setTimeout(() => {
                      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
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
                      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
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
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        name="userName"
                        value={formData.userName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
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
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      rows={3}
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      rows={2}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Goal
                    </label>
                    <input
                      type="text"
                      name="goal"
                      value={formData.goal}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Education
                    </label>
                    <input
                      type="text"
                      name="education"
                      value={formData.education}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Image Upload Section - mentor style */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Profile Image
                  </h3>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center mb-4 bg-gray-50 cursor-pointer flex items-center justify-center"
                    onClick={() =>
                      document.getElementById("imageUpload").click()
                    }
                    style={{ minHeight: 120 }}
                    title="Click to upload/change avatar"
                  >
                    {profileImage || formData.avatarUrl ? (
                      <img
                        src={profileImage || formData.avatarUrl}
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

                {/* Links Section - mentor style */}
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
                      <button
                        onClick={() => {
                          setSearchTerm("");
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
                      currentCourses.map((item) => {
                        const course = item.courseInfo;
                        const mentor = course.mentor;
                        return (
                          <div
                            key={item.courseId}
                            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white"
                          >
                            {/* Course Image */}
                            <div className="relative">
                              <img
                                src={
                                  course.thumbnail ||
                                  course.imageUrl ||
                                  course.image ||
                                  "https://via.placeholder.com/300x200/f3f4f6/9ca3af?text=Course+Image"
                                }
                                alt={course.title}
                                className="w-full h-48 object-cover"
                                onError={(e) => {
                                  e.target.src =
                                    "https://via.placeholder.com/300x200/f3f4f6/9ca3af?text=Course+Image";
                                }}
                              />
                            </div>

                            <div className="p-4">
                              {/* Course Title */}
                              <h4 className="font-semibold text-gray-900 mb-2 text-lg line-clamp-2">
                                {course.title}
                              </h4>

                              {/* Mentor Info */}
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                  {mentor?.avatarUrl ? (
                                    <img
                                      src={mentor.avatarUrl}
                                      alt={`${mentor.firstName} ${mentor.lastName}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.src =
                                          "https://via.placeholder.com/32x32/e5e7eb/9ca3af?text=" +
                                          (mentor.firstName?.charAt(0) ||
                                            mentor.lastName?.charAt(0) ||
                                            "M");
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-medium">
                                      {mentor?.firstName?.charAt(0) ||
                                        mentor?.lastName?.charAt(0) ||
                                        "M"}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-800">
                                    {mentor?.firstName} {mentor?.lastName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Instructor
                                  </p>
                                </div>
                              </div>

                              {/* Rating */}
                              <div className="flex items-center gap-2 mb-3">
                                <div className="flex text-yellow-400 text-sm">
                                  {[...Array(5)].map((_, i) => (
                                    <span key={i}>
                                      {i < Math.floor(course.rate || 0)
                                        ? "★"
                                        : i < (course.rate || 0)
                                        ? "☆"
                                        : "☆"}
                                    </span>
                                  ))}
                                </div>
                                <span className="text-sm text-gray-600">
                                  {(course.rate || 0).toFixed(1)} (
                                  {course.reviews || 0} reviews)
                                </span>
                              </div>

                              {/* Course Stats */}
                              <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  🕒 {course.duration || "N/A"}
                                </span>
                                <span className="flex items-center gap-1">
                                  📚 {course.lectures || 0} lectures
                                </span>
                              </div>

                              {/* Category */}
                              <div className="mb-4">
                                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                  {course.category || "General"}
                                </span>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    // Navigate directly to course using courseId
                                    navigate(
                                      `/order-complete-course/${course._id}`,
                                      {
                                        state: {
                                          courseId: course._id,
                                          courseInfo: course,
                                        },
                                      }
                                    );
                                  }}
                                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                                >
                                  View Course
                                </button>
                                <button
                                  onClick={() => openReviewPopup(course)}
                                  className="px-4 py-2 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition text-sm font-medium"
                                  title="Rate this course"
                                >
                                  ⭐ Rate
                                </button>
                              </div>

                              {/* Purchase Date */}
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-xs text-gray-500">
                                  Purchased on{" "}
                                  {new Date(
                                    item.purchaseDate
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <div className="text-6xl mb-4">📚</div>
                        <p className="text-gray-500 text-lg mb-2">
                          No courses found
                        </p>
                        <p className="text-gray-400">
                          {searchTerm
                            ? "Try adjusting your search criteria"
                            : "You haven't purchased any courses yet"}
                        </p>
                        {!searchTerm && (
                          <button
                            onClick={() => navigate("/all-courses")}
                            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                          >
                            Browse Courses
                          </button>
                        )}
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

            {activeTab === "mybookings" && (
              <div className="space-y-6">
                {/* My Booking Sessions Section */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 p-3 rounded-xl">
                        <VscEditSession className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          My Sessions
                        </h2>
                        <p className="text-gray-600">
                          Manage your booked mentoring sessions
                        </p>
                      </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="flex gap-3">
                      <div className="bg-white rounded-xl px-4 py-3 border border-gray-200 text-center min-w-[80px]">
                        <div className="text-2xl font-bold text-orange-600">
                          {
                            bookings.filter((b) => b.status === "pending")
                              .length
                          }
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          Pending
                        </div>
                      </div>
                      <div className="bg-white rounded-xl px-4 py-3 border border-gray-200 text-center min-w-[80px]">
                        <div className="text-2xl font-bold text-blue-600">
                          {bookings.length}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          Total
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setBookingFilterBy("all")}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          bookingFilterBy === "all"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        All ({bookings.length})
                      </button>
                      <button
                        onClick={() => setBookingFilterBy("pending")}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          bookingFilterBy === "pending"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Pending (
                        {bookings.filter((b) => b.status === "pending").length})
                      </button>
                      <button
                        onClick={() => setBookingFilterBy("accepted")}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          bookingFilterBy === "accepted"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Accepted (
                        {bookings.filter((b) => b.status === "active").length})
                      </button>
                      <button
                        onClick={() => setBookingFilterBy("declined")}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          bookingFilterBy === "declined"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Declined (
                        {
                          bookings.filter((b) => b.status === "cancelled")
                            .length
                        }
                        )
                      </button>
                    </div>

                    <button
                      onClick={fetchBookings}
                      disabled={bookingsLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                      {bookingsLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Loading...
                        </>
                      ) : (
                        <>
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
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          Refresh
                        </>
                      )}
                    </button>
                  </div>

                  {/* Loading State */}
                  {bookingsLoading && (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">
                        Loading your sessions...
                      </span>
                    </div>
                  )}

                  {/* Error State */}
                  {bookingsError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center">
                        <svg
                          className="w-5 h-5 text-red-600 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-red-700 font-medium">
                          Unable to load sessions
                        </span>
                      </div>
                      <p className="text-red-600 mt-1">{bookingsError}</p>
                      <button
                        onClick={fetchBookings}
                        className="mt-2 text-red-600 hover:text-red-800 underline text-sm"
                      >
                        Try again
                      </button>
                    </div>
                  )}

                  {/* Empty State - No bookings at all */}
                  {!bookingsLoading &&
                    !bookingsError &&
                    bookings.length === 0 && (
                      <div className="text-center py-12">
                        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                          <BsCalendarDate className="w-8 h-8 text-gray-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No sessions yet
                        </h3>
                        <p className="text-gray-600 mb-4">
                          You haven't booked any mentoring sessions. Find a
                          mentor to get started!
                        </p>
                        <button
                          onClick={() => setActiveTab("mentors")}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                        >
                          Find Mentors
                        </button>
                      </div>
                    )}

                  {/* Empty State - No results after filtering */}
                  {!bookingsLoading &&
                    !bookingsError &&
                    bookings.length > 0 &&
                    getFilteredBookings().length === 0 && (
                      <div className="text-center py-12">
                        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                          <BsCalendarDate className="w-8 h-8 text-gray-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No sessions found
                        </h3>
                        <p className="text-gray-600 mb-4">
                          No sessions match the selected filter. Try changing
                          the filter.
                        </p>
                        <button
                          onClick={() => setBookingFilterBy("all")}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                        >
                          View All Sessions
                        </button>
                      </div>
                    )}

                  {/* Info Box */}
                  {!bookingsLoading &&
                    !bookingsError &&
                    bookings.length === 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <svg
                              className="w-5 h-5 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-blue-800 mb-2">
                              How sessions work:
                            </h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                              <li>
                                • Browse mentors and book available time slots
                              </li>
                              <li>
                                • You will receive notifications for new session
                                confirmations
                              </li>
                              <li>
                                • Join or cancel sessions based on your schedule
                              </li>
                              <li>
                                • Confirmed sessions will be added to your
                                calendar
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Session Cards */}
                  {!bookingsLoading &&
                    !bookingsError &&
                    getFilteredBookings().length > 0 && (
                      <div className="space-y-4">
                        {getFilteredBookings().map((booking) => {
                          const bookingDate = new Date(booking.date);
                          const isUpcoming = bookingDate > new Date();

                          // Status styling
                          const getStatusStyle = (status) => {
                            const styles = {
                              pending: {
                                bg: "bg-orange-50",
                                text: "text-orange-700",
                                border: "border-orange-200",
                                label: "PENDING",
                                badge: "bg-orange-100 text-orange-700",
                              },
                              active: {
                                bg: "bg-green-50",
                                text: "text-green-700",
                                border: "border-green-200",
                                label: "ACCEPTED",
                                badge: "bg-green-100 text-green-700",
                              },
                              finished: {
                                bg: "bg-blue-50",
                                text: "text-blue-700",
                                border: "border-blue-200",
                                label: "COMPLETED",
                                badge: "bg-blue-100 text-blue-700",
                              },
                              cancelled: {
                                bg: "bg-red-50",
                                text: "text-red-700",
                                border: "border-red-200",
                                label: "DECLINED",
                                badge: "bg-red-100 text-red-700",
                              },
                              rejected: {
                                bg: "bg-gray-50",
                                text: "text-gray-700",
                                border: "border-gray-200",
                                label: "DECLINED",
                                badge: "bg-gray-100 text-gray-700",
                              },
                            };
                            return styles[status] || styles.pending;
                          };

                          const statusStyle = getStatusStyle(booking.status);

                          return (
                            <div
                              key={booking._id}
                              className={`${statusStyle.bg} ${statusStyle.border} border-2 rounded-2xl p-6 relative`}
                            >
                              {/* Top Right Section - Date and Status */}
                              <div className="absolute top-4 right-4 flex items-center gap-4">
                                <div className="text-sm text-gray-500 font-medium">
                                  {bookingDate.toLocaleDateString("en-US", {
                                    month: "numeric",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </div>
                                <span
                                  className={`${statusStyle.badge} px-3 py-1 rounded-lg text-xs font-bold`}
                                >
                                  {statusStyle.label}
                                </span>
                              </div>

                              {/* Mentor Info */}
                              <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <div className="flex-shrink-0">
                                  {booking.mentor?.avatarUrl ? (
                                    <img
                                      src={booking.mentor.avatarUrl}
                                      alt={`${booking.mentor.firstName} ${booking.mentor.lastName}`}
                                      className="w-14 h-14 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-lg">
                                      {booking.mentor?.firstName?.[0]}
                                      {booking.mentor?.lastName?.[0]}
                                    </div>
                                  )}
                                </div>

                                {/* Details */}
                                <div className="flex-1">
                                  <h3 className="font-bold text-xl text-gray-900 mb-1">
                                    {booking.mentor?.firstName}{" "}
                                    {booking.mentor?.lastName}
                                  </h3>
                                  {booking.mentor?.email && (
                                    <p className="text-gray-600 text-sm mb-4">
                                      {booking.mentor.email}
                                    </p>
                                  )}

                                  {/* Date, Time and Review Button */}
                                  <div className="grid grid-cols-3 gap-6">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <BsCalendarDate className="w-5 h-5 text-blue-600" />
                                        <span className="text-blue-600 font-semibold text-sm">
                                          Date
                                        </span>
                                      </div>
                                      <p className="font-bold text-gray-900">
                                        {bookingDate.toLocaleDateString(
                                          "en-US",
                                          {
                                            weekday: "long",
                                            month: "long",
                                            day: "numeric",
                                            year: "numeric",
                                          }
                                        )}
                                      </p>
                                    </div>

                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <svg
                                          className="w-5 h-5 text-pink-600"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                          />
                                        </svg>
                                        <span className="text-pink-600 font-semibold text-sm">
                                          Time
                                        </span>
                                      </div>
                                      <p className="font-bold text-gray-900">
                                        {booking.start}
                                      </p>
                                    </div>

                                    {/* Review Button Column */}
                                    <div>
                                      {(() => {
                                        // Better date/time parsing
                                        let bookingDateTime;
                                        try {
                                          // Handle different date/time formats
                                          if (booking.date && booking.start) {
                                            // Try combining date and time
                                            const dateStr = new Date(
                                              booking.date
                                            )
                                              .toISOString()
                                              .split("T")[0];
                                            const timeStr = booking.start;
                                            bookingDateTime = new Date(
                                              `${dateStr}T${timeStr}:00`
                                            );

                                            // If invalid, try alternative parsing
                                            if (
                                              isNaN(bookingDateTime.getTime())
                                            ) {
                                              bookingDateTime = new Date(
                                                `${booking.date} ${booking.start}`
                                              );
                                            }
                                          } else {
                                            bookingDateTime = new Date(
                                              booking.date
                                            );
                                          }
                                        } catch (error) {
                                          console.error(
                                            "Error parsing booking date/time:",
                                            error
                                          );
                                          bookingDateTime = new Date(
                                            booking.date
                                          );
                                        }

                                        const isPastConsultation =
                                          bookingDateTime < new Date();

                                        // If booking is past consultation time, consider it finished
                                        const isFinished =
                                          booking.status === "finished" ||
                                          (booking.status === "active" &&
                                            isPastConsultation);

                                        // Only show review button for finished bookings
                                        const canReview = isFinished;

                                        return (
                                          <>
                                            {/* Show review button for finished or past active/accepted bookings */}
                                            {canReview && (
                                              <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                  <svg
                                                    className="w-5 h-5 text-orange-600"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                  >
                                                    <path
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      strokeWidth={2}
                                                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                                    />
                                                  </svg>
                                                  <span className="text-orange-600 font-semibold text-sm">
                                                    Review
                                                  </span>
                                                </div>
                                                <button
                                                  onClick={() =>
                                                    openBookingReviewPopup(
                                                      booking
                                                    )
                                                  }
                                                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 px-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm"
                                                  title="Rate this consultation session"
                                                >
                                                  <span className="text-base">
                                                    ⭐
                                                  </span>
                                                  <span>Rate</span>
                                                </button>
                                              </div>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </div>

                                  {/* Notes */}
                                  {booking.notes && (
                                    <div className="mt-4 p-3 bg-white/70 rounded-lg border border-gray-200">
                                      <p className="text-sm text-gray-700">
                                        {booking.notes}
                                      </p>
                                    </div>
                                  )}

                                  {/* Decline Reason - chỉ hiển thị cho booking bị declined */}
                                  {booking.status === "cancelled" &&
                                    booking.declineReason && (
                                      <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                                        <div className="flex items-center gap-2 mb-1">
                                          <svg
                                            className="w-4 h-4 text-red-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z"
                                            />
                                          </svg>
                                          <span className="text-red-700 font-semibold text-sm">
                                            Decline Reason
                                          </span>
                                        </div>
                                        <p className="text-sm text-red-700">
                                          {booking.declineReason}
                                        </p>
                                      </div>
                                    )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
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
                        placeholder="Search mentors by name or expertise"
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
                        <option value="all">All mentors</option>
                        <option value="courses">Purchased Course</option>
                        <option value="bookings">Booked Consultation</option>
                        <option value="top-rated">Top Rated (4.5+)</option>
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
                      minHeight: "400px",
                    }}
                  >
                    {mentorsLoading ? (
                      <div className="col-span-full text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                          <p className="text-gray-500">Loading mentors...</p>
                        </div>
                      </div>
                    ) : currentMentors.length > 0 ? (
                      currentMentors.map((mentor) => (
                        <div
                          key={mentor._id}
                          className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white"
                        >
                          {/* Mentor Header */}
                          <div className="flex items-start gap-4 mb-4">
                            <div className="relative">
                              <img
                                src={mentor.avatarUrl || minatoImg}
                                alt={mentor.displayName}
                                className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 mb-1 truncate">
                                {mentor.displayName}
                              </h4>
                              <p className="text-sm text-blue-600 font-medium mb-1">
                                {mentor.jobTitle}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  {renderStars(mentor.averageRating || 0)}
                                  <span className="font-semibold ml-1">
                                    {mentor.averageRating
                                      ? mentor.averageRating.toFixed(1)
                                      : "0.0"}
                                  </span>
                                </div>
                                <span>•</span>
                                <span>{mentor.studentCount} students</span>
                              </div>
                            </div>
                          </div>

                          {/* Relationship badges */}
                          <div className="flex gap-2 mb-4">
                            {mentor.hasCoursePurchase && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                📚 Purchased Course
                              </span>
                            )}
                            {mentor.hasBooking && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                📅 Booked Consultation
                              </span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <button
                              onClick={() => navigate(`/mentor/${mentor._id}`)}
                              className="bg-gray-900 text-white py-2 px-3 rounded-lg hover:bg-gray-800 transition text-sm font-medium"
                            >
                              View Profile
                            </button>
                            <button
                              onClick={() => openMentorRatingPopup(mentor)}
                              className="bg-yellow-600 text-white py-2 px-3 rounded-lg hover:bg-yellow-700 transition text-sm font-medium"
                            >
                              ⭐ Rate Mentor
                            </button>
                          </div>
                          <div className="grid grid-cols-1">
                            <button
                              onClick={() => {
                                // Navigate to message or open message modal
                                toast.info(
                                  "Messaging feature is under development"
                                );
                              }}
                              className="bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                            >
                              💬 Send Message
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
                              You haven't purchased any courses or booked
                              consultations with mentors yet
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

                      {/* Messages List - Hiện tại bỏ trống, không render gì khi chưa có API */}
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
                {/* Loading State */}
                {reviewsLoading && (
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">
                        Đang tải đánh giá...
                      </span>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {reviewsError && !reviewsLoading && (
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <svg
                          className="w-8 h-8 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Unable to load reviews
                      </h3>
                      <p className="text-gray-600 mb-4">{reviewsError}</p>
                      <button
                        onClick={fetchMenteeReviews}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                )}

                {/* My Reviews Section */}
                {!reviewsLoading && !reviewsError && (
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    {/* Header */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        My Reviews ({allReviews.length})
                      </h3>
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
                        All ({allReviews.length})
                      </button>
                      <button
                        onClick={() => handleReviewFilterChange("course")}
                        className={`px-4 py-2 rounded-md transition text-sm font-medium ${
                          reviewFilter === "course"
                            ? "bg-white shadow-sm text-gray-900"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Courses (
                        {allReviews.filter((r) => r.type === "course").length})
                      </button>
                      <button
                        onClick={() => handleReviewFilterChange("consulting")}
                        className={`px-4 py-2 rounded-md transition text-sm font-medium ${
                          reviewFilter === "consulting"
                            ? "bg-white shadow-sm text-gray-900"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Consulting (
                        {
                          allReviews.filter((r) => r.type === "consulting")
                            .length
                        }
                        )
                      </button>
                      <button
                        onClick={() => handleReviewFilterChange("mentor")}
                        className={`px-4 py-2 rounded-md transition text-sm font-medium ${
                          reviewFilter === "mentor"
                            ? "bg-white shadow-sm text-gray-900"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Mentor (
                        {allReviews.filter((r) => r.type === "mentor").length})
                      </button>
                    </div>
                    {/* Reviews List */}
                    <div className="space-y-6">
                      {currentPageReviews.length > 0 ? (
                        currentPageReviews.map((review) => (
                          <div
                            key={review.id}
                            className="border border-gray-200 rounded-lg p-6"
                          >
                            <div className="flex items-start gap-4">
                              {/* Avatar/Image */}
                              <img
                                src={review.targetImage}
                                alt={review.targetTitle}
                                className={`w-16 h-16 object-cover ${
                                  review.type === "course"
                                    ? "rounded-lg"
                                    : "rounded-full"
                                }`}
                              />

                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    {/* Title based on review type */}
                                    <h4 className="font-semibold text-gray-900 mb-1">
                                      {review.type === "course"
                                        ? review.targetTitle
                                        : review.targetTitle}
                                    </h4>

                                    {/* Course mentor information */}
                                    {review.type === "course" &&
                                      review.instructor && (
                                        <div className="text-sm text-gray-600 mb-2 bg-blue-50 px-2 py-1 rounded">
                                          <div className="flex items-center gap-1">
                                            <svg
                                              className="w-4 h-4 text-blue-600"
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
                                            <span className="font-medium text-blue-800">
                                              Instructor:{" "}
                                            </span>
                                            <span className="text-blue-700">
                                              {review.instructor}
                                            </span>
                                          </div>
                                        </div>
                                      )}

                                    {/* Consultation details for consulting reviews */}
                                    {review.type === "consulting" &&
                                      (review.consultationDate ||
                                        review.consultationTime) && (
                                        <div className="text-sm text-gray-600 mb-2 bg-purple-50 px-2 py-1 rounded">
                                          <div className="flex items-center gap-1">
                                            <svg
                                              className="w-4 h-4 text-purple-600"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                              />
                                            </svg>
                                            <span className="font-medium text-purple-800">
                                              Consultation Date:{" "}
                                            </span>
                                            {review.consultationDate && (
                                              <span className="text-purple-700">
                                                {review.consultationDate}
                                              </span>
                                            )}
                                            {review.consultationTime && (
                                              <span className="text-purple-700 ml-1">
                                                ({review.consultationTime})
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                    {/* Rating and Date */}
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

                                  {/* Type Badge */}
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      review.type === "course"
                                        ? "bg-blue-100 text-blue-800"
                                        : review.type === "consulting"
                                        ? "bg-purple-100 text-purple-800"
                                        : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {review.type === "course"
                                      ? "Course"
                                      : review.type === "consulting"
                                      ? "Consultation"
                                      : "Mentor"}
                                  </span>
                                </div>

                                {/* Comment */}
                                {review.comment && (
                                  <p className="text-gray-700 mb-4 leading-relaxed">
                                    {review.comment}
                                  </p>
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
                            {reviewFilter === "all"
                              ? "No reviews yet"
                              : `No ${
                                  reviewFilter === "course"
                                    ? "course"
                                    : reviewFilter === "consulting"
                                    ? "consultation"
                                    : "mentor"
                                } reviews yet`}
                          </h3>
                          <p className="text-gray-600">
                            {reviewFilter === "all"
                              ? "Start learning and leave your first review!"
                              : `You haven't written any ${
                                  reviewFilter === "course"
                                    ? "course"
                                    : reviewFilter === "consulting"
                                    ? "consultation"
                                    : "mentor"
                                } reviews yet.`}
                          </p>
                        </div>
                      )}
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
                          Previous
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
                          Next
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
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Popup */}
      {isReviewPopupOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmittingReview) {
              closeReviewPopup();
            }
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all animate-in slide-in-from-bottom-8 zoom-in-95 duration-500 ease-out"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: "modalAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 animate-in slide-in-from-top-4 duration-300 delay-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Rate Course</h3>
                <button
                  onClick={closeReviewPopup}
                  disabled={isSubmittingReview}
                  className="text-gray-400 hover:text-gray-600 transition-all duration-200 p-1 hover:bg-gray-100 rounded-full hover:scale-110"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6 animate-in slide-in-from-bottom-4 duration-400 delay-200">
              {/* Course Info */}
              {reviewCourse && (
                <div className="flex items-start gap-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 transform transition-all duration-300 hover:shadow-md">
                  <img
                    src={
                      reviewCourse.thumbnail ||
                      reviewCourse.imageUrl ||
                      "https://via.placeholder.com/60x40"
                    }
                    alt={reviewCourse.title}
                    className="w-16 h-12 object-cover rounded-lg shadow-sm"
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/60x40/f3f4f6/6b7280?text=Course";
                    }}
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1 leading-tight">
                      {reviewCourse.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      By {reviewCourse.mentor?.firstName || "Unknown"}{" "}
                      {reviewCourse.mentor?.lastName || "Instructor"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        {reviewCourse.category || "General"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Star Rating */}
              <div className="mb-6 animate-in slide-in-from-bottom-4 duration-400 delay-300">
                <label className="block text-sm font-medium text-gray-700 mb-3 transform transition-all duration-300">
                  Your Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleStarClick(star)}
                      onMouseEnter={() => setReviewHoverRating(star)}
                      onMouseLeave={() => setReviewHoverRating(0)}
                      disabled={isSubmittingReview}
                      className={`text-3xl transition-all duration-300 transform hover:scale-125 active:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 rounded ${
                        star <= (reviewHoverRating || reviewRating)
                          ? "text-yellow-400 hover:text-yellow-500"
                          : "text-gray-300 hover:text-yellow-300"
                      } ${
                        isSubmittingReview
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer hover:drop-shadow-lg hover:rotate-12"
                      }`}
                      style={{
                        filter:
                          star <= (reviewHoverRating || reviewRating)
                            ? "drop-shadow(0 2px 4px rgba(251, 191, 36, 0.3))"
                            : "none",
                        animationDelay: `${star * 100}ms`,
                      }}
                    >
                      ★
                    </button>
                  ))}
                  <div className="ml-4 text-sm animate-in fade-in duration-300 delay-500">
                    {reviewHoverRating > 0 ? (
                      <span className="text-yellow-500 font-medium">
                        {reviewHoverRating} star
                        {reviewHoverRating > 1 ? "s" : ""}
                      </span>
                    ) : reviewRating > 0 ? (
                      <span className="text-yellow-600 font-medium">
                        {reviewRating} star{reviewRating > 1 ? "s" : ""}{" "}
                        selected
                      </span>
                    ) : (
                      <span className="text-gray-500">Click stars to rate</span>
                    )}
                  </div>
                </div>
                {reviewRating > 0 && (
                  <div className="mt-2 text-xs text-gray-600 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-600">
                    {reviewRating === 1 && "😞 Poor"}
                    {reviewRating === 2 && "😐 Fair"}
                    {reviewRating === 3 && "🙂 Good"}
                    {reviewRating === 4 && "😊 Very Good"}
                    {reviewRating === 5 && "🤩 Excellent"}
                  </div>
                )}
              </div>

              {/* Comment */}
              <div className="mb-6 animate-in slide-in-from-bottom-4 duration-400 delay-400">
                <label
                  htmlFor="review-comment"
                  className="block text-sm font-medium text-gray-700 mb-2 transform transition-all duration-300"
                >
                  Your Review (Optional)
                </label>
                <div className="relative">
                  <textarea
                    id="review-comment"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    disabled={isSubmittingReview}
                    placeholder="Share your experience with this course... What did you like most? What could be improved?"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-300 disabled:bg-gray-50 disabled:cursor-not-allowed hover:border-blue-300 focus:scale-[1.02] focus:shadow-lg"
                    rows={4}
                    maxLength={500}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400 animate-in fade-in duration-300 delay-700">
                    {reviewComment.length}/500
                  </div>
                </div>
                {reviewComment.length > 450 && (
                  <div className="text-xs text-orange-500 mt-1">
                    You're approaching the character limit
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl animate-in slide-in-from-bottom-4 duration-400 delay-500">
              <div className="flex gap-3">
                <button
                  onClick={closeReviewPopup}
                  disabled={isSubmittingReview}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium hover:scale-105 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReview}
                  disabled={isSubmittingReview || reviewRating === 0}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 hover:scale-105 active:scale-95"
                >
                  {isSubmittingReview ? (
                    <>
                      <svg
                        className="animate-spin w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
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
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      Submit Review
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Review Popup */}
      {isBookingReviewPopupOpen && (
        <div
          className="fixed inset-0 booking-review-backdrop backdrop-fade-in z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmittingBookingReview) {
              closeBookingReviewPopup();
            }
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all animate-in slide-in-from-bottom-8 zoom-in-95 duration-500 ease-out"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: "modalAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 animate-in slide-in-from-top-4 duration-300 delay-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  Rate Consultation
                </h3>
                <button
                  onClick={closeBookingReviewPopup}
                  disabled={isSubmittingBookingReview}
                  className="text-gray-400 hover:text-gray-600 transition-all duration-200 p-1 hover:bg-gray-100 rounded-full hover:scale-110"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6 animate-in slide-in-from-bottom-4 duration-400 delay-200">
              {/* Booking Info */}
              {reviewBooking && (
                <div className="flex items-start gap-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 transform transition-all duration-300 hover:shadow-md">
                  <div className="flex-shrink-0">
                    {reviewBooking.mentor?.avatarUrl ? (
                      <img
                        src={reviewBooking.mentor.avatarUrl}
                        alt={`${reviewBooking.mentor.firstName} ${reviewBooking.mentor.lastName}`}
                        className="w-16 h-16 rounded-full object-cover shadow-sm"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-lg">
                        {reviewBooking.mentor?.firstName?.[0]}
                        {reviewBooking.mentor?.lastName?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1 leading-tight">
                      Consultation with{" "}
                      {reviewBooking.mentor?.firstName || "Unknown"}{" "}
                      {reviewBooking.mentor?.lastName || "Mentor"}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {new Date(reviewBooking.date).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}{" "}
                      at {reviewBooking.start}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        Consultation Session
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Star Rating */}
              <div className="mb-6 animate-in slide-in-from-bottom-4 duration-400 delay-300">
                <label className="block text-sm font-medium text-gray-700 mb-3 transform transition-all duration-300">
                  Your Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleBookingStarClick(star)}
                      onMouseEnter={() => setBookingReviewHoverRating(star)}
                      onMouseLeave={() => setBookingReviewHoverRating(0)}
                      disabled={isSubmittingBookingReview}
                      className={`text-3xl transition-all duration-300 transform hover:scale-125 active:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 rounded ${
                        star <=
                        (bookingReviewHoverRating || bookingReviewRating)
                          ? "text-yellow-400 hover:text-yellow-500"
                          : "text-gray-300 hover:text-yellow-300"
                      } ${
                        isSubmittingBookingReview
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer hover:drop-shadow-lg hover:rotate-12"
                      }`}
                      style={{
                        filter:
                          star <=
                          (bookingReviewHoverRating || bookingReviewRating)
                            ? "drop-shadow(0 2px 4px rgba(251, 191, 36, 0.3))"
                            : "none",
                        animationDelay: `${star * 100}ms`,
                      }}
                    >
                      ★
                    </button>
                  ))}
                  <div className="ml-4 text-sm animate-in fade-in duration-300 delay-500">
                    {bookingReviewHoverRating > 0 ? (
                      <span className="text-yellow-500 font-medium">
                        {bookingReviewHoverRating} star
                        {bookingReviewHoverRating > 1 ? "s" : ""}
                      </span>
                    ) : bookingReviewRating > 0 ? (
                      <span className="text-yellow-600 font-medium">
                        {bookingReviewRating} star
                        {bookingReviewRating > 1 ? "s" : ""} selected
                      </span>
                    ) : (
                      <span className="text-gray-500">Click stars to rate</span>
                    )}
                  </div>
                </div>
                {bookingReviewRating > 0 && (
                  <div className="mt-2 text-xs text-gray-600 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-600">
                    {bookingReviewRating === 1 && "😞 Poor"}
                    {bookingReviewRating === 2 && "😐 Fair"}
                    {bookingReviewRating === 3 && "🙂 Good"}
                    {bookingReviewRating === 4 && "😊 Very Good"}
                    {bookingReviewRating === 5 && "🤩 Excellent"}
                  </div>
                )}
              </div>

              {/* Comment */}
              <div className="mb-6 animate-in slide-in-from-bottom-4 duration-400 delay-400">
                <label
                  htmlFor="booking-review-comment"
                  className="block text-sm font-medium text-gray-700 mb-2 transform transition-all duration-300"
                >
                  Your Review (Optional)
                </label>
                <div className="relative">
                  <textarea
                    id="booking-review-comment"
                    value={bookingReviewComment}
                    onChange={(e) => setBookingReviewComment(e.target.value)}
                    disabled={isSubmittingBookingReview}
                    placeholder="Share your experience with this consultation... How was the mentor's guidance? What did you learn?"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-300 disabled:bg-gray-50 disabled:cursor-not-allowed hover:border-blue-300 focus:scale-[1.02] focus:shadow-lg"
                    rows={4}
                    maxLength={500}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400 animate-in fade-in duration-300 delay-700">
                    {bookingReviewComment.length}/500
                  </div>
                </div>
                {bookingReviewComment.length > 450 && (
                  <div className="text-xs text-orange-500 mt-1">
                    You're approaching the character limit
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl animate-in slide-in-from-bottom-4 duration-400 delay-500">
              <div className="flex gap-3">
                <button
                  onClick={closeBookingReviewPopup}
                  disabled={isSubmittingBookingReview}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium hover:scale-105 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={submitBookingReview}
                  disabled={
                    isSubmittingBookingReview || bookingReviewRating === 0
                  }
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 hover:scale-105 active:scale-95"
                >
                  {isSubmittingBookingReview ? (
                    <>
                      <svg
                        className="animate-spin w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
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
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      Submit Review
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mentor Rating Popup */}
      {isMentorRatingPopupOpen && (
        <div
          className="fixed inset-0 mentor-rating-backdrop backdrop-fade-in z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmittingMentorRating) {
              closeMentorRatingPopup();
            }
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all animate-in slide-in-from-bottom-8 zoom-in-95 duration-500 ease-out"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: "modalAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 animate-in slide-in-from-top-4 duration-300 delay-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Rate Mentor</h3>
                <button
                  onClick={closeMentorRatingPopup}
                  disabled={isSubmittingMentorRating}
                  className="text-gray-400 hover:text-gray-600 transition-all duration-200 p-1 hover:bg-gray-100 rounded-full hover:scale-110"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              {selectedMentor && (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={selectedMentor.avatarUrl || minatoImg}
                    alt={selectedMentor.displayName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedMentor.displayName}
                    </p>
                    <p className="text-sm text-blue-600">
                      {selectedMentor.jobTitle}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="px-6 py-6 animate-in fade-in duration-300 delay-200">
              {/* Star Rating */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  How would you rate this mentor?
                </label>
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setMentorRating(star)}
                      onMouseEnter={() => setMentorRatingHover(star)}
                      onMouseLeave={() => setMentorRatingHover(0)}
                      className="text-3xl hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 rounded"
                      disabled={isSubmittingMentorRating}
                    >
                      {star <= (mentorRatingHover || mentorRating) ? (
                        <IoStar className="text-yellow-400" />
                      ) : (
                        <IoStarOutline className="text-gray-300" />
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm text-gray-500">
                  {mentorRating > 0 && (
                    <>
                      {mentorRating === 1 && "Poor"}
                      {mentorRating === 2 && "Fair"}
                      {mentorRating === 3 && "Good"}
                      {mentorRating === 4 && "Very Good"}
                      {mentorRating === 5 && "Excellent"}
                    </>
                  )}
                </p>
              </div>

              {/* Comment */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share your experience (optional)
                </label>
                <textarea
                  value={mentorRatingComment}
                  onChange={(e) => setMentorRatingComment(e.target.value)}
                  placeholder="Tell others about your experience with this mentor..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none transition-all duration-200"
                  rows={4}
                  maxLength={500}
                  disabled={isSubmittingMentorRating}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {mentorRatingComment.length}/500 characters
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 animate-in slide-in-from-bottom-4 duration-300 delay-300">
              <button
                onClick={closeMentorRatingPopup}
                disabled={isSubmittingMentorRating}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={submitMentorRating}
                disabled={isSubmittingMentorRating || mentorRating === 0}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmittingMentorRating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  "Submit Rating"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Animations */}
      <style>{`
        @keyframes modalAppear {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05) translateY(-5px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes modalDisappear {
          0% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          100% {
            opacity: 0;
            transform: scale(0.9) translateY(10px);
          }
        }

        .modal-exit {
          animation: modalDisappear 0.2s ease-in forwards;
        }

        /* Enhanced backdrop blur for booking review popup */
        .booking-review-backdrop {
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        /* Smooth fade-in animation for backdrop */
        @keyframes backdropFadeIn {
          0% {
            opacity: 0;
            backdrop-filter: blur(0px);
          }
          100% {
            opacity: 1;
            backdrop-filter: blur(8px);
          }
        }

        .backdrop-fade-in {
          animation: backdropFadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default MenteeProfile;
