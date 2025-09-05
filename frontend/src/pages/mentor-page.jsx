import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import profileApi from "../api/modules/profile.api";
import courseApi from "../api/modules/course.api";
import cartApi from "../api/modules/cart.api";
import { toast } from "react-toastify";
import { showLoading, hideLoading } from "../redux/features/loading.slice";

const MentorPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const { id } = useParams(); // Lấy ID mentor từ URL
  const location = useLocation(); // Lấy state từ navigation
  // --- AUTH CHECK (mentor hoặc mentee đều được xem) ---
  useEffect(() => {
    const token =
      localStorage.getItem("actkn") || localStorage.getItem("token");
    const userStr =
      localStorage.getItem("user") || localStorage.getItem("user");
    console.log("Token:", token);
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
    if (user.role === "mentee") {
      return;
    }
    // if (user.role === "admin") {
    //   navigate("/admin/profile");
    //   return;
    // }
  }, [navigate]);

  // State declarations
  const [mentor, setMentor] = useState(null);
  const [courses, setCourses] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to check if course is already purchased
  const isCourseAlreadyPurchased = (courseId) => {
    const mockPurchasedCourses = localStorage.getItem("mockPurchasedCourses");
    if (mockPurchasedCourses) {
      try {
        const purchasedCourses = JSON.parse(mockPurchasedCourses);
        return purchasedCourses.some(
          (purchased) =>
            (purchased.course?._id ||
              purchased.course?.id ||
              purchased.courseId) === courseId
        );
      } catch (error) {
        console.error("Error parsing purchased courses:", error);
        return false;
      }
    }
    return false;
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
        console.log("API failed, using localStorage fallback:", apiError);

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
          image: course.thumbnail,
          mentor: course.authorName || course.mentorName || "Unknown Mentor",
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

    const courseId = course._id || course.id;

    // Check if course is already purchased
    if (isCourseAlreadyPurchased(courseId)) {
      toast.info(
        "You have already purchased this course! Check 'My Courses' in your profile."
      );
      return;
    }

    navigate(`/course-detail/${courseId}`);
  };

  // Fetch data from backend API and overwrite default data if available
  useEffect(() => {
    // Scroll to top when component mounts or id changes
    window.scrollTo({ top: 0, behavior: "smooth" });

    const fetchMentorData = async () => {
      console.log("=== Mentor Page Debug ===");
      console.log("URL params ID:", id);
      console.log("Location state:", location.state);
      console.log("Mentor data from state:", location.state?.mentorData);

      if (!id) return; // Nếu không có ID thì không fetch

      setLoading(true);
      setError(null);

      try {
        // Fetch mentor profile by ID first
        console.log("Fetching mentor profile for ID:", id);
        const mentorProfile = await profileApi.getMentorById(id);
        console.log("Mentor profile response:", mentorProfile);

        if (mentorProfile && mentorProfile.data) {
          console.log("Setting mentor data:", mentorProfile.data);
          setMentor(mentorProfile.data);
        } else {
          console.log("No mentor profile data found");
        }

        // Fetch mentor's courses using ID from params
        console.log("Fetching courses for mentor ID:", id);
        const coursesRes = await courseApi.getCoursesByMentor(id);
        console.log("Courses response:", coursesRes);

        if (Array.isArray(coursesRes)) {
          setCourses(coursesRes);
        }
      } catch (err) {
        console.error("Error fetching mentor data:", err);
        setError("Không thể tải dữ liệu mentor hoặc khóa học");

        // Fallback: Nếu có mentorData từ state (từ CourseDetail), sử dụng luôn
        const mentorDataFromState = location.state?.mentorData;
        if (mentorDataFromState) {
          console.log(
            "API failed, using mentor data from navigation state:",
            mentorDataFromState
          );
          setMentor({ user: mentorDataFromState });
        }
      }
      setLoading(false);
    };
    fetchMentorData();
  }, [id, location.state]); // Thêm location.state vào dependency array

  // Debug log when mentor state changes
  useEffect(() => {
    console.log("=== Mentor State Updated ===");
    console.log("Current mentor object:", mentor);
    if (mentor?.user) {
      console.log("Mentor user data:", mentor.user);
    }
  }, [mentor]);
  const mentorCoursesRef = useRef(null);
  const [hoveredCarousel, setHoveredCarousel] = useState(null);
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
    <div className="min-h-screen bg-white-50 flex flex-col py-0">
      <main className="w-full flex flex-col">
        <div className="w-full mt-8 p-0">
          {/* Mentor Info Section - fetch and display real data */}
          {mentor && (
            <div className="w-full flex flex-col lg:flex-row lg:items-start lg:justify-between lg:gap-8 max-w-7xl mx-auto w-full px-2 md:px-4 mb-12">
              {/* Left info + about */}
              <div className="flex-1 min-w-0 max-w-full lg:max-w-[calc(100%-21rem)] pr-0 lg:pr-8">
                <div className="text-base text-gray-500 mb-1">Mentor</div>
                <h1 className="text-4xl font-bold text-gray-900 mb-1">
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
                      {mentor?.totalStudents || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-base text-gray-500 font-medium mb-1">
                      Reviews
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                      {mentor?.reviewsCount || "N/A"}
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
                  <p className="text-gray-700 text-justify break-words overflow-wrap-anywhere leading-relaxed mb-6">
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
                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gray-100 shadow mb-6 bg-gray-200 ">
                  <img
                    src={
                      mentor?.profile?.avatarUrl ||
                      mentor?.user?.avatarUrl ||
                      "https://randomuser.me/api/portraits/men/32.jpg"
                    }
                    alt={
                      mentor?.profile?.firstName ||
                      mentor?.user?.firstName ||
                      "Mentor"
                    }
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <a
                    href={
                      mentor?.profile?.links?.website ||
                      mentor?.user?.website ||
                      "#"
                    }
                    className="w-full border border-gray-300 rounded py-2 text-center text-gray-700 font-medium hover:bg-gray-100 transition"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Website
                  </a>
                  <a
                    href={
                      mentor?.profile?.links?.twitter ||
                      mentor?.user?.twitter ||
                      "#"
                    }
                    className="w-full border border-gray-300 rounded py-2 text-center text-gray-700 font-medium hover:bg-gray-100 transition"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Twitter
                  </a>
                  <a
                    href={
                      mentor?.profile?.links?.linkedin ||
                      mentor?.user?.linkedinUrl ||
                      "#"
                    }
                    className="w-full border border-gray-300 rounded py-2 text-center text-gray-700 font-medium hover:bg-gray-100 transition"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LinkedIn
                  </a>
                  <a
                    href={
                      mentor?.profile?.links?.github ||
                      mentor?.user?.github ||
                      "#"
                    }
                    className="w-full border border-gray-300 rounded py-2 text-center text-gray-700 font-medium hover:bg-gray-100 transition"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub
                  </a>
                  <a
                    href={
                      mentor?.profile?.links?.youtube ||
                      mentor?.user?.youtube ||
                      "#"
                    }
                    className="w-full border border-gray-300 rounded py-2 text-center text-gray-700 font-medium hover:bg-gray-100 transition"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Youtube
                  </a>
                  <a
                    href={
                      mentor?.profile?.links?.facebook ||
                      mentor?.user?.facebook ||
                      "#"
                    }
                    className="w-full border border-gray-300 rounded py-2 text-center text-gray-700 font-medium hover:bg-gray-100 transition"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Facebook
                  </a>
                  {!(mentor?.profile?.introVideo || mentor?.user?.introVideo) &&
                    (() => {
                      console.log(
                        "Không có introVideo:",
                        mentor?.profile?.introVideo,
                        mentor?.user?.introVideo
                      );
                      return null;
                    })()}
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
                  <button className="w-full bg-gray-900 text-white rounded py-2 font-semibold mt-2 hover:bg-gray-800 transition">
                    Book Now
                  </button>
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
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-base ${
                                i < (course.rating || course.rate || 0)
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                          <span className="text-sm text-gray-700 ml-2">
                            (
                            {course.ratingsCount || course.numberOfRatings || 0}{" "}
                            Ratings)
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 mb-2 line-clamp-1">
                          {course.duration || course.totalHours || 0} Hours.{" "}
                          {course.lectures || course.totalLectures || 0}{" "}
                          Lectures. {course.category}
                        </div>

                        {/* Hiển thị tags (Programming Languages) */}
                        {course.tags && course.tags.length > 0 && (
                          <div className="mb-2">
                            <div className="flex flex-wrap gap-1">
                              {course.tags.slice(0, 3).map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium max-w-[90px] truncate"
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
                          $
                          {(() => {
                            const price =
                              typeof course.price === "number"
                                ? course.price
                                : parseFloat(course.price || 0);
                            return price % 1 === 0
                              ? price.toLocaleString("en-US")
                              : price.toLocaleString("en-US", {
                                  minimumFractionDigits: 1,
                                  maximumFractionDigits: 2,
                                });
                          })()}
                        </div>

                        {/* Add to Cart and Buy Now buttons for mentees */}
                        {user && user.role === "mentee" && (
                          <div className="flex gap-2 mt-3">
                            {isCourseAlreadyPurchased(
                              course._id || course.id
                            ) ? (
                              <div className="w-full bg-green-100 text-green-700 py-2 px-3 rounded-md text-sm font-medium text-center">
                                ✓ Already Purchased
                              </div>
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
          {/* Mentor Reviews Section - empty UI, ready for API, aligned with My Courses */}
          <section
            className="w-full py-10 bg-white"
            style={{ background: "white" }}
          >
            <div className="max-w-7xl mx-auto w-full px-2 md:px-4">
              <h3 className="text-[24px] font-bold text-[#222] mb-8">
                Mentee Reviews
              </h3>
              <div className="flex flex-col gap-6 min-h-[180px]">
                {/* No reviews yet, ready for API integration */}
              </div>
              <div className="flex justify-center mt-8">
                <button className="border border-gray-300 rounded px-6 py-2 text-gray-700 font-medium hover:bg-gray-100 transition">
                  View more Reviews
                </button>
              </div>
            </div>
          </section>
        </div>
        {/* Close .w-full.mt-8.p-0 */}
      </main>
    </div>
  );
};

export default MentorPage;
