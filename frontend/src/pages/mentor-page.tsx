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
import { hasUserRole } from "../utils/user-role";
import { formatVnd } from "../utils/currency";
import { toast } from "react-toastify";
import { showLoading, hideLoading } from "../redux/features/loading.slice";
import { IconHeart } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import favoriteApi from "../api/modules/favorite.api";
import {
  FaFacebook,
  FaGithub,
  FaLinkedin,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";

// Stars render function
const renderStars = (rating) => {
  return <span className="font-semibold">{Number(rating || 0).toFixed(1)} / 5</span>;
};

// Helper function to get rating breakdown for progress bars
const getRatingBreakdown = (reviews) => {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return {
      counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  reviews.forEach((review) => {
    const rating = Math.round(Number(review.rate || review.rating) || 0);
    if (rating >= 1 && rating <= 5) {
      counts[rating]++;
    }
  });

  const total = reviews.length;
  const percentages = {};

  for (let i = 1; i <= 5; i++) {
    percentages[i] = total > 0 ? (counts[i] / total) * 100 : 0;
  }

  return { counts, percentages };
};

const MentorPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const user = useSelector((state: any) => state.user);
  const { id } = useParams(); // Lấy ID mentor từ URL
  const location = useLocation(); // Lấy state từ navigation
  // --- AUTH CHECK (mentor hoặc mentee đều được xem) ---
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
    if (user.role === "mentor") {
      return;
    }
    if (hasUserRole(user, "mentee")) {
      return;
    }
    // if (user.role === "admin") {
    //   navigate("/admin/profile");
    //   return;
    // }
  }, [navigate]);

  // State declarations
  const [mentor, setMentor] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [mentorStats, setMentorStats] = useState<any>({
    totalReviews: 0,
    averageRating: 0,
    courseReviews: 0,
    consultationReviews: 0,
    totalMentees: 0,
  });
  const [loading, setLoading] = useState<any>(false);
  const [error, setError] = useState<any>(null);
  const [purchasedCoursesMap, setPurchasedCoursesMap] = useState<any>(new Map());

  // Booking states
  const [showBookingModal, setShowBookingModal] = useState<any>(false);
  const [bookingLoading, setBookingLoading] = useState<any>(false);
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState<any>(new Date());
  const [selectedDate, setSelectedDate] = useState<any>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<any>(null);
  const [bookingStep, setBookingStep] = useState<any>(1);
  const [bookingNotes, setBookingNotes] = useState<any>("");
  const [showMonthYearPicker, setShowMonthYearPicker] = useState<any>(false);
  let viewer = user;
  try {
    viewer = JSON.parse(localStorage.getItem("user") || "null") || user;
  } catch {
    viewer = user;
  }
  const isMenteeView =
    hasUserRole(viewer, "mentee") &&
    localStorage.getItem("mentorMode") !== "true";
  const mentorTargetId =
    id || mentor?.user?._id || mentor?.profile?.user?._id || mentor?._id;
  const favorites = useQuery({
    queryKey: ["favorites"],
    queryFn: favoriteApi.list,
    enabled: isMenteeView,
  });
  const favoriteMutation = useMutation({
    mutationFn: ({ mentorId, active }: { mentorId: string; active: boolean }) =>
      active
        ? favoriteApi.remove("mentor", mentorId)
        : favoriteApi.add("mentor", mentorId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favorites"] }),
  });
  const isFavorite =
    favorites.data?.mentors.some((item) => item._id === mentorTargetId) ?? false;

  // Helper function to check if course is already purchased
  const isCourseAlreadyPurchased = (courseId) => {
    // Check from API-based purchasedCoursesMap (Course.mentees array check)
    return (
      purchasedCoursesMap.has(courseId) && purchasedCoursesMap.get(courseId)
    );
  };

  // Helper function to get purchased course ID if it exists
  const getPurchasedCourseId = (courseId) => {
    // Since we're now only checking Course.mentees array, we don't have purchasedCourse IDs
    // Return the courseId if purchased, null otherwise
    return isCourseAlreadyPurchased(courseId) ? courseId : null;
  };

  // Smart navigation function for View Course button
  const handleSmartViewCourse = (e, course) => {
    e.stopPropagation();
    const courseId = course._id || course.id;

    if (isCourseAlreadyPurchased(courseId)) {
      // Navigate to purchased course view
      navigate(`/order-complete-course/${courseId}`, {
        state: { courseId, courseInfo: course },
      });
    } else {
      // Fallback to course detail page if not purchased
      navigate(`/course-detail/${courseId}`, {
        state: { courseInfo: course },
      });
    }
  };

  // Add to Cart function
  const handleAddToCart = async (e, course) => {
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to add courses to cart");
      navigate("/auth/signin");
      return;
    }

    if (!hasUserRole(user, "mentee")) {
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
      const { response, error } = await cartApi.addToCart(
        { courseId },
        dispatch,
      );
      if (error || !response) throw error || new Error("Cart unavailable");
      toast.success("Course added to cart successfully!");
    } catch (error) {
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
      navigate("/auth/signin");
      return;
    }

    if (!hasUserRole(user, "mentee")) {
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
  const fetchMentorReviews = async (mentorId) => {
    let allReviews = [];

    // 1. Course reviews
    let courseReviews = [];
    try {
      const { response: courseRes } = await reviewApi.getMentorCourseReviews(
        mentorId
      );
      if (courseRes?.data?.items) {
        courseReviews = courseRes.data.items;
        allReviews = [...allReviews, ...courseReviews];
      }
    } catch (_) {}

    // 2. Booking reviews
    let consultationReviews = [];
    try {
      const { response: bookingRes } = await reviewApi.getBookingReviews(
        mentorId
      );
      if (bookingRes?.data?.items) {
        consultationReviews = bookingRes.data.items;
        allReviews = [...allReviews, ...consultationReviews];
      }
    } catch (_) {}

    // 3. Mentor-only (direct) reviews
    let mentorOnlyReviews = [];
    try {
      if (typeof reviewApi.getMentorOnlyReviews === "function") {
        const { response: mentorOnlyRes } =
          await reviewApi.getMentorOnlyReviews(mentorId);
        if (mentorOnlyRes?.data?.items) {
          mentorOnlyReviews = mentorOnlyRes.data.items;
          allReviews = [...allReviews, ...mentorOnlyReviews];
        }
      } else if (typeof reviewApi.getMentorReviewsByMentorId === "function") {
        const { response: mentorOnlyRes2 } =
          await reviewApi.getMentorReviewsByMentorId(mentorId);
        if (mentorOnlyRes2?.data?.items) {
          mentorOnlyReviews = mentorOnlyRes2.data.items;
          allReviews = [...allReviews, ...mentorOnlyReviews];
        }
      } else if (typeof reviewApi.getMentorReviews === "function") {
        const { response: mentorOnlyRes3 } = await reviewApi.getMentorReviews(
          mentorId
        );
        if (mentorOnlyRes3?.data?.items) {
          mentorOnlyReviews = mentorOnlyRes3.data.items;
          allReviews = [...allReviews, ...mentorOnlyReviews];
        }
      }
    } catch (_) {}

    // 4. Chuẩn hóa & sắp xếp review mới nhất lên đầu
    allReviews = (allReviews || []).filter(Boolean).sort((a, b) => {
      const da = new Date(a.createdAt || a.created_at || 0).getTime();
      const db = new Date(b.createdAt || b.created_at || 0).getTime();
      return db - da;
    });

    // 5. Tính thống kê
    const totalReviews = allReviews.length;
    const averageRating =
      totalReviews > 0
        ? allReviews.reduce(
            (sum, review) => sum + (Number(review.rate) || 0),
            0
          ) / totalReviews
        : 0;

    const stats = {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      courseReviews: courseReviews.length,
      consultationReviews: consultationReviews.length,
      mentorOnlyReviews: mentorOnlyReviews.length,
    };

    // 6. Set state - preserve existing totalMentees value
    setMentorStats((prevStats) => ({
      ...stats,
      totalMentees: prevStats.totalMentees, // Preserve existing totalMentees
    }));
    setReviews(allReviews);
  };

  // Fetch data from backend API and overwrite default data if available
  useEffect(() => {
    // Scroll to top when component mounts or id changes
    window.scrollTo({ top: 0, behavior: "smooth" });

    const fetchMentorData = async () => {
      if (!id) return; // Nếu không có ID thì không fetch

      setLoading(true);
      setError(null);

      try {
        // Fetch mentor profile by ID first
        const mentorProfile = await profileApi.getMentorById(id);

        if (mentorProfile && mentorProfile.data) {
          setMentor(mentorProfile.data);

          // Extract totalMentees from the API response and update mentorStats
          const totalMentees = mentorProfile.data.totalMentees || 0;
          setMentorStats((prevStats) => ({
            ...prevStats,
            totalMentees: totalMentees,
          }));
        }

        // Fetch mentor's courses using ID from params
        const coursesRes = await courseApi.getCoursesByMentor(id);

        if (Array.isArray(coursesRes)) {
          setCourses(coursesRes);
          // Fetch mentor reviews and calculate statistics - pass courses data
          await fetchMentorReviews(id);
        } else {
          // Fetch mentor reviews without courses data
          await fetchMentorReviews(id);
        }
      } catch (err) {
        setError("Không thể tải dữ liệu mentor hoặc khóa học");

        // Fallback: Nếu có mentorData từ state (từ CourseDetail), sử dụng luôn
        const mentorDataFromState = location.state?.mentorData;
        if (mentorDataFromState) {
          setMentor({ user: mentorDataFromState });
        }
      }
      setLoading(false);
    };
    fetchMentorData();
  }, [id, location.state]); // Thêm location.state vào dependency array

  // Debug log when mentor state changes
  // Fetch purchased courses for smart navigation
  useEffect(() => {
    const fetchPurchasedCourses = async () => {
      if (!hasUserRole(user, "mentee")) return;

      // Check purchase status for displayed courses
      if (courses.length > 0) {
        const statusMap = new Map();

        await Promise.all(
          courses.map(async (course) => {
            const courseId = course._id || course.id || course.courseId;
            if (courseId) {
              try {
                const { response } = await courseApi.checkPurchaseStatus(
                  courseId
                );
                const isPurchased = response?.data?.isPurchased || false;
                statusMap.set(courseId, isPurchased);
              } catch (error) {
                console.error(
                  `Error checking purchase status for course ${courseId}:`,
                  error
                );
                statusMap.set(courseId, false);
              }
            }
          })
        );

        setPurchasedCoursesMap(statusMap);
        console.log("Purchase status checked for", statusMap.size, "courses");
      }
    };

    fetchPurchasedCourses();
  }, [user, courses]); // Depend on user and courses to check when courses are loaded

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
        toast.error("Không thể tải lịch mentor");
        setAvailabilities([]);
      } else {
        const availabilitiesData =
          response?.availabilities ||
          response?.data?.availabilities ||
          response?.data ||
          [];
        setAvailabilities(
          Array.isArray(availabilitiesData) ? availabilitiesData : []
        );
      }
    } catch (err) {
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

    if (!hasUserRole(user, "mentee")) {
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
        toast.error(error?.message || "Có lỗi xảy ra khi đặt lịch");
      }
    } catch (err) {
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

  const mentorCoursesRef = useRef<any>(null);
  const [hoveredCarousel, setHoveredCarousel] = useState<any>(null);
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
    <div className="flex min-h-[100dvh] flex-col bg-[var(--ui-page)] py-0">
      <main
        className={`w-full flex flex-col ${showBookingModal ? "blur-sm" : ""}`}
      >
        <div className="w-full p-0 py-10">
          {/* Mentor Info Section - fetch and display real data */}
          {mentor && (
            <div className="ui-card mx-auto mb-12 flex w-[calc(100%-2rem)] max-w-7xl flex-col px-5 py-8 sm:px-8 lg:flex-row lg:items-start lg:justify-between lg:gap-8 lg:px-10">
              {/* Left info + about */}
              <div className="flex-1 min-w-0 max-w-full lg:max-w-[calc(100%-21rem)] pr-0 lg:pr-8">
                <div className="ui-eyebrow mb-4">Verified mentor</div>
                <h1 className="mb-2 text-4xl font-extrabold tracking-[-0.045em] text-[var(--ui-text)] sm:text-5xl">
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
                <div className="relative mb-6 flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-4 border-[var(--ui-surface)] bg-[var(--ui-accent-soft)] text-4xl font-extrabold text-[var(--ui-accent)] shadow">
                  <span>{(mentor?.profile?.firstName?.[0] || mentor?.user?.firstName?.[0] || "M").toUpperCase()}</span>
                  {(mentor?.profile?.avatarUrl || mentor?.user?.avatarUrl) && (
                    <img
                      src={mentor?.profile?.avatarUrl || mentor?.user?.avatarUrl}
                      alt={mentor?.profile?.firstName || mentor?.user?.firstName || "Mentor"}
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                </div>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  {((mentor?.profile?.links?.website &&
                    mentor.profile.links.website.trim() !== "") ||
                    (mentor?.user?.website &&
                      mentor.user.website.trim() !== "")) && (
                    <a
                      href={
                        mentor?.profile?.links?.website || mentor?.user?.website
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded border border-gray-300 py-2 text-center font-medium text-gray-700 transition hover:bg-gray-100"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Website
                    </a>
                  )}
                  {((mentor?.profile?.links?.twitter &&
                    mentor.profile.links.twitter.trim() !== "") ||
                    (mentor?.user?.twitter &&
                      mentor.user.twitter.trim() !== "")) && (
                    <a
                      href={
                        mentor?.profile?.links?.twitter || mentor?.user?.twitter
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded border border-gray-300 py-2 text-center font-medium text-gray-700 transition hover:bg-gray-100"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaXTwitter aria-hidden="true" className="h-4 w-4" />
                      X / Twitter
                    </a>
                  )}
                  {((mentor?.profile?.links?.linkedin &&
                    mentor.profile.links.linkedin.trim() !== "") ||
                    (mentor?.user?.linkedinUrl &&
                      mentor.user.linkedinUrl.trim() !== "")) && (
                    <a
                      href={
                        mentor?.profile?.links?.linkedin ||
                        mentor?.user?.linkedinUrl
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded border border-gray-300 py-2 text-center font-medium text-gray-700 transition hover:bg-gray-100"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaLinkedin aria-hidden="true" className="h-4 w-4" />
                      LinkedIn
                    </a>
                  )}
                  {((mentor?.profile?.links?.github &&
                    mentor.profile.links.github.trim() !== "") ||
                    (mentor?.user?.github &&
                      mentor.user.github.trim() !== "")) && (
                    <a
                      href={
                        mentor?.profile?.links?.github || mentor?.user?.github
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded border border-gray-300 py-2 text-center font-medium text-gray-700 transition hover:bg-gray-100"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaGithub aria-hidden="true" className="h-4 w-4" />
                      GitHub
                    </a>
                  )}
                  {((mentor?.profile?.links?.youtube &&
                    mentor.profile.links.youtube.trim() !== "") ||
                    (mentor?.user?.youtube &&
                      mentor.user.youtube.trim() !== "")) && (
                    <a
                      href={
                        mentor?.profile?.links?.youtube || mentor?.user?.youtube
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded border border-gray-300 py-2 text-center font-medium text-gray-700 transition hover:bg-gray-100"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaYoutube aria-hidden="true" className="h-4 w-4" />
                      YouTube
                    </a>
                  )}
                  {((mentor?.profile?.links?.facebook &&
                    mentor.profile.links.facebook.trim() !== "") ||
                    (mentor?.user?.facebook &&
                      mentor.user.facebook.trim() !== "")) && (
                    <a
                      href={
                        mentor?.profile?.links?.facebook ||
                        mentor?.user?.facebook
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded border border-gray-300 py-2 text-center font-medium text-gray-700 transition hover:bg-gray-100"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaFacebook aria-hidden="true" className="h-4 w-4" />
                      Facebook
                    </a>
                  )}
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
                  <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-4 py-3">
                    <p className="text-xs font-semibold text-[var(--ui-text-muted)]">Consultation fee</p>
                    <div className="mt-1 flex items-baseline justify-between gap-3">
                      <strong className="text-xl text-[var(--ui-text)]">
                        {formatVnd(Number(mentor?.profile?.sessionPrice || 0))}
                      </strong>
                      <span className="text-sm text-[var(--ui-text-muted)]">/ session</span>
                    </div>
                  </div>
                  {/* Only show Book Now button for mentees */}
                  {isMenteeView && (
                    <>
                      <button
                        type="button"
                        aria-pressed={isFavorite}
                        disabled={!mentorTargetId || favoriteMutation.isPending}
                        onClick={() =>
                          favoriteMutation.mutate({
                            mentorId: mentorTargetId,
                            active: isFavorite,
                          })
                        }
                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--ui-surface-muted)] px-4 text-sm font-bold text-[var(--ui-text)] transition-colors hover:bg-[var(--ui-accent-soft)] hover:text-[var(--ui-accent)] disabled:opacity-50"
                      >
                        <IconHeart
                          size={19}
                          fill={isFavorite ? "currentColor" : "none"}
                        />
                        {isFavorite ? "Saved mentor" : "Save mentor"}
                      </button>
                      <button
                        className="min-h-11 w-full rounded bg-[var(--ui-accent-fill)] py-2 font-semibold text-white transition-colors hover:bg-[var(--ui-accent-fill-hover)]"
                        onClick={openBookingModal}
                      >
                        Book Now
                      </button>
                    </>
                  )}
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
                          {formatVnd(Number(course.price) || 0)}
                        </div>

                        {/* Add to Cart and Buy Now buttons for mentees */}
                        {hasUserRole(user, "mentee") && (
                          <div className="flex flex-col gap-2 mt-3">
                            {isCourseAlreadyPurchased(
                              course._id || course.id
                            ) ? (
                              <>
                                <div className="w-full bg-green-100 text-green-700 py-2 px-3 rounded-md text-sm font-medium text-center">
                                  Already Purchased
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

          {/* Reviews Section */}
          <section className="w-full py-14 bg-white">
            <div className="max-w-7xl mx-auto w-full px-2 md:px-4">
              {/* Section Header */}
              <div className="mb-8">
                <h3 className="text-[24px] font-bold text-[#222] mb-2">
                  Reviews from Mentees
                </h3>
                <p className="text-gray-600">
                  What students say about their experience with this mentor
                </p>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-12 gap-8">
                {(() => {
                  const ratingBreakdown = getRatingBreakdown(reviews);

                  return (
                    <>
                      {/* Left Column - Rating Summary */}
                      <div className="col-span-12 lg:col-span-4">
                        <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                          {/* Overall Rating */}
                          <div className="text-center mb-6">
                            <div className="text-4xl font-bold text-gray-900 mb-2">
                              {mentorStats.averageRating
                                ? mentorStats.averageRating.toFixed(1)
                                : "0.0"}
                            </div>
                            <div className="flex items-center justify-center gap-1 mb-2">
                              {renderStars(mentorStats.averageRating || 0)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {mentorStats.totalReviews} total reviews
                            </div>
                          </div>

                          {/* Review Type Breakdown */}
                          <div className="space-y-3 mb-6">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-blue-700">
                                Course Reviews
                              </span>
                              <span className="text-sm font-bold text-blue-600">
                                {mentorStats.courseReviews || 0}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-green-700">
                                Consultation Reviews
                              </span>
                              <span className="text-sm font-bold text-green-600">
                                {mentorStats.consultationReviews || 0}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-purple-700">
                                General Reviews
                              </span>
                              <span className="text-sm font-bold text-purple-600">
                                {mentorStats.mentorOnlyReviews || 0}
                              </span>
                            </div>
                          </div>

                          {/* Star Distribution */}
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">
                              Rating Distribution
                            </h4>
                            {[5, 4, 3, 2, 1].map((star) => (
                              <div
                                key={star}
                                className="flex items-center gap-3"
                              >
                                <div className="flex items-center gap-1 w-8">
                                  <span className="text-sm text-gray-600">
                                    {star}
                                  </span>
                                  <span className="text-xs">/5</span>
                                </div>
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                                    style={{
                                      width: `${ratingBreakdown.percentages[star]}%`,
                                    }}
                                  ></div>
                                </div>
                                <div className="text-xs text-gray-500 w-8 text-right">
                                  {ratingBreakdown.counts[star]}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Review List */}
                      <div className="col-span-12 lg:col-span-8">
                        <div className="h-[600px] overflow-y-auto pr-2 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                          {Array.isArray(reviews) && reviews.length > 0 ? (
                            reviews.map((rv, idx) => {
                              // Get user information from multiple possible sources
                              const reviewUser =
                                rv.author || rv.user || rv.mentee;
                              const userName =
                                reviewUser?.fullName ||
                                (reviewUser?.firstName && reviewUser?.lastName
                                  ? `${reviewUser.firstName} ${reviewUser.lastName}`.trim()
                                  : "") ||
                                reviewUser?.userName ||
                                reviewUser?.name ||
                                reviewUser?.username ||
                                "Anonymous Student";

                              const avatar =
                                reviewUser?.avatarUrl ||
                                reviewUser?.avatar ||
                                reviewUser?.photo ||
                                reviewUser?.profilePicture ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  userName
                                )}&background=e1f5fe&color=0277bd&size=128`;

                              // Determine review type and get specific details
                              const isCourse = !!(
                                rv.course ||
                                rv.courseId ||
                                rv.course_id ||
                                rv.targetType === "Course"
                              );
                              const isBooking = !!(
                                rv.booking ||
                                rv.bookingId ||
                                rv.booking_id ||
                                rv.targetType === "Booking"
                              );
                              const isMentorReview =
                                rv.targetType === "Mentor" ||
                                (!isCourse && !isBooking);

                              let reviewType = "General Mentor";
                              let reviewTypeColor =
                                "bg-purple-100 text-purple-800";
                              let reviewDetails = "";

                              if (isCourse) {
                                reviewType = "Course Review";
                                reviewTypeColor = "bg-blue-100 text-blue-800";
                                reviewDetails =
                                  rv.course?.title ||
                                  rv.courseTitle ||
                                  "Course review";
                              } else if (isBooking) {
                                reviewType = "Consultation Review";
                                reviewTypeColor = "bg-green-100 text-green-800";
                                reviewDetails =
                                  rv.booking?.topic ||
                                  rv.bookingTopic ||
                                  "Consultation session";
                              } else {
                                reviewType = "Mentor Review";
                                reviewTypeColor =
                                  "bg-purple-100 text-purple-800";
                                reviewDetails = "General mentor evaluation";
                              }

                              const rating = Number(rv.rate || rv.rating) || 0;
                              const content =
                                rv.comment ||
                                rv.content ||
                                rv.text ||
                                rv.review ||
                                "";

                              const created =
                                rv.createdAt ||
                                rv.created_at ||
                                rv.updatedAt ||
                                rv.updated_at;
                              const dateStr = created
                                ? new Date(created).toLocaleDateString(
                                    "en-US",
                                    {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    }
                                  )
                                : "";

                              return (
                                <div
                                  key={rv._id || rv.id || idx}
                                  className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow"
                                >
                                  {/* Header with avatar and user info */}
                                  <div className="flex items-start gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 border-2 border-gray-100">
                                      <img
                                        src={avatar}
                                        alt={userName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                            userName
                                          )}&background=e1f5fe&color=0277bd&size=128`;
                                        }}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-semibold text-gray-900 truncate">
                                          {userName}
                                        </h4>
                                        <span
                                          className={`text-xs px-2 py-1 rounded-full font-medium ${reviewTypeColor}`}
                                        >
                                          {reviewType}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1">
                                          {renderStars(rating)}
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">
                                          {rating.toFixed(1)}
                                        </span>
                                        {dateStr && (
                                          <span className="text-sm text-gray-500 ml-2">
                                            • {dateStr}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Review subject/topic */}
                                  <div className="mb-3">
                                    <div className="text-sm font-medium text-gray-800 mb-1">
                                      {isCourse && (
                                        <span className="flex items-center gap-2">
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
                                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                            />
                                          </svg>
                                          Course: {reviewDetails}
                                        </span>
                                      )}
                                      {isBooking && (
                                        <span className="flex items-center gap-2">
                                          <svg
                                            className="w-4 h-4 text-green-600"
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
                                          Consultation: {reviewDetails}
                                        </span>
                                      )}
                                      {isMentorReview && (
                                        <span className="flex items-center gap-2">
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
                                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                            />
                                          </svg>
                                          Mentor: {reviewDetails}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Review content */}
                                  {content && (
                                    <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-4">
                                      "{content}"
                                    </p>
                                  )}
                                  {isBooking && rv.booking && (
                                    <div className="text-xs text-gray-500 bg-green-50 p-3 rounded-lg border-l-2 border-green-200">
                                      <div className="font-medium text-green-800 mb-1">
                                        Consultation Details:
                                      </div>
                                      <div>
                                        Topic:{" "}
                                        {rv.booking.topic ||
                                          "General consultation"}
                                      </div>
                                      {rv.booking.date && (
                                        <div>
                                          Date:{" "}
                                          {new Date(
                                            rv.booking.date
                                          ).toLocaleDateString()}
                                        </div>
                                      )}
                                      {rv.booking.duration && (
                                        <div>
                                          ⏱️ Duration: {rv.booking.duration}{" "}
                                          minutes
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-12">
                              <div className="text-gray-400 mb-2">
                                <svg
                                  className="w-16 h-16 mx-auto"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                  />
                                </svg>
                              </div>
                              <p className="text-gray-500 text-lg">
                                No reviews yet
                              </p>
                              <p className="text-gray-400 text-sm">
                                Be the first to leave a review for this mentor!
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
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
                          Date:{" "}
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
                        <div>
                          Fee: {formatVnd(Number(mentor?.profile?.sessionPrice || 0))}
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
