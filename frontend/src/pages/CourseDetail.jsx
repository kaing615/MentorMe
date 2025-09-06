import React, { useRef, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { IoStarOutline, IoStar } from "react-icons/io5";
import { AiOutlineGlobal } from "react-icons/ai";
import { FaHashtag, FaBullseye } from "react-icons/fa";
import { GiLevelEndFlag } from "react-icons/gi";
import CoursePic from "../assets/thumbnail.png";
import facebooklogo from "../assets/facebook.png";
import githublogo from "../assets/github.png";
import googlelogo from "../assets/google.png";
import twitterlogo from "../assets/twitter.png";
import microsoftlogo from "../assets/microsoft.png";
import minatoImg from "../assets/minato.webp"; // đổi lại .jpg nếu repo bạn dùng .jpg
import { ImQuotesLeft } from "react-icons/im";
import { showLoading, hideLoading } from "../redux/features/loading.slice";
import courseApi from "../api/modules/course.api";
import cartApi from "../api/modules/cart.api";
import { toast } from "react-toastify";
import { MENTEE_PATH, MENTOR_PATH, PATH } from "../routes/path";

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Check authentication and role
  useEffect(() => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("actkn");
    if (!token) {
      toast.error("Please log in to view course details");
      navigate(PATH.LOGIN);
      return;
    }
    const userStr = localStorage.getItem("user");
    let user = null;
    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      user = null;
    }
    // Chỉ cho phép mentee, mentor, admin
    if (!user || !["mentee", "mentor"].includes(user.role)) {
      toast.error("You do not have access to this page.");
      navigate(PATH.LOGIN);
      return;
    }
  }, [navigate]);

  // States
  const [courseData, setCourseData] = useState(null);
  const [relatedCourses, setRelatedCourses] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Refs
  const coursesRef = useRef(null);
  const testimonialRef = useRef(null); // <- KHÔNG comment, vì bên dưới có dùng
  const loadingTimerRef = useRef(null);

  // Fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!id) return;

      dispatch(showLoading());
      const startTime = Date.now();

      try {
        const { response: courseResponse, err: courseError } =
          await courseApi.getDetail({ courseId: id });

        if (courseError) {
          throw new Error(
            courseError.message || "Không thể tải thông tin khóa học"
          );
        }

        const course = courseResponse?.data?.course;
        setCourseData(course);

        // Fetch related courses
        if (course && course.category) {
          const { response: relatedResponse } =
            await courseApi.getRelatedCourses({
              courseId: id,
              category: course.category,
              limit: 6,
            });

          const rel = relatedResponse?.data?.courses || [];
          setRelatedCourses(Array.isArray(rel) ? rel : []);
        }
      } catch (error) {
        console.error("Error fetching course data:", error);
        setError(error.message);
        toast.error(error.message || "Có lỗi xảy ra khi tải dữ liệu");
      } finally {
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

    // Cleanup
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
  }, [id, dispatch]);

  // Helper function to check if course is already purchased
  const isCourseAlreadyPurchased = (courseId) => {
    const userStr = localStorage.getItem("user");
    let currentUserId = null;
    try {
      const user = userStr ? JSON.parse(userStr) : null;
      currentUserId = user?.id || user?._id;
    } catch (e) {
      return false;
    }

    const mockKey = currentUserId
      ? `mockPurchasedCourses_${currentUserId}`
      : "mockPurchasedCourses";
    const mockPurchasedCourses = localStorage.getItem(mockKey);

    if (mockPurchasedCourses) {
      try {
        const purchasedCourses = JSON.parse(mockPurchasedCourses);
        return purchasedCourses.some((purchased) => {
          const purchasedCourseId =
            purchased.course?._id ||
            purchased.course?.id ||
            purchased.courseId ||
            purchased.courseInfo?._id;
          return purchasedCourseId === courseId;
        });
      } catch (error) {
        console.error("Error parsing purchased courses:", error);
        return false;
      }
    }
    return false;
  };

  // Handle Add to Cart
  const handleAddToCart = async () => {
    if (!courseData?._id) {
      toast.error("Không thể thêm khóa học vào giỏ hàng");
      return;
    }

    // Check if course is already purchased
    if (isCourseAlreadyPurchased(courseData._id)) {
      toast.error(
        "Bạn đã mua khóa học này rồi! Kiểm tra 'Khóa học của tôi' trong profile."
      );
      return;
    }

    // Check if user is mentee
    const userStr = localStorage.getItem("user");
    let user = null;
    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      toast.error("Vui lòng đăng nhập lại");
      return;
    }

    if (!user || user.role !== "mentee") {
      toast.error("Chỉ mentee mới có thể mua khóa học");
      return;
    }

    setIsAddingToCart(true);

    try {
      // Debug: Check token
      const token =
        localStorage.getItem("token") || localStorage.getItem("actkn");
      console.log("Add to cart - Token exists:", !!token);
      console.log("Add to cart - CourseId:", courseData._id);

      const { response, error } = await cartApi.addToCart({
        courseId: courseData._id,
        dispatch,
      });

      if (error) {
        throw new Error(error.message || "Không thể thêm vào giỏ hàng");
      }

      toast.success("Đã thêm khóa học vào giỏ hàng!");

      // Có thể navigate đến cart page hoặc show cart sidebar
      // navigate("/mentee/cart");
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error(error.message || "Có lỗi xảy ra khi thêm vào giỏ hàng");
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Handle Buy Now
  const handleBuyNow = async () => {
    if (!courseData?._id) {
      toast.error("Không thể mua khóa học");
      return;
    }

    // Check if course is already purchased
    if (isCourseAlreadyPurchased(courseData._id)) {
      toast.error(
        "Bạn đã mua khóa học này rồi! Kiểm tra 'Khóa học của tôi' trong profile."
      );
      return;
    }

    // Add to cart first, then redirect to checkout
    await handleAddToCart();
    if (!isAddingToCart) {
      navigate("/mentee/checkout");
    }
  };

  // Loading
  if (!courseData && !error) return null;

  // Error
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Có lỗi xảy ra
          </h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Testimonials sample
  const testimonials = [
    {
      name: "Jane Doe",
      text: "MentorMe is a game-changer! I love how easy it is to connect with real mentors who actually get what I'm going through.",
      avatar: minatoImg,
    },
    {
      name: "John Smith",
      text: "This programming course was exactly what I needed! The instructor explains complex concepts clearly.",
      avatar: minatoImg,
    },
    {
      name: "Sarah Wilson",
      text: "Amazing learning experience! The course content is well-structured and the mentor is always available to help.",
      avatar: minatoImg,
    },
  ];

  // Scroll testimonial
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
    const scrollAmount = (cardWidth + gap) * 1;
    container.scrollBy({ left: direction * scrollAmount, behavior: "smooth" });
  };

  // Scroll related courses
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
    const scrollAmount = (cardWidth + gap) * 2;
    container.scrollBy({ left: direction * scrollAmount, behavior: "smooth" });
  };

  // Stars render
  const renderStars = (rating) => {
    const stars = [];
    const r = Number(rating) || 0;
    const full = Math.floor(r);
    const hasHalf = r % 1 !== 0;

    for (let i = 0; i < full; i++) {
      stars.push(
        <IoStar key={`full-${i}`} className="text-yellow-500" size={20} />
      );
    }
    if (hasHalf) {
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
    const empty = 5 - Math.ceil(r);
    for (let i = 0; i < empty; i++) {
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

  const basePrice = Number(courseData?.price) || 0;
  const discount = Number(courseData?.discount) || 0;
  const discountedPrice = basePrice - basePrice * (discount / 100);

  return (
    <div title="Course Detail" className="flex flex-col">
      <div
        title="hold name and box of course"
        className="flex flex-row pt-3 pl-10 gap-8"
      >
        <div title="hold name of course" className="w-[70%] pt-10">
          <h1 className="font-bold text-5xl">{courseData.title}</h1>
          <p className="pt-3 text-slate-700">{courseData.description}</p>

          <div
            title="rating (star) | total time of course, number of lectures and level required"
            className="flex flex-row pt-3 items-center space-x-4"
          >
            <div className="flex flex-row items-center">
              <div className="flex flex-row">
                {renderStars(courseData.rate || 0)}
              </div>
              <span className="pl-2 text-lg font-medium">
                {courseData.rate || 0}
              </span>
            </div>

            <p className="text-lg text-slate-700">|</p>

            <div className="flex flex-row items-center text-slate-700">
              <span>{courseData.duration} total hours</span>
            </div>

            <div className="flex flex-row items-center text-slate-700">
              <span>{courseData.lectures} Lectures</span>
            </div>

            <div className="flex flex-row items-center text-slate-700">
              <span>
                {Array.isArray(courseData.category)
                  ? courseData.category.join(", ")
                  : courseData.category}
              </span>
            </div>
          </div>

          <div title="hold author" className="flex flex-row mt-4">
            <div
              title="avatar of author"
              className="w-12 h-12 rounded-full bg-gray-300 mr-3 cursor-pointer"
              onClick={() => {
                if (courseData.mentor?._id) {
                  navigate(`/mentor/${courseData.mentor._id}`, {
                    state: { mentorData: courseData.mentor },
                  });
                }
              }}
            >
              <img
                src={courseData.mentor?.avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  e.currentTarget.src = minatoImg;
                }}
              />
            </div>
            <div title="hold name of author" className="flex flex-row mt-3">
              <div>Create by</div>
              <div
                title="name of author"
                className="font-semibold text-lg ml-2 cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
                onClick={() => {
                  if (courseData.mentor?._id) {
                    navigate(`/mentor/${courseData.mentor._id}`, {
                      state: { mentorData: courseData.mentor },
                    });
                  }
                }}
              >
                {courseData.mentor?.userName ||
                  courseData.mentor?.email ||
                  "Anonymous"}
              </div>
            </div>
          </div>

          <div
            title="hold language of course"
            className="flex flex-row mt-4 gap-3 items-start"
          >
            <AiOutlineGlobal className="text-gray-400 mt-1" size={25} />
            <div className="flex flex-col">
              <span className="text-gray-700 font-medium mb-2">Languages:</span>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  if (!courseData.language)
                    return (
                      <span className="text-gray-500 text-sm">
                        No language available
                      </span>
                    );
                  let langs = courseData.language;

                  // Parse languages array
                  if (Array.isArray(langs)) {
                    return langs.map((lang, index) => (
                      <span
                        key={index}
                        className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-medium"
                      >
                        {lang.trim()}
                      </span>
                    ));
                  }

                  if (
                    typeof langs === "string" &&
                    langs.trim().startsWith("[")
                  ) {
                    try {
                      const parsed = JSON.parse(langs);
                      if (Array.isArray(parsed)) {
                        return parsed.map((lang, index) => (
                          <span
                            key={index}
                            className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-medium"
                          >
                            {lang.trim()}
                          </span>
                        ));
                      }
                    } catch {}
                  }

                  // Fallback for string format
                  const langArray = String(langs)
                    .replace(/\[|\]|"/g, "")
                    .split(",")
                    .map((lang) => lang.trim())
                    .filter(Boolean);

                  return langArray.map((lang, index) => (
                    <span
                      key={index}
                      className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-medium"
                    >
                      {lang}
                    </span>
                  ));
                })()}
              </div>
            </div>
          </div>

          <div
            title="hold tags"
            className="flex flex-row mt-4 gap-3 items-start"
          >
            <FaHashtag className="text-gray-400 mt-1" size={25} />
            <div className="flex flex-col">
              <span className="text-gray-700 font-medium mb-2">Tags:</span>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  if (!courseData.tags)
                    return (
                      <span className="text-gray-500 text-sm">
                        No tags available
                      </span>
                    );
                  let tags = courseData.tags;

                  // Parse tags array
                  if (Array.isArray(tags)) {
                    return tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium"
                      >
                        {tag.trim()}
                      </span>
                    ));
                  }

                  if (typeof tags === "string" && tags.trim().startsWith("[")) {
                    try {
                      const parsed = JSON.parse(tags);
                      if (Array.isArray(parsed)) {
                        return parsed.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium"
                          >
                            {tag.trim()}
                          </span>
                        ));
                      }
                    } catch {}
                  }

                  // Fallback for string format
                  const tagArray = String(tags)
                    .replace(/\[|\]|"/g, "")
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean);

                  return tagArray.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium"
                    >
                      {tag}
                    </span>
                  ));
                })()}
              </div>
            </div>
          </div>

          {/* Hiển thị level nếu có */}
          {courseData.level && (
            <div
              title="hold level"
              className="flex flex-row mt-4 gap-3 items-start"
            >
              <GiLevelEndFlag className="text-gray-400 mt-1" size={25} />
              <div className="flex flex-col">
                <span className="text-gray-700 font-medium mb-2">Level:</span>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-block bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full font-medium">
                    {courseData.level}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Hiển thị key learning objectives nếu có */}
          {courseData.keyLearningObjectives && (
            <div
              title="hold key objectives"
              className="flex flex-row mt-4 gap-3 items-start"
            >
              <FaBullseye className="text-gray-400 mt-1" size={25} />
              <div className="flex flex-col">
                <span className="text-gray-700 font-medium mb-2">
                  Key Learning Objectives:
                </span>
                <div className="text-gray-600 text-sm leading-relaxed">
                  {(() => {
                    console.log(
                      "Raw keyLearningObjectives:",
                      courseData.keyLearningObjectives
                    );
                    console.log(
                      "Type:",
                      typeof courseData.keyLearningObjectives
                    );

                    let objectives = courseData.keyLearningObjectives;

                    // If it's already an array, use it directly
                    if (Array.isArray(objectives)) {
                      console.log("Already array:", objectives);
                      return (
                        <ul className="list-disc list-inside space-y-2">
                          {objectives.map((objective, index) => (
                            <li key={index} className="text-gray-600">
                              {objective}
                            </li>
                          ))}
                        </ul>
                      );
                    }

                    // If it's a string, try to parse as JSON first
                    if (typeof objectives === "string") {
                      console.log("String detected, trying to parse...");

                      try {
                        const parsed = JSON.parse(objectives);
                        console.log("JSON parsed successfully:", parsed);

                        if (Array.isArray(parsed)) {
                          return (
                            <ul className="list-disc list-inside space-y-2">
                              {parsed.map((objective, index) => (
                                <li key={index} className="text-gray-600">
                                  {objective}
                                </li>
                              ))}
                            </ul>
                          );
                        }
                      } catch (e) {
                        console.log(
                          "JSON parse failed, treating as string:",
                          e
                        );
                      }

                      // If JSON parse fails, treat as single objective
                      return (
                        <ul className="list-disc list-inside space-y-2">
                          <li className="text-gray-600">{objectives}</li>
                        </ul>
                      );
                    }

                    // Fallback: display as is
                    return <div>{objectives}</div>;
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>

        <div title="hold box of course" className="w-1/4 mt-5">
          <div
            className="bg-white rounded-lg p-6"
            style={{ boxShadow: "0px 0px 8px 0px rgba(0,0,0,0.15)" }}
          >
            <img
              src={courseData.thumbnail || courseData.thumbnailUrl || CoursePic}
              alt="Course Thumbnail"
              className="w-full h-48 object-cover rounded-lg mb-4"
            />

            <div
              title="hold price"
              className="flex flex-row items-center space-x-3 mb-4"
            >
              <span className="text-3xl font-bold text-black">
                $
                {(() => {
                  const price =
                    typeof discountedPrice === "number"
                      ? discountedPrice
                      : parseFloat(discountedPrice || 0);
                  return price % 1 === 0
                    ? price.toLocaleString("en-US")
                    : price.toLocaleString("en-US", {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 2,
                      });
                })()}
              </span>
              {discount > 0 && (
                <>
                  <span className="text-xl font-semibold text-gray-400 line-through">
                    $
                    {(() => {
                      const price =
                        typeof basePrice === "number"
                          ? basePrice
                          : parseFloat(basePrice || 0);
                      return price % 1 === 0
                        ? price.toLocaleString("en-US")
                        : price.toLocaleString("en-US", {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 2,
                          });
                    })()}
                  </span>
                  <span className="text-xl font-semibold text-green-600">
                    {discount}% Off
                  </span>
                </>
              )}
            </div>

            <div
              title="hold button of course"
              className="flex flex-col space-y-3"
            >
              {isCourseAlreadyPurchased(courseData?._id) ? (
                <div className="w-full bg-green-100 text-green-800 py-3 rounded-lg text-center font-medium border border-green-300">
                  <span className="inline-flex items-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    ✓ Already Purchased
                  </span>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    className="w-full bg-slate-950 text-white py-2 rounded-lg hover:bg-slate-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAddingToCart ? "Đang thêm..." : "Add To Cart"}
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={isAddingToCart}
                    className="w-full text-black py-2 rounded-lg border-2 border-slate-950 hover:bg-slate-100 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Buy Now
                  </button>
                </>
              )}
            </div>

            <div
              title="line separator"
              className="border-t border-gray-300 my-4"
            />

            <div className="flex flex-col font-medium text-lg gap-2 mt-2">
              Share
              <div
                title="hold social media icons"
                className="flex flex-row gap-2"
              >
                <a href="https://facebook.com" aria-label="Facebook">
                  <div className="bg-slate-200 rounded-full flex items-center justify-center w-10 h-10">
                    <img
                      src={facebooklogo}
                      alt="Facebook"
                      className="w-6 h-6"
                    />
                  </div>
                </a>
                <a href="https://github.com" aria-label="GitHub">
                  <div className="bg-slate-200 rounded-full flex items-center justify-center w-10 h-10">
                    <img src={githublogo} alt="GitHub" className="w-6 h-6" />
                  </div>
                </a>
                <a href="https://google.com" aria-label="Google">
                  <div className="bg-slate-200 rounded-full flex items-center justify-center w-10 h-10">
                    <img src={googlelogo} alt="Google" className="w-6 h-6" />
                  </div>
                </a>
                <a href="https://yourwebsite.com" aria-label="Website">
                  <div className="bg-slate-200 rounded-full flex items-center justify-center w-10 h-10">
                    <img
                      src={twitterlogo}
                      alt="Your Website"
                      className="w-6 h-6"
                    />
                  </div>
                </a>
                <a href="https://microsoft.com" aria-label="Microsoft">
                  <div className="bg-slate-200 rounded-full flex items-center justify-center w-10 h-10">
                    <img
                      src={microsoftlogo}
                      alt="Microsoft"
                      className="w-6 h-6"
                    />
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <section
        className="w-full py-14 bg-white mt-16 pl-4"
        style={{ background: "#f8f9fb" }}
      >
        <div className="w-full flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-4 px-10">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold text-slate-800">
                What Our Customer Say
              </h1>
              <h2 className="text-2xl font-bold text-slate-800">
                About This Course
              </h2>
            </div>
          </div>
          <div className="relative px-10">
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              ref={testimonialRef}
              id="testimonial-track"
            >
              {reviews && reviews.length > 0 ? (
                reviews.map((review, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-gray-200 shadow flex flex-col gap-4 min-w-[340px] max-w-[360px] w-[340px] px-7 py-6"
                  >
                    <div className="text-blue-700 text-4xl mb-2">
                      <ImQuotesLeft />
                    </div>
                    <div className="text-slate-700 text-base flex-1">
                      {review.content}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <img
                        src={review.user?.avatar || minatoImg}
                        alt={review.user?.name || "User"}
                        className="w-11 h-11 rounded-full object-cover border"
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-slate-700">
                          {review.user?.name || "User"}
                        </span>
                        <span className="text-xs text-slate-500">Student</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 col-span-3">
                  No reviews yet for this course.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Related Courses */}
      <section className="w-full py-10 bg-white mt-5">
        <div className="w-full">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6 px-10">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold text-[#1A2233]">
                More Courses Like This
              </h1>
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
                {relatedCourses.map((course, idx) => {
                  const p = Number(course.price) || 0;
                  const d = Number(course.discount) || 0;
                  const discountedPrice = p - p * (d / 100);
                  const formatPrice = (price) => {
                    return price % 1 === 0
                      ? price.toLocaleString("en-US")
                      : price.toLocaleString("en-US", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 2,
                        });
                  };
                  return (
                    <button
                      key={course.courseId || course._id || idx}
                      onClick={() => {
                        navigate(
                          `/course-detail/${course.courseId || course._id}`
                        );
                        window.scrollTo(0, 0);
                      }}
                      className="text-left border border-gray-200 rounded-lg p-4 w-[320px] hover:shadow-lg transition duration-200 flex flex-col items-start whitespace-normal min-h-[400px]"
                    >
                      <img
                        src={
                          course.thumbnailUrl || course.thumbnail || CoursePic
                        }
                        alt={course.title}
                        className="w-[320px] h-[180px] object-cover rounded-lg mb-2"
                      />
                      <div className="font-bold text-lg line-clamp-2 break-words whitespace-normal max-w-full mb-1">
                        {course.title}
                      </div>
                      <div className="text-sm text-slate-600 mb-2">
                        By{" "}
                        {course.mentor?.userName ||
                          course.mentor?.firstName ||
                          "Mentor"}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-slate-700 mb-2">
                        <div className="flex items-center">
                          {renderStars(course.rate || 0)}
                        </div>
                        <span className="text-sm">({course.rate || 0})</span>
                      </div>
                      <div className="text-sm text-slate-600 mb-2">
                        {course.duration} hours · {course.lectures} Lectures ·{" "}
                        {Array.isArray(course.category)
                          ? course.category.join(", ")
                          : course.category}
                      </div>

                      {/* Hiển thị tags */}
                      {course.tags && course.tags.length > 0 && (
                        <div className="mb-2">
                          <div className="flex flex-wrap gap-1">
                            {course.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium max-w-[80px] truncate"
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
                      {course.language && course.language.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-500 mb-1">
                            Languages:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {course.language.slice(0, 2).map((lang, index) => (
                              <span
                                key={index}
                                className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium max-w-[80px] truncate"
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

                      {/* Hiển thị level */}
                      {course.level && (
                        <p className="text-green-500 text-xs mb-2">
                          <b>Level:</b> {course.level}
                        </p>
                      )}

                      <div className="font-bold flex flex-row text-xl mt-auto gap-1">
                        <div title="discount">
                          ${formatPrice(discountedPrice)}
                        </div>
                        {d > 0 && (
                          <div
                            title="original"
                            className="text-base font-semibold text-gray-400 line-through"
                          >
                            ${formatPrice(p)}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
                {relatedCourses.length === 0 && (
                  <div className="text-slate-600">
                    Chưa có khoá học tương tự.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CourseDetail;
