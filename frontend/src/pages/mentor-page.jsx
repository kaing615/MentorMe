import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import profileApi from "../api/modules/profile.api";
import courseApi from "../api/modules/course.api";
import cartApi from "../api/modules/cart.api";
import purchasedCourseApi from "../api/modules/purchasedCourse.api";
import availabilityApi from "../api/modules/availability.api";
import bookingApi from "../api/modules/booking.api";
import reviewApi from "../api/modules/review.api";
import { toast } from "react-toastify";
import { showLoading, hideLoading } from "../redux/features/loading.slice";
import { IoStar, IoStarOutline } from "react-icons/io5";

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

const MentorPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const { id } = useParams(); // Lấy ID mentor từ URL
  const location = useLocation(); // Lấy state từ navigation
  // --- AUTH CHECK (mentor hoặc mentee đều được xem) ---
  useEffect(() => {
    const token =
      localStorage.getItem("actkn") || localStorage.getItem("token");
    const userStr =
      localStorage.getItem("user") || localStorage.getItem("user");
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
      return;
    }
    // if (user.role === "admin") {
    //   navigate("/admin/profile");
    //   return;
    // }
  }, [navigate]);

  // State declarations
  const [mentor, setMentor] = useState(null);
  const [courses, setCourses] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [mentorStats, setMentorStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    courseReviews: 0,
    consultationReviews: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [purchasedCoursesMap, setPurchasedCoursesMap] = useState(new Map());

  // Booking states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [availabilities, setAvailabilities] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingNotes, setBookingNotes] = useState("");
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);

  // Helper function to check if course is already purchased
  const isCourseAlreadyPurchased = (courseId) => {
    // Get current user ID for user-specific localStorage
    const userStr = localStorage.getItem("user");
    let currentUserId = null;
    try {
      const user = userStr ? JSON.parse(userStr) : null;
      currentUserId = user?.id || user?._id;
    } catch (e) {
      // Ignore parse errors
    }

    const mockKey = currentUserId
      ? `mockPurchasedCourses_${currentUserId}`
      : "mockPurchasedCourses";
    const mockPurchasedCourses = localStorage.getItem(mockKey);

    if (mockPurchasedCourses) {
      try {
        const purchasedCourses = JSON.parse(mockPurchasedCourses);
        return purchasedCourses.some(
          (purchased) =>
            (purchased.course?._id ||
              purchased.course?.id ||
              purchased.courseId) === courseId
        );
      } catch (error) {
        console.error("Error parsing purchased courses:", error);
        return false;
      }
    }
    return false;
  };

  // Helper function to get purchased course ID if it exists
  const getPurchasedCourseId = (courseId) => {
    return purchasedCoursesMap.get(courseId);
  };

  // Smart navigation function for View Course button
  const handleSmartViewCourse = (e, course) => {
    e.stopPropagation();
    const courseId = course._id || course.id;
    const purchasedCourseId = getPurchasedCourseId(courseId);

    if (purchasedCourseId) {
      // Navigate with purchasedCourseId for new purchased courses
      navigate(`/order-complete-course/${purchasedCourseId}`, {
        state: { purchasedCourseId, courseInfo: course },
      });
    } else {
      // Fallback to courseId for legacy courses
      navigate(`/order-complete-course/${courseId}`, {
        state: { courseId, courseInfo: course },
      });
    }
  };

  // Add to Cart function
  const handleAddToCart = async (e, course) => {
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to add courses to cart");
      navigate("/login");
      return;
    }

    if (user.role !== "mentee") {
      toast.error("Only mentees can purchase courses");
      return;
    }

    const courseId = course._id || course.id;

    // Check if course is already purchased
    if (isCourseAlreadyPurchased(courseId)) {
      toast.info(
        "You have already purchased this course! Check 'My Courses' in your profile."
      );
      return;
    }

    try {
      dispatch(showLoading());

      // Try API first, fallback to localStorage
      try {
        const { response, error } = await cartApi.addToCart(
          { courseId },
          dispatch
        );

        if (response) {
          toast.success("Course added to cart successfully!");
          return;
        } else if (error) {
          throw new Error(error.message || "API failed");
        }
      } catch (apiError) {
        console.log("API failed, using localStorage fallback:", apiError);

        // Fallback to localStorage
        const existingCart = localStorage.getItem("mockCart");
        let cartItems = existingCart ? JSON.parse(existingCart) : [];

        // Check if course already in cart
        const alreadyInCart = cartItems.some(
          (item) => (item._id || item.id) === courseId
        );

        if (alreadyInCart) {
          toast.info("Course is already in your cart");
          return;
        }

        // Add course to cart
        cartItems.push({
          id: courseId,
          _id: courseId,
          title: course.title,
          price: course.price,
          image: course.thumbnail,
          mentor: course.authorName || course.mentorName || "Unknown Mentor",
          addedAt: new Date().toISOString(),
        });

        localStorage.setItem("mockCart", JSON.stringify(cartItems));
        toast.success("Course added to cart successfully!");
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error("Failed to add course to cart");
    } finally {
      dispatch(hideLoading());
    }
  };

  // Buy Now function
  // Buy Now function
  const handleBuyNow = (e, course) => {
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to purchase courses");
      navigate("/login");
      return;
    }

    if (user.role !== "mentee") {
      toast.error("Only mentees can purchase courses");
      return;
    }

    const courseId = course._id || course.id;

    // Check if course is already purchased
    if (isCourseAlreadyPurchased(courseId)) {
      toast.info(
        "You have already purchased this course! Check 'My Courses' in your profile."
      );
      return;
    }

    // Show loading page
    dispatch(showLoading());

    // Navigate with a slight delay to show loading
    setTimeout(() => {
      navigate(`/shoppingcart`);
    }, 300);
  };

  // Function to fetch mentor reviews and calculate statistics
  const fetchMentorReviews = async (mentorId, mentorCourses = []) => {
    try {
      console.log("🔍 Fetching reviews for mentor:", mentorId);

      // Fetch mentor course reviews
      const { response: courseReviewsResponse, error: courseReviewsError } =
        await reviewApi.getMentorCourseReviews(mentorId);

      // Try to estimate mentees from available data
      let estimatedMentees = 0;

      console.log("� Purchased course mentees: 0 (API not implemented yet)");

      // NOTE: getMentorBookings() only returns bookings for the currently logged-in mentor,
      // not for the mentor whose page we're viewing. For security reasons, users can't
      // access other mentors' booking data. Only admins can query bookings by mentor ID.
      //
      // For now, we'll estimate mentees from review data as a fallback.
      // Step 1: Extract mentees from courses
      const courseMenteeIds = new Set();
      if (mentorCourses && mentorCourses.length > 0) {
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
        console.log(
          "Found",
          courseMenteeIds.size,
          "unique mentees from courses"
        );
      }

      // Step 2: Try to get mentees from bookings (if possible)
      // NOTE: For security reasons, we can only access bookings if user is admin or the mentor themselves
      const bookingMenteeIds = new Set();

      // If current user is the same mentor being viewed, we can get their booking data
      const currentUserId = user?.id || user?._id;
      if (currentUserId === mentorId) {
        try {
          const { response: mentorBookingsResponse } =
            await bookingApi.getMentorBookings();
          if (mentorBookingsResponse && mentorBookingsResponse.data) {
            const bookings = Array.isArray(mentorBookingsResponse.data)
              ? mentorBookingsResponse.data
              : mentorBookingsResponse.data.bookings || [];

            bookings.forEach((booking) => {
              if (
                booking.status === "confirmed" ||
                booking.status === "completed"
              ) {
                const menteeId =
                  booking.mentee?._id ||
                  booking.mentee?.id ||
                  booking.menteeId ||
                  booking.userId;
                if (menteeId) {
                  bookingMenteeIds.add(menteeId);
                }
              }
            });
            console.log(
              "Found",
              bookingMenteeIds.size,
              "unique mentees from successful bookings"
            );
          }
        } catch (error) {
          console.log("Could not fetch booking data:", error.message);
        }
      } else {
        console.log(
          "Cannot access booking data for other mentors (security restriction)"
        );
      }

      // Step 3: Combine and deduplicate all mentee IDs
      const allUniqueMenteeIds = new Set([
        ...courseMenteeIds,
        ...bookingMenteeIds,
      ]);
      estimatedMentees = allUniqueMenteeIds.size;

      console.log(
        "Total unique mentees (courses + bookings):",
        estimatedMentees
      );
      console.log("   - From courses:", courseMenteeIds.size);
      console.log("   - From bookings:", bookingMenteeIds.size);
      console.log("   - Total unique:", allUniqueMenteeIds.size);

      let allReviews = [];
      let courseReviews = [];

      if (
        courseReviewsResponse &&
        courseReviewsResponse.data &&
        courseReviewsResponse.data.items
      ) {
        courseReviews = courseReviewsResponse.data.items;
        allReviews = [...courseReviews];

        // Estimate mentees from course reviews as fallback
        const uniqueReviewerIds = new Set();
        courseReviews.forEach((review) => {
          const userId = review.userId || review.user?._id || review.user?.id;
          if (userId) {
            uniqueReviewerIds.add(userId);
          }
        });
        // NOTE: Don't overwrite estimatedMentees here - we already calculated it from course.mentees arrays
        console.log("Course reviews:", courseReviews.length);
      }

      console.log("Final estimated unique mentees:", estimatedMentees);

      // TODO: Add consultation reviews API call when available
      // const consultationReviews = await reviewApi.getMentorConsultationReviews(mentorId);
      // allReviews = [...allReviews, ...consultationReviews];

      // Calculate statistics
      const totalReviews = allReviews.length;
      const averageRating =
        totalReviews > 0
          ? allReviews.reduce((sum, review) => sum + (review.rate || 0), 0) /
            totalReviews
          : 0;

      const stats = {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        courseReviews: courseReviews.length,
        consultationReviews: 0, // TODO: Update when consultation reviews API is available
        totalMentees: estimatedMentees,
      };

      console.log("📊 Mentor stats calculated:", stats);
      setMentorStats(stats);
      setReviews(allReviews);
    } catch (error) {
      console.error("Error fetching mentor reviews:", error);
      setMentorStats({
        totalReviews: 0,
        averageRating: 0,
        courseReviews: 0,
        consultationReviews: 0,
        totalMentees: 0,
      });
    }
  };

  // Fetch data from backend API and overwrite default data if available
  useEffect(() => {
    // Scroll to top when component mounts or id changes
    window.scrollTo({ top: 0, behavior: "smooth" });

    const fetchMentorData = async () => {
      console.log("=== Mentor Page Debug ===");
      console.log("URL params ID:", id);
      console.log("Location state:", location.state);
      console.log("Mentor data from state:", location.state?.mentorData);

      if (!id) return; // Nếu không có ID thì không fetch

      setLoading(true);
      setError(null);

      try {
        // Fetch mentor profile by ID first
        console.log("Fetching mentor profile for ID:", id);
        const mentorProfile = await profileApi.getMentorById(id);
        console.log("Mentor profile response:", mentorProfile);

        if (mentorProfile && mentorProfile.data) {
          console.log("Setting mentor data:", mentorProfile.data);
          setMentor(mentorProfile.data);
        } else {
          console.log("No mentor profile data found");
        }

        // Fetch mentor's courses using ID from params
        console.log("Fetching courses for mentor ID:", id);
        const coursesRes = await courseApi.getCoursesByMentor(id);
        console.log("Courses response:", coursesRes);

        if (Array.isArray(coursesRes)) {
          setCourses(coursesRes);
          // Fetch mentor reviews and calculate statistics - pass courses data
          await fetchMentorReviews(id, coursesRes);
        } else {
          // Fetch mentor reviews without courses data
          await fetchMentorReviews(id, []);
        }
      } catch (err) {
        console.error("Error fetching mentor data:", err);
        setError("Không thể tải dữ liệu mentor hoặc khóa học");

        // Fallback: Nếu có mentorData từ state (từ CourseDetail), sử dụng luôn
        const mentorDataFromState = location.state?.mentorData;
        if (mentorDataFromState) {
          console.log(
            "API failed, using mentor data from navigation state:",
            mentorDataFromState
          );
          setMentor({ user: mentorDataFromState });
        }
      }
      setLoading(false);
    };
    fetchMentorData();
  }, [id, location.state]); // Thêm location.state vào dependency array

  // Debug log when mentor state changes
  useEffect(() => {
    console.log("=== Mentor State Updated ===");
    console.log("Current mentor object:", mentor);
    if (mentor?.user) {
      console.log("Mentor user data:", mentor.user);
    }
  }, [mentor]);

  // Fetch purchased courses for smart navigation
  useEffect(() => {
    const fetchPurchasedCourses = async () => {
      if (!user || user.role !== "mentee") return;

      try {
        const { response, err } =
          await purchasedCourseApi.getPurchasedCourses();
        if (response?.data?.purchasedCourses) {
          const coursesMap = new Map();
          response.data.purchasedCourses.forEach((purchasedCourse) => {
            const courseId =
              purchasedCourse.course?._id ||
              purchasedCourse.course?.id ||
              purchasedCourse.courseId ||
              purchasedCourse.courseInfo?._id;
            const purchasedCourseId = purchasedCourse._id || purchasedCourse.id;

            if (courseId && purchasedCourseId) {
              coursesMap.set(courseId, purchasedCourseId);
            }
          });
          setPurchasedCoursesMap(coursesMap);
        }
      } catch (error) {
        console.error("Error fetching purchased courses:", error);
      }
    };

    fetchPurchasedCourses();
  }, [user]);

  // Booking Functions
  const loadMentorAvailability = async () => {
    if (!mentor?._id && !mentor?.user?._id && !mentor?.profile?._id) return;

    const mentorId = mentor._id || mentor.user?._id || mentor.profile?._id;

    setBookingLoading(true);
    try {
      const today = new Date();
      const twoWeeksLater = new Date();
      twoWeeksLater.setDate(today.getDate() + 14);

      const startDate = today.toISOString().split("T")[0];
      const endDate = twoWeeksLater.toISOString().split("T")[0];

      const { response, error } =
        await availabilityApi.getMentorPublicAvailability(
          mentorId,
          startDate,
          endDate
        );

      if (error) {
        console.error("Error loading mentor availability:", error);
        toast.error("Không thể tải lịch mentor");
        setAvailabilities([]);
      } else {
        let availabilitiesData =
          response?.availabilities ||
          response?.data?.availabilities ||
          response?.data ||
          [];
        setAvailabilities(
          Array.isArray(availabilitiesData) ? availabilitiesData : []
        );
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Có lỗi xảy ra khi tải lịch");
      setAvailabilities([]);
    } finally {
      setBookingLoading(false);
    }
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const firstDay = new Date(year, currentMonth, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      const availability = availabilities.find((avail) => {
        const availDate = new Date(avail.date).toISOString().split("T")[0];
        return availDate === dateStr;
      });

      let dayStatus = "unavailable";
      if (availability && availability.slots.length > 0) {
        const hasOpenSlots = availability.slots.some(
          (slot) => slot.status === "open"
        );
        const hasPendingSlots = availability.slots.some(
          (slot) => slot.status === "pending"
        );
        const hasHeldSlots = availability.slots.some(
          (slot) => slot.status === "held"
        );
        const hasBookedSlots = availability.slots.some(
          (slot) => slot.status === "booked"
        );

        if (hasOpenSlots) {
          // Có slot open -> có thể book
          dayStatus = "available";
        } else if (hasPendingSlots) {
          // Chỉ có slot pending -> hiển thị pending
          dayStatus = "pending";
        } else if (hasHeldSlots) {
          dayStatus = "pending";
        } else if (hasBookedSlots) {
          dayStatus = "booked";
        }
      }

      const isPast = date < today;
      const isCurrentMonth = date.getMonth() === currentMonth;

      days.push({
        date: date,
        dateStr: dateStr,
        day: date.getDate(),
        availability: availability,
        dayStatus: isPast ? "past" : dayStatus,
        isPast: isPast,
        isCurrentMonth: isCurrentMonth,
        isClickable:
          !isPast &&
          isCurrentMonth &&
          availability &&
          availability.slots.length > 0,
      });
    }

    return days;
  };

  const handleDateSelect = (day) => {
    if (!day.isClickable) return;
    setSelectedDate(day.dateStr);
    setSelectedTimeSlot(null);
    setBookingStep(2);
  };

  const handleTimeSlotSelect = (slot) => {
    setSelectedTimeSlot(slot);
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTimeSlot) {
      toast.error("Vui lòng chọn ngày và giờ");
      return;
    }

    if (!user || user.role !== "mentee") {
      toast.error("Chỉ mentee mới có thể đặt lịch");
      return;
    }

    const mentorId =
      mentor?.user?._id || mentor?.user?.id || mentor?._id || mentor?.id;
    if (!mentorId) {
      toast.error("Không tìm thấy thông tin mentor");
      return;
    }

    setBookingLoading(true);
    try {
      // Tìm availability object chứa slot được chọn
      const selectedAvailability = availabilities.find((avail) => {
        const availDate = new Date(avail.date).toISOString().split("T")[0];
        return availDate === selectedDate;
      });

      if (!selectedAvailability) {
        toast.error("Không tìm thấy lịch khả dụng cho ngày đã chọn");
        return;
      }

      // Tạo booking data
      const bookingData = {
        availabilityId: selectedAvailability._id,
        slotId: selectedTimeSlot._id,
        date: selectedDate,
        start: selectedTimeSlot.start,
        end: selectedTimeSlot.end,
        notes: bookingNotes.trim() || undefined,
      };

      console.log("Creating booking with data:", bookingData);

      // Gọi API tạo booking
      const { response, error } = await bookingApi.createBooking(
        mentorId,
        bookingData
      );

      if (response) {
        toast.success("Đặt lịch thành công! Chờ mentor xác nhận.");
        closeBookingModal();
        // Reload availability để cập nhật trạng thái
        loadMentorAvailability();
      } else {
        console.error("Booking API error:", error);
        toast.error(error?.message || "Có lỗi xảy ra khi đặt lịch");
      }
    } catch (err) {
      console.error("Booking error:", err);
      toast.error("Có lỗi xảy ra khi đặt lịch");
    } finally {
      setBookingLoading(false);
    }
  };

  const getSelectedDateAvailability = () => {
    return availabilities.find((avail) => {
      const availDate = new Date(avail.date).toISOString().split("T")[0];
      return availDate === selectedDate;
    });
  };

  const openBookingModal = () => {
    setShowBookingModal(true);
    setBookingStep(1);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setBookingNotes("");
    loadMentorAvailability();
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
    setBookingStep(1);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setBookingNotes("");
  };

  const mentorCoursesRef = useRef(null);
  const [hoveredCarousel, setHoveredCarousel] = useState(null);
  const scrollCarouselBy = (ref, direction) => {
    const container = ref.current;
    if (!container) return;

    // Get the first card to calculate dimensions
    const card = container.querySelector(".course-card");
    if (!card) return;

    const cardWidth = card.offsetWidth;
    const gap = 24; // gap-6 = 1.5rem = 24px
    const scrollAmount = (cardWidth + gap) * 3; // Scroll exactly 3 cards

    container.scrollBy({
      left: direction * scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="min-h-screen bg-white-50 flex flex-col py-0">
      <main
        className={`w-full flex flex-col ${showBookingModal ? "blur-sm" : ""}`}
      >
        <div className="w-full mt-8 p-0">
          {/* Mentor Info Section - fetch and display real data */}
          {mentor && (
            <div className="w-full flex flex-col lg:flex-row lg:items-start lg:justify-between lg:gap-8 max-w-7xl mx-auto px-2 md:px-4 mb-12">
              {/* Left info + about */}
              <div className="flex-1 min-w-0 max-w-full lg:max-w-[calc(100%-21rem)] pr-0 lg:pr-8">
                <div className="text-base text-gray-500 mb-1">Mentor</div>
                <h1 className="text-4xl font-bold text-gray-900 mb-1">
                  {mentor?.profile?.firstName ||
                    mentor?.user?.firstName ||
                    "Mentor"}{" "}
                  {mentor?.profile?.lastName || mentor?.user?.lastName || ""}
                </h1>
                <div className="text-lg text-gray-700 mb-4 font-medium">
                  {mentor?.profile?.jobTitle || mentor?.user?.jobTitle || ""}
                </div>
                {/* Headline - only show when available */}
                {(mentor?.profile?.headline || mentor?.user?.headline) && (
                  <div className="text-base text-gray-600 mb-4 italic break-words overflow-wrap-anywhere leading-relaxed">
                    "{mentor?.profile?.headline || mentor?.user?.headline}"
                  </div>
                )}
                <div className="flex gap-16 mb-6">
                  <div>
                    <div className="text-base text-gray-500 font-medium mb-1">
                      Total Students
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                      {mentorStats.totalMentees !== undefined
                        ? mentorStats.totalMentees
                        : "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-base text-gray-500 font-medium mb-1">
                      Reviews
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex items-center gap-1">
                        {renderStars(mentorStats.averageRating || 0)}
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        {mentorStats.averageRating
                          ? mentorStats.averageRating.toFixed(1)
                          : "0.0"}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {mentorStats.totalReviews || "0"} Total Reviews
                    </div>
                    {mentorStats.totalReviews > 0 && (
                      <div className="text-sm text-gray-600 mt-1">
                        {mentorStats.courseReviews} Courses •{" "}
                        {mentorStats.consultationReviews} Consultations
                      </div>
                    )}
                  </div>
                </div>
                {/* About Section merged here */}
                <div className="w-full mt-0">
                  <h3 className="text-xl font-bold mb-2 text-gray-900">
                    About{" "}
                    {mentor?.profile?.firstName ||
                      mentor?.user?.firstName ||
                      "Mentor"}
                  </h3>
                  <p className="mb-6 text-gray-700 text-justify break-words overflow-wrap-anywhere leading-relaxed">
                    {mentor?.profile?.bio ||
                      mentor?.user?.bio ||
                      "No bio available."}
                  </p>
                  {/* Category/Expertise */}
                  {(mentor?.profile?.category || mentor?.user?.category) && (
                    <div className="mb-6">
                      <h4 className="font-bold mb-2 text-gray-900">Category</h4>
                      <p className="text-gray-700">
                        {(() => {
                          const cat =
                            mentor?.profile?.category || mentor?.user?.category;
                          if (!cat) return "";
                          return cat.charAt(0).toUpperCase() + cat.slice(1);
                        })()}
                      </p>
                    </div>
                  )}
                  <h4 className="font-bold mb-2 text-gray-900">
                    Professional Experience
                  </h4>
                  <p className="text-gray-700 text-justify break-words overflow-wrap-anywhere mb-6">
                    {mentor?.profile?.experience ||
                      mentor?.user?.experience ||
                      "No professional experience provided."}
                  </p>
                  <h4 className="font-bold mb-2 text-gray-900">
                    Areas of Expertise
                  </h4>
                  <ul className="list-disc list-inside mb-6 text-gray-800">
                    {(
                      mentor?.profile?.skills ||
                      mentor?.user?.skills ||
                      []
                    ).map((skill, idx) => (
                      <li key={idx}>{skill}</li>
                    ))}
                  </ul>
                  <h4 className="font-bold mb-2 text-gray-900">
                    Greatest Achievement
                  </h4>
                  <p className="text-gray-700 text-justify break-words overflow-wrap-anywhere leading-relaxed mb-6">
                    {mentor?.profile?.greatestAchievement ||
                      mentor?.user?.greatestAchievement ||
                      "No greatest achievement provided."}
                  </p>
                </div>
              </div>
              {/* Right avatar & info buttons */}
              <div className="flex flex-col items-center w-full lg:w-80 flex-shrink-0 mt-8 lg:mt-0">
                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gray-100 shadow mb-6 bg-gray-200 ">
                  <img
                    src={
                      mentor?.profile?.avatarUrl ||
                      mentor?.user?.avatarUrl ||
                      "https://randomuser.me/api/portraits/men/32.jpg"
                    }
                    alt={
                      mentor?.profile?.firstName ||
                      mentor?.user?.firstName ||
                      "Mentor"
                    }
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <a
                    href={
                      mentor?.profile?.links?.website ||
                      mentor?.user?.website ||
                      "#"
                    }
                    className="w-full border border-gray-300 rounded py-2 text-center text-gray-700 font-medium hover:bg-gray-100 transition"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Website
                  </a>
                  <a
                    href={
                      mentor?.profile?.links?.twitter ||
                      mentor?.user?.twitter ||
                      "#"
                    }
                    className="w-full border border-gray-300 rounded py-2 text-center text-gray-700 font-medium hover:bg-gray-100 transition"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Twitter
                  </a>
                  <a
                    href={
                      mentor?.profile?.links?.linkedin ||
                      mentor?.user?.linkedinUrl ||
                      "#"
                    }
                    className="w-full border border-gray-300 rounded py-2 text-center text-gray-700 font-medium hover:bg-gray-100 transition"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LinkedIn
                  </a>
                  <a
                    href={
                      mentor?.profile?.links?.github ||
                      mentor?.user?.github ||
                      "#"
                    }
                    className="w-full border border-gray-300 rounded py-2 text-center text-gray-700 font-medium hover:bg-gray-100 transition"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub
                  </a>
                  <a
                    href={
                      mentor?.profile?.links?.youtube ||
                      mentor?.user?.youtube ||
                      "#"
                    }
                    className="w-full border border-gray-300 rounded py-2 text-center text-gray-700 font-medium hover:bg-gray-100 transition"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Youtube
                  </a>
                  <a
                    href={
                      mentor?.profile?.links?.facebook ||
                      mentor?.user?.facebook ||
                      "#"
                    }
                    className="w-full border border-gray-300 rounded py-2 text-center text-gray-700 font-medium hover:bg-gray-100 transition"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Facebook
                  </a>
                  {!(mentor?.profile?.introVideo || mentor?.user?.introVideo) &&
                    (() => {
                      console.log(
                        "Không có introVideo:",
                        mentor?.profile?.introVideo,
                        mentor?.user?.introVideo
                      );
                      return null;
                    })()}
                  {mentor?.profile?.introVideo || mentor?.user?.introVideo ? (
                    <button
                      className="w-full border border-blue-500 rounded py-2 text-center text-blue-700 font-medium hover:bg-blue-50 transition"
                      onClick={() =>
                        window.open(
                          mentor?.profile?.introVideo ||
                            mentor?.user?.introVideo,
                          "_blank"
                        )
                      }
                    >
                      Intro Video
                    </button>
                  ) : null}
                  <button
                    className="w-full bg-gray-900 text-white rounded py-2 font-semibold mt-2 hover:bg-gray-800 transition"
                    onClick={openBookingModal}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* More Courses Section - Figma style, horizontal carousel, closer match */}
          <section className="w-full py-14 " style={{ background: "#f9fbfd" }}>
            <div className="max-w-7xl mx-auto w-full px-2 md:px-4">
              <div className="flex justify-between items-center mb-8 px-2">
                <h3 className="text-[24px] font-bold text-[#222]">
                  More Courses by{" "}
                  {mentor?.profile?.firstName ||
                    mentor?.user?.firstName ||
                    "Mentor"}
                  <span className="text-[#F8FAFC]">{mentor?.name}</span>
                </h3>
                <div className="flex gap-3">
                  <button
                    type="button"
                    aria-label="Scroll left"
                    className="w-10 h-10 rounded-md bg-[#c9d6e7] flex items-center justify-center text-xl text-white hover:bg-[#b0c4de] transition"
                    onClick={() => scrollCarouselBy(mentorCoursesRef, -1)}
                  >
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    aria-label="Scroll right"
                    className="w-10 h-10 rounded-md bg-[#c9d6e7] flex items-center justify-center text-xl text-white hover:bg-[#b0c4de] transition"
                    onClick={() => scrollCarouselBy(mentorCoursesRef, 1)}
                  >
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div
                className="overflow-x-auto no-scrollbar"
                ref={mentorCoursesRef}
                style={{
                  WebkitOverflowScrolling: "touch",
                  scrollSnapType: "x mandatory",
                  scrollBehavior: "smooth",
                }}
                tabIndex={-1}
              >
                <div className="inline-flex gap-6 pb-2">
                  {courses.map((course, idx) => (
                    <div
                      key={course._id || course.id || idx}
                      onClick={() =>
                        navigate(`/course-detail/${course._id || course.id}`)
                      }
                      className="course-card bg-white rounded-xl border border-gray-200 shadow-lg flex flex-col min-w-[300px] max-w-[340px] w-full transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer overflow-hidden"
                      style={{
                        scrollSnapAlign: "start",
                        textDecoration: "none",
                        minHeight: "450px",
                      }}
                    >
                      <div className="h-[140px] w-full bg-white-100 rounded-t-xl flex items-center justify-center">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="object-cover h-[120px] w-[92%] rounded-xl"
                          style={{ marginTop: "4px", marginBottom: "4px" }}
                        />
                      </div>
                      <div className="flex flex-col px-5 py-4 flex-1">
                        <div className="font-bold text-[18px] text-gray-900 mb-2 leading-tight line-clamp-2">
                          {course.title}
                        </div>
                        <div className="text-sm text-gray-700 font-normal mb-2 line-clamp-1">
                          By{" "}
                          {course.authorName ||
                            course.mentorName ||
                            mentor?.profile?.firstName ||
                            mentor?.user?.firstName ||
                            "Mentor"}
                        </div>
                        <div className="flex items-center gap-1 text-sm mb-2">
                          {renderStars(course.rating || course.rate || 0)}
                          <span className="text-sm text-gray-700 ml-2">
                            (
                            {course.ratingsCount || course.numberOfRatings || 0}{" "}
                            Ratings)
                          </span>
                        </div>

                        {/* Course Details */}
                        <div className="text-sm text-gray-700 mb-2 line-clamp-1">
                          {course.duration || course.totalHours || 0} Total
                          Hours • {course.lectures || course.totalLectures || 0}{" "}
                          Lectures
                        </div>

                        {/* Category */}
                        <div className="mb-3">
                          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                            Category: {course.category || "General"}
                          </span>
                        </div>

                        {/* Tags (Programming Languages and Tools) */}
                        {course.tags && course.tags.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 mb-1">
                              {course.category === "Programming"
                                ? "Programming Languages:"
                                : "Tools:"}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {course.tags.slice(0, 2).map((tag, tagIndex) => (
                                <span
                                  key={tagIndex}
                                  className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${
                                    course.category === "Programming"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-purple-100 text-purple-800"
                                  }`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Hiển thị languages */}
                        {course.language && course.language.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-500 mb-1">
                              Languages:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {course.language
                                .slice(0, 2)
                                .map((lang, index) => (
                                  <span
                                    key={index}
                                    className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium max-w-[90px] truncate"
                                  >
                                    {lang}
                                  </span>
                                ))}
                              {course.language.length > 2 && (
                                <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                                  +{course.language.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Hiển thị level nếu có */}
                        {course.level && (
                          <p className="text-green-500 text-xs mb-2">
                            <b>Level:</b> {course.level}
                          </p>
                        )}

                        <div className="font-bold text-xl text-gray-900 mt-auto">
                          $
                          {(() => {
                            const price =
                              typeof course.price === "number"
                                ? course.price
                                : parseFloat(course.price || 0);
                            return price % 1 === 0
                              ? price.toLocaleString("en-US")
                              : price.toLocaleString("en-US", {
                                  minimumFractionDigits: 1,
                                  maximumFractionDigits: 2,
                                });
                          })()}
                        </div>

                        {/* Add to Cart and Buy Now buttons for mentees */}
                        {user && user.role === "mentee" && (
                          <div className="flex flex-col gap-2 mt-3">
                            {isCourseAlreadyPurchased(
                              course._id || course.id
                            ) ? (
                              <>
                                <div className="w-full bg-green-100 text-green-700 py-2 px-3 rounded-md text-sm font-medium text-center">
                                  ✓ Already Purchased
                                </div>
                                <button
                                  onClick={(e) =>
                                    handleSmartViewCourse(e, course)
                                  }
                                  className="w-full bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                                >
                                  View Course
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={(e) => handleAddToCart(e, course)}
                                  className="flex-1 bg-blue-100 text-blue-600 py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors"
                                >
                                  Add to Cart
                                </button>
                                <button
                                  onClick={(e) => handleBuyNow(e, course)}
                                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                                >
                                  Buy Now
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
          {/* Mentor Reviews Section - empty UI, ready for API, aligned with My Courses */}
          <section
            className="w-full py-10 bg-white"
            style={{ background: "white" }}
          >
            <div className="max-w-7xl mx-auto w-full px-2 md:px-4">
              <h3 className="text-[24px] font-bold text-[#222] mb-8">
                Mentee Reviews
              </h3>
              <div className="flex flex-col gap-6 min-h-[180px]">
                {/* No reviews yet, ready for API integration */}
              </div>
              <div className="flex justify-center mt-8">
                <button className="border border-gray-300 rounded px-6 py-2 text-gray-700 font-medium hover:bg-gray-100 transition">
                  View more Reviews
                </button>
              </div>
            </div>
          </section>
        </div>
        {/* Close .w-full.mt-8.p-0 */}
      </main>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] h-full">
              {/* Left Side - Calendar/Time Selection */}
              <div className="p-6 border-r border-gray-200">
                {/* Header */}
                <div className="bg-gray-800 text-white p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold">Hello, Let's Talk !</h3>
                  <p className="text-sm opacity-90 mt-1">
                    Schedule a 1 hour one-on-one call to discuss your goals and
                    challenges
                  </p>
                  <div className="flex items-center mt-2 text-sm">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    This call is optional but highly recommended
                  </div>
                </div>

                {bookingStep === 1 && (
                  <>
                    {/* Choose a Date */}
                    <h4 className="text-lg font-semibold mb-4">
                      Choose a Date
                    </h4>

                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() =>
                          setCurrentDate(
                            new Date(
                              currentDate.getFullYear(),
                              currentDate.getMonth() - 1,
                              1
                            )
                          )
                        }
                        className="p-2 hover:bg-gray-100 rounded-lg"
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
                      <div className="text-center relative">
                        <button
                          onClick={() =>
                            setShowMonthYearPicker(!showMonthYearPicker)
                          }
                          className="text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors"
                        >
                          {currentDate.toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric",
                          })}
                        </button>

                        {/* Month/Year Picker Popup */}
                        {showMonthYearPicker && (
                          <>
                            {/* Overlay to close popup when clicking outside */}
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setShowMonthYearPicker(false)}
                            />
                            <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 min-w-[280px]">
                              <div className="flex items-center justify-between mb-4">
                                <h5 className="text-sm font-medium text-gray-900">
                                  Select Month & Year
                                </h5>
                                <button
                                  onClick={() => setShowMonthYearPicker(false)}
                                  className="p-1 hover:bg-gray-100 rounded"
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
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              </div>

                              {/* Year Selection */}
                              <div className="mb-4">
                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                  Year
                                </label>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      setCurrentDate(
                                        new Date(
                                          currentDate.getFullYear() - 1,
                                          currentDate.getMonth(),
                                          1
                                        )
                                      )
                                    }
                                    className="p-1 hover:bg-gray-100 rounded"
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
                                  <span className="flex-1 text-center font-medium">
                                    {currentDate.getFullYear()}
                                  </span>
                                  <button
                                    onClick={() =>
                                      setCurrentDate(
                                        new Date(
                                          currentDate.getFullYear() + 1,
                                          currentDate.getMonth(),
                                          1
                                        )
                                      )
                                    }
                                    className="p-1 hover:bg-gray-100 rounded"
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
                              </div>

                              {/* Month Grid */}
                              <div className="mb-4">
                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                  Month
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                  {[
                                    "Jan",
                                    "Feb",
                                    "Mar",
                                    "Apr",
                                    "May",
                                    "Jun",
                                    "Jul",
                                    "Aug",
                                    "Sep",
                                    "Oct",
                                    "Nov",
                                    "Dec",
                                  ].map((month, index) => (
                                    <button
                                      key={month}
                                      onClick={() => {
                                        setCurrentDate(
                                          new Date(
                                            currentDate.getFullYear(),
                                            index,
                                            1
                                          )
                                        );
                                        setShowMonthYearPicker(false);
                                      }}
                                      className={`
                                        px-3 py-2 text-xs rounded-lg border transition-colors
                                        ${
                                          currentDate.getMonth() === index
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                                        }
                                      `}
                                    >
                                      {month}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Quick Actions */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setCurrentDate(new Date());
                                    setShowMonthYearPicker(false);
                                  }}
                                  className="flex-1 px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                  Today
                                </button>
                                <button
                                  onClick={() => setShowMonthYearPicker(false)}
                                  className="flex-1 px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  Done
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          setCurrentDate(
                            new Date(
                              currentDate.getFullYear(),
                              currentDate.getMonth() + 1,
                              1
                            )
                          )
                        }
                        className="p-2 hover:bg-gray-100 rounded-lg"
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
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      {/* Week Days Header */}
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(
                          (day) => (
                            <div
                              key={day}
                              className="text-center text-sm font-medium text-gray-600 py-2"
                            >
                              {day}
                            </div>
                          )
                        )}
                      </div>

                      {/* Calendar Days */}
                      <div className="grid grid-cols-7 gap-1">
                        {generateCalendarDays().map((day, index) => {
                          let dayClass =
                            "py-2 px-1 text-sm rounded-lg transition-all duration-200 ";

                          if (!day.isCurrentMonth) {
                            dayClass += "text-gray-300 cursor-not-allowed";
                          } else if (day.isPast) {
                            dayClass += "text-gray-300 cursor-not-allowed";
                          } else {
                            switch (day.dayStatus) {
                              case "available":
                                dayClass +=
                                  "bg-green-100 text-green-800 font-medium hover:bg-green-200 cursor-pointer border border-green-300";
                                break;
                              case "pending":
                                dayClass +=
                                  "bg-orange-100 text-orange-800 font-medium hover:bg-orange-200 cursor-pointer border border-orange-300";
                                break;
                              case "booked":
                                dayClass +=
                                  "bg-red-100 text-red-800 font-medium cursor-not-allowed border border-red-300";
                                break;
                              default:
                                dayClass +=
                                  "text-gray-400 cursor-not-allowed opacity-50";
                            }
                          }

                          if (selectedDate === day.dateStr) {
                            dayClass += " !bg-blue-600 !text-white !font-bold";
                          }

                          return (
                            <button
                              key={index}
                              onClick={() => handleDateSelect(day)}
                              disabled={!day.isClickable}
                              className={dayClass}
                            >
                              {day.day}
                            </button>
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div className="mt-4 flex flex-wrap gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-green-200 border border-green-300 rounded"></div>
                          <span>Available</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-orange-200 border border-orange-300 rounded"></div>
                          <span>Pending</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-red-200 border border-red-300 rounded"></div>
                          <span>Booked</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {bookingStep === 2 && (
                  <>
                    {/* Pick a time */}
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        onClick={() => setBookingStep(1)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
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
                      <h4 className="text-lg font-semibold">Pick a time</h4>
                    </div>

                    {/* Selected Date Info */}
                    <div className="bg-blue-50 rounded-lg p-3 mb-4">
                      <div className="text-sm text-blue-800">
                        Selected:{" "}
                        {new Date(selectedDate).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                    </div>

                    {/* Time Slots */}
                    <div className="grid grid-cols-3 gap-3">
                      {getSelectedDateAvailability()?.slots.map((slot) => {
                        let slotClass =
                          "py-3 px-4 rounded-lg border text-sm font-medium transition-all duration-200 ";

                        if (slot.status === "open") {
                          slotClass +=
                            selectedTimeSlot?._id === slot._id
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50";
                        } else if (slot.status === "pending") {
                          // Pending slots - màu cam nhạt, vẫn có thể book được
                          slotClass +=
                            selectedTimeSlot?._id === slot._id
                              ? "bg-orange-600 text-white border-orange-600"
                              : "bg-orange-100 text-orange-700 border-orange-300 hover:border-orange-400 hover:bg-orange-200";
                        } else if (slot.status === "booked") {
                          // Booked slots - màu đỏ, không thể book
                          slotClass +=
                            "bg-red-100 text-red-600 border-red-200 cursor-not-allowed";
                        } else {
                          // Blocked, held, etc. - xám
                          slotClass +=
                            "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed";
                        }

                        return (
                          <button
                            key={slot._id}
                            onClick={() =>
                              slot.status === "open" ||
                              slot.status === "pending"
                                ? handleTimeSlotSelect(slot)
                                : null
                            }
                            disabled={
                              slot.status !== "open" &&
                              slot.status !== "pending"
                            }
                            className={slotClass}
                          >
                            <div>{slot.start}</div>
                            <div className="text-xs opacity-75">
                              {slot.status === "open"
                                ? "Available"
                                : slot.status === "pending"
                                ? "Pending"
                                : slot.status === "held"
                                ? "Held"
                                : slot.status === "booked"
                                ? "Booked"
                                : "Blocked"}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Continue Button */}
                    {selectedTimeSlot && (
                      <div className="mt-6 flex gap-3">
                        <button
                          onClick={() => setBookingStep(1)}
                          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => setBookingStep(3)}
                          className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                        >
                          Continue
                        </button>
                      </div>
                    )}

                    {/* Timezone Info */}
                    <div className="mt-4 text-xs text-gray-500">
                      ⏰ All Times are in Vietnam Time (Hanoi)
                    </div>
                  </>
                )}

                {bookingStep === 3 && (
                  <>
                    {/* Confirm Booking */}
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        onClick={() => setBookingStep(2)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
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
                      <h4 className="text-lg font-semibold">Confirm Booking</h4>
                    </div>

                    {/* Booking Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h5 className="font-medium mb-2">Booking Summary</h5>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>
                          📅 Date:{" "}
                          {new Date(selectedDate).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                        <div>
                          ⏰ Time: {selectedTimeSlot?.start} -{" "}
                          {selectedTimeSlot?.end}
                        </div>
                        <div>
                          👨‍🏫 Mentor:{" "}
                          {(mentor?.profile || mentor?.user)?.firstName}{" "}
                          {(mentor?.profile || mentor?.user)?.lastName}
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={bookingNotes}
                        onChange={(e) => setBookingNotes(e.target.value)}
                        placeholder="Any specific topics you'd like to discuss..."
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                        rows={3}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setBookingStep(2)}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleBooking}
                        disabled={bookingLoading}
                        className="flex-1 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                      >
                        {bookingLoading ? "Booking..." : "Confirm Booking"}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Right Side - Mentor Info */}
              <div className="p-6 bg-gray-50">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Onboarding Call</h3>
                  <button
                    onClick={closeBookingModal}
                    className="p-2 hover:bg-gray-200 rounded-lg text-gray-500"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Mentor Avatar & Info */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-3">
                    {(mentor?.profile || mentor?.user)?.avatarUrl ? (
                      <img
                        src={(mentor?.profile || mentor?.user)?.avatarUrl}
                        alt={`${(mentor?.profile || mentor?.user)?.firstName} ${
                          (mentor?.profile || mentor?.user)?.lastName
                        }`}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gray-400 flex items-center justify-center text-white font-semibold">
                        {(mentor?.profile || mentor?.user)?.firstName?.[0]}
                        {(mentor?.profile || mentor?.user)?.lastName?.[0]}
                      </div>
                    )}
                  </div>
                  <h4 className="font-semibold text-gray-900">
                    {(mentor?.profile || mentor?.user)?.firstName}{" "}
                    {(mentor?.profile || mentor?.user)?.lastName}
                  </h4>
                  {(mentor?.profile || mentor?.user)?.jobTitle && (
                    <p className="text-sm text-gray-600">
                      {(mentor?.profile || mentor?.user)?.jobTitle}
                    </p>
                  )}
                </div>

                {/* Duration */}
                <div className="flex items-center gap-2 mb-4">
                  <svg
                    className="w-4 h-4 text-gray-600"
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
                  <span className="text-sm">
                    <strong>Duration</strong>
                    <br />
                    <span className="text-gray-600">60-70 mins</span>
                  </span>
                </div>

                {/* Benefits */}
                <div className="space-y-3 mb-6">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    It is a chance to connect with one of our mentors to learn
                    more about our platform and how we can help you grow your
                    career
                  </p>

                  <div className="space-y-2">
                    {[
                      "Expert Guidance in Your Field",
                      "Low cost",
                      "One-on-One Mentorship Sessions",
                      "Career and Skill Development Support",
                      "Tailored Guidance for Your Goals",
                    ].map((benefit, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <svg
                          className="w-4 h-4 text-green-600 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <p>
                    You can also bring any questions that you might have for us!
                  </p>
                </div>

                {bookingLoading && (
                  <div className="mt-4 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-gray-600 mt-2">Loading...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorPage;
