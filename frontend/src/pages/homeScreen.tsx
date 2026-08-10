// screens/HomeScreen.jsx
import React, { useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBriefcase,
  IconCode,
  IconMessageCircle,
  IconPalette,
  IconSearch,
  IconSpeakerphone,
  IconStarFilled,
  IconTrendingUp,
  IconUsers,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import BecomeMentor from "../assets/become-an-mentor.jpg";
import MentoringHero from "../assets/mentoring-hero.jpg";

import { showLoading, hideLoading } from "../redux/features/loading.slice";
import courseApi from "../api/modules/course.api.js";
import profileApi from "../api/modules/profile.api.js";
import cartApi from "../api/modules/cart.api.js";
import purchasedCourseApi from "../api/modules/purchasedCourse.api.js";
import reviewApi from "../api/modules/review.api.js";
import { hasUserRole } from "../utils/user-role";
import { toast } from "react-toastify";

const categories = [
  { icon: IconCode, name: "Programming", description: "Build practical technical skills" },
  { icon: IconPalette, name: "Design", description: "Create thoughtful digital experiences" },
  { icon: IconBriefcase, name: "Business", description: "Turn ideas into sustainable growth" },
  { icon: IconSpeakerphone, name: "Marketing", description: "Reach the right audience with clarity" },
];

gsap.registerPlugin(ScrollTrigger, useGSAP);

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
  const pageRef = useRef<any>(null);

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
    if (hasUserRole(user, "mentor") || hasUserRole(user, "mentee")) {
      return;
    }
    // Nếu không phải mentor hoặc mentee, redirect về signin
    navigate("/auth/signin");
    return;
  }, [navigate]);

  const [topCourses, setTopCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState<any>(false);
  const [coursesError, setCoursesError] = useState<any>(false);
  const [topMentors, setTopMentors] = useState<any[]>([]);
  const [mentorsLoading, setMentorsLoading] = useState<any>(false);
  const [mentorsError, setMentorsError] = useState<any>(false);
  // State để lưu purchased courses status
  const [purchasedCoursesMap, setPurchasedCoursesMap] = useState<any>(new Map());

  const coursesRef = useRef<any>(null);
  const mentorsRef = useRef<any>(null);
  const [hoveredCarousel, setHoveredCarousel] = useState<any>(null);

  const dragCourses = useHorizontalScrollBlockSwipe();
  const dragMentors = useHorizontalScrollBlockSwipe();

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from("[data-hero-copy] > *", {
            y: 24,
            opacity: 0,
            duration: 0.65,
            stagger: 0.08,
          })
          .from(
            "[data-hero-media]",
            { scale: 0.96, opacity: 0, duration: 0.8 },
            "<0.1",
          );

        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((section) => {
          ScrollTrigger.create({
            trigger: section,
            start: "top 86%",
            once: true,
            onEnter: () =>
              gsap.fromTo(
                section,
                { y: 28, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.7, ease: "power2.out" },
              ),
          });
        });
      });
      return () => media.revert();
    },
    { scope: pageRef },
  );

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
      navigate("/auth/signin");
      return;
    }

    if (!hasUserRole(user, "mentee")) {
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
      const { response, error } = await cartApi.addToCart(
        { courseId },
        dispatch,
      );
      if (error || !response) throw error || new Error("Cart unavailable");
      toast.success("Course added to cart successfully!");
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
      navigate("/auth/signin");
      return;
    }

    if (!hasUserRole(user, "mentee")) {
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
      const { response, error } = await cartApi.addToCart(
        { courseId },
        dispatch,
      );
      if (error || !response) throw error || new Error("Cart unavailable");
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
      setCoursesError(false);
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
          setCoursesError(true);
        }
      } catch (error) {
        console.error("Error fetching top courses:", error);
        setTopCourses([]);
        setCoursesError(true);
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
      setMentorsError(false);
      try {
        const response = await profileApi.getTopMentors(6);
        const raw = Array.isArray(response?.data?.mentors)
          ? response.data.mentors
          : [];
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
        setTopMentors([]);
        setMentorsError(true);
      } finally {
        setMentorsLoading(false);
      }
    };
    fetchTopMentors();
  }, []);

  // Fetch purchased courses for smart navigation
  useEffect(() => {
    const fetchPurchasedCourses = async () => {
      if (!hasUserRole(user, "mentee")) return;

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
    <div ref={pageRef} className="flex min-h-[100dvh] flex-col overflow-hidden bg-[var(--ui-page)]">
      {/* Hero */}
      <section className="ui-hero-surface relative bg-[var(--ui-surface)] px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="pointer-events-none absolute -right-36 -top-44 h-[32rem] w-[32rem] rounded-full bg-[var(--ui-accent-soft)] opacity-70 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:gap-16">
          <div data-hero-copy className="w-full max-w-2xl">
            <span className="ui-eyebrow ui-eyebrow-plain">Guidance that moves you forward</span>
            <h1 className="mt-6 max-w-[15ch] text-4xl font-[780] leading-[0.98] tracking-[-0.06em] text-[var(--ui-text)] sm:text-6xl">
              Learn faster with the right mentor.
            </h1>
            <p className="mt-6 max-w-[42ch] text-base leading-7 text-[var(--ui-text-muted)] sm:text-lg">
              Find focused guidance, practical courses, and a clearer path to your next goal.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/all-mentors")}
                className="min-h-12 whitespace-nowrap rounded-full bg-[var(--ui-accent-fill)] px-6 py-3 font-bold text-white shadow-[var(--ui-shadow-sm)] transition-all hover:-translate-y-0.5 hover:bg-[var(--ui-accent-fill-hover)]"
              >
                Find your mentor
              </button>
              <button
                onClick={handleSeeAllCourses}
                className="min-h-12 whitespace-nowrap rounded-full bg-[var(--ui-surface-muted)] px-6 py-3 font-bold text-[var(--ui-text)] transition-colors hover:bg-[var(--ui-accent-soft)]"
              >
                Explore courses
              </button>
            </div>
          </div>

          <div data-hero-media className="relative lg:pl-4">
            <div className="absolute -bottom-5 -left-5 h-32 w-32 rounded-[2rem] bg-[var(--ui-accent-soft)]" />
            <div className="ui-image-frame relative overflow-hidden rounded-[2rem] border border-[var(--ui-border)] shadow-[var(--ui-shadow-lg)]">
              <img
                src={MentoringHero}
                alt="A learner and mentor reviewing a practical learning plan"
                className="aspect-[4/3] h-full w-full object-cover"
                fetchPriority="high"
              />
              <div className="absolute inset-x-5 bottom-5 rounded-2xl bg-[color-mix(in_srgb,var(--ui-surface)_88%,transparent)] p-4 shadow-[var(--ui-shadow-sm)] backdrop-blur-md sm:max-w-xs">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--ui-accent)]">Your next step</p>
                <p className="mt-1 text-sm font-semibold leading-5 text-[var(--ui-text)]">Turn a big goal into a practical plan you can follow.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-reveal className="w-full bg-[var(--ui-surface)] px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
        <div className="mx-auto grid max-w-7xl gap-px overflow-hidden rounded-[1.75rem] border border-[var(--ui-border)] bg-[var(--ui-border)] md:grid-cols-3">
          {[
            { icon: IconSearch, step: "01", title: "Discover", copy: "Explore mentors and courses shaped around your goal." },
            { icon: IconMessageCircle, step: "02", title: "Connect", copy: "Choose a mentor, then agree on focus and format." },
            { icon: IconTrendingUp, step: "03", title: "Move forward", copy: "Apply the plan, ask better questions, and keep momentum." },
          ].map(({ icon: StepIcon, step, title, copy }) => (
            <div key={step} className="bg-[var(--ui-surface-muted)] p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <StepIcon aria-hidden="true" className="text-[var(--ui-accent)]" size={26} stroke={1.7} />
                <span className="text-xs font-extrabold tracking-[0.18em] text-[var(--ui-text-muted)]">{step}</span>
              </div>
              <h2 className="mt-8 text-xl font-extrabold tracking-[-0.03em] text-[var(--ui-text)]">{title}</h2>
              <p className="mt-2 max-w-[32ch] text-sm leading-6 text-[var(--ui-text-muted)]">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top Categories */}
      <section data-reveal className="w-full bg-[var(--ui-page)] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-9 max-w-2xl">
            <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--ui-accent)]">Explore by direction</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] text-[var(--ui-text)] sm:text-4xl">
              Start with what you want to build.
            </h2>
            <p className="mt-3 text-base leading-7 text-[var(--ui-text-muted)]">Choose a category to see real courses currently available.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {categories.map((cat) => {
              const CategoryIcon = cat.icon;
              return (
              <button
                type="button"
                key={cat.name}
                onClick={() => {
                  localStorage.setItem("searchPageActiveTab", "courses");
                  navigate(`/platform/search?category=${encodeURIComponent(cat.name)}`);
                }}
                className="ui-card ui-card-interactive flex min-h-56 flex-col gap-4 px-5 py-6 text-left"
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
                <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-[var(--ui-accent)]">
                  View courses <IconArrowRight aria-hidden="true" size={17} stroke={1.8} />
                </span>
              </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Top Courses */}
      <section data-reveal className="w-full bg-[var(--ui-surface)] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-7xl mx-auto w-full">
          <div className="mb-9 flex items-end justify-between gap-6 px-2">
            <div className="max-w-2xl">
              <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--ui-accent)]">Learn by doing</span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] text-[var(--ui-text)] sm:text-4xl">Courses built for practical progress.</h2>
            </div>
            <button
              onClick={handleSeeAllCourses}
              className="rounded-lg px-3 py-2 text-sm font-bold text-[var(--ui-accent)] transition-colors hover:bg-[var(--ui-accent-soft)]"
            >
              All courses
            </button>
          </div>

          <div
            className="group flex items-center gap-3 overflow-hidden"
            onMouseEnter={() => setHoveredCarousel("courses")}
            onMouseLeave={() => setHoveredCarousel(null)}
          >
            {/* Left button */}
            <button
              type="button"
              aria-label="Scroll left"
              className={`order-1 hidden h-11 w-11 shrink-0 items-center justify-center transition-opacity duration-200 sm:flex ${
                hoveredCarousel === "courses"
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              } rounded-full bg-[var(--ui-surface-raised)] text-[var(--ui-text)] shadow-[var(--ui-shadow-sm)] backdrop-blur-md hover:bg-[var(--ui-accent-soft)]`}
              onClick={() => scrollCarouselBy(coursesRef, -1)}
            >
              <IconArrowLeft aria-hidden="true" size={28} stroke={1.8} />
            </button>
            {/* Right button */}
            <button
              type="button"
              aria-label="Scroll right"
              className={`order-3 hidden h-11 w-11 shrink-0 items-center justify-center transition-opacity duration-200 sm:flex ${
                hoveredCarousel === "courses"
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              } rounded-full bg-[var(--ui-surface-raised)] text-[var(--ui-text)] shadow-[var(--ui-shadow-sm)] backdrop-blur-md hover:bg-[var(--ui-accent-soft)]`}
              onClick={() => scrollCarouselBy(coursesRef, 1)}
            >
              <IconArrowRight aria-hidden="true" size={28} stroke={1.8} />
            </button>

            <div
              ref={coursesRef}
              className="top-courses-drag order-2 min-w-0 flex-1 overflow-x-auto whitespace-nowrap select-none -mx-2 px-2 no-scrollbar"
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
                  : coursesError ? (
                    <div className="w-[calc(100vw-4rem)] max-w-3xl rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-8 text-left">
                      <p className="font-bold text-[var(--ui-text)]">Courses could not be loaded.</p>
                      <p className="mt-2 text-sm text-[var(--ui-text-muted)]">Please refresh and try again.</p>
                    </div>
                  ) : topCourses.length === 0 ? (
                    <div className="w-[calc(100vw-4rem)] max-w-3xl rounded-2xl border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-8 text-left">
                      <p className="font-bold text-[var(--ui-text)]">No courses found</p>
                      <p className="mt-2 text-sm text-[var(--ui-text-muted)]">Published courses will appear here.</p>
                    </div>
                  ) : topCourses.map(
                      (course, idx) => {
                        const courseId =
                          course._id || course.id || course.courseId;
                        const price = course.price ?? 0;
                        const thumbnail =
                          course.thumbnailUrl || course.thumbnail || course.img;
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
                            className="ui-card ui-card-interactive min-h-[450px] cursor-pointer overflow-hidden flex flex-col"
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
                            <div className="relative flex h-48 items-center justify-center overflow-hidden bg-[var(--ui-accent-soft)] text-[var(--ui-accent)]">
                              <IconCode aria-hidden="true" size={36} stroke={1.5} />
                              {thumbnail && (
                                <img
                                  src={thumbnail}
                                  alt={course.title || "Course"}
                                  className="absolute inset-0 h-full w-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              )}
                            </div>
                            <div className="flex-1 flex flex-col p-4 pb-0">
                              <div
                                className="flex flex-col"
                                style={{
                                  minHeight: "120px",
                                  justifyContent: "flex-start",
                                }}
                              >
                                <h4 className="mb-2 line-clamp-2 font-semibold text-[var(--ui-text)]">
                                  {course.title || "Untitled Course"}
                                </h4>
                                <p className="mb-2 text-sm text-[var(--ui-text-muted)]">
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
                                  <span className="text-sm text-[var(--ui-text-muted)]">
                                    ({course.numberOfRatings || 0} Ratings)
                                  </span>
                                </div>
                                <div className="mb-1 text-sm text-[var(--ui-text)]">
                                  {hours} Total Hours • {lectures} Lectures
                                </div>
                                <div className="mb-2 text-sm text-[var(--ui-text-muted)]">
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
                                            className="inline-block rounded-full bg-[var(--ui-accent-soft)] px-2 py-1 text-xs font-medium text-[var(--ui-accent)]"
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
                                      <p className="mb-1 text-xs text-[var(--ui-text-muted)]">
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
                              <p className="mb-2 mt-auto text-xl font-bold text-[var(--ui-text)]">
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
                              {hasUserRole(user, "mentee") && (
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
      <section data-reveal className="w-full bg-[var(--ui-page)] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-9 flex items-end justify-between gap-6 px-2">
            <div className="max-w-2xl">
              <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--ui-accent)]">Learn with someone who knows the path</span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] text-[var(--ui-text)] sm:text-4xl">Meet mentors available now.</h2>
            </div>
            <button
              onClick={handleSeeAllMentors}
              className="rounded-lg px-3 py-2 text-sm font-bold text-[var(--ui-accent)] transition-colors hover:bg-[var(--ui-accent-soft)]"
            >
              All mentors
            </button>
          </div>

          <div
            className="group flex items-center gap-3 overflow-hidden"
            onMouseEnter={() => setHoveredCarousel("mentors")}
            onMouseLeave={() => setHoveredCarousel(null)}
          >
            {/* Left */}
            <button
              type="button"
              aria-label="Scroll left"
              className={`order-1 hidden h-11 w-11 shrink-0 items-center justify-center transition-opacity duration-200 sm:flex ${
                hoveredCarousel === "mentors"
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              } rounded-full bg-[var(--ui-surface-raised)] text-[var(--ui-text)] shadow-[var(--ui-shadow-sm)] backdrop-blur-md hover:bg-[var(--ui-accent-soft)]`}
              onClick={() => scrollCarouselBy(mentorsRef, -1, "button")}
            >
              <IconArrowLeft aria-hidden="true" size={28} stroke={1.8} />
            </button>
            {/* Right */}
            <button
              type="button"
              aria-label="Scroll right"
              className={`order-3 hidden h-11 w-11 shrink-0 items-center justify-center transition-opacity duration-200 sm:flex ${
                hoveredCarousel === "mentors"
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              } rounded-full bg-[var(--ui-surface-raised)] text-[var(--ui-text)] shadow-[var(--ui-shadow-sm)] backdrop-blur-md hover:bg-[var(--ui-accent-soft)]`}
              onClick={() => scrollCarouselBy(mentorsRef, 1, "button")}
            >
              <IconArrowRight aria-hidden="true" size={28} stroke={1.8} />
            </button>

            <div
              ref={mentorsRef}
              className="top-mentors-drag order-2 min-w-0 flex-1 overflow-x-auto whitespace-nowrap select-none -mx-2 px-2 no-scrollbar"
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
                  : mentorsError ? (
                    <div className="w-[calc(100vw-4rem)] max-w-3xl rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-8 text-left">
                      <p className="font-bold text-[var(--ui-text)]">Mentors could not be loaded.</p>
                      <p className="mt-2 text-sm text-[var(--ui-text-muted)]">Please refresh and try again.</p>
                    </div>
                  ) : topMentors.length === 0 ? (
                    <div className="w-[calc(100vw-4rem)] max-w-3xl rounded-2xl border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface)] p-8 text-left">
                      <p className="font-bold text-[var(--ui-text)]">No mentors found</p>
                      <p className="mt-2 text-sm text-[var(--ui-text-muted)]">Approved mentor profiles will appear here.</p>
                    </div>
                  ) : topMentors.map((mentor, idx) => (
                      <div
                        key={mentor._id || idx}
                        className="ui-card ui-card-interactive group flex w-full min-w-[260px] max-w-[300px] cursor-pointer flex-col items-center p-6 focus:outline-none focus:ring-2 focus:ring-[var(--ui-accent)]"
                        role="button"
                        style={{ outline: "none", scrollSnapAlign: "start" }}
                        onClick={() => handleMentorClick(mentor._id)}
                      >
                        <div className="relative mb-4 flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl bg-[var(--ui-accent-soft)] text-2xl font-extrabold text-[var(--ui-accent)]">
                          <span>{(mentor.firstName?.[0] || mentor.fullName?.[0] || "M").toUpperCase()}</span>
                          {mentor.avatarUrl && (
                            <img
                              src={mentor.avatarUrl}
                              alt={mentor.fullName || `${mentor.firstName || ""} ${mentor.lastName || ""}`.trim() || "Mentor"}
                              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                        </div>
                        <div className="flex flex-col items-center flex-1 w-full">
                          <div className="mb-1 text-center text-lg font-bold text-[var(--ui-text)]">
                            {mentor.fullName ||
                              `${mentor.firstName || ""} ${
                                mentor.lastName || ""
                              }`.trim()}
                          </div>
                          <div className="mb-2 text-center text-sm text-[var(--ui-text-muted)]">
                            {mentor.jobTitle || "Professional"}
                          </div>
                          <div className="mb-3 text-center text-xs text-[var(--ui-text-muted)]">
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
                            <div className="flex items-center gap-2 rounded-full bg-[var(--ui-accent-soft)] px-3 py-2">
                              <IconUsers aria-hidden="true" className="h-4 w-4 text-[var(--ui-accent)]" stroke={1.8} />
                              <span className="text-sm font-medium text-[var(--ui-accent)]">
                                {mentor.totalMentees ?? 0}
                              </span>
                              <span className="text-xs text-[var(--ui-accent)]">
                                students
                              </span>
                            </div>
                          </div>
                          <div className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--ui-accent-fill)] py-2.5 text-base font-semibold text-white transition hover:bg-[var(--ui-accent-fill-hover)]">
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

      <section data-reveal className="w-full bg-[var(--ui-surface)] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] bg-[var(--ui-accent-fill)] shadow-[var(--ui-shadow-lg)] lg:grid-cols-[0.8fr_1.2fr]">
          <img
            src={BecomeMentor}
            alt="A mentor supporting a focused learning conversation"
            className="h-full min-h-72 w-full object-cover"
          />
          <div className="flex flex-col justify-center p-8 text-white sm:p-12 lg:p-16">
            <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-100">Share what you know</span>
            <h2 className="mt-4 max-w-[13ch] text-3xl font-extrabold leading-tight tracking-[-0.045em] sm:text-5xl">Help someone make their next move.</h2>
            <p className="mt-5 max-w-[48ch] text-base leading-7 text-cyan-50">Create a mentor profile with your current account and start guiding learners in your field.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  navigate("/auth/apply-as-men");
                  window.scrollTo(0, 0);
                }}
                className="inline-flex min-h-12 items-center gap-2 rounded-full !bg-white px-6 py-3 text-base font-bold !text-cyan-950 transition-transform hover:-translate-y-0.5"
              >
                Mentor with MentorMe
                <IconArrowRight aria-hidden="true" size={19} stroke={1.8} />
              </button>
              <button
                onClick={handleSeeAllCourses}
                className="min-h-12 rounded-full bg-cyan-950/25 px-6 py-3 text-base font-bold text-white transition-colors hover:bg-cyan-950/40"
              >
                Browse courses
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeScreen;
