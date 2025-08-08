import React, { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
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
import { showLoading, hideLoading } from "../redux/features/loading.slice";
import courseApi from "../api/modules/course.api";
import { toast } from "react-toastify";
import { LiaHashtagSolid } from "react-icons/lia";

const CourseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // States
    const [courseData, setCourseData] = useState(null);
    const [relatedCourses, setRelatedCourses] = useState([]);
    const [error, setError] = useState(null);
    
    // Refs - phải khai báo trước early returns
    const coursesRef = useRef(null);
    const loadingTimerRef = useRef(null);
    // const testimonialRef = useRef(null);
    
    // Fetch course data
    useEffect(() => {
        const fetchCourseData = async () => {
            if (!id) return;
            
            dispatch(showLoading());
            const startTime = Date.now();
            
            try {
                
                const { response: courseResponse, err: courseError } = await courseApi.getDetail({ 
                    courseId: id 
                });
                
                if (courseError) {
                    throw new Error(courseError.message || "Không thể tải thông tin khóa học");
                }
                
                const course = courseResponse.data.course;
                setCourseData(course);
                
                // Fetch related courses
                if (course && course.category) {
                    const { response: relatedResponse } = await courseApi.getRelatedCourses({
                        courseId: id,
                        category: course.category,
                        limit: 6
                    });
                    
                    if (relatedResponse && relatedResponse.data && relatedResponse.data.courses) {
                        setRelatedCourses(relatedResponse.data.courses);
                    }
                }
                
            } catch (error) {
                console.error("Error fetching course data:", error);
                setError(error.message);
                toast.error(error.message || "Có lỗi xảy ra khi tải dữ liệu");
            } finally {
                // Đảm bảo loading hiển thị tối thiểu một khoảng thời gian
                const MIN_DURATION = 1500; // ms
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(MIN_DURATION - elapsed, 0);
                if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
                loadingTimerRef.current = setTimeout(() => {
                    dispatch(hideLoading());
                    loadingTimerRef.current = null;
                }, remaining);
            }
        };
        
        fetchCourseData();

        // Cleanup khi đổi route hoặc unmount
        return () => {
            if (loadingTimerRef.current) {
                clearTimeout(loadingTimerRef.current);
                loadingTimerRef.current = null;
            }
        }

    }, [id, dispatch]);
    
    // Loading state
    if (!courseData && !error) {
        return null; // LoadingPage sẽ hiển thị
    }
    
    // Error state
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Có lỗi xảy ra</h2>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

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
    // const testimonialRef = useRef(null);
    
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

    // Top courses carousel ref and state
    // const [hoveredCarousel, setHoveredCarousel] = useState(null);

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

    const discountPrice = courseData.price - (courseData.price * (courseData.discount/100));

    return (
        <div title="Course Detail" className="flex flex-col">
            <div title="hold name and box of course" className="flex flex-row pt-3 pl-10 gap-8">
                <div title="hold name of course" className="w-[70%] pt-10">
                    <h1 className='font-bold text-5xl'>{courseData.title}</h1>
                    <p className="pt-3 text-slate-700">
                        {courseData.description}
                    </p>

                    <div title = "rating (star) | total time of course, number of lectures and level required" className="flex flex-row pt-3 items-center space-x-4">
                        <div className="flex flex-row items-center">
                            <div className="flex flex-row">
                                {renderStars(courseData.rate || 0)}
                            </div>
                            <span className="pl-2 text-lg font-medium">{courseData.rate || 0}</span>
                        </div>

                        <p className = "text-lg text-slate-700">|</p>
                        
                        <div className="flex flex-row items-center text-slate-700">
                            <span>{courseData.duration} total hours</span>
                        </div>
                        
                        <div className="flex flex-row items-center text-slate-700">
                            <span>{courseData.lectures} Lectures</span>
                        </div>
                        
                        <div className="flex flex-row items-center text-slate-700">
                            <span>{Array.isArray(courseData.category) ? courseData.category.join(', ') : courseData.category}</span>
                        </div>
                    </div>

                    <div title = "hold author" className = "flex flex-row mt-4">
                        <div title = "avatar of author" className="w-12 h-12 rounded-full bg-gray-300 mr-3">
                            <img src = {courseData.mentor.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                        </div>
                        <div title = "hold name of author" className="flex flex-row mt-3">
                            <div>Create by</div>
                            <div title = "name of author" className="font-semibold text-lg ml-2">
                                {courseData.mentor?.userName || courseData.mentor?.email || "Anonymous"}
                            </div>
                        </div>
                    </div>

                    <div title = "hold languege of course" className="flex flex-row mt-4 gap-3">
                        <AiOutlineGlobal className="text-gray-500" size={25} />
                        <span className="text-gray-700">
                            {courseData.language}
                        </span>
                    </div>

                    <div title = "hold tags" className="flex flex-row mt-4 gap-3">
                        <LiaHashtagSolid className="text-gray-500" size={25} />
                        <span className="text-gray-700">
                            {courseData.tags && courseData.tags.length > 0 
                                ? courseData.tags.join(', ')
                                : "No tags available"
                            }
                        </span>
                    </div>
                </div>

                <div title = "hold box of course" className="w-1/4 mt-5">
                    <div className="bg-white rounded-lg p-6" style={{
                        boxShadow: '0px 0px 8px 0px rgba(0, 0, 0, 0.15)'
                    }}>

                        <img src={CoursePic} alt="Course Thumbnail" className="w-full h-48 object-cover rounded-lg mb-4" />

                        <div title="hold price" className="flex flex-row items-center space-x-3 mb-4">
                            <span className="text-3xl font-bold text-black">
                                ${discountPrice.toFixed(1)}
                            </span>
                            {courseData.discount && courseData.discount > 0 && (
                                <>
                                    <span className="text-xl font-semibold text-gray-400 line-through">
                                        ${courseData.price.toFixed(1)}
                                    </span>
                                    <span className="text-xl font-semibold text-green-600">
                                        {courseData.discount}% Off
                                    </span>
                                </>
                            )}
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
            {/* <section className="w-full py-14 bg-white mt-16 pl-4" style={{ background: "#f8f9fb" }}>
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
            </section> */}

            <section className="w-full py-10 bg-white mt-5">
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
                                        key={course.courseId || idx}
                                        onClick={() => navigate(`/courses/${course.courseId}`)}
                                        className="text-left border border-gray-200 rounded-lg p-4 w-[320px] hover:shadow-lg transition duration-200 flex flex-col items-start whitespace-normal"
                                    >
                                        <img
                                            src={course.thumbnailUrl || CoursePic}
                                            alt={course.title}
                                            className="w-[320px] h-[180px] object-cover rounded-lg mb-2"
                                        />
                                        <div className="font-bold text-lg line-clamp-2 break-words whitespace-normal max-w-full">{course.title}</div>
                                        <div className="text-sm text-slate-600">By {course.mentor?.userName || course.mentor?.firstName}</div>
                                        <div className="flex items-center gap-2 mt-1 text-slate-700">
                                            <div className="flex items-center">{renderStars(course.rate || 0)}</div>
                                            <span className="text-sm">({course.rate || 0})</span>
                                        </div>
                                        <div className="text-sm text-slate-600 mt-1">
                                            {course.duration} hours · {course.lectures} Lectures · {Array.isArray(course.category) ? course.category.join(', ') : course.category}
                                        </div>
                                        <div className="font-bold flex flex-row text-xl mt-1 gap-1">
                                            <div title="discount">
                                                ${course.price - (course.price * (course.discount/100)).toFixed(1)}
                                            </div>

                                            <div title="original" className="text-base font-semibold text-gray-400 line-through">
                                                ${course.price.toFixed(1)}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                                {relatedCourses.length === 0 && (
                                    <div className="text-slate-600">Chưa có khoá học tương tự.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );

}

export default CourseDetail;