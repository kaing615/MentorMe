// screens/HomeScreen.jsx
import React, { useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IoStarOutline, IoStar } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

import minatoImg from "../assets/minato.webp";
import oipImg from "../assets/OIP.webp";
import GradImg from "../assets/grad.png";
import NiggaImg from "../assets/nigga.png";
import WhiteImg from "../assets/white.png";
import AvatarsImg from "../assets/avatars.png";
import BoImg from "../assets/Bơ.jpg";
import BecomeMentor from "../assets/become-an-mentor.jpg";

import { MENTEE_PATH } from "../routes/path";
import { showLoading, hideLoading } from "../redux/features/loading.slice";
import { clearUser } from "../redux/features/user.slice";
import courseApi from "../api/modules/course.api.js";
import profileApi from "../api/modules/profile.api.js";
import cartApi from "../api/modules/cart.api.js";
import purchasedCourseApi from "../api/modules/purchasedCourse.api.js";
import { toast } from "react-toastify";

const categories = [
  { icon: "📚", name: "Astrology", count: 17 },
  { icon: "💻", name: "Development", count: 19 },
  { icon: "📈", name: "Marketing", count: 15 },
  { icon: "🧠", name: "Mindset", count: 9 },
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

const testimonials = [
  {
    name: "Jane Doe",
    text: "MentorMe is a game-changer! I love how easy it is to connect with real mentors who actually get what I'm going through. Every session feels super chill, helpful, and way more personal than any course I've tried. Big fan!",
    avatar: minatoImg,
  },
  {
    name: "Jane Doe",
    text: "MentorMe is a game-changer! I love how easy it is to connect with real mentors who actually get what I'm going through. Every session feels super chill, helpful, and way more personal than any course I've tried. Big fan!",
    avatar: minatoImg,
  },
  {
    name: "Jane Doe",
    text: "MentorMe is a game-changer! I love how easy it is to connect with real mentors who actually get what I'm going through. Every session feels super chill, helpful, and way more personal than any course I've tried. Big fan!",
    avatar: minatoImg,
  },
];

// Native horizontal scroll blocker (optional hook)
const useHorizontalScrollBlockSwipe = () => {
  const ref = useRef(null);
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
  const user = useSelector((state) => state.user);

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

  const [topCourses, setTopCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [topMentors, setTopMentors] = useState([]);
  const [mentorsLoading, setMentorsLoading] = useState(false);
  const [purchasedCoursesMap, setPurchasedCoursesMap] = useState(new Map());

  const coursesRef = useRef(null);
  const mentorsRef = useRef(null);
  const testimonialRef = useRef(null);
  const [hoveredCarousel, setHoveredCarousel] = useState(null);

  const dragCourses = useHorizontalScrollBlockSwipe();
  const dragMentors = useHorizontalScrollBlockSwipe();

  // Helper function to check if course is already purchased
  const isCourseAlreadyPurchased = (courseId) => {
    // First check API-based purchasedCoursesMap
    if (purchasedCoursesMap.has(courseId)) {
      return true;
    }

    // Then check localStorage for immediate feedback and fallback
    const userStr = localStorage.getItem("user");
    let currentUserId = null;
    try {
      const user = userStr ? JSON.parse(userStr) : null;
      currentUserId = user?.id || user?._id;
    } catch (e) {
      console.warn("Error parsing user:", e);
    }

    const mockKey = currentUserId
      ? `mockPurchasedCourses_${currentUserId}`
      : "mockPurchasedCourses";
    const mockPurchasedCourses = localStorage.getItem(mockKey);

    if (mockPurchasedCourses) {
      try {
        const purchasedCourses = JSON.parse(mockPurchasedCourses);

        const isPurchased = purchasedCourses.some((purchased) => {
          const purchasedCourseId =
            purchased.course?._id ||
            purchased.course?.id ||
            purchased.courseId ||
            purchased.courseInfo?._id;
          return purchasedCourseId === courseId;
        });

        return isPurchased;
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

    const courseId = course._id || course.id || course.courseId;

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

  const handleSeeAllCourses = () => {
    const userStr =
      localStorage.getItem("user") || localStorage.getItem("user");
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
  const handleSeeAllMentors = () => navigate(`/${MENTEE_PATH.ALL_MENTORS}`);

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

  const scrollTestimonialBy = (direction) => {
    const container = testimonialRef.current;
    if (!container) return;
    const card = container.querySelector("#testimonial-track > div");
    let cardWidth = 340;
    let gap = 24;
    if (card) {
      const track = container.querySelector("#testimonial-track");
      if (track) {
        const trackStyle = window.getComputedStyle(track);
        gap = parseInt(trackStyle.columnGap || trackStyle.gap || "24", 10);
        cardWidth = card.offsetWidth;
      }
    }
    const scrollAmount = (cardWidth + gap) * 3;
    container.scrollBy({ left: direction * scrollAmount, behavior: "smooth" });
  };

  useEffect(() => {
    dispatch(showLoading());
    const timer = setTimeout(() => dispatch(hideLoading()), 1200);
    return () => clearTimeout(timer);
  }, [dispatch]);

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

        if (response && response.data?.mentors) {
          setTopMentors(response.data.mentors);
        } else {
          setTopMentors(fallbackMentors);
        }
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

  const renderStars = (rating = 0) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <IoStar key={`full-${i}`} className="text-yellow-500" size={20} />
      );
    }
    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative">
          <IoStarOutline className="text-yellow-500" size={20} />
          <IoStar
            className="text-yellow-500 absolute top-0 left-0"
            size={20}
            style={{ clipPath: "inset(0 50% 0 0)" }}
          />
        </div>
      );
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <IoStarOutline
          key={`empty-${i}`}
          className="text-yellow-500"
          size={20}
        />
      );
    }
    return stars;
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Hero */}
      <section className="bg-white h-[600px] py-16 px-6 md:px-16 flex flex-col md:flex-row gap-10 items-center justify-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Unlock Your Potential <br /> with{" "}
            <span className="text-blue-600">MentorMe</span>
          </h1>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Ready to level up? With MentorMe, you're just a click away from
            connecting with awesome mentors who've been there, done that, and
            are here to help you crush your goals.
          </p>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Explore different fields, chat directly with real experts, and book
            one-on-one sessions—online or in person.
          </p>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Don't just dream it—make it happen.
          </p>

          <button
            onClick={handleSeeAllCourses}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-semibold transition"
          >
            Get Started
          </button>
        </div>

        <div className="relative w-full flex justify-center items-center mt-10 md:mt-0.5">
          <div className="relative w-[400px] h-[480px]">
            <div className="absolute left-60 transform -translate-x-1/2 top-0 w-56 h-56 rounded-full overflow-hidden shadow-xl bg-yellow-300">
              <img
                src={NiggaImg}
                alt="Student"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="absolute bottom-20 right-60 w-56 h-56 rounded-full overflow-hidden shadow-xl bg-green-400">
              <img
                src={GradImg}
                alt="Grad"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="absolute bottom-0 right-0 w-56 h-56 rounded-full overflow-hidden shadow-xl bg-blue-300">
              <img
                src={WhiteImg}
                alt="Teen"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-xl shadow-lg flex flex-col items-center space-y-2">
            <img src={AvatarsImg} alt="Community" className="w-28 h-auto" />
            <span className="text-lg font-medium text-gray-800">
              Join our community
            </span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="w-full py-10" style={{ background: "#ffffffff" }}>
        <div className="w-full rounded-2xl flex items-center text-center bg-[#f8f9fb] px-4 py-6">
          {[
            { label: "X+", desc: "Courses by our best mentors" },
            { label: "X+", desc: "Courses by our best mentors" },
            { label: "X+", desc: "Courses by our best mentors" },
            { label: "X+", desc: "Courses by our best mentors" },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`flex-1 px-4 ${
                idx !== 0 ? "border-l-2 border-gray-300" : ""
              }`}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {item.label}
              </h3>
              <p className="text-base text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top Categories */}
      <section className="w-full py-12 bg-white">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-extrabold text-[#1a2233]">
              Top Categories
            </h2>
            <button className="text-blue-700 text-base font-semibold hover:underline">
              See All
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {categories.map((cat, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border shadow-lg flex flex-col items-center py-10 px-4 gap-4 hover:shadow-xl transition-all duration-200"
              >
                <div className="w-24 h-24 flex items-center justify-center rounded-full bg-blue-100 mb-3">
                  <span className="text-4xl text-blue-500">{cat.icon}</span>
                </div>
                <span className="font-extrabold text-lg text-[#1a2233] text-center">
                  {cat.name}
                </span>
                <span className="text-base text-slate-500 text-center">
                  {cat.count} Courses
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Courses */}
      <section className="w-full py-10 bg-white border-t border-[#D6E3F3]">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-center mb-6 px-2">
            <h2 className="text-2xl font-bold text-[#1A2233]">Top Courses</h2>
            <button
              onClick={handleSeeAllCourses}
              className="text-[#2563eb] font-semibold px-5 py-2 rounded-lg transition-all duration-200
                bg-gradient-to-r from-blue-100 to-blue-200 shadow-sm
                hover:from-blue-400 hover:to-blue-600 hover:text-white hover:shadow-lg hover:scale-105"
            >
              See All
            </button>
          </div>

          <div
            className="relative group"
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
              <svg
                width="32"
                height="32"
                fill="none"
                stroke="#222"
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
              <svg
                width="32"
                height="32"
                fill="none"
                stroke="#222"
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
      <section className="w-full py-10 bg-white border-[#D6E3F3]">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-center mb-6 px-2">
            <h2 className="text-2xl font-bold text-[#1A2233]">Top Mentors</h2>
            <button
              onClick={handleSeeAllMentors}
              className="text-[#2563eb] font-semibold hover:underline"
            >
              See All
            </button>
          </div>

          <div
            className="relative group"
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
              <svg
                width="32"
                height="32"
                fill="none"
                stroke="#222"
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
              <svg
                width="32"
                height="32"
                fill="none"
                stroke="#222"
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
                            e.target.src = BoImg; // Fallback image
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
                            {(mentor.category || "General")
                              .charAt(0)
                              .toUpperCase() +
                              (mentor.category || "General")
                                .slice(1)
                                .toLowerCase()}
                          </div>
                          <div className="flex items-center justify-center gap-4 w-full mb-4">
                            <div className="flex items-center gap-1">
                              <span className="text-[#F59E1B] text-lg">★</span>
                              <span className="text-[#1A2233] font-semibold text-base">
                                {mentor.averageRating
                                  ? mentor.averageRating.toFixed(1)
                                  : "4.5"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[#6B7280] text-base">
                                {mentor.totalStudents
                                  ? mentor.totalStudents.toLocaleString()
                                  : "1000"}{" "}
                                Students
                              </span>
                            </div>
                          </div>
                          <div className="w-full flex items-center justify-center gap-2 bg-[#2563eb] text-white font-semibold rounded-lg py-2 mt-auto text-base hover:bg-[#1749b1] transition">
                            View Profile
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-5 h-5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        className="w-full py-14 bg-white"
        style={{ background: "#f8f9fb" }}
      >
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-4 px-2">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold text-slate-800">
                What Our Customer Say
              </h2>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <button
                onClick={() => scrollTestimonialBy(-1)}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xl shadow hover:bg-gray-200 transition"
              >
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
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
                onClick={() => scrollTestimonialBy(1)}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xl shadow hover:bg-gray-200 transition"
              >
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
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

          <div className="relative">
            <div
              id="testimonial-carousel"
              ref={testimonialRef}
              className="overflow-x-auto no-scrollbar px-1 select-none"
              style={{
                scrollSnapType: "x mandatory",
                WebkitOverflowScrolling: "touch",
              }}
              tabIndex={-1}
            >
              <div
                id="testimonial-track"
                className="flex gap-6 min-w-full"
                style={{ width: "max-content" }}
              >
                {testimonials
                  .concat(testimonials)
                  .concat(testimonials)
                  .map((t, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl border border-gray-200 shadow flex flex-col gap-4 min-w-[340px] max-w-[360px] w-[340px] px-7 py-6 snap-start"
                    >
                      <div className="text-blue-700 text-4xl font-bold mb-2">
                        “
                      </div>
                      <div className="text-slate-700 text-base flex-1">
                        {t.text}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <img
                          src={t.avatar}
                          alt={t.name}
                          className="w-11 h-11 rounded-full object-cover border"
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-slate-700">
                            {t.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            Student
                          </span>
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
      <section className="w-full py-0 bg-white">
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-20 md:gap-32">
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
                Become an Mentor
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
                  className="group flex items-center gap-2 px-6 py-3 bg-[#1A2233] text-white rounded-xl font-semibold shadow-lg hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-110 hover:-translate-y-3 active:scale-95 active:translate-y-0 transition-all duration-400 ease-out text-base md:text-lg relative overflow-hidden transform"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out"></span>
                  <span className="relative z-10">Mentor with MentorMe</span>
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className="relative z-10 transition-transform duration-400 group-hover:translate-x-2 group-hover:scale-125"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
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
                  className="group flex items-center gap-2 px-6 py-3 bg-[#1A2233] text-white rounded-xl font-semibold shadow-lg hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-110 hover:-translate-y-3 active:scale-95 active:translate-y-0 transition-all duration-400 ease-out text-base md:text-lg relative overflow-hidden transform"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out"></span>
                  <span className="relative z-10">Checkout Courses</span>
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className="relative z-10 transition-transform duration-400 group-hover:translate-x-2 group-hover:scale-125"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
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
