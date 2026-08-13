import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import courseApi from "../api/modules/course.api";
import purchasedCourseApi from "../api/modules/purchasedCourse.api";
import cartApi from "../api/modules/cart.api";
import profileApi from "../api/modules/profile.api";
import { hasUserRole } from "../utils/user-role";
import { showLoading, hideLoading } from "../redux/features/loading.slice";
import { toast } from "react-toastify";

const OrderCompleteCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.user);

  // --- AUTH CHECK (chỉ mentee được phép) ---
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
    // Check role - chỉ mentee được phép vào order complete
    if (hasUserRole(user, "mentee")) {
      return;
    }
    // Nếu không phải mentee, redirect về home
    if (user.role === "mentor") {
      navigate("/home");
      return;
    }
    navigate("/auth/signin");
    return;
  }, [navigate]);

  // Tab persistence logic
  const TAB_STORAGE_KEY = "orderCompleteCourseActiveTab";
  const getInitialTab = () => {
    const storedTab = localStorage.getItem(TAB_STORAGE_KEY);
    return storedTab || "Details";
  };
  const [activeTab, setActiveTab] = useState<any>(getInitialTab());

  // Scroll to top on mount (page load/reload)
  useEffect(() => {
    // Force immediate scroll to top on page load
    window.scrollTo(0, 0);
    // Also try with a small delay to ensure DOM is ready
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);
  }, []);

  // Scroll to top on tab change and save tab
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    localStorage.setItem(TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);
  const [showRatingPopup, setShowRatingPopup] = useState<any>(false);
  const [userRating, setUserRating] = useState<any>(0);
  const [userComment, setUserComment] = useState<any>("");
  const [courseScrollPosition, setCourseScrollPosition] = useState<any>(0);
  const [categoryExpanded, setCategoryExpanded] = useState<any>(false);
  const [mentorCourses, setMentorCourses] = useState<any[]>([]); // Add mentor courses state

  // Course data state
  const [courseData, setCourseData] = useState<any>(null);
  const [mentorData, setMentorData] = useState<any>(null);
  const [purchasedCourseData, setPurchasedCourseData] = useState<any>(null);
  const [loading, setLoading] = useState<any>(true);
  const [error, setError] = useState<any>(null);

  // Course reviews state
  const [courseReviews, setCourseReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState<any>(false);
  const [reviewStats, setReviewStats] = useState<any>({
    totalReviews: 0,
    averageRating: 0,
  });

  // Get courseId or purchasedCourseId from URL params, location state, or URL search
  // Logic: URL param 'id' could be either purchasedCourseId (24 chars) or courseId (24 chars)
  // We'll determine which one it is based on context and API response

  const urlId = id; // The ID from URL params (/order-complete-course/:id)

  const purchasedCourseId =
    location.state?.purchasedCourseId ||
    new URLSearchParams(location.search).get("purchasedCourseId") ||
    null;

  const courseId =
    location.state?.courseId ||
    new URLSearchParams(location.search).get("courseId") ||
    urlId; // Fallback: treat urlId as courseId

  const isCourseAlreadyPurchased = (candidateCourseId) =>
    Boolean(
      purchasedCourseData &&
        (purchasedCourseData.courseId === candidateCourseId ||
          courseData?._id === candidateCourseId),
    );

  // Add to Cart function (from mentor-page.jsx)
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

  // Buy Now function (from mentor-page.jsx)
  const handleBuyNow = (e, course) => {
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

    const courseId = course._id || course.id;

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

  // Fetch course data on component mount
  useEffect(() => {
    const fetchCourseDetails = async () => {
      // Priority: Try purchasedCourseId first, then fallback to courseId
      if (!purchasedCourseId && !courseId) {
        setError("Course ID or Purchased Course ID not provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Strategy: Try purchasedCourseId API first, if fails then use courseId API
        let usedPurchasedCourseId = false;

        if (purchasedCourseId) {
          try {
            const { response, error } =
              await purchasedCourseApi.getPurchasedCourseById(
                { purchasedCourseId },
                dispatch
              );

            if (!error && response?.data?.data) {
              usedPurchasedCourseId = true;

              const purchasedData = response.data.data;

              // Set course data from purchased course
              const courseInfo = {
                id: purchasedData.courseInfo._id,
                _id: purchasedData.courseInfo._id, // Add _id as well
                title: purchasedData.courseInfo.title,
                description: purchasedData.courseInfo.description,
                price: purchasedData.courseInfo.price,
                category: purchasedData.courseInfo.category,
                duration: purchasedData.courseInfo.duration,
                rate: purchasedData.courseInfo.rate,
                lectures: purchasedData.courseInfo.lectures,
                link: purchasedData.courseInfo.link,
                imageUrl: purchasedData.courseInfo.thumbnail,
                thumbnail: purchasedData.courseInfo.thumbnail,
                mentor: purchasedData.courseInfo.mentor,
                mentees: purchasedData.courseInfo.mentees || [], // Add mentees array from backend
                // Additional purchased course data
                keyLearningObjectives:
                  purchasedData.courseInfo.keyLearningObjectives || [],
                tags: purchasedData.courseInfo.tags || [],
                language: purchasedData.courseInfo.language || [],
              };

              setCourseData(courseInfo);

              // Fetch course reviews immediately after setting course data
              if (courseInfo._id) {
                await fetchCourseReviews(courseInfo._id);
              }

              // Set mentor data
              if (purchasedData.courseInfo.mentor) {
                const mentor = purchasedData.courseInfo.mentor;

                // Fetch mentor profile to get real totalMentees
                let mentorProfileData = null;
                try {
                  const mentorProfile = await profileApi.getMentorById(
                    mentor._id
                  );
                  if (mentorProfile && mentorProfile.data) {
                    mentorProfileData = mentorProfile.data;
                  }
                } catch (err) {}

                setMentorData({
                  id: mentor._id,
                  name: mentor.userName || "Mentor",
                  firstName: mentor.firstName,
                  lastName: mentor.lastName,
                  userName: mentor.userName,
                  avatar: mentor.avatarUrl,
                  title: mentor.jobTitle || "Mentor",
                  bio: mentor.bio,
                  email: mentor.email,
                  category: mentor.category,
                  experience: mentor.experience,
                  skills: mentor.skills || [],
                  totalCourses: 0, // Will be fetched separately
                  totalStudents:
                    mentorProfileData?.totalMentees !== undefined
                      ? mentorProfileData.totalMentees
                      : "N/A",
                });

                // Fetch mentor courses separately
                try {
                  const courses = await courseApi.getCoursesByMentor(
                    mentor._id
                  );
                  if (Array.isArray(courses)) {
                    setMentorCourses(courses);
                    setMentorData((prev) => ({
                      ...prev,
                      totalCourses: courses.length,
                    }));
                  }
                } catch (err) {}
              }

              // Set purchased course data
              setPurchasedCourseData({
                purchasedCourseId: purchasedData.purchasedCourseId,
                courseId: purchasedData.courseId,
                purchaseDate: purchasedData.purchaseDate,
                progress: purchasedData.progress,
                lastAccessDate: purchasedData.lastAccessDate,
                isCompleted: purchasedData.isCompleted,
                rating: purchasedData.rating,
                review: purchasedData.review,
                orderInfo: purchasedData.orderInfo,
              });

              setLoading(false);
              return; // Success with purchasedCourseId
            }
          } catch (err) {}
        }

        // Fallback to courseId logic (legacy or when purchasedCourseId fails)
        const finalCourseId = courseId || purchasedCourseId; // Use either courseId or treat purchasedCourseId as courseId

        if (finalCourseId && !usedPurchasedCourseId) {
          // Fetch both course details and purchased course details from API
          const [courseResult, purchasedResult] = await Promise.allSettled([
            courseApi.getDetail({ courseId }),
            purchasedCourseApi.getPurchasedCourseDetails({ courseId }),
          ]);

          // Handle course details (legacy logic continues...)
          if (courseResult.status === "fulfilled") {
            const { response, error } = courseResult.value;

            if (error || !response?.data?.course) {
              setError("Failed to load course details");
              toast.error("Không thể tải dữ liệu khóa học");
              return;
            }

            // Continue with existing course data processing...
            const course = response.data.course;

            // Parse keyLearningObjectives
            let parsedObjectives = [];
            if (course.keyLearningObjectives) {
              if (Array.isArray(course.keyLearningObjectives)) {
                parsedObjectives = course.keyLearningObjectives;
              } else if (typeof course.keyLearningObjectives === "string") {
                try {
                  const parsed = JSON.parse(course.keyLearningObjectives);
                  if (Array.isArray(parsed)) {
                    parsedObjectives = parsed;
                  } else {
                    parsedObjectives = [course.keyLearningObjectives];
                  }
                } catch (e) {
                  parsedObjectives = [course.keyLearningObjectives];
                }
              }
            }

            // Parse tags
            let parsedTags = [];
            if (course.tags && Array.isArray(course.tags)) {
              parsedTags = course.tags;
            }

            // Parse language
            let parsedLanguage = [];
            if (course.language && Array.isArray(course.language)) {
              parsedLanguage = course.language;
            }

            // Handle thumbnail
            const imageUrl = course.thumbnail || "";

            const courseInfo = {
              id: course._id,
              _id: course._id, // Add _id as well
              title: course.title,
              description: course.description,
              price: course.price,
              category: course.category,
              duration: course.duration,
              rate: course.rate,
              lectures: course.lectures,
              link: course.link,
              imageUrl: imageUrl,
              thumbnail: course.thumbnail,
              mentor: course.mentor,
              mentees: course.mentees || [], // Add mentees array from backend
              createdAt: course.createdAt,
              updatedAt: course.updatedAt,
              level: course.level,
              // Parsed arrays for display
              keyLearningObjectives: parsedObjectives,
              tags: parsedTags,
              language: parsedLanguage,
            };

            setCourseData(courseInfo);

            // Fetch course reviews immediately after setting course data
            if (courseInfo._id) {
              console.log("🔄 Fetching reviews for course:", courseInfo._id);
              await fetchCourseReviews(courseInfo._id);
            }

            // Set mentor data with real API stats
            if (course.mentor) {
              // Fetch real mentor stats
              const fetchMentorStats = async (mentorId) => {
                try {
                  console.log("Fetching courses for mentor ID:", mentorId);

                  // Try to get real mentor courses count - getCoursesByMentor returns array directly
                  const courses = await courseApi.getCoursesByMentor(mentorId);

                  console.log("📊 Mentor courses array:", courses);

                  // Save courses to state for Course tab (similar to mentor-page.jsx)
                  if (Array.isArray(courses)) {
                    setMentorCourses(courses);
                    console.log(
                      "✅ Saved mentor courses to state:",
                      courses.length
                    );
                  }

                  const totalCourses = Array.isArray(courses)
                    ? courses.length
                    : 0;
                  console.log("🎯 Final totalCourses count:", totalCourses);

                  // Fetch mentor profile to get real totalMentees
                  let totalStudents = "N/A";
                  try {
                    const mentorProfile = await profileApi.getMentorById(
                      mentorId
                    );
                    if (
                      mentorProfile &&
                      mentorProfile.data &&
                      mentorProfile.data.totalMentees !== undefined
                    ) {
                      totalStudents = mentorProfile.data.totalMentees;
                      console.log(
                        "✅ Got real totalMentees from profile API:",
                        totalStudents
                      );
                    } else {
                      console.warn(
                        "❌ No totalMentees in mentor profile response"
                      );
                    }
                  } catch (profileError) {
                    console.warn(
                      "Failed to fetch mentor profile for totalMentees:",
                      profileError
                    );
                  }

                  // Use data from course.mentor
                  return {
                    totalCourses: totalCourses, // Return exact number
                    totalStudents: totalStudents, // Use real data from profile API
                    experience: course.mentor.experience || "Professional",
                    category: course.mentor.category || "IT",
                  };
                } catch (error) {
                  console.warn(
                    "Failed to fetch mentor stats, using defaults:",
                    error
                  );
                  return {
                    totalCourses: 0, // Return 0 if failed to fetch
                    totalStudents: "N/A",
                    experience: course.mentor.experience || "Professional",
                    category: course.mentor.category || "IT",
                  };
                }
              };

              // Get mentor stats and set data
              const mentorStats = await fetchMentorStats(course.mentor._id);

              setMentorData({
                id: course.mentor._id,
                name: course.mentor.userName || "Mentor",
                firstName: course.mentor.firstName,
                lastName: course.mentor.lastName,
                userName: course.mentor.userName,
                avatar: course.mentor.avatarUrl,
                title: course.mentor.jobTitle || "Mentor",
                bio: course.mentor.bio,
                email: course.mentor.email,
                location: course.mentor.location,
                category: mentorStats.category,
                experience: mentorStats.experience,
                skills: course.mentor.skills || [],
                totalCourses: mentorStats.totalCourses,
                totalStudents: mentorStats.totalStudents,
              });
            }
          }

          // Handle purchased course details from the API only.
          if (
            purchasedResult.status === "fulfilled" &&
            !purchasedResult.value.error
          ) {
            const apiData = purchasedResult.value.response?.data;
            if (apiData?.isPurchased && apiData?.courseData) {
              console.log(
                "✅ Setting purchasedCourseData from API (check endpoint):",
                apiData.courseData
              );
              setPurchasedCourseData({
                courseId:
                  apiData.courseData.courseId ||
                  apiData.courseData.courseInfo?._id,
                purchaseDate: apiData.courseData.purchaseDate,
                progress: apiData.courseData.progress,
                lastAccessDate: apiData.courseData.lastAccessDate,
              });
              setCourseData((current) => ({
                ...current,
                link: apiData.courseData.courseInfo?.link || current?.link,
              }));
            } else {
              console.log(
                "ℹ️ Course not purchased according to API check endpoint"
              );
            }
          } else {
            console.warn(
              "❌ Purchased course data not available:",
              (purchasedResult as PromiseRejectedResult).reason
            );
            // This is not a critical error, user might be viewing course details without purchasing
          }
        }
      } catch (err) {
        console.error("Error in fetchCourseDetails:", err);
        setError("An unexpected error occurred");
        toast.error("Lỗi khi tải dữ liệu khóa học");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId, purchasedCourseId]);

  // Course scroll handlers
  const scrollCourseLeft = () => {
    const container = document.getElementById("course-scroll-container");
    if (container) {
      container.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollCourseRight = () => {
    const container = document.getElementById("course-scroll-container");
    if (container) {
      container.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const handleSeeAllCourses = () => {
    navigate("/all-courses", {
      state: {
        mentorId: courseData.mentor?.id,
        mentorName: courseData.mentor?.name,
      },
    });
  };

  const fetchCourseReviews = async (courseId) => {
    try {
      setReviewsLoading(true);
      console.log("Fetching reviews for courseId:", courseId);
      console.log("CourseId type:", typeof courseId);

      const { response: reviewsResponse, err: reviewsError } =
        await courseApi.getCourseReviews({ courseId });

      console.log("📥 Reviews API response:", reviewsResponse);
      console.log("❌ Reviews API error:", reviewsError);

      if (reviewsResponse && reviewsResponse.data) {
        // Backend trả về { data: reviews } thay vì { data: { reviews: [...] } }
        const courseReviews = Array.isArray(reviewsResponse.data)
          ? reviewsResponse.data
          : reviewsResponse.data.reviews || [];

        console.log("✅ Processed course reviews:", courseReviews);
        console.log("📊 Reviews count:", courseReviews.length);
        // Debug: Check first review structure
        if (courseReviews.length > 0) {
          console.log("First review structure:", courseReviews[0]);
          console.log("First review user:", courseReviews[0].user);
          console.log("First review author:", courseReviews[0].author);
        }
        setCourseReviews(courseReviews);

        // Calculate review statistics
        const totalReviews = courseReviews.length;
        const averageRating =
          totalReviews > 0
            ? courseReviews.reduce(
                (sum, review) => sum + (review.rate || 0),
                0
              ) / totalReviews
            : 0;

        setReviewStats({
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        });

        console.log("📈 Review stats calculated:", {
          totalReviews,
          averageRating,
        });

        return courseReviews;
      } else {
        console.error(
          "❌ Failed to fetch reviews - no response data:",
          reviewsError
        );
        setCourseReviews([]);
        setReviewStats({ totalReviews: 0, averageRating: 0 });
        return [];
      }
    } catch (error) {
      console.error("💥 Error fetching course reviews:", error);
      setCourseReviews([]);
      setReviewStats({ totalReviews: 0, averageRating: 0 });
      return [];
    } finally {
      setReviewsLoading(false);
    }
  };
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // No course data
  if (!courseData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No course data available</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const renderStars = (rating) => {
    return <span className="text-sm font-semibold">{Number(rating || 0).toFixed(1)} / 5</span>;
  };

  // Function to handle course access
  const handleCourseAccess = () => {
    if (!courseData.link) {
      toast.error("Bạn chưa có quyền truy cập nội dung khóa học này");
      return;
    }
    window.open(courseData.link, "_blank", "noopener,noreferrer");
  };

  // Function to navigate to mentor profile
  const handleMentorProfile = () => {
    if (mentorData?.id) {
      navigate(`/mentor/${mentorData.id}`);
    }
  };

  // Function to handle rating popup
  const handleShowRatingPopup = () => {
    setShowRatingPopup(true);
  };

  const handleCloseRatingPopup = () => {
    setShowRatingPopup(false);
    setUserRating(0);
    setUserComment("");
  };

  const handleSubmitRating = async () => {
    if (!userRating) {
      toast.error("Please select a rating");
      return;
    }

    try {
      const targetCourseId = courseData?._id || courseData?.id;
      const { response, error } = await courseApi.addCourseReview({
        courseId: targetCourseId,
        reviewData: {
          rating: userRating,
          comment: userComment.trim(),
        },
      });
      if (error || !response) {
        throw error || new Error("Review service unavailable");
      }
      await fetchCourseReviews(targetCourseId);
      toast.success("Thank you for your rating!");
      handleCloseRatingPopup();
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("Failed to submit rating. Please try again.");
    }
  };

  const renderCourseContent = () => {
    switch (activeTab) {
      case "Details":
        return (
          <div className="bg-white rounded-lg p-8">
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">
                Course Overview
              </h3>
              <p className="text-gray-700 mb-8 leading-relaxed text-lg break-words overflow-wrap-anywhere hyphens-auto">
                {courseData.description || "Course description not available."}
              </p>
            </div>

            {/* Google Drive Access - Enhanced */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-blue-500 rounded-full">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-xl text-blue-900">
                    Access Course Materials
                  </h4>
                  <p className="text-blue-700">
                    Complete course content hosted on Google Drive with lifetime
                    access
                  </p>
                </div>
              </div>

              <button
                onClick={handleCourseAccess}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 px-6 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-semibold text-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                🚀 Open Course Drive Folder
              </button>
            </div>

            {/* Key Learning Objectives - Enhanced */}
            <div className="mb-8">
              <h4 className="text-xl font-bold mb-6 text-gray-800">
                Key Learning Objectives
              </h4>
              <div className="grid gap-4">
                {(
                  courseData.keyLearningObjectives || [
                    "Master the fundamentals of this subject",
                    "Apply knowledge to real-world projects",
                    "Build confidence in your skills",
                    "Prepare for advanced topics",
                  ]
                ).map((objective, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="text-gray-700 leading-relaxed">
                      {objective}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Information - Enhanced */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 shadow-sm">
              <h4 className="font-bold text-xl mb-6 text-gray-800">
                Course Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    label: "Category",
                    value: courseData.category || "General",
                    icon: "📂",
                  },
                  {
                    label: "Level",
                    value: courseData.level || "All Levels",
                    icon: "📊",
                  },
                  {
                    label: "Duration",
                    value: courseData.duration
                      ? `${courseData.duration} hour${
                          courseData.duration > 1 ? "s" : ""
                        }`
                      : "Self-paced",
                    icon: "⏰",
                  },
                  {
                    label: "Lectures",
                    value: courseData.lectures
                      ? `${courseData.lectures} lecture${
                          courseData.lectures > 1 ? "s" : ""
                        }`
                      : "Multiple",
                    icon: "Course",
                  },
                  {
                    label: "Language",
                    value:
                      courseData.language && courseData.language.length > 0
                        ? courseData.language.join(", ")
                        : "Not specified",
                    icon: "🌐",
                  },

                  {
                    label: "Students",
                    value:
                      courseData.mentees && courseData.mentees.length > 0
                        ? `${courseData.mentees.length} enrolled`
                        : "No students yet",
                    icon: "👥",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm"
                  >
                    <span className="text-gray-600 flex items-center space-x-2">
                      <span>{item.icon}</span>
                      <span>{item.label}:</span>
                    </span>
                    <span className="font-semibold text-gray-800">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "Mentor":
        return (
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-xl font-bold mb-6">About Your Mentor</h3>

            {/* Mentor Profile Card */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="flex items-center space-x-6 mb-4">
                <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[var(--ui-accent-soft)] text-xl font-bold text-[var(--ui-accent)] shadow-md">
                  <span>{(mentorData?.firstName?.[0] || mentorData?.name?.[0] || "M").toUpperCase()}</span>
                  {mentorData?.avatar && (
                    <img
                      src={mentorData.avatar}
                      alt={mentorData?.name || "Mentor"}
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-800 mb-1">
                    {mentorData?.firstName &&
                    mentorData?.lastName &&
                    mentorData?.userName
                      ? `${mentorData.firstName} ${mentorData.lastName} (${mentorData.userName})`
                      : mentorData?.userName ||
                        mentorData?.name ||
                        "Anonymous Mentor"}
                  </h4>
                  <p className="text-blue-600 font-semibold mb-1">
                    {mentorData?.title || "Mentor"}
                  </p>
                </div>
                <button
                  onClick={handleMentorProfile}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  See Profile
                </button>
              </div>

              {/* Mentor Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-base font-bold text-gray-800 mb-1">
                    Experience
                  </div>
                  <div className="text-sm text-gray-600">
                    {mentorData?.experience}
                  </div>
                </div>
                <div
                  className={`text-center p-3 bg-white rounded-lg transition-all duration-200 relative ${
                    // Only show cursor pointer and hover effect if there are multiple categories
                    mentorData?.category &&
                    ((Array.isArray(mentorData.category) &&
                      mentorData.category.length > 1) ||
                      (!Array.isArray(mentorData.category) &&
                        mentorData.category.includes(",")))
                      ? "cursor-pointer hover:bg-gray-50"
                      : ""
                  }`}
                  onClick={() => {
                    // Only allow click if there are multiple categories
                    const hasMultipleCategories =
                      mentorData?.category &&
                      ((Array.isArray(mentorData.category) &&
                        mentorData.category.length > 1) ||
                        (!Array.isArray(mentorData.category) &&
                          mentorData.category.includes(",")));
                    if (hasMultipleCategories) {
                      setCategoryExpanded(!categoryExpanded);
                    }
                  }}
                >
                  <div className="text-base font-bold text-gray-800 mb-1 flex items-center justify-center gap-1">
                    Category
                    {/* Only show arrow if there are multiple categories */}
                    {mentorData?.category &&
                      ((Array.isArray(mentorData.category) &&
                        mentorData.category.length > 1) ||
                        (!Array.isArray(mentorData.category) &&
                          mentorData.category.includes(","))) && (
                        <svg
                          className={`w-4 h-4 transition-transform duration-200 ${
                            categoryExpanded ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {mentorData?.category
                      ? Array.isArray(mentorData.category)
                        ? mentorData.category[0]
                        : mentorData.category.split(",")[0].trim()
                      : "web-development"}
                  </div>

                  {/* Expandable Categories - Absolute positioned */}
                  {categoryExpanded && (
                    <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg space-y-1 z-50">
                      {mentorData?.category ? (
                        Array.isArray(mentorData.category) ? (
                          mentorData.category.slice(1).map((cat, index) => (
                            <div
                              key={index}
                              className="text-xs text-gray-700 px-2 py-1 bg-gray-100 rounded"
                            >
                              {cat}
                            </div>
                          ))
                        ) : (
                          mentorData.category
                            .split(",")
                            .slice(1)
                            .map((cat, index) => (
                              <div
                                key={index}
                                className="text-xs text-gray-700 px-2 py-1 bg-gray-100 rounded"
                              >
                                {cat.trim()}
                              </div>
                            ))
                        )
                      ) : (
                        <div className="text-xs text-gray-500">
                          No additional categories
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-base font-bold text-gray-800 mb-1">
                    Courses
                  </div>
                  <div className="text-sm text-gray-600">
                    {mentorData?.totalCourses !== undefined
                      ? mentorData.totalCourses
                      : "0"}
                  </div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-base font-bold text-gray-800 mb-1">
                    Students
                  </div>
                  <div className="text-sm text-gray-600">
                    {mentorData?.totalStudents || "100+"}
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="mb-4">
                <p className="text-gray-700 leading-relaxed text-sm text-justify break-words overflow-wrap-anywhere hyphens-auto">
                  {mentorData?.bio ||
                    "An experienced mentor dedicated to helping students achieve their learning goals."}
                </p>
              </div>

              {/* Specialties */}
              <div>
                <h5 className="font-medium mb-2 text-gray-800">
                  Area of Expertise:
                </h5>
                <div className="flex flex-wrap gap-2">
                  {(mentorData?.skills && mentorData.skills.length > 0
                    ? mentorData.skills
                    : ["Teaching", "Mentoring", "Professional Development"]
                  ).map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium break-words"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "Course":
        return (
          <div className="bg-white rounded-lg p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-800">
                More Courses by {mentorData?.name || "This Mentor"}
              </h3>
              <button
                onClick={handleSeeAllCourses}
                className="text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-2 transition-colors"
              >
                <span>See All</span>
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {/* Horizontal Scrollable Course List */}
            <div className="relative">
              <div
                id="course-scroll-container"
                className="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {(mentorCourses && mentorCourses.length > 0
                  ? mentorCourses
                  : []
                ).map((course, index) => {
                  const isPurchased = isCourseAlreadyPurchased(
                    course._id || course.id
                  );

                  return (
                    <div
                      key={course._id || course.id || index}
                      className="flex-shrink-0 w-80 bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
                      onClick={() =>
                        navigate(`/course-detail/${course._id || course.id}`)
                      }
                    >
                      {/* Course Image */}
                      <div className="relative flex h-48 items-center justify-center overflow-hidden bg-[var(--ui-accent-soft)] font-bold text-[var(--ui-accent)]">
                        <span>Course</span>
                        {(course.thumbnail || course.image) && (
                          <img
                            src={course.thumbnail || course.image}
                            alt={course.title}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                        <div className="absolute top-3 right-3 bg-white bg-opacity-95 backdrop-blur-sm px-3 py-1 rounded-full shadow-md">
                          <span className="text-sm font-bold text-gray-800">
                            {course.price != null ? `$${course.price}` : "Price unavailable"}
                          </span>
                        </div>
                      </div>

                      {/* Course Content */}
                      <div className="p-4">
                        {/* Course Title */}
                        <h4 className="font-bold text-lg mb-2 text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {course.title}
                        </h4>

                        {/* Author */}
                        <p className="text-sm text-gray-600 mb-3">
                          By{" "}
                          {course.authorName ||
                            course.mentorName ||
                            (course.mentor?.firstName && course.mentor?.lastName
                              ? `${course.mentor.firstName} ${course.mentor.lastName}`
                              : course.mentor?.userName) ||
                            "Mentor"}
                        </p>

                        {/* Rating */}
                        <div className="flex items-center mb-3">
                          <div className="flex items-center space-x-1">
                            {renderStars(course.rate || course.rating || 0)}
                            <span className="text-sm font-medium text-gray-700 ml-1">
                              (
                              {course.ratingsCount ||
                                course.numberOfRatings ||
                                0}{" "}
                              Ratings)
                            </span>
                          </div>
                        </div>

                        {/* Course Details */}
                        <div className="text-sm text-gray-700 mb-2 line-clamp-1">
                          {course.duration || course.totalHours || 0} Total
                          Hours • {course.lectures || course.totalLectures || 0}{" "}
                          Lectures
                        </div>

                        {/* Category */}
                        <div className="mb-3">
                          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                            Category: {course.category || "General"}
                          </span>
                        </div>

                        {/* Tags (Programming Languages and Tools) */}
                        {course.tags && course.tags.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 mb-1">
                              {course.category === "Programming"
                                ? "Programming Languages:"
                                : "Tools:"}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {course.tags.slice(0, 2).map((tag, tagIndex) => (
                                <span
                                  key={tagIndex}
                                  className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${
                                    course.category === "Programming"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-purple-100 text-purple-800"
                                  }`}
                                >
                                  {tag}
                                </span>
                              ))}
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

                        {/* Level */}
                        {course.level && (
                          <div className="mb-4">
                            <span className="text-sm text-gray-600">
                              <span className="font-medium">Level: </span>
                              <span className="text-green-600 font-medium">
                                {course.level}
                              </span>
                            </span>
                          </div>
                        )}

                        {/* Price Display */}
                        <div className="mb-4">
                          <span className="text-2xl font-bold text-gray-800">
                            ${course.price || "170"}
                          </span>
                        </div>

                        {/* Add to Cart and Buy Now buttons for mentees */}
                        {hasUserRole(user, "mentee") && (
                          <div className="flex flex-col gap-2 mt-3">
                            {isCourseAlreadyPurchased(
                              course._id || course.id
                            ) ? (
                              <>
                                <div className="w-full bg-green-100 text-green-700 py-2 px-3 rounded-md text-sm font-medium text-center">
                                  Already Purchased
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/order-complete-course`, {
                                      state: {
                                        courseId: course._id || course.id,
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
                    </div>
                  );
                })}

                {/* Show message if no courses (similar to mentor-page empty state) */}
                {(!mentorCourses || mentorCourses.length === 0) && (
                  <div className="w-full text-center py-12">
                    <div className="text-gray-500">
                      <svg
                        className="w-16 h-16 mx-auto mb-4 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                      <p className="text-lg font-medium mb-2">No Courses Yet</p>
                      <p className="text-sm">
                        This mentor hasn't created any courses yet.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation buttons for better UX */}
              <div className="flex justify-center mt-6 space-x-4">
                <button
                  onClick={scrollCourseLeft}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={scrollCourseRight}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        );

      case "Review":
        return (
          <div className="bg-white rounded-lg p-8">
            <h3 className="text-2xl font-bold mb-8 text-gray-800">
              Course Reviews
            </h3>

            {reviewsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Loading reviews...</span>
              </div>
            ) : (
              <>
                {/* Overall Rating Summary */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 mb-8 border border-yellow-200">
                  <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-8">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-gray-800 mb-2">
                        {reviewStats.averageRating || "N/A"}
                      </div>
                      <div className="flex items-center justify-center space-x-1 mb-2">
                        {renderStars(reviewStats.averageRating || 0)}
                      </div>
                      <p className="text-gray-600 text-sm">Course Rating</p>
                    </div>

                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                        <div className="p-4 bg-white rounded-lg shadow-sm">
                          <div className="text-2xl font-bold text-blue-600">
                            {reviewStats.totalReviews}
                          </div>
                          <div className="text-sm text-gray-600">
                            Total Reviews
                          </div>
                        </div>
                        <div className="p-4 bg-white rounded-lg shadow-sm">
                          <div className="text-2xl font-bold text-purple-600">
                            {reviewStats.averageRating}
                          </div>
                          <div className="text-sm text-gray-600">
                            Average Rating
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reviews List with Custom Scrollbar */}
                {courseReviews.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="space-y-6">
                      {courseReviews.map((review, index) => (
                        <div
                          key={review._id || index}
                          className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200"
                        >
                          <div className="flex items-start space-x-4">
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                              {/* Check if user has avatar */}
                              {review.user?.avatarUrl ||
                              review.author?.avatarUrl ||
                              review.user?.avatar ||
                              review.author?.avatar ? (
                                <img
                                  src={
                                    review.user?.avatarUrl ||
                                    review.author?.avatarUrl ||
                                    review.user?.avatar ||
                                    review.author?.avatar
                                  }
                                  alt={
                                    review.user?.firstName ||
                                    review.author?.firstName ||
                                    review.user?.userName ||
                                    review.author?.userName ||
                                    "User"
                                  }
                                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                                  onError={(e) => {
                                    // Fallback to initial circle if image fails
                                    e.currentTarget.style.display = "none";
                                    (e.currentTarget.nextSibling as HTMLElement).style.display = "flex";
                                  }}
                                />
                              ) : null}
                              <div
                                className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
                                style={{
                                  display:
                                    review.user?.avatarUrl ||
                                    review.author?.avatarUrl ||
                                    review.user?.avatar ||
                                    review.author?.avatar
                                      ? "none"
                                      : "flex",
                                }}
                              >
                                {(
                                  review.user?.firstName ||
                                  review.author?.firstName ||
                                  review.user?.userName ||
                                  review.author?.userName ||
                                  review.user?.name ||
                                  review.author?.name ||
                                  "Anonymous"
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                            </div>

                            {/* Review Content */}
                            <div className="flex-1">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                                <div>
                                  <h4 className="font-bold text-lg text-gray-800">
                                    {/* Try multiple user field combinations */}
                                    {review.user?.firstName &&
                                    review.user?.lastName
                                      ? `${review.user.firstName} ${review.user.lastName}`
                                      : review.author?.firstName &&
                                        review.author?.lastName
                                      ? `${review.author.firstName} ${review.author.lastName}`
                                      : review.user?.userName ||
                                        review.author?.userName ||
                                        review.user?.name ||
                                        review.author?.name ||
                                        "Anonymous Student"}
                                  </h4>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <div className="flex items-center space-x-1">
                                      {renderStars(review.rate || 0)}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">
                                      {review.rate || 0}
                                    </span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-sm text-gray-500">
                                      {new Date(
                                        review.createdAt || review.reviewDate
                                      ).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <p className="text-gray-700 leading-relaxed">
                                {review.content ||
                                  review.reviewText ||
                                  "No review text provided."}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-500">
                      <svg
                        className="w-16 h-16 mx-auto mb-4 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.451L3 21l2.451-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"
                        />
                      </svg>
                      <p className="text-lg font-medium mb-2">No Reviews Yet</p>
                      <p className="text-sm">
                        This course hasn't received any reviews yet. Be the
                        first to review!
                      </p>
                    </div>
                  </div>
                )}

                {/* Custom CSS for scrollbar */}
                <style>{`
                  .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                  }
                  .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                  }
                  .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(to bottom, #3b82f6, #6366f1);
                    border-radius: 4px;
                  }
                  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(to bottom, #2563eb, #4f46e5);
                  }
                `}</style>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Course Header */}
          <div className="bg-white rounded-lg overflow-hidden shadow-sm mb-6">
            <div className="relative flex h-64 items-center justify-center bg-[var(--ui-accent-soft)] text-lg font-bold text-[var(--ui-accent)]">
              <span>Course</span>
              {courseData.imageUrl && (
                <img
                  src={courseData.imageUrl}
                  alt={courseData.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
            </div>
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-4">{courseData.title}</h1>

              {/* Purchase Status - Show if course is not purchased */}
              {!purchasedCourseData && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-orange-800">
                      Bạn đang xem khóa học chưa mua. Một số tính năng có thể bị
                      hạn chế.
                    </span>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex space-x-8 border-b border-gray-200 mb-6">
                {["Details", "Mentor", "Course", "Review"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                    }}
                    className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {renderCourseContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Rating Popup */}
      {showRatingPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ui-overlay)] backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Rate this Course</h3>
              <button
                onClick={handleCloseRatingPopup}
                className="text-gray-500 hover:text-gray-700"
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

            <div className="mb-4">
              <p className="text-gray-600 mb-3">
                How would you rate this course?
              </p>
              <div className="flex justify-center space-x-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setUserRating(star)}
                    className={`text-3xl ${
                      star <= userRating ? "text-yellow-400" : "text-gray-300"
                    } hover:text-yellow-400 transition-colors`}
                  >
                    {star}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Comment (Optional)
              </label>
              <textarea
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Share your thoughts about this course..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCloseRatingPopup}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={userRating === 0}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderCompleteCourse;
