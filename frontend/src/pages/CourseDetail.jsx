import React, { useRef, useState } from 'react';
import { IoStarOutline, IoStar } from "react-icons/io5";
import { AiOutlineGlobal } from "react-icons/ai";
import CoursePic from "../assets/thumbnail.png";
import facebooklogo from "../assets/facebook.png";
import githublogo from "../assets/github.png";
import googlelogo from "../assets/google.png";
import twitterlogo from "../assets/twitter.png";
import microsoftlogo from "../assets/microsoft.png";
import minatoImg from "../assets/minato.webp";
import { ImQuotesLeft } from "react-icons/im";

const CourseDetail = () => {
    // Course data - có thể lấy từ props hoặc API
    const originalPrice = 99; // Giá gốc
    const discountPercent = 50;
    
    const courseData = {
        rating: 2.5,
        totalTime: "12 total hours",
        lectureCount: 45,
        level: "All Levels",
        originalPrice: originalPrice,
        discountPercent: discountPercent,
        currentPrice: originalPrice * (1 - discountPercent / 100) // Tính giá hiện tại
    };

    // Testimonials data
    const testimonials = [
        {
            name: "Jane Doe",
            text: "MentorMe is a game-changer! I love how easy it is to connect with real mentors who actually get what I'm going through. Every session feels super chill, helpful, and way more personal than any course I've tried. Big fan!",
            avatar: minatoImg,
        },
        {
            name: "John Smith",
            text: "This programming course was exactly what I needed! The instructor explains complex concepts in a simple way and the hands-on projects really helped me understand the material better.",
            avatar: minatoImg,
        },
        {
            name: "Sarah Wilson",
            text: "Amazing learning experience! The course content is well-structured and the mentor is always available to help. I've learned more in 3 months than I did in years of self-study.",
            avatar: minatoImg,
        },
    ];

    // Testimonial carousel ref
    const testimonialRef = useRef(null);
    
    // Scroll testimonial function
    const scrollTestimonialBy = (direction) => {
        const container = testimonialRef.current;
        if (!container) return;
        const card = container.querySelector("#testimonial-track > div");
        let cardWidth = 340;
        let gap = 24;
        if (card) {
            cardWidth = card.offsetWidth;
            const style = getComputedStyle(container);
            gap = parseInt(style.gap) || 24;
        }
        const scrollAmount = (cardWidth + gap) * 1; // Scroll by 1 card
        container.scrollBy({ left: direction * scrollAmount, behavior: "smooth" });
    };

    // Related courses data
    const relatedCourses = [
        {
            title: "Programming Fundamentals",
            mentor: "Viet Thang Nguyen",
            rating: 4.8,
            ratings: 1200,
            hours: 22,
            lectures: 155,
            level: "Beginner",
            price: 149.9,
            img: minatoImg,
        },
        {
            title: "UI/UX Design Basics",
            mentor: "Viet Thang Nguyen",
            rating: 4.7,
            ratings: 1200,
            hours: 18,
            lectures: 120,
            level: "Beginner",
            price: 149.9,
            img: minatoImg,
        },
        {
            title: "Digital Marketing 101",
            mentor: "Viet Thang Nguyen",
            rating: 4.9,
            ratings: 1200,
            hours: 25,
            lectures: 180,
            level: "Intermediate",
            price: 149.9,
            img: minatoImg,
        },
        {
            title: "Advanced JavaScript",
            mentor: "Viet Thang Nguyen",
            rating: 4.6,
            ratings: 1200,
            hours: 30,
            lectures: 200,
            level: "Advanced",
            price: 149.9,
            img: minatoImg,
        },
        {
            title: "Advanced JavaScript",
            mentor: "Viet Thang Nguyen",
            rating: 4.6,
            ratings: 1200,
            hours: 30,
            lectures: 200,
            level: "Advanced",
            price: 149.9,
            img: minatoImg,
        },
        {
            title: "Advanced JavaScript",
            mentor: "Viet Thang Nguyen",
            rating: 4.6,
            ratings: 1200,
            hours: 30,
            lectures: 200,
            level: "Advanced",
            price: 149.9,
            img: minatoImg,
        },
    ];

    // Top courses carousel ref and state
    const coursesRef = useRef(null);
    const [hoveredCarousel, setHoveredCarousel] = useState(null);

    // Scroll courses function
    const scrollCoursesBy = (direction) => {
        const container = coursesRef.current;
        if (!container) return;
        const card = container.querySelector("button");
        let cardWidth = 320;
        let gap = 32;
        if (card) {
            cardWidth = card.offsetWidth;
            const style = getComputedStyle(container);
            gap = parseInt(style.gap) || 32;
        }
        const scrollAmount = (cardWidth + gap) * 2; // Scroll by 2 cards
        container.scrollBy({ left: direction * scrollAmount, behavior: "smooth" });
    };

    // Function để render sao dựa trên rating
    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        
        // Render sao đầy
        for (let i = 0; i < fullStars; i++) {
            stars.push(
                <IoStar key={`full-${i}`} className="text-yellow-500" size={20} />
            );
        }
        
        // Render sao nửa (nếu có)
        if (hasHalfStar) {
            stars.push(
                <div key="half" className="relative">
                    <IoStarOutline className="text-yellow-500" size={20} />
                    <IoStar 
                        className="text-yellow-500 absolute top-0 left-0" 
                        size={20} 
                        style={{ clipPath: 'inset(0 50% 0 0)' }}
                    />
                </div>
            );
        }
        
        // Render sao rỗng còn lại
        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(
                <IoStarOutline key={`empty-${i}`} className="text-yellow-500" size={20} />
            );
        }
        
        return stars;
    };

    return (
        <div title="Course Detail" className="flex flex-col">
            <div title="hold name and box of course" className="flex flex-row pt-3 pl-10 gap-8">
                <div title="hold name of course" className="w-[70%] pt-10">
                    <h1 className='font-bold text-5xl'>Programming Fundamentals</h1>
                    <p className = "pt-3 text-slate-700">
                        This course is designed to give you a solid foundation in programming, covering essential 
                        <br />concepts, problem-solving techniques, and practical tools used by today's developers. Whether
                        <br /> you're new to coding or looking to strengthen your basics, you'll learn the core principles and
                        <br /> logic behind writing effective, real-world code across multiple platforms.
                    </p>

                    <div title = "rating (star) | total time of course, number of lectures and level required" className="flex flex-row pt-3 items-center space-x-4">
                        <div className="flex flex-row items-center">
                            <div className="flex flex-row">
                                {renderStars(courseData.rating)}
                            </div>
                            <span className="pl-2 text-lg font-medium">{courseData.rating}</span>
                        </div>

                        <p className = "text-lg text-slate-700">|</p>
                        
                        <div className="flex flex-row items-center text-slate-700">
                            <span> {courseData.totalTime}</span>
                        </div>
                        
                        <div className="flex flex-row items-center text-slate-700">
                            <span>{courseData.lectureCount} Lectures</span>
                        </div>
                        
                        <div className="flex flex-row items-center text-slate-700">
                            <span>{courseData.level}</span>
                        </div>
                    </div>

                    <div title = "hold author" className = "flex flex-row mt-4">
                        <div title = "avatar of author" className="w-12 h-12 rounded-full bg-gray-300 mr-3"></div>
                        <div title = "hold name of author" className="flex flex-row mt-3">
                            <div>Create by</div>
                            <div title = "name of author" className="font-semibold text-lg ml-2">John Doe</div>
                        </div>
                    </div>

                    <div title = "hold languege of course" className="flex flex-row mt-4 gap-3">
                        <AiOutlineGlobal className="text-gray-500" size={25} />
                        <span className="text-gray-700">English, Spanish, Italian, German</span>
                    </div>
                </div>

                <div title = "hold box of course" className="w-1/4 mt-5">
                    <div className="bg-white rounded-lg p-6" style={{
                        boxShadow: '0px 0px 8px 0px rgba(0, 0, 0, 0.15)'
                    }}>

                        <img src={CoursePic} alt="Course Thumbnail" className="w-full h-48 object-cover rounded-lg mb-4" />

                        <div title="hold price" className="flex flex-row items-center space-x-3 mb-4">
                            <span className="text-3xl font-bold text-black">
                                ${courseData.currentPrice}
                            </span>
                            <span className="text-xl text-gray-400 line-through">
                                ${courseData.originalPrice}
                            </span>
                            <span className="text-lg font-semibold text-green-600">
                                {courseData.discountPercent}% Off
                            </span>
                        </div>

                        <div title = "hold button of course" className="flex flex-col space-y-3">
                            <button className="w-full bg-slate-950 text-white py-2 rounded-lg hover:bg-slate-500 transition duration-200">
                                Add To Cart
                            </button>

                            <button className="w-full text-black py-2 rounded-lg border-2 border-slate-950 hover:bg-slate-100 transition duration-200">
                                Buy Now
                            </button>
                        </div>

                        <div title = "line separator" className="border-t border-gray-300 my-4"></div>

                        <div className="flex flex-col font-medium text-lg gap-2 mt-2">
                            Share
                            <div title = "hold social media icons" className="flex flex-row gap-2">
                                <a href="https://facebook.com">
                                <div className="bg-slate-200 rounded-full flex items-center justify-center w-10 h-10">
                                <img src={facebooklogo} alt="Facebook" className="w-6 h-6" />
                                </div>
                                </a>

                                <a href="https://github.com">
                                    <div className="bg-slate-200 rounded-full flex items-center justify-center w-10 h-10">
                                    <img src={githublogo} alt="GitHub" className="w-6 h-6" />
                                    </div>
                                </a>

                                <a href="https://google.com">
                                    <div className="bg-slate-200 rounded-full flex items-center justify-center w-10 h-10">
                                    <img src={googlelogo} alt="Google" className="w-6 h-6" />
                                    </div>
                                </a>

                                <a href="https://yourwebsite.com">
                                    <div className="bg-slate-200 rounded-full flex items-center justify-center w-10 h-10">
                                    <img src={twitterlogo} alt="Your Website" className="w-6 h-6" />
                                    </div>
                                </a>

                                <a href="https://microsoft.com">
                                    <div className="bg-slate-200 rounded-full flex items-center justify-center w-10 h-10">
                                    <img src={microsoftlogo} alt="Microsoft" className="w-6 h-6" />
                                    </div>
                                </a>
                            </div>
                            
                        </div>
                    </div>
                </div>
            </div>

            {/* Testimonials Section */}
            <section className="w-full py-14 bg-white mt-16 pl-4" style={{ background: "#f8f9fb" }}>
                <div className="w-full flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-4 px-10">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-3xl font-bold text-slate-800">
                                What Our Customer Say
                            </h1>
                            <h2 className="text-2xl font-bold text-slate-800">
                                About Us
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

                    <div className="relative px-10">
                        <div
                            id="testimonial-carousel"
                            ref={testimonialRef}
                            className="overflow-x-auto no-scrollbar select-none"
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
                                    .map((t, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-white rounded-2xl border border-gray-200 shadow flex flex-col gap-4 min-w-[340px] max-w-[360px] w-[340px] px-7 py-6 snap-start"
                                        >
                                            <div className="text-blue-700 text-4xl mb-2">
                                                <ImQuotesLeft />
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
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="w-full py-10 bg-white">
                <div className="w-full">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6 px-10">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-3xl font-bold text-[#1A2233]">More Courses Like This</h1>
                        </div>
                        <div className="flex gap-2 mt-4 md:mt-0">
                            <button
                                onClick={() => scrollCoursesBy(-1)}
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
                                onClick={() => scrollCoursesBy(1)}
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
                    <div className="relative px-10">
                        <div
                            ref={coursesRef}
                            className="overflow-x-auto whitespace-nowrap select-none no-scrollbar"
                            style={{
                                WebkitOverflowScrolling: "touch",
                                scrollSnapType: "x mandatory",
                                scrollBehavior: "smooth",
                            }}
                            tabIndex={-1}
                        >
                            <div className="inline-flex gap-8">
                                {relatedCourses.map((course, idx) => (
                                    <button
                                        key={idx}
                                        className="bg-white rounded-[18px] border border-[#D6E3F3] shadow-sm flex flex-col p-6 min-w-[290px] max-w-[320px] w-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 group cursor-pointer"
                                        tabIndex={0}
                                        type="button"
                                        onClick={() => {
                                            /* Navigate to course detail */
                                        }}
                                        style={{ outline: "none", scrollSnapAlign: "start" }}
                                    >
                                        <img
                                            src={course.img}
                                            alt={course.title}
                                            className="w-full h-32 object-cover rounded-[14px] mb-4 group-hover:scale-105 transition-transform duration-200"
                                        />
                                        <div className="flex flex-col flex-1">
                                            <div className="font-bold text-lg text-[#1A2233] mb-1">
                                                {course.title}
                                            </div>
                                            <div className="text-sm text-[#6B7280] mb-1">
                                                By {course.mentor}
                                            </div>
                                            <div className="flex items-center gap-1 text-sm mb-1">
                                                <span className="text-[#F59E1B]">★</span>
                                                <span className="text-[#F59E1B]">★</span>
                                                <span className="text-[#F59E1B]">★</span>
                                                <span className="text-[#F59E1B]">★</span>
                                                <span className="text-[#F59E1B]">★</span>
                                                <span className="text-[#6B7280] ml-2">
                                                    ({course.ratings} <span className="font-bold">Ratings</span>)
                                                </span>
                                            </div>
                                            <div className="text-sm text-[#6B7280] mb-1">
                                                {course.hours} Total Hours. {course.lectures} Lectures. {course.level}
                                            </div>
                                            <div className="font-bold text-[#1A2233] text-xl mt-2">
                                                ${course.price}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );

}

export default CourseDetail;