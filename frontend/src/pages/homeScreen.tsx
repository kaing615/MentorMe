// screens/HomeScreen.jsx
import React, { useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBrain,
  IconBriefcase,
  IconChartDots,
  IconCode,
  IconStarFilled,
  IconUsers,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

import oipImg from "../assets/OIP.webp";
import BoImg from "../assets/Bơ.jpg";
import BecomeMentor from "../assets/become-an-mentor.jpg";
import MentoringHero from "../assets/mentoring-hero.jpg";

import { MENTEE_PATH } from "../routes/path";
import { showLoading, hideLoading } from "../redux/features/loading.slice";
import { clearUser } from "../redux/features/user.slice";
import courseApi from "../api/modules/course.api.js";
import profileApi from "../api/modules/profile.api.js";
import cartApi from "../api/modules/cart.api.js";
import purchasedCourseApi from "../api/modules/purchasedCourse.api.js";
import reviewApi from "../api/modules/review.api.js";
import { toast } from "react-toastify";

const categories = [
  { icon: IconCode, name: "Engineering", description: "Build practical technical skills" },
  { icon: IconChartDots, name: "Product", description: "Turn ideas into useful products" },
  { icon: IconBriefcase, name: "Career", description: "Plan your next professional move" },
  { icon: IconBrain, name: "Leadership", description: "Lead people with more clarity" },
];

const fallbackCourses = [
  {
    title: "Programming Fundamentals",
    mentor: "Ronald Richards",
    rating: 4.8,
    ratings: 1200,
    hours: 22,
    lectures: 155,
    level: "Beginner",
    price: 149.9,
    img: oipImg,
  },
  {
    title: "UI/UX Design Basics",
    mentor: "Jane Smith",
    rating: 4.7,
    ratings: 980,
    hours: 18,
    lectures: 120,
    level: "Beginner",
    price: 129.9,
    img: BoImg,
  },
  {
    title: "Digital Marketing 101",
    mentor: "Alex Johnson",
    rating: 4.9,
    ratings: 1500,
    hours: 25,
    lectures: 180,
    level: "Intermediate",
    price: 159.9,
    img: oipImg,
  },
  {
    title: "Data Science Bootcamp",
    mentor: "Emily Lee",
    rating: 4.8,
    ratings: 1100,
    hours: 30,
    lectures: 200,
    level: "Advanced",
    price: 199.9,
    img: BoImg,
  },
  {
    title: "Business Analytics",
    mentor: "Chris Martin",
    rating: 4.6,
    ratings: 900,
    hours: 20,
    lectures: 140,
    level: "Intermediate",
    price: 139.9,
    img: oipImg,
  },
  {
    title: "Frontend Development",
    mentor: "Sara Kim",
    rating: 4.9,
    ratings: 1700,
    hours: 28,
    lectures: 210,
    level: "Advanced",
    price: 189.9,
    img: BoImg,
  },
];

const mentors = [
  { name: "First", students: "2400", reviews: "4.9", img: BoImg },
  { name: "Jane Smith", students: "1800", reviews: "4.8", img: oipImg },
  { name: "Alex Johnson", students: "2100", reviews: "4.7", img: BoImg },
  { name: "Emily Lee", students: "1950", reviews: "4.9", img: oipImg },
  { name: "Chris Martin", students: "1700", reviews: "4.6", img: BoImg },
  { name: "Last", students: "2200", reviews: "4.9", img: oipImg },
];

// Fallback mentors data for when API fails
const fallbackMentors = [
  {
    name: "First",
    students: "2400",
    reviews: "4.9",
    img: BoImg,
    jobTitle: "UI/UX Designer",
    category: "Design",
  },
  {
    name: "Jane Smith",
    students: "1800",
    reviews: "4.8",
    img: oipImg,
    jobTitle: "Frontend Developer",
    category: "Development",
  },
  {
    name: "Alex Johnson",
    students: "2100",
    reviews: "4.7",
    img: BoImg,
    jobTitle: "Marketing Expert",
    category: "Marketing",
  },
  {
    name: "Emily Lee",
    students: "1950",
    reviews: "4.9",
    img: oipImg,
    jobTitle: "Data Scientist",
    category: "Data Science",
  },
  {
    name: "Chris Martin",
    students: "1700",
    reviews: "4.6",
    img: BoImg,
    jobTitle: "Business Analyst",
    category: "Business",
  },
  {
    name: "Last",
    students: "2200",
    reviews: "4.9",
    img: oipImg,
    jobTitle: "Product Manager",
    category: "Product",
  },
];

// Native horizontal scroll blocker (optional hook)
const useHorizontalScrollBlockSwipe = () => {
  const ref = useRef<any>(null);
  useEffect(() => {
    const handleTouchMove = (e) => {
      e.stopPropagation();
    };
    const node = ref.current;
    if (node)
      node.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => node && node.removeEventListener("touchmove", handleTouchMove);
  }, []);
  return ref;
};

const HomeScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: any) => state.user);

  // --- AUTH CHECK (mentor và mentee đều được xem) ---
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
    // Check role - chỉ mentor và mentee được phép vào
    if (user.role === "mentor" || user.role === "mentee") {
      return;
    }
    // Nếu không phải mentor hoặc mentee, redirect về signin
    navigate("/auth/signin");
    return;
  }, [navigate]);

  const [topCourses, setTopCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState<any>(false);
  const [topMentors, setTopMentors] = useState<any[]>([]);
  const [mentorsLoading, setMentorsLoading] = useState<any>(false);
  // State để lưu purchased courses status
  const [purchasedCoursesMap, setPurchasedCoursesMap] = useState<any>(new Map());

  const coursesRef = useRef<any>(null);
  const mentorsRef = useRef<any>(null);
  const [hoveredCarousel, setHoveredCarousel] = useState<any>(null);

  const dragCourses = useHorizontalScrollBlockSwipe();
  const dragMentors = useHorizontalScrollBlockSwipe();

  const computeMentorStats = async (mentorId) => {
    // 1) Lấy toàn bộ khóa học của mentor để suy ra mentee (unique)
    const menteeSet = new Set();
    try {
      const coursesRes = await courseApi.getCoursesByMentor(mentorId);
      const courses = Array.isArray(coursesRes) ? coursesRes : [];
      courses.forEach((c) => {
        if (Array.isArray(c?.mentees)) {
          c.mentees.forEach((m) => {
            const id = typeof m === "string" ? m : m?._id || m?.id;
            if (id) menteeSet.add(id);
          });
        }
      });
    } catch (_) {}

    // 2) Lấy reviews (course + booking) rồi tính trung bình
    let allReviews = [];
    try {
      const { response: cr } = await reviewApi.getMentorCourseReviews(mentorId);
      const courseReviews = cr?.data?.items || [];
      allReviews = allReviews.concat(courseReviews);
    } catch (_) {}
    try {
      const { response: br } = await reviewApi.getBookingReviews(mentorId);
      const bookingReviews = br?.data?.items || [];
      allReviews = allReviews.concat(bookingReviews);
    } catch (_) {}

    const totalReviews = allReviews.length;
    const averageRating = totalReviews
      ? Math.round(
          (allReviews.reduce((s, r) => s + (Number(r.rate) || 0), 0) /
            totalReviews) *
            10
        ) / 10
      : 0;

    return {
      totalMentees: menteeSet.size,
      totalReviews,
      averageRating,
    };
  };

  // Helper function to check if course is already purchased
  const isCourseAlreadyPurchased = (courseId) => {
    // Check from API-based purchasedCoursesMap (Course.mentees array check)
    return (
      purchasedCoursesMap.has(courseId) && purchasedCoursesMap.get(courseId)
    );
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

    const courseId = course._id || course.id || course.courseId;

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
        // Fallback to localStorage
        const existingCart = localStorage.getItem("mockCart");
        const cartItems = existingCart ? JSON.parse(existingCart) : [];

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
          image: course.thumbnailUrl || course.thumbnail || course.img,
          mentor:
            course?.mentor?.userName ||
            course?.mentor?.email ||
            course?.mentor?.fullName ||
            course?.mentor ||
            "Unknown Mentor",
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
  const handleBuyNow = async (e, course) => {
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

    const courseId = course._id || course.id || course.courseId;

    // Check if course is already purchased
    if (isCourseAlreadyPurchased(courseId)) {
      toast.info(
        "You have already purchased this course! Check 'My Courses' in your profile."
      );
      return;
    }

    // Kiểm tra nếu đã có trong giỏ hàng
    let alreadyInCart = false;
    try {
      // Ưu tiên kiểm tra qua API nếu có
      if (cartApi && cartApi.getCart) {
        const { response } = await cartApi.getCart();
        if (response && Array.isArray(response.items)) {
          alreadyInCart = response.items.some(
            (item) => (item._id || item.id) === courseId
          );
        }
      }
    } catch {
      // Fallback localStorage
      const existingCart = localStorage.getItem("mockCart");
      const cartItems = existingCart ? JSON.parse(existingCart) : [];
      alreadyInCart = cartItems.some(
        (item) => (item._id || item.id) === courseId
      );
    }

    if (alreadyInCart) {
      // Nếu đã có trong giỏ hàng thì chuyển tới giỏ hàng và cuộn lên đầu trang
      navigate("/shoppingcart");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Nếu chưa có thì thêm vào giỏ hàng
    try {
      dispatch(showLoading());
      // Thêm qua API nếu có
      if (cartApi && cartApi.addToCart) {
        await cartApi.addToCart({ courseId }, dispatch);
      } else {
        // Fallback localStorage
        const existingCart = localStorage.getItem("mockCart");
        const cartItems = existingCart ? JSON.parse(existingCart) : [];
        cartItems.push({
          id: courseId,
          _id: courseId,
          title: course.title,
          price: course.price,
          image: course.thumbnailUrl || course.thumbnail || course.img,
          mentor:
            course?.mentor?.userName ||
            course?.mentor?.email ||
            course?.mentor?.fullName ||
            course?.mentor ||
            "Unknown Mentor",
          addedAt: new Date().toISOString(),
        });
        localStorage.setItem("mockCart", JSON.stringify(cartItems));
      }
      toast.success("Course added to cart successfully!");
    } catch (error) {
      toast.error("Failed to add course to cart");
      dispatch(hideLoading());
      return;
    }

    // Chuyển tới giỏ hàng và cuộn lên đầu trang
    navigate("/shoppingcart");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSeeAllCourses = () => {
    const userStr = localStorage.getItem("user");
    let user = null;
    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      user = null;
    }
    if (user && user.role === "mentor") {
      navigate("/mentor/all-courses");
    } else {
      navigate("/all-courses");
    }
  };
  const handleSeeAllMentors = () => {
    // Lưu tab "mentors" vào localStorage trước khi navigate
    localStorage.setItem("searchPageActiveTab", "mentors");
    navigate(`/platform/search`);
  };

  const handleMentorClick = (mentorId) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate(`/mentor/${mentorId}`);
  };

  useEffect(() => {
    // block horizontal-only wheel in testimonials
    const carousel = document.getElementById("testimonial-carousel");
    if (!carousel) return;
    const blockHorizontalWheel = (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) e.preventDefault();
    };
    carousel.addEventListener("wheel", blockHorizontalWheel, {
      passive: false,
    });
    carousel.addEventListener("touchmove", blockHorizontalWheel, {
      passive: false,
    });
    return () => {
      carousel.removeEventListener("wheel", blockHorizontalWheel);
      carousel.removeEventListener("touchmove", blockHorizontalWheel);
    };
  }, []);

  const scrollCarouselBy = (ref, direction, itemSelector = "button") => {
    const container = ref.current;
    if (!container) return;
    const card = container.querySelector(itemSelector);
    let cardWidth = 320; // fallback
    let gap = 32;
    if (card) {
      const track = container.firstElementChild;
      if (track) {
        const trackStyle = window.getComputedStyle(track);
        gap = parseInt(trackStyle.columnGap || trackStyle.gap || "32", 10);
        cardWidth = card.offsetWidth;
      }
    }
    const scrollAmount = (cardWidth + gap) * 3;
    container.scrollBy({ left: direction * scrollAmount, behavior: "smooth" });
  };

  useEffect(() => {
    const fetchTopCourses = async () => {
      setCoursesLoading(true);
      try {
        const { response, err } = await courseApi.getTopCourses({
          limit: 6,
          minRate: 4.0,
        });
        if (response) {
          const coursesData = response.data?.courses || response.courses || [];
          setTopCourses(Array.isArray(coursesData) ? coursesData : []);
        } else {
          console.error("Failed to fetch top courses:", err);
          setTopCourses([]);
        }
      } catch (error) {
        console.error("Error fetching top courses:", error);
        setTopCourses([]);
      } finally {
        setCoursesLoading(false);
      }
    };
    fetchTopCourses();
  }, []);

  // Fetch top mentors from API
  useEffect(() => {
    const fetchTopMentors = async () => {
      setMentorsLoading(true);
      try {
        const response = await profileApi.getTopMentors(6);
        const raw = response?.data?.mentors || fallbackMentors;
        // Enrich mỗi mentor với stats
        const enriched = await Promise.all(
          raw.map(async (m) => {
            const mentorId = m?._id || m?.id || m?.user?._id || m?.user?.id;
            if (!mentorId)
              return {
                ...m,
                averageRating: 0,
                totalReviews: 0,
                totalMentees: 0,
              };
            const stats = await computeMentorStats(mentorId);
            return { ...m, ...stats };
          })
        );
        setTopMentors(enriched);
      } catch (error) {
        console.error("Error fetching top mentors:", error);
        setTopMentors(fallbackMentors);
      } finally {
        setMentorsLoading(false);
      }
    };
    fetchTopMentors();
  }, []);

  // Fetch purchased courses for smart navigation
  useEffect(() => {
    const fetchPurchasedCourses = async () => {
      if (!user || user.role !== "mentee") return;

      // Check purchase status for displayed courses
      if (topCourses.length > 0) {
        const statusMap = new Map();

        await Promise.all(
          topCourses.map(async (course) => {
            const courseId = course._id || course.id || course.courseId;
            if (courseId) {
              try {
                const { response, error } = await courseApi.checkPurchaseStatus(
                  { courseId },
                  dispatch
                );
                if (response?.data?.isPurchased) {
                  statusMap.set(courseId, true);
                }
              } catch (error) {
                console.error(
                  `Error checking purchase status for course ${courseId}:`,
                  error
                );
              }
            }
          })
        );

        setPurchasedCoursesMap(statusMap);
        console.log("Purchase status checked for", statusMap.size, "courses");
      }
    };

    fetchPurchasedCourses();
  }, [user, topCourses]); // Depend on topCourses to check when courses are loaded

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[var(--ui-page)]">
      {/* Hero */}
      <section className="bg-[var(--ui-surface)] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="w-full max-w-xl">
          <h1 className="max-w-[13ch] text-4xl font-extrabold leading-[1.05] tracking-[-0.045em] text-[var(--ui-text)] sm:text-5xl lg:text-6xl">
            Build momentum with expert guidance.
          </h1>
          <p className="mt-6 max-w-[48ch] text-base leading-7 text-[var(--ui-text-muted)] sm:text-lg">
            Learn with experienced mentors through focused sessions built around your goals.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={handleSeeAllCourses}
              className="min-h-12 whitespace-nowrap rounded-xl bg-[var(--ui-accent)] px-6 py-3 font-bold text-white transition-colors hover:bg-[var(--ui-accent-strong)] active:translate-y-px"
            >
              Browse courses
            </button>
            <button
              onClick={() => navigate("/all-mentors")}
              className="min-h-12 whitespace-nowrap rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] px-6 py-3 font-bold text-[var(--ui-text)] transition-colors hover:bg-[var(--ui-surface-muted)] active:translate-y-px"
            >
              Find a mentor
            </button>
          </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] shadow-[var(--ui-shadow)]">
            <img
              src={MentoringHero}
              alt="A learner and mentor reviewing a practical learning plan"
              className="aspect-[3/2] h-full w-full object-cover"
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="w-full bg-[var(--ui-surface)] px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-6 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-4 py-6 text-center sm:grid-cols-4 sm:gap-y-0">
          {[
            { label: "1:1", desc: "Focused mentor sessions" },
            { label: "Flexible", desc: "Online or in person" },
            { label: "Direct", desc: "Message your mentor" },
            { label: "Practical", desc: "Guidance for real goals" },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`min-w-0 px-2 sm:px-4 ${
                idx % 2 !== 0 ? "border-l border-[var(--ui-border)]" : ""
              } ${
                idx === 2 ? "sm:border-l sm:border-[var(--ui-border)]" : ""
              }`}
            >
              <h3 className="mb-1 text-lg font-extrabold text-[var(--ui-text)] sm:text-xl">
                {item.label}
              </h3>
              <p className="text-xs leading-5 text-[var(--ui-text-muted)] sm:text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top Categories */}
      <section className="w-full bg-[var(--ui-surface)] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-[var(--ui-text)]">
              Top Categories
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {categories.map((cat) => {
              const CategoryIcon = cat.icon;
              return (
              <div
                key={cat.name}
                className="flex flex-col gap-4 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] px-5 py-7 transition-transform hover:-translate-y-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--ui-accent-soft)] text-[var(--ui-accent)]">
                  <CategoryIcon aria-hidden="true" size={25} stroke={1.7} />
                </div>
                <span className="text-lg font-extrabold text-[var(--ui-text)]">
                  {cat.name}
                </span>
                <span className="text-sm leading-6 text-[var(--ui-text-muted)]">
                  {cat.description}
                </span>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Top Courses */}
      <section className="w-full border-t border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-center mb-6 px-2">
            <h2 className="text-2xl font-bold text-[#1A2233]">Top Courses</h2>
            <button
              onClick={handleSeeAllCourses}
              className="rounded-lg px-3 py-2 text-sm font-bold text-[var(--ui-accent)] transition-colors hover:bg-[var(--ui-accent-soft)]"
            >
              All courses
            </button>
          </div>

          <div
            className="group relative overflow-hidden"
            onMouseEnter={() => setHoveredCarousel("courses")}
            onMouseLeave={() => setHoveredCarousel(null)}
          >
            {/* Left button */}
            <button
              type="button"
              aria-label="Scroll left"
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-14 h-36 flex items-center justify-center transition-opacity duration-200 ${
                hoveredCarousel === "courses"
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              } bg-white/20 backdrop-blur-md rounded-full shadow-lg border border-white/40 hover:bg-white/40`}
              onClick={() => scrollCarouselBy(coursesRef, -1)}
            >
              <IconArrowLeft aria-hidden="true" size={28} stroke={1.8} />
            </button>
            {/* Right button */}
            <button
              type="button"
              aria-label="Scroll right"
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-14 h-36 flex items-center justify-center transition-opacity duration-200 ${
                hoveredCarousel === "courses"
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              } bg-white/20 backdrop-blur-md rounded-full shadow-lg border border-white/40 hover:bg-white/40`}
              onClick={() => scrollCarouselBy(coursesRef, 1)}
            >
              <IconArrowRight aria-hidden="true" size={28} stroke={1.8} />
            </button>

            <div
              ref={coursesRef}
              className="top-courses-drag overflow-x-auto whitespace-nowrap select-none -mx-2 px-2 no-scrollbar"
              style={{
                WebkitOverflowScrolling: "touch",
                scrollSnapType: "x mandatory",
                scrollBehavior: "smooth",
              }}
              tabIndex={-1}
            >
              <div className="inline-flex gap-8" ref={dragCourses}>
                {coursesLoading
                  ? [...Array(3)].map((_, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-[18px] border border-[#D6E3F3] shadow-sm flex flex-col p-6 min-w-[290px] max-w-[320px] w-full animate-pulse"
                      >
                        <div className="w-full h-32 bg-gray-200 rounded-[14px] mb-4" />
                        <div className="h-4 bg-gray-200 rounded mb-2" />
                        <div className="h-3 bg-gray-200 rounded mb-2 w-3/4" />
                        <div className="h-3 bg-gray-200 rounded mb-2" />
                        <div className="h-3 bg-gray-200 rounded mb-2 w-1/2" />
                        <div className="h-6 bg-gray-200 rounded mt-2 w-1/3" />
                      </div>
                    ))
                  : (topCourses.length > 0 ? topCourses : fallbackCourses).map(
                      (course, idx) => {
                        const courseId =
                          course._id || course.id || course.courseId;
                        const price =
                          course.price ??
                          fallbackCourses[idx % fallbackCourses.length].price ??
                          0;
                        const rate = course.rate ?? course.rating ?? 0;
                        const hours = course.duration ?? course.hours ?? 0;
                        const lectures = course.lectures ?? 0;
                        const mentorName =
                          course?.mentor?.userName ||
                          course?.mentor?.email ||
                          course?.mentor?.fullName ||
                          course?.mentor ||
                          "Unknown Mentor";
                        return (
                          <div
                            key={courseId || idx}
                            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow min-h-[450px] flex flex-col cursor-pointer bg-white"
                            onClick={() => {
                              if (courseId)
                                navigate(`/course-detail/${courseId}`);
                            }}
                            style={{
                              outline: "none",
                              scrollSnapAlign: "start",
                              minWidth: "320px",
                              maxWidth: "320px",
                            }}
                          >
                            <img
                              src={
                                course.thumbnailUrl ||
                                course.thumbnail ||
                                course.img ||
                                oipImg
                              }
                              alt={course.title || "Course"}
                              className="w-full h-48 object-cover"
                              onError={(e) => (e.currentTarget.src = oipImg)}
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
                                  {course.title || "Untitled Course"}
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
                                    return mentorName;
                                  })()}
                                </p>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="flex text-yellow-400 text-sm">
                                    {"★".repeat(Math.floor(rate || 0))}
                                    {(rate || 0) % 1 !== 0 && "☆"}
                                  </div>
                                  <span className="text-sm text-gray-600">
                                    ({course.numberOfRatings || 0} Ratings)
                                  </span>
                                </div>
                                <div className="text-sm text-gray-700 mb-1">
                                  {hours} Total Hours • {lectures} Lectures
                                </div>
                                <div className="text-sm text-gray-600 mb-2">
                                  {course.category || "General"}
                                </div>

                                {/* Hiển thị tags (Programming Languages) */}
                                {course.tags && course.tags.length > 0 && (
                                  <div className="mb-2">
                                    <div className="flex flex-wrap gap-1">
                                      {course.tags
                                        .slice(0, 3)
                                        .map((tag, index) => (
                                          <span
                                            key={index}
                                            className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium"
                                          >
                                            {tag}
                                          </span>
                                        ))}
                                      {course.tags.length > 3 && (
                                        <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                                          +{course.tags.length - 3} more
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Hiển thị languages */}
                                {course.language &&
                                  course.language.length > 0 && (
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
                                              className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
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
                              </div>
                              <p className="font-bold text-xl text-gray-900 mb-2 mt-auto">
                                $
                                {(() => {
                                  const priceNum =
                                    typeof price === "number"
                                      ? price
                                      : parseFloat(price || 0);
                                  return priceNum % 1 === 0
                                    ? priceNum.toLocaleString("en-US")
                                    : priceNum.toLocaleString("en-US", {
                                        minimumFractionDigits: 1,
                                        maximumFractionDigits: 2,
                                      });
                                })()}
                              </p>

                              {/* Add to Cart and Buy Now buttons for mentees */}
                              {user && user.role === "mentee" && (
                                <div className="flex flex-col gap-2 mt-2 mb-4">
                                  {isCourseAlreadyPurchased(courseId) ? (
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
                                        onClick={(e) =>
                                          handleAddToCart(e, course)
                                        }
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
                        );
                      }
                    )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Mentors */}
      <section className="w-full bg-[var(--ui-surface)] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="flex justify-between items-center mb-6 px-2">
            <h2 className="text-2xl font-bold text-[#1A2233]">Top Mentors</h2>
            <button
              onClick={handleSeeAllMentors}
              className="rounded-lg px-3 py-2 text-sm font-bold text-[var(--ui-accent)] transition-colors hover:bg-[var(--ui-accent-soft)]"
            >
              All mentors
            </button>
          </div>

          <div
            className="group relative overflow-hidden"
            onMouseEnter={() => setHoveredCarousel("mentors")}
            onMouseLeave={() => setHoveredCarousel(null)}
          >
            {/* Left */}
            <button
              type="button"
              aria-label="Scroll left"
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-14 h-36 flex items-center justify-center transition-opacity duration-200 ${
                hoveredCarousel === "mentors"
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              } bg-white/20 backdrop-blur-md rounded-full shadow-lg border border-white/40 hover:bg-white/40`}
              onClick={() => scrollCarouselBy(mentorsRef, -1, "button")}
            >
              <IconArrowLeft aria-hidden="true" size={28} stroke={1.8} />
            </button>
            {/* Right */}
            <button
              type="button"
              aria-label="Scroll right"
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-14 h-36 flex items-center justify-center transition-opacity duration-200 ${
                hoveredCarousel === "mentors"
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              } bg-white/20 backdrop-blur-md rounded-full shadow-lg border border-white/40 hover:bg-white/40`}
              onClick={() => scrollCarouselBy(mentorsRef, 1, "button")}
            >
              <IconArrowRight aria-hidden="true" size={28} stroke={1.8} />
            </button>

            <div
              ref={mentorsRef}
              className="top-mentors-drag overflow-x-auto whitespace-nowrap select-none -mx-2 px-2 no-scrollbar"
              style={{
                WebkitOverflowScrolling: "touch",
                scrollSnapType: "x mandatory",
                scrollBehavior: "smooth",
              }}
              tabIndex={-1}
            >
              <div className="inline-flex gap-8" ref={dragMentors}>
                {mentorsLoading
                  ? // Loading state
                    Array.from({ length: 6 }).map((_, idx) => (
                      <div
                        key={`loading-${idx}`}
                        className="bg-white rounded-[18px] border border-[#D6E3F3] shadow-sm flex flex-col items-center p-6 min-w-[260px] max-w-[300px] w-full animate-pulse"
                        style={{ scrollSnapAlign: "start" }}
                      >
                        <div className="w-28 h-28 bg-gray-200 rounded-[14px] mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="flex items-center justify-center gap-4 w-full mb-4">
                          <div className="h-3 bg-gray-200 rounded w-12"></div>
                          <div className="h-3 bg-gray-200 rounded w-20"></div>
                        </div>
                        <div className="w-full h-10 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))
                  : topMentors.map((mentor, idx) => (
                      <div
                        key={mentor._id || idx}
                        className="bg-white rounded-[18px] border border-[#D6E3F3] shadow-sm flex flex-col items-center p-6 min-w-[260px] max-w-[300px] w-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 group cursor-pointer"
                        role="button"
                        style={{ outline: "none", scrollSnapAlign: "start" }}
                        onClick={() => handleMentorClick(mentor._id)}
                      >
                        <img
                          src={mentor.avatarUrl || BoImg}
                          alt={
                            mentor.fullName ||
                            `${mentor.firstName} ${mentor.lastName}`
                          }
                          className="w-28 h-28 object-cover rounded-[14px] mb-4 group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            e.currentTarget.src = BoImg; // Fallback image
                          }}
                        />
                        <div className="flex flex-col items-center flex-1 w-full">
                          <div className="font-bold text-lg text-[#1A2233] mb-1 text-center">
                            {mentor.fullName ||
                              `${mentor.firstName || ""} ${
                                mentor.lastName || ""
                              }`.trim()}
                          </div>
                          <div className="text-sm text-[#6B7280] mb-2 text-center">
                            {mentor.jobTitle || "Professional"}
                          </div>
                          <div className="text-xs text-[#6B7280] mb-3 text-center">
                            {(() => {
                              let category = mentor.category || "General";

                              // If it's an array, take the first element
                              if (Array.isArray(category)) {
                                category = category[0] || "General";
                              }

                              // If it's a string with commas, take the first part
                              if (
                                typeof category === "string" &&
                                category.includes(",")
                              ) {
                                category = category.split(",")[0].trim();
                              }

                              return (
                                category.charAt(0).toUpperCase() +
                                category.slice(1).toLowerCase()
                              );
                            })()}
                          </div>
                          <div className="flex items-center justify-between w-full mb-4">
                            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 rounded-full">
                              <IconStarFilled aria-hidden="true" className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm font-bold text-yellow-700">
                                {(mentor.averageRating ?? 0).toFixed(1)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-full">
                              <IconUsers aria-hidden="true" className="h-4 w-4 text-blue-600" stroke={1.8} />
                              <span className="text-sm font-medium text-blue-800">
                                {mentor.totalMentees ?? 0}
                              </span>
                              <span className="text-xs text-blue-600">
                                students
                              </span>
                            </div>
                          </div>
                          <div className="w-full flex items-center justify-center gap-2 bg-[#2563eb] text-white font-semibold rounded-lg py-2 mt-auto text-base hover:bg-[#1749b1] transition">
                            View Profile
                            <IconArrowRight aria-hidden="true" size={19} stroke={1.8} />
                          </div>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Become a Mentor & Education */}
      <section className="w-full bg-[var(--ui-surface)] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-20 md:gap-28">
          {/* Mentor Card */}
          <div className="flex flex-col md:flex-row items-center md:items-stretch gap-10 md:gap-0">
            <div className="flex-1 flex justify-center items-center">
              <div className="relative w-[320px] h-[320px] md:w-[340px] md:h-[340px] flex items-center justify-center">
                <div className="absolute inset-0 rounded-[48px] bg-[#E6E6FA]" />
                <img
                  src={BecomeMentor}
                  alt="mentor"
                  className="w-full h-full object-cover rounded-[48px] relative z-10"
                />
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center md:pl-12">
              <h3 className="text-2xl md:text-3xl font-bold text-[#1A2233] mb-3 text-right md:text-left">
                Become a Mentor
              </h3>
              <p className="text-gray-600 text-base md:text-lg mb-6 max-w-lg text-right md:text-left">
                Instructors from around the world teach millions of students on
                MentorMe.
              </p>
              <div className="flex justify-end md:justify-start">
                <button
                  onClick={() => {
                    // Clear user data using Redux action (will also clear localStorage)
                    dispatch(clearUser());
                    // Clear all authentication related data from both localStorage and sessionStorage
                    localStorage.removeItem("user");
                    localStorage.removeItem("token");
                    localStorage.removeItem("actkn");
                    localStorage.removeItem("isLoggedIn");
                    sessionStorage.removeItem("user");
                    sessionStorage.removeItem("token");
                    sessionStorage.removeItem("actkn");
                    sessionStorage.removeItem("isLoggedIn");
                    // Reset header về trạng thái mặc định khi đăng xuất
                    localStorage.setItem("mentorMode", "false");
                    // Navigate to apply as mentor page
                    navigate("/auth/apply-as-men");
                    window.scrollTo(0, 0);
                    toast.success("Redirecting to mentor application!");
                  }}
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[var(--ui-text)] px-6 py-3 text-base font-bold text-[var(--ui-surface)] transition-opacity hover:opacity-85 active:translate-y-px"
                >
                  <span>Become a mentor</span>
                  <IconArrowRight aria-hidden="true" size={19} stroke={1.8} />
                </button>
              </div>
            </div>
          </div>

          {/* Education Card */}
          <div className="flex flex-col-reverse md:flex-row items-center md:items-stretch gap-10 md:gap-0">
            <div className="flex-1 flex flex-col justify-center md:pr-12">
              <h3 className="text-2xl md:text-3xl font-bold text-[#1A2233] mb-3 text-left">
                Transform your life through education
              </h3>
              <p className="text-gray-600 text-base md:text-lg mb-6 max-w-lg text-left">
                Learners around the world are launching new careers, advancing
                in their fields, and enriching their lives.
              </p>
              <div className="flex justify-start">
                <button
                  onClick={handleSeeAllCourses}
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[var(--ui-text)] px-6 py-3 text-base font-bold text-[var(--ui-surface)] transition-opacity hover:opacity-85 active:translate-y-px"
                >
                  <span>Browse courses</span>
                  <IconArrowRight aria-hidden="true" size={19} stroke={1.8} />
                </button>
              </div>
            </div>
            <div className="flex-1 flex justify-center items-center">
              <div className="relative w-[320px] h-[320px] md:w-[340px] md:h-[340px] flex items-center justify-center">
                <div className="absolute inset-0 rounded-[48px] bg-[#D6E3F3]" />
                <img
                  src={oipImg}
                  alt="education"
                  className="w-full h-full object-cover rounded-[48px] relative z-10"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeScreen;
