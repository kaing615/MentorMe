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
  IconStar,
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
import MentoringHeroCutout from "../assets/mentoring-hero-cutout.png";

import { showLoading, hideLoading } from "../redux/features/loading.slice";
import courseApi from "../api/modules/course.api.js";
import profileApi from "../api/modules/profile.api.js";
import cartApi from "../api/modules/cart.api.js";
import purchasedCourseApi from "../api/modules/purchasedCourse.api.js";
import reviewApi from "../api/modules/review.api.js";
import { hasUserRole } from "../utils/user-role";
import { formatVnd } from "../utils/currency";
import { toast } from "react-toastify";

const categories = [
  { icon: IconCode, name: "Programming", description: "Build practical technical skills" },
  { icon: IconPalette, name: "Design", description: "Create thoughtful digital experiences" },
  { icon: IconBriefcase, name: "Business", description: "Turn ideas into sustainable growth" },
  { icon: IconSpeakerphone, name: "Marketing", description: "Reach the right audience with clarity" },
  { icon: IconSearch, name: "All skills", description: "Browse every course and find your direction", all: true },
];

gsap.registerPlugin(ScrollTrigger, useGSAP);

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
    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      user = null;
    }
    if (!user || !user.role) {
      navigate("/auth/signin");
      return;
    }
    if (hasUserRole(user, "mentor") || hasUserRole(user, "mentee")) {
      return;
    }
    navigate("/auth/signin");
    return;
  }, [navigate]);

  const [topCourses, setTopCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState<any>(false);
  const [coursesError, setCoursesError] = useState<any>(false);
  const [topMentors, setTopMentors] = useState<any[]>([]);
  const [mentorsLoading, setMentorsLoading] = useState<any>(false);
  const [mentorsError, setMentorsError] = useState<any>(false);
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

        gsap.utils.toArray<HTMLElement>("[data-scale-media]").forEach((mediaNode) => {
          gsap.fromTo(
            mediaNode,
            { scale: 0.9, opacity: 0.55 },
            {
              scale: 1,
              opacity: 1,
              ease: "none",
              scrollTrigger: {
                trigger: mediaNode,
                start: "top 92%",
                end: "center 58%",
                scrub: 0.8,
              },
            },
          );
        });
      });

      media.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-stack-card]");
        cards.slice(0, -1).forEach((card, index) => {
          gsap.to(card, {
            scale: 0.94,
            opacity: 0.56,
            ease: "none",
            scrollTrigger: {
              trigger: cards[index + 1],
              start: "top 78%",
              end: "top 24%",
              scrub: true,
            },
          });
        });
      });
      return () => media.revert();
    },
    { scope: pageRef },
  );

  const computeMentorStats = async (mentorId) => {
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
    const featuredReview = allReviews.find((review) => {
      const text = review?.comment || review?.content || review?.review;
      return typeof text === "string" && text.trim();
    });

    return {
      totalMentees: menteeSet.size,
      totalReviews,
      averageRating,
      featuredReview:
        featuredReview?.comment ||
        featuredReview?.content ||
        featuredReview?.review ||
        "",
    };
  };

  const isCourseAlreadyPurchased = (courseId) => {
    return (
      purchasedCoursesMap.has(courseId) && purchasedCoursesMap.get(courseId)
    );
  };

  const getPurchasedCourseId = (courseId) => {
    return purchasedCoursesMap.get(courseId);
  };

  const handleSmartViewCourse = (e, course) => {
    e.stopPropagation();
    const courseId = course._id || course.id;
    const purchasedCourseId = getPurchasedCourseId(courseId);

    if (purchasedCourseId) {
      navigate(`/order-complete-course/${purchasedCourseId}`, {
        state: { purchasedCourseId, courseInfo: course },
      });
    } else {
      navigate(`/order-complete-course/${courseId}`, {
        state: { courseId, courseInfo: course },
      });
    }
  };

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
    localStorage.setItem("searchPageActiveTab", "mentors");
    navigate(`/platform/search`);
  };

  const handleMentorClick = (mentorId) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate(`/mentor/${mentorId}`);
  };

  const scrollCarouselBy = (ref, direction, itemSelector = "button") => {
    const container = ref.current;
    if (!container) return;
    const card = container.querySelector(itemSelector);
    let cardWidth = 320;
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

  useEffect(() => {
    const fetchTopMentors = async () => {
      setMentorsLoading(true);
      setMentorsError(false);
      try {
        const response = await profileApi.getTopMentors(6);
        const raw = Array.isArray(response?.data?.mentors)
          ? response.data.mentors
          : [];
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

  useEffect(() => {
    const fetchPurchasedCourses = async () => {
      if (!hasUserRole(user, "mentee")) return;

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
  }, [user, topCourses]);

  return (
    <div ref={pageRef} className="flex min-h-[100dvh] flex-col overflow-hidden bg-[var(--ui-page)]">
      <section className="ui-brand-hero relative mx-3 mt-3 overflow-hidden rounded-[2rem] border-2 border-blue-300/30 px-4 pb-14 pt-12 shadow-[var(--ui-shadow-lg)] sm:mx-5 sm:px-6 lg:px-8 lg:pb-20 lg:pt-16">
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:gap-16">
          <div data-hero-copy className="w-full max-w-3xl">
            <p className="text-sm font-bold text-blue-100">Guidance that moves you forward</p>
            <h1 className="mt-5 max-w-[17ch] text-4xl font-[790] leading-[0.98] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
              Learn faster with the
              <span
                aria-hidden="true"
                className="ui-inline-image"
                style={{ backgroundImage: `url(${MentoringHero})` }}
              />
              <span className="ui-marker">right mentor.</span>
            </h1>
            <p className="mt-6 max-w-[42ch] text-base leading-7 text-blue-100 sm:text-lg">
              Find focused guidance, practical courses, and a clearer path to your next goal.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/all-mentors")}
                className="ui-button-highlight min-h-12 whitespace-nowrap rounded-full px-6 py-3 font-bold transition-all"
              >
                Find your mentor
              </button>
              <button
                onClick={handleSeeAllCourses}
                className="min-h-12 whitespace-nowrap rounded-full border border-white/35 bg-white/12 px-6 py-3 font-bold text-white backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white hover:text-blue-800"
              >
                Explore courses
              </button>
            </div>
          </div>

          <div data-hero-media data-scale-media className="relative min-h-[19rem] sm:min-h-[25rem] lg:min-h-[30rem] lg:pl-4">
            <div className="absolute -bottom-3 left-3 z-0 h-32 w-32 rotate-6 rounded-[45%_55%_48%_52%] border-2 border-dashed border-yellow-300/65 lg:left-8" />
            <img
              src={MentoringHeroCutout}
              alt="A learner and mentor reviewing a practical learning plan"
              className="absolute -bottom-14 right-[-8%] z-10 w-[112%] max-w-none sm:-bottom-14 sm:right-[-5%] lg:-bottom-20 lg:right-[-8%] lg:w-[122%]"
              fetchPriority="high"
            />
            <div className="absolute -bottom-8 left-4 z-20 max-w-xs rounded-2xl border border-white/25 bg-blue-950/70 p-4 text-white shadow-[var(--ui-shadow-sm)] backdrop-blur-md sm:left-8 lg:-bottom-12">
              <p className="text-sm font-bold text-white">Your next step</p>
              <p className="mt-1 text-sm font-semibold leading-5 text-blue-100">Turn a big goal into a practical plan you can follow.</p>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Browse learning directions" className="mt-5 overflow-hidden border-y-2 border-[var(--ui-border)] bg-[var(--ui-highlight-soft)] py-4">
        <div className="ui-marquee">
          {[0, 1].map((cycle) => (
            <div key={cycle} className="flex w-max min-w-screen shrink-0 items-center justify-around gap-3 px-3" aria-hidden={cycle === 1}>
              {categories.map((category) => {
                const CategoryIcon = category.icon;
                return (
                  <button
                    key={`${cycle}-${category.name}`}
                    type="button"
                    tabIndex={cycle === 1 ? -1 : 0}
                    onClick={() => {
                      localStorage.setItem("searchPageActiveTab", "courses");
                      navigate(
                        category.all
                          ? "/platform/search"
                          : `/platform/search?category=${encodeURIComponent(category.name)}`,
                      );
                    }}
                    className="inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full border-2 border-blue-200 bg-white px-5 text-sm font-bold text-blue-800 shadow-[3px_3px_0_var(--ui-highlight)] transition-transform hover:-translate-y-0.5"
                  >
                    <CategoryIcon aria-hidden="true" size={18} stroke={1.8} />
                    {category.name}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section data-reveal className="w-full px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <div className="h-fit lg:sticky lg:top-28">
            <p className="text-sm font-bold text-[var(--ui-accent)]">A simple path, kept visible</p>
            <h2 className="mt-3 max-w-[12ch] text-3xl font-black tracking-[-0.05em] text-[var(--ui-text)] sm:text-5xl">
              From a question to real progress.
            </h2>
            <p className="mt-5 max-w-[40ch] text-base leading-7 text-[var(--ui-text-muted)]">
              Discover the right person, agree on a plan, and keep moving with focused support.
            </p>
          </div>
          <div className="space-y-6 lg:space-y-10 lg:pb-12">
          {[
            { icon: IconSearch, title: "Discover your direction", copy: "Explore mentors and courses shaped around the outcome you want." },
            { icon: IconMessageCircle, title: "Build the plan together", copy: "Choose a mentor, share the context, and agree on a focused format." },
            { icon: IconTrendingUp, title: "Keep momentum visible", copy: "Apply the plan, ask better questions, and turn each session into action." },
          ].map(({ icon: StepIcon, title, copy }, index) => (
            <article
              key={title}
              data-stack-card
              style={{ zIndex: index + 1 }}
              className={`ui-card relative min-h-64 p-7 sm:p-10 lg:sticky lg:top-28 ${
                index === 1
                  ? "ui-card-blue"
                  : index === 2
                    ? "ui-card-yellow"
                    : ""
              }`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-[44%_56%_48%_52%] border-2 border-[var(--ui-accent)] bg-[var(--ui-surface-raised)] text-[var(--ui-accent)] shadow-[3px_4px_0_var(--ui-highlight)]">
                <StepIcon aria-hidden="true" size={27} stroke={1.8} />
              </div>
              <h3 className="mt-12 max-w-[18ch] text-2xl font-black tracking-[-0.04em] text-[var(--ui-text)] sm:text-3xl">{title}</h3>
              <p className="mt-4 max-w-[44ch] text-base leading-7 text-[var(--ui-text-muted)]">{copy}</p>
            </article>
          ))}
          </div>
        </div>
      </section>

      <section data-reveal className="w-full bg-[var(--ui-surface)] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-9 max-w-2xl">
            <p className="text-sm font-bold text-[var(--ui-accent)]">Explore by direction</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] text-[var(--ui-text)] sm:text-4xl">
              Start with what you want to build.
            </h2>
            <p className="mt-3 text-base leading-7 text-[var(--ui-text-muted)]">Choose a category to see real courses currently available.</p>
          </div>
          <div className="grid grid-flow-dense grid-cols-1 gap-4 md:grid-cols-12">
            {categories.map((cat, index) => {
              const CategoryIcon = cat.icon;
              const spanClass = index === 0 ? "md:col-span-7" : index === 1 ? "md:col-span-5" : "md:col-span-4";
              const toneClass = index === 0
                ? "ui-brand-hero border-blue-300/30 text-white"
                : index === 1
                  ? "ui-card ui-card-yellow"
                  : "ui-card";
              return (
              <button
                type="button"
                key={cat.name}
                onClick={() => {
                  localStorage.setItem("searchPageActiveTab", "courses");
                  navigate(
                    cat.all
                      ? "/platform/search"
                      : `/platform/search?category=${encodeURIComponent(cat.name)}`,
                  );
                }}
                className={`ui-card-interactive ${spanClass} ${toneClass} flex min-h-64 flex-col gap-4 rounded-[var(--ui-radius-lg)] border-2 px-6 py-7 text-left sm:p-8`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-[44%_56%_48%_52%] border-2 ${index === 0 ? "border-yellow-300 bg-white/12 text-yellow-300" : "border-[var(--ui-accent)] bg-[var(--ui-accent-soft)] text-[var(--ui-accent)]"}`}>
                  <CategoryIcon aria-hidden="true" size={25} stroke={1.7} />
                </div>
                <span className={`text-xl font-extrabold ${index === 0 ? "text-white" : "text-[var(--ui-text)]"}`}>
                  {cat.name}
                </span>
                <span className={`max-w-[34ch] text-sm leading-6 ${index === 0 ? "text-blue-100" : "text-[var(--ui-text-muted)]"}`}>
                  {cat.description}
                </span>
                <span className={`mt-auto inline-flex items-center gap-1 text-sm font-bold ${index === 0 ? "text-yellow-300" : "text-[var(--ui-accent)]"}`}>
                  View courses <IconArrowRight aria-hidden="true" size={17} stroke={1.8} />
                </span>
              </button>
              );
            })}
          </div>
        </div>
      </section>

      <section data-reveal className="w-full bg-[var(--ui-surface)] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-7xl mx-auto w-full">
          <div className="mb-9 flex items-end justify-between gap-6 px-2">
            <div className="max-w-2xl">
              <p className="text-sm font-bold text-[var(--ui-accent)]">Learn by doing</p>
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
                                  <div className="flex gap-0.5 text-yellow-500" aria-label={`${Number(rate || 0).toFixed(1)} out of 5 stars`}>
                                    {[0, 1, 2, 3, 4].map((starIndex) =>
                                      starIndex < Math.floor(rate || 0) ? (
                                        <IconStarFilled key={starIndex} aria-hidden="true" size={15} />
                                      ) : (
                                        <IconStar key={starIndex} aria-hidden="true" size={15} stroke={1.8} />
                                      ),
                                    )}
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

                                {course.level && (
                                  <p className="text-green-500 text-xs mb-2">
                                    <b>Level:</b> {course.level}
                                  </p>
                                )}
                              </div>
                              <p className="mb-2 mt-auto text-xl font-bold text-[var(--ui-text)]">
                                {formatVnd(Number(price) || 0)}
                              </p>

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

      <section data-reveal className="w-full bg-[var(--ui-page)] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-9 flex items-end justify-between gap-6 px-2">
            <div className="max-w-2xl">
              <p className="text-sm font-bold text-[var(--ui-accent)]">Learn with someone who knows the path</p>
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
                  ? Array.from({ length: 4 }).map((_, idx) => (
                      <div
                        key={`loading-${idx}`}
                        className="ui-card flex min-h-72 w-full min-w-[320px] max-w-[390px] animate-pulse flex-col p-6"
                        style={{ scrollSnapAlign: "start" }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 rounded-2xl bg-[var(--ui-surface-muted)]" />
                          <div className="flex-1">
                            <div className="h-4 w-3/4 rounded bg-[var(--ui-surface-muted)]" />
                            <div className="mt-2 h-3 w-1/2 rounded bg-[var(--ui-surface-muted)]" />
                          </div>
                        </div>
                        <div className="mt-8 h-20 rounded-2xl bg-[var(--ui-surface-muted)]" />
                        <div className="mt-auto h-10 rounded-xl bg-[var(--ui-surface-muted)]" />
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
                      <button
                        type="button"
                        key={mentor._id || idx}
                        className="ui-card ui-card-interactive group flex min-h-80 w-full min-w-[320px] max-w-[390px] cursor-pointer flex-col p-6 text-left focus:outline-none focus:ring-2 focus:ring-[var(--ui-accent)]"
                        style={{ outline: "none", scrollSnapAlign: "start" }}
                        onClick={() => handleMentorClick(mentor._id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[44%_56%_48%_52%] border-2 border-[var(--ui-highlight)] bg-[var(--ui-accent-soft)] text-xl font-extrabold text-[var(--ui-accent)] shadow-[3px_4px_0_var(--ui-accent-soft)]">
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
                          <div className="min-w-0">
                            <h3 className="truncate text-lg font-black text-[var(--ui-text)]">
                              {mentor.fullName || `${mentor.firstName || ""} ${mentor.lastName || ""}`.trim()}
                            </h3>
                            <p className="mt-1 truncate text-sm text-[var(--ui-text-muted)]">{mentor.jobTitle || "Professional"}</p>
                          </div>
                        </div>
                        <div className="ui-sketch-note mt-7 min-h-24 p-4">
                          <IconMessageCircle aria-hidden="true" className="text-[var(--ui-accent)]" size={19} stroke={1.8} />
                          <p className="mt-2 line-clamp-3 whitespace-normal text-sm leading-6 text-[var(--ui-text)]">
                            {mentor.featuredReview || mentor.bio || "Explore this mentor's experience, focus areas, and available sessions."}
                          </p>
                        </div>
                        <div className="mt-auto flex w-full items-center justify-between pt-6">
                          <div className="flex items-center gap-4 text-sm font-bold text-[var(--ui-text-muted)]">
                            <span className="inline-flex items-center gap-1.5 text-[var(--ui-highlight-strong)]">
                              <IconStarFilled aria-hidden="true" size={17} />
                              {(mentor.averageRating ?? 0).toFixed(1)}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <IconUsers aria-hidden="true" size={17} stroke={1.8} />
                              {mentor.totalMentees ?? 0}
                            </span>
                          </div>
                          <span className="inline-flex items-center gap-1 text-sm font-bold text-[var(--ui-accent)]">
                            View profile <IconArrowRight aria-hidden="true" size={18} stroke={1.8} />
                          </span>
                        </div>
                      </button>
                    ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-reveal className="w-full bg-[var(--ui-surface)] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="ui-brand-hero mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] border-2 border-blue-300/30 shadow-[var(--ui-shadow-lg)] lg:grid-cols-[0.8fr_1.2fr]">
          <img
            data-scale-media
            src={BecomeMentor}
            alt="A mentor supporting a focused learning conversation"
            className="h-full min-h-72 w-full object-cover"
          />
          <div className="flex flex-col justify-center p-8 text-white sm:p-12 lg:p-16">
            <p className="text-sm font-bold text-yellow-300">Share what you know</p>
            <h2 className="mt-4 max-w-[13ch] text-3xl font-extrabold leading-tight tracking-[-0.045em] sm:text-5xl">Help someone make their next move.</h2>
            <p className="mt-5 max-w-[48ch] text-base leading-7 text-blue-100">Create a mentor profile with your current account and start guiding learners in your field.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  navigate("/auth/apply-as-men");
                  window.scrollTo(0, 0);
                }}
                className="ui-button-highlight inline-flex min-h-12 items-center gap-2 rounded-full px-6 py-3 text-base font-bold transition-all"
              >
                Mentor with MentorMe
                <IconArrowRight aria-hidden="true" size={19} stroke={1.8} />
              </button>
              <button
                onClick={handleSeeAllCourses}
                className="min-h-12 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-base font-bold text-white transition-colors hover:bg-white hover:text-blue-800"
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
