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
import { VscCodeReview } from "react-icons/vsc";
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
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Get current user info
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    try {
      const user = userStr ? JSON.parse(userStr) : null;
      setCurrentUser(user);
    } catch (e) {
      setCurrentUser(null);
    }
  }, []);

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

        // Fetch course reviews
        if (course && course._id) {
          try {
            setReviewsLoading(true);
            console.log("Fetching reviews for courseId:", course._id);

            const { response: reviewsResponse, err: reviewsError } =
              await courseApi.getCourseReviews({ courseId: course._id });

            console.log("Reviews API response:", reviewsResponse);
            console.log("Reviews API error:", reviewsError);

            if (reviewsResponse && reviewsResponse.data) {
              // Backend trả về { data: reviews } thay vì { data: { reviews: [...] } }
              const courseReviews = Array.isArray(reviewsResponse.data)
                ? reviewsResponse.data
                : reviewsResponse.data.reviews || [];
              setReviews(courseReviews);
              console.log("Course reviews loaded:", courseReviews);
              console.log("Reviews count:", courseReviews.length);
            } else if (reviewsError) {
              console.warn("Could not fetch reviews:", reviewsError);
              setReviews([]); // Set empty array if reviews fail to load
            }
          } catch (reviewError) {
            console.warn("Error fetching course reviews:", reviewError);
            setReviews([]); // Set empty array on error
          } finally {
            setReviewsLoading(false);
          }
        }

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

  // Cleanup effect to restore scroll when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

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

  // Handle Add to Cart (for both main course and related courses)
  const handleAddToCart = async (e, course = null) => {
    if (e) {
      e.stopPropagation();
    }

    // Use provided course or default to main course data
    const targetCourse = course || courseData;
    const courseId = targetCourse?._id || targetCourse?.courseId;

    if (!courseId) {
      toast.error("Không thể thêm khóa học vào giỏ hàng");
      return;
    }

    // Check if course is already purchased
    if (isCourseAlreadyPurchased(courseId)) {
      toast.error(
        "You have already purchased this course! Check 'My Courses' in your profile."
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

      const { response, error } = await cartApi.addToCart(
        {
          courseId: courseId,
        },
        dispatch
      );

      if (error) {
        // Get error message from different possible sources
        let errorMessage = "";
        if (typeof error === "string") {
          errorMessage = error;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.data && error.data.message) {
          errorMessage = error.data.message;
        } else if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = "Can't add to cart";
        }

        console.log("Error message:", errorMessage);

        // Check if it's "already in cart" error
        if (errorMessage.toLowerCase().includes("đã có trong giỏ hàng")) {
          toast.info("Course is already in cart!");
          return;
        }

        throw new Error(errorMessage);
      }

      toast.success("Course has been added to cart!");

      // Có thể navigate đến cart page hoặc show cart sidebar
      // navigate("/mentee/cart");
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error(error.message || "Có lỗi xảy ra khi thêm vào giỏ hàng");
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Check if course is already in cart
  const isCourseInCart = async (courseId) => {
    try {
      const { response, error } = await cartApi.getCart(dispatch);
      if (error || !response?.data?.cart?.courses) {
        return false;
      }

      const cartCourses = response.data.cart.courses;
      return cartCourses.some(
        (item) =>
          item.course?._id === courseId ||
          item.course?.courseId === courseId ||
          item.courseId === courseId
      );
    } catch (error) {
      console.error("Error checking cart:", error);
      return false;
    }
  };

  // Handle Buy Now (for both main course and related courses)
  const handleBuyNow = async (e, course = null) => {
    if (e) {
      e.stopPropagation();
    }

    // Use provided course or default to main course data
    const targetCourse = course || courseData;
    const courseId = targetCourse?._id || targetCourse?.courseId;

    if (!courseId) {
      toast.error("Không thể mua khóa học");
      return;
    }

    // Check if course is already purchased
    if (isCourseAlreadyPurchased(courseId)) {
      toast.error(
        "You have already purchased this course! Check 'My Courses' in your profile."
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
      // Check if course is already in cart
      const isInCart = await isCourseInCart(courseId);

      if (isInCart) {
        // Course already in cart, go directly to shopping cart
        navigate("/shoppingcart");
      } else {
        // Course not in cart, add it silently (no toast notification)
        const { response, error } = await cartApi.addToCart(
          { courseId: courseId },
          dispatch
        );

        if (error) {
          // If there's an error adding to cart, show error and don't navigate
          let errorMessage = "";
          if (typeof error === "string") {
            errorMessage = error;
          } else if (error.message) {
            errorMessage = error.message;
          } else if (error.data && error.data.message) {
            errorMessage = error.data.message;
          } else if (
            error.response &&
            error.response.data &&
            error.response.data.message
          ) {
            errorMessage = error.response.data.message;
          } else {
            errorMessage = "Không thể thêm vào giỏ hàng";
          }

          toast.error(errorMessage);
          return;
        }

        // Successfully added to cart, now navigate to shopping cart
        navigate("/shoppingcart");
      }
    } catch (error) {
      console.error("Buy now error:", error);
      toast.error("Có lỗi xảy ra khi thực hiện mua hàng");
    } finally {
      setIsAddingToCart(false);
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
    const card = container.querySelector(".inline-flex > div");
    let cardWidth = 450; // Updated default width
    let gap = 24;
    if (card) {
      cardWidth = card.offsetWidth;
      const style = getComputedStyle(container.querySelector(".inline-flex"));
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

  // Modal functions
  const openReviewModal = (review) => {
    setSelectedReview(review);
    setIsModalOpen(true);
    document.body.style.overflow = "hidden"; // Prevent background scroll
  };

  const closeReviewModal = () => {
    setSelectedReview(null);
    setIsModalOpen(false);
    document.body.style.overflow = "auto"; // Restore scroll
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
          <h1 className="font-bold text-5xl break-words">{courseData.title}</h1>
          <p className="pt-3 text-slate-700 break-words whitespace-pre-wrap leading-relaxed">
            {courseData.description}
          </p>

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

          {/* Hiển thị languages nếu có */}
          {courseData.language && courseData.language.length > 0 && (
            <div
              title="hold language of course"
              className="flex flex-row mt-4 gap-3 items-start"
            >
              <AiOutlineGlobal
                className="text-gray-400 mt-1 flex-shrink-0"
                size={25}
              />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-gray-700 font-medium mb-2">
                  Languages:
                </span>
                <div className="flex flex-wrap gap-1">
                  {(() => {
                    let langs = courseData.language;

                    // Parse languages array
                    if (Array.isArray(langs)) {
                      return (
                        <>
                          {langs.slice(0, 3).map((lang, index) => (
                            <span
                              key={index}
                              className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium max-w-[120px] truncate"
                            >
                              {lang.trim()}
                            </span>
                          ))}
                          {langs.length > 3 && (
                            <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                              +{langs.length - 3} more
                            </span>
                          )}
                        </>
                      );
                    }

                    if (
                      typeof langs === "string" &&
                      langs.trim().startsWith("[")
                    ) {
                      try {
                        const parsed = JSON.parse(langs);
                        if (Array.isArray(parsed)) {
                          return (
                            <>
                              {parsed.slice(0, 3).map((lang, index) => (
                                <span
                                  key={index}
                                  className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium max-w-[120px] truncate"
                                >
                                  {lang.trim()}
                                </span>
                              ))}
                              {parsed.length > 3 && (
                                <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                                  +{parsed.length - 3} more
                                </span>
                              )}
                            </>
                          );
                        }
                      } catch {}
                    }

                    // Fallback for string format
                    const langArray = String(langs)
                      .replace(/\[|\]|"/g, "")
                      .split(",")
                      .map((lang) => lang.trim())
                      .filter(Boolean);

                    return (
                      <>
                        {langArray.slice(0, 3).map((lang, index) => (
                          <span
                            key={index}
                            className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium max-w-[120px] truncate"
                          >
                            {lang}
                          </span>
                        ))}
                        {langArray.length > 3 && (
                          <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                            +{langArray.length - 3} more
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Hiển thị tags nếu có */}
          {courseData.tags && (
            <div
              title="hold tags"
              className="flex flex-row mt-4 gap-3 items-start"
            >
              <FaHashtag
                className="text-gray-400 mt-1 flex-shrink-0"
                size={25}
              />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-gray-700 font-medium mb-2">Tags:</span>
                <div className="flex flex-wrap gap-1">
                  {(() => {
                    let tags = courseData.tags;

                    // Parse tags array
                    if (Array.isArray(tags)) {
                      return (
                        <>
                          {tags.slice(0, 5).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium max-w-[120px] truncate"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                          {tags.length > 5 && (
                            <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                              +{tags.length - 5} more
                            </span>
                          )}
                        </>
                      );
                    }

                    if (
                      typeof tags === "string" &&
                      tags.trim().startsWith("[")
                    ) {
                      try {
                        const parsed = JSON.parse(tags);
                        if (Array.isArray(parsed)) {
                          return (
                            <>
                              {parsed.slice(0, 5).map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium max-w-[120px] truncate"
                                >
                                  {tag.trim()}
                                </span>
                              ))}
                              {parsed.length > 5 && (
                                <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                                  +{parsed.length - 5} more
                                </span>
                              )}
                            </>
                          );
                        }
                      } catch {}
                    }

                    // Fallback for string format
                    const tagArray = String(tags)
                      .replace(/\[|\]|"/g, "")
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean);

                    return (
                      <>
                        {tagArray.slice(0, 5).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium max-w-[120px] truncate"
                          >
                            {tag}
                          </span>
                        ))}
                        {tagArray.length > 5 && (
                          <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                            +{tagArray.length - 5} more
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Hiển thị level nếu có */}
          {courseData.level && (
            <div
              title="hold level"
              className="flex flex-row mt-4 gap-3 items-start"
            >
              <GiLevelEndFlag
                className="text-gray-400 mt-1 flex-shrink-0"
                size={25}
              />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-gray-700 font-medium mb-2">Level:</span>
                <div className="flex flex-wrap gap-1">
                  <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
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
              <FaBullseye
                className="text-gray-400 mt-1 flex-shrink-0"
                size={25}
              />
              <div className="flex flex-col flex-1 min-w-0">
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
                            <li
                              key={index}
                              className="text-gray-600 break-words"
                            >
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
                                <li
                                  key={index}
                                  className="text-gray-600 break-words"
                                >
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
                          <li className="text-gray-600 break-words">
                            {objectives}
                          </li>
                        </ul>
                      );
                    }

                    // Fallback: display as is
                    return <div className="break-words">{objectives}</div>;
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

            {/* Add to Cart and Buy Now buttons for mentees */}
            {currentUser && currentUser.role === "mentee" && (
              <div className="flex flex-col gap-3 mb-4">
                {isCourseAlreadyPurchased(courseData?._id) ? (
                  <div className="w-full flex flex-col gap-3">
                    <div className="w-full bg-green-100 text-green-700 py-3 px-4 rounded-md text-sm font-medium text-center">
                      ✓ Already Purchased
                    </div>
                    <button
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition"
                      onClick={() =>
                        navigate(`/order-complete-course`, {
                          state: {
                            courseId: courseData._id,
                            courseInfo: courseData,
                          },
                        })
                      }
                    >
                      View Course
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={(e) => handleAddToCart(e)}
                      disabled={isAddingToCart}
                      className="w-full bg-blue-100 text-blue-600 py-3 px-4 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAddingToCart ? "Adding..." : "Add to Cart"}
                    </button>
                    <button
                      onClick={(e) => handleBuyNow(e)}
                      disabled={isAddingToCart}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Buy Now
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Show message for mentors */}
            {currentUser?.role === "mentor" && (
              <div className="w-full bg-blue-100 text-blue-800 py-3 px-4 rounded-md text-sm font-medium text-center mb-4">
                <span className="inline-flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Course Preview - Mentor View
                </span>
              </div>
            )}

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
            {/* Add scroll buttons */}
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
              ref={testimonialRef}
              className="overflow-x-auto whitespace-nowrap select-none no-scrollbar"
              style={{
                WebkitOverflowScrolling: "touch",
                scrollSnapType: "x mandatory",
                scrollBehavior: "smooth",
              }}
              tabIndex={-1}
            >
              <div className="inline-flex gap-6" id="testimonial-track">
                {reviewsLoading ? (
                  // Loading state
                  [1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl border border-gray-200 shadow flex flex-col gap-4 w-[450px] h-[280px] px-7 py-6 animate-pulse flex-shrink-0 hover:shadow-lg transition-all duration-300 hover:scale-105"
                    >
                      <div className="h-8 bg-gray-200 rounded w-8"></div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <div
                            key={star}
                            className="h-4 w-4 bg-gray-200 rounded"
                          ></div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-gray-200 rounded-full"></div>
                        <div className="space-y-1">
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : reviews && reviews.length > 0 ? (
                  reviews.map((review, idx) => (
                    <div
                      key={review._id || idx}
                      className="bg-white rounded-2xl border border-gray-200 shadow flex flex-col gap-4 w-[450px] h-[280px] px-7 py-6 flex-shrink-0 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:-translate-y-1 hover:border-blue-300 group"
                      style={{ scrollSnapAlign: "start" }}
                      onClick={() => openReviewModal(review)}
                    >
                      <div className="text-blue-700 text-4xl mb-2 transition-all duration-300 group-hover:text-blue-600 group-hover:scale-110 group-hover:rotate-12">
                        <VscCodeReview />
                      </div>

                      {/* Rating Stars */}
                      <div className="flex items-center gap-1 mb-2 group-hover:scale-105 transition-all duration-300">
                        {renderStars(review.rate || 0)}
                        <span className="text-sm text-gray-600 ml-2 group-hover:text-gray-700 transition-colors duration-300">
                          ({review.rate || 0}/5)
                        </span>
                      </div>

                      <div
                        className="text-slate-700 text-base flex-1 leading-relaxed whitespace-normal break-words overflow-hidden transition-all duration-300 group-hover:text-slate-800"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 4,
                          WebkitBoxOrient: "vertical",
                          maxHeight: "6rem",
                        }}
                      >
                        {review.content || "Great course!"}
                      </div>
                      <div className="flex items-center gap-3 mt-2 group-hover:scale-105 transition-all duration-300">
                        <img
                          src={
                            review.author?.avatarUrl ||
                            review.author?.avatar ||
                            minatoImg
                          }
                          alt={
                            review.author?.firstName ||
                            review.author?.userName ||
                            "User"
                          }
                          className="w-11 h-11 rounded-full object-cover border transition-all duration-300 group-hover:border-blue-300 group-hover:shadow-lg group-hover:scale-110"
                          onError={(e) => {
                            e.target.src = minatoImg;
                          }}
                        />
                        <div className="flex flex-col transition-all duration-300 group-hover:translate-x-1">
                          <span className="font-semibold text-sm text-slate-700 group-hover:text-slate-800 transition-colors duration-300">
                            {review.author?.firstName && review.author?.lastName
                              ? `${review.author.firstName} ${review.author.lastName}`
                              : review.author?.userName || "Anonymous Student"}
                          </span>
                          <span className="text-xs text-slate-500 group-hover:text-slate-600 transition-colors duration-300">
                            Student
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-center py-8 min-w-full">
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-4xl text-gray-300">💭</div>
                      <div className="text-lg font-medium">
                        No reviews yet for this course
                      </div>
                      <div className="text-sm">
                        Be the first to share your experience!
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
                    <div
                      key={course.courseId || course._id || idx}
                      className="text-left border border-gray-200 rounded-lg p-4 w-[320px] hover:shadow-lg transition duration-200 flex flex-col items-start whitespace-normal min-h-[400px] cursor-pointer"
                      onClick={() => {
                        navigate(
                          `/course-detail/${course.courseId || course._id}`
                        );
                        window.scrollTo(0, 0);
                      }}
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

                      <div className="font-bold flex flex-row text-xl mt-auto gap-1 mb-3">
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

                      {/* Add to Cart and Buy Now buttons for mentees */}
                      {currentUser && currentUser.role === "mentee" && (
                        <div className="flex flex-col gap-2 mt-auto w-full">
                          {isCourseAlreadyPurchased(
                            course._id || course.courseId
                          ) ? (
                            <>
                              <div className="w-full bg-green-100 text-green-700 py-2 px-3 rounded-md text-sm font-medium text-center">
                                ✓ Already Purchased
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/order-complete-course`, {
                                    state: {
                                      courseId: course._id || course.courseId,
                                      courseInfo: course,
                                    },
                                  });
                                }}
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

      {/* Review Modal */}
      {isModalOpen && selectedReview && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeReviewModal();
            }
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 transform transition-all animate-in slide-in-from-bottom-8 zoom-in-95 duration-500 ease-out max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: "modalAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 animate-in slide-in-from-top-4 duration-300 delay-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-blue-700 text-3xl">
                    <VscCodeReview />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Course Review
                  </h3>
                </div>
                <button
                  onClick={closeReviewModal}
                  className="text-gray-400 hover:text-gray-600 transition-all duration-200 p-1 hover:bg-gray-100 rounded-full hover:scale-110"
                >
                  <svg
                    className="w-6 h-6"
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
            </div>

            {/* Content */}
            <div className="px-6 py-6 animate-in slide-in-from-bottom-4 duration-400 delay-200">
              {/* Rating Display */}
              <div className="flex items-center justify-center gap-2 mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-100 transform transition-all duration-300">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-2xl transition-all duration-300 ${
                        star <= (selectedReview.rate || 5)
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                      style={{
                        filter:
                          star <= (selectedReview.rate || 5)
                            ? "drop-shadow(0 2px 4px rgba(251, 191, 36, 0.3))"
                            : "none",
                        animationDelay: `${star * 100}ms`,
                      }}
                    >
                      ★
                    </span>
                  ))}
                  <span className="text-lg text-gray-700 ml-3 font-semibold">
                    ({selectedReview.rate || 5}/5)
                  </span>
                </div>
              </div>

              {/* Review Content */}
              <div className="mb-6 animate-in slide-in-from-bottom-4 duration-400 delay-300">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 transform transition-all duration-300 hover:shadow-md">
                  <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
                    {selectedReview.content || "Great course!"}
                  </p>
                </div>
              </div>

              {/* Author Info */}
              <div className="animate-in slide-in-from-bottom-4 duration-400 delay-400">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <img
                    src={
                      selectedReview.author?.avatarUrl ||
                      selectedReview.author?.avatar ||
                      minatoImg
                    }
                    alt={
                      selectedReview.author?.firstName ||
                      selectedReview.author?.userName ||
                      "User"
                    }
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 shadow-sm transform transition-all duration-300 hover:scale-105"
                    onError={(e) => {
                      e.target.src = minatoImg;
                    }}
                  />
                  <div className="flex-1">
                    <span className="text-xl font-semibold text-gray-900 block">
                      {selectedReview.author?.firstName &&
                      selectedReview.author?.lastName
                        ? `${selectedReview.author.firstName} ${selectedReview.author.lastName}`
                        : selectedReview.author?.userName ||
                          "Anonymous Student"}
                    </span>
                    <p className="text-gray-600 mt-1">Student</p>
                    {selectedReview.createdAt && (
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(selectedReview.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl animate-in slide-in-from-bottom-4 duration-400 delay-500">
              <button
                onClick={closeReviewModal}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 hover:scale-105 active:scale-95"
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
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes modalAppear {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05) translateY(-5px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes modalDisappear {
          0% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          100% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
        }
      `}</style>
    </div>
  );
};

export default CourseDetail;
