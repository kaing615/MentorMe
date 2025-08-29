// screens/HomeScreen.jsx
import React, { useRef, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { IoStarOutline, IoStar } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

import minatoImg from "../assets/minato.webp";
import oipImg from "../assets/OIP.webp";
import GradImg from "../assets/grad.png";
import NiggaImg from "../assets/nigga.png";
import WhiteImg from "../assets/white.png";
import AvatarsImg from "../assets/avatars.png";
import BoImg from "../assets/Bơ.jpg";

import { MENTEE_PATH } from "../routes/path";
import { showLoading, hideLoading } from "../redux/features/loading.slice";
import courseApi from "../api/modules/course.api.js";

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
    if (node) node.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => node && node.removeEventListener("touchmove", handleTouchMove);
  }, []);
  return ref;
};

const HomeScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [topCourses, setTopCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  const coursesRef = useRef(null);
  const mentorsRef = useRef(null);
  const testimonialRef = useRef(null);
  const [hoveredCarousel, setHoveredCarousel] = useState(null);

  const dragCourses = useHorizontalScrollBlockSwipe();
  const dragMentors = useHorizontalScrollBlockSwipe();

  const handleSeeAllCourses = () => navigate(`/${MENTEE_PATH.ALL_COURSES}`);
  const handleSeeAllMentors = () => navigate(`/${MENTEE_PATH.ALL_MENTORS}`);

  useEffect(() => {
    // block horizontal-only wheel in testimonials
    const carousel = document.getElementById("testimonial-carousel");
    if (!carousel) return;
    const blockHorizontalWheel = (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) e.preventDefault();
    };
    carousel.addEventListener("wheel", blockHorizontalWheel, { passive: false });
    carousel.addEventListener("touchmove", blockHorizontalWheel, { passive: false });
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

  const renderStars = (rating = 0) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    for (let i = 0; i < fullStars; i++) {
      stars.push(<IoStar key={`full-${i}`} className="text-yellow-500" size={20} />);
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
      stars.push(<IoStarOutline key={`empty-${i}`} className="text-yellow-500" size={20} />);
    }
    return stars;
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Hero */}
      <section className="bg-white h-[600px] py-16 px-6 md:px-16 flex flex-col md:flex-row gap-10 items-center justify-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Unlock Your Potential <br /> with <span className="text-blue-600">MentorMe</span>
          </h1>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Ready to level up? With MentorMe, you're just a click away from connecting with awesome
            mentors who've been there, done that, and are here to help you crush your goals.
          </p>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Explore different fields, chat directly with real experts, and book one-on-one
            sessions—online or in person.
          </p>
          <p className="text-gray-600 mb-8 leading-relaxed">Don't just dream it—make it happen.</p>

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
              <img src={NiggaImg} alt="Student" className="w-full h-full object-cover" />
            </div>

            <div className="absolute bottom-20 right-60 w-56 h-56 rounded-full overflow-hidden shadow-xl bg-green-400">
              <img src={GradImg} alt="Grad" className="w-full h-full object-cover" />
            </div>

            <div className="absolute bottom-0 right-0 w-56 h-56 rounded-full overflow-hidden shadow-xl bg-blue-300">
              <img src={WhiteImg} alt="Teen" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-xl shadow-lg flex flex-col items-center space-y-2">
            <img src={AvatarsImg} alt="Community" className="w-28 h-auto" />
            <span className="text-lg font-medium text-gray-800">Join our community</span>
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
              className={`flex-1 px-4 ${idx !== 0 ? "border-l-2 border-gray-300" : ""}`}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{item.label}</h3>
              <p className="text-base text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top Categories */}
      <section className="w-full py-12 bg-white">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-extrabold text-[#1a2233]">Top Categories</h2>
            <button className="text-blue-700 text-base font-semibold hover:underline">See All</button>
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
                <span className="font-extrabold text-lg text-[#1a2233] text-center">{cat.name}</span>
                <span className="text-base text-slate-500 text-center">{cat.count} Courses</span>
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
            <button onClick={handleSeeAllCourses} className="text-[#2563eb] font-semibold hover:underline">
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
                hoveredCarousel === "courses" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
              } bg-white/20 backdrop-blur-md rounded-full shadow-lg border border-white/40 hover:bg-white/40`}
              onClick={() => scrollCarouselBy(coursesRef, -1)}
            >
              <svg width="32" height="32" fill="none" stroke="#222" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {/* Right button */}
            <button
              type="button"
              aria-label="Scroll right"
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-14 h-36 flex items-center justify-center transition-opacity duration-200 ${
                hoveredCarousel === "courses" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
              } bg-white/20 backdrop-blur-md rounded-full shadow-lg border border-white/40 hover:bg-white/40`}
              onClick={() => scrollCarouselBy(coursesRef, 1)}
            >
              <svg width="32" height="32" fill="none" stroke="#222" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div
              ref={coursesRef}
              className="top-courses-drag overflow-x-auto whitespace-nowrap select-none -mx-2 px-2 no-scrollbar"
              style={{ WebkitOverflowScrolling: "touch", scrollSnapType: "x mandatory", scrollBehavior: "smooth" }}
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
                  : (topCourses.length > 0 ? topCourses : fallbackCourses).map((course, idx) => {
                      const courseId = course._id || course.id || course.courseId;
                      const price = course.price ?? fallbackCourses[idx % fallbackCourses.length].price ?? 0;
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
                        <button
                          key={courseId || idx}
                          className="bg-white rounded-[18px] border border-[#D6E3F3] shadow-sm flex flex-col p-6 min-w-[290px] max-w-[320px] w-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 group cursor-pointer whitespace-normal"
                          type="button"
                          onClick={() => {
                            if (courseId) navigate(`/courses/${courseId}`);
                          }}
                          style={{ outline: "none", scrollSnapAlign: "start" }}
                        >
                          <img
                            src={course.thumbnailUrl || course.thumbnail || course.img || oipImg}
                            alt={course.title || "Course"}
                            className="w-full h-32 object-cover rounded-[14px] mb-4 group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => (e.currentTarget.src = oipImg)}
                          />
                          <div className="flex flex-col flex-1">
                            <div className="font-bold text-lg text-[#1A2233] mb-1">
                              {course.title || "Untitled Course"}
                            </div>
                            <div className="text-sm text-[#6B7280] mb-1">By {mentorName}</div>
                            <div className="flex justify-center gap-2 mt-1 text-slate-700">
                              <div className="flex items-center">{renderStars(rate)}</div>
                              <span className="text-sm">({Number(rate).toFixed(1)})</span>
                            </div>
                            <div className="text-sm text-[#6B7280] mb-1">
                              {hours} Total Hours. {lectures} Lectures.
                            </div>
                            <div className="font-bold text-[#1A2233] text-xl mt-2">${price}</div>
                          </div>
                        </button>
                      );
                    })}
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
            <button onClick={handleSeeAllMentors} className="text-[#2563eb] font-semibold hover:underline">
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
                hoveredCarousel === "mentors" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
              } bg-white/20 backdrop-blur-md rounded-full shadow-lg border border-white/40 hover:bg-white/40`}
              onClick={() => scrollCarouselBy(mentorsRef, -1, "button")}
            >
              <svg width="32" height="32" fill="none" stroke="#222" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {/* Right */}
            <button
              type="button"
              aria-label="Scroll right"
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-14 h-36 flex items-center justify-center transition-opacity duration-200 ${
                hoveredCarousel === "mentors" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
              } bg-white/20 backdrop-blur-md rounded-full shadow-lg border border-white/40 hover:bg-white/40`}
              onClick={() => scrollCarouselBy(mentorsRef, 1, "button")}
            >
              <svg width="32" height="32" fill="none" stroke="#222" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div
              ref={mentorsRef}
              className="top-mentors-drag overflow-x-auto whitespace-nowrap select-none -mx-2 px-2 no-scrollbar"
              style={{ WebkitOverflowScrolling: "touch", scrollSnapType: "x mandatory", scrollBehavior: "smooth" }}
              tabIndex={-1}
            >
              <div className="inline-flex gap-8" ref={dragMentors}>
                {mentors.map((mentor, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-[18px] border border-[#D6E3F3] shadow-sm flex flex-col items-center p-6 min-w-[260px] max-w-[300px] w-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 group cursor-pointer"
                    role="button"
                    style={{ outline: "none", scrollSnapAlign: "start" }}
                  >
                    <img
                      src={mentor.img}
                      alt={mentor.name}
                      className="w-28 h-28 object-cover rounded-[14px] mb-4 group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="flex flex-col items-center flex-1 w-full">
                      <div className="font-bold text-lg text-[#1A2233] mb-1 text-center">{mentor.name}</div>
                      <div className="text-sm text-[#6B7280] mb-2 text-center">UI/UX Designer</div>
                      <div className="flex items-center justify-center gap-4 w-full mb-4">
                        <div className="flex items-center gap-1">
                          <span className="text-[#F59E1B] text-lg">★</span>
                          <span className="text-[#1A2233] font-semibold text-base">4.9</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[#6B7280] text-base">2400 Students</span>
                        </div>
                      </div>
                      <div className="w-full flex items-center justify-center gap-2 bg-[#2563eb] text-white font-semibold rounded-lg py-2 mt-auto text-base hover:bg-[#1749b1] transition">
                        Send Message
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.668c0 .456-.244.88-.64 1.1l-7.5 4.167a2.25 2.25 0 01-2.22 0l-7.5-4.167a1.125 1.125 0 01-.64-1.1V6.75" />
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
      <section className="w-full py-14 bg-white" style={{ background: "#f8f9fb" }}>
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-4 px-2">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold text-slate-800">What Our Customer Say</h2>
              <span className="text-base text-slate-500 font-medium">About Us</span>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <button
                onClick={() => scrollTestimonialBy(-1)}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xl shadow hover:bg-gray-200 transition"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => scrollTestimonialBy(1)}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xl shadow hover:bg-gray-200 transition"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="relative">
            <div
              id="testimonial-carousel"
              ref={testimonialRef}
              className="overflow-x-auto no-scrollbar px-1 select-none"
              style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
              tabIndex={-1}
            >
              <div id="testimonial-track" className="flex gap-6 min-w-full" style={{ width: "max-content" }}>
                {testimonials.concat(testimonials).concat(testimonials).map((t, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-gray-200 shadow flex flex-col gap-4 min-w-[340px] max-w-[360px] w-[340px] px-7 py-6 snap-start"
                  >
                    <div className="text-blue-700 text-4xl font-bold mb-2">“</div>
                    <div className="text-slate-700 text-base flex-1">{t.text}</div>
                    <div className="flex items-center gap-3 mt-2">
                      <img src={t.avatar} alt={t.name} className="w-11 h-11 rounded-full object-cover border" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-slate-700">{t.name}</span>
                        <span className="text-xs text-slate-500">Student</span>
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
                <img src={minatoImg} alt="mentor" className="w-full h-full object-cover rounded-[48px] relative z-10" />
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center md:pl-12">
              <h3 className="text-2xl md:text-3xl font-bold text-[#1A2233] mb-3 text-right md:text-left">
                Become an Mentor
              </h3>
              <p className="text-gray-600 text-base md:text-lg mb-6 max-w-lg text-right md:text-left">
                Instructors from around the world teach millions of students on MentorMe.
              </p>
              <div className="flex justify-end md:justify-start">
                <button className="flex items-center gap-2 px-6 py-3 bg-[#1A2233] text-white rounded-xl font-semibold shadow hover:bg-blue-700 transition text-base md:text-lg">
                  Mentor with MentorMe
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
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
                Learners around the world are launching new careers, advancing in their fields, and enriching their
                lives.
              </p>
              <div className="flex justify-start">
                <button
                  onClick={handleSeeAllCourses}
                  className="flex items-center gap-2 px-6 py-3 bg-[#1A2233] text-white rounded-xl font-semibold shadow hover:bg-blue-700 transition text-base md:text-lg"
                >
                  Checkout Courses
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 flex justify-center items-center">
              <div className="relative w-[320px] h-[320px] md:w-[340px] md:h-[340px] flex items-center justify-center">
                <div className="absolute inset-0 rounded-[48px] bg-[#D6E3F3]" />
                <img src={oipImg} alt="education" className="w-full h-full object-cover rounded-[48px] relative z-10" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeScreen;
