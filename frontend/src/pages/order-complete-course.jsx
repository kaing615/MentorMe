import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { showLoading, hideLoading } from "../redux/features/loading.slice";
import courseApi from "../api/modules/course.api";
import purchasedCourseApi from "../api/modules/purchasedCourse.api";
import cartApi from "../api/modules/cart.api";
import { toast } from "react-toastify";

const OrderCompleteCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);

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
    if (user.role === "mentee") {
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

  // Initialize activeTab from localStorage or default to "Details"
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem("orderCompletePageActiveTab");
    return savedTab || "Details";
  });
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [courseScrollPosition, setCourseScrollPosition] = useState(0);

  // Course data state
  const [courseData, setCourseData] = useState(null);
  const [mentorData, setMentorData] = useState(null);
  const [purchasedCourseData, setPurchasedCourseData] = useState(null);
  const [mentorCourseCount, setMentorCourseCount] = useState(0);
  const [mentorCourses, setMentorCourses] = useState([]);
  const [purchasedCourseIds, setPurchasedCourseIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User data will come from Redux selector above

  // Fetch purchased courses from API on component mount
  useEffect(() => {
    const fetchPurchasedCourses = async () => {
      if (!user) return;

      try {
        const { response, error } =
          await purchasedCourseApi.getPurchasedCourses(dispatch);

        if (response && response.data && response.data.courses) {
          console.log(
            "Fetched purchased courses from API:",
            response.data.courses.length
          );
          // Extract course IDs for quick lookup
          const purchasedIds = response.data.courses
            .map((item) => item.course?._id || item.course?.id || item.courseId)
            .filter(Boolean);
          setPurchasedCourseIds(purchasedIds);
        } else if (error) {
          console.warn("Failed to fetch purchased courses:", error);
        }
      } catch (err) {
        console.error("Error fetching purchased courses:", err);
      }
    };

    fetchPurchasedCourses();
  }, [user, dispatch]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle tab change and save to localStorage
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    localStorage.setItem("orderCompletePageActiveTab", newTab);
  };

  // Get courseId from location state or URL params
  const courseId =
    location.state?.courseId ||
    new URLSearchParams(location.search).get("courseId");

  // Fetch course data on component mount
  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!courseId) {
        setError("Course ID not provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Check if course is purchased via API
        let isPurchasedFromAPI = false;
        let apiPurchasedData = null;

        try {
          const { response, error } =
            await purchasedCourseApi.getPurchasedCourses(dispatch);

          if (!error && response?.data?.courses) {
            const purchasedCourses = response.data.courses;
            console.log("🔍 Checking API - Current courseId:", courseId);
            console.log("🔍 Available purchased courses:", purchasedCourses);

            const purchasedCourse = purchasedCourses.find(
              (item) =>
                item.courseId === courseId ||
                item.course?._id === courseId ||
                item.courseInfo?._id === courseId
            );

            if (purchasedCourse) {
              isPurchasedFromAPI = true;
              apiPurchasedData = {
                courseId: purchasedCourse.courseId || courseId,
                purchaseDate:
                  purchasedCourse.purchaseDate || purchasedCourse.createdAt,
                lastAccessDate: new Date().toISOString(),
              };
              console.log("✅ Course is purchased from API:", apiPurchasedData);
            } else {
              console.log("❌ Course not found in API purchases");
            }
          }
        } catch (apiError) {
          console.error("Error checking purchased courses from API:", apiError);
        }

        // Fetch both course details and purchased course details from API
        const [courseResult, purchasedResult] = await Promise.allSettled([
          courseApi.getDetail({ courseId }),
          purchasedCourseApi.getPurchasedCourseDetails({ courseId }),
        ]);

        // Handle course details
        if (courseResult.status === "fulfilled") {
          const { response, error } = courseResult.value;

          if (error || !response?.data?.course) {
            console.error("Error fetching course:", error);
            setError("Failed to load course details");
            toast.error("Không thể tải dữ liệu khóa học");
            return;
          }

          // EXACT pattern from EditCoursePage line 155: const course = response.data.course;
          const course = response.data.course;
          console.log("🎯 Course data from database:", course);

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

          setCourseData({
            id: course._id,
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
            createdAt: course.createdAt,
            updatedAt: course.updatedAt,
            level: course.level,
            // Parsed arrays for display
            keyLearningObjectives: parsedObjectives,
            tags: parsedTags,
            language: parsedLanguage,
          });

          // Set mentor data and fetch their course count
          if (course.mentor) {
            const mentorId = course.mentor._id;

            // Fetch mentor's courses specifically
            try {
              // Try to fetch mentor courses specifically first
              let coursesResponse = await courseApi.getAllCourses({
                filterBy: JSON.stringify({ mentorId: mentorId }),
                limit: 100,
                dispatch,
              });

              // If filterBy mentorId doesn't work, fallback to get all courses and filter
              if (
                coursesResponse.error ||
                !coursesResponse.response?.data?.courses?.length
              ) {
                console.log(
                  "🔄 MentorId filter failed, falling back to manual filtering..."
                );
                coursesResponse = await courseApi.getAllCourses({
                  limit: 500, // Get more courses to ensure we get mentor's courses
                  dispatch,
                });
              }
              if (
                !coursesResponse.error &&
                coursesResponse.response?.data?.courses
              ) {
                const allCourses = coursesResponse.response.data.courses;

                // Filter mentor courses manually if needed
                const mentorCourses = allCourses.filter(
                  (course) =>
                    course.mentor?._id === mentorId ||
                    course.mentor === mentorId ||
                    course.mentorId === mentorId
                );

                // Transform courses to match AllCoursepage format
                const transformedCourses = mentorCourses.map((course) => ({
                  id: course._id || course.courseId,
                  title: course.title || "Untitled Course",
                  instructor: course.mentor?.userName
                    ? course.mentor.userName
                    : course.mentor?.firstName || course.mentor?.lastName
                    ? `${course.mentor.firstName || ""} ${
                        course.mentor.lastName || ""
                      }`.trim()
                    : "Unknown Instructor",
                  category: course.category || "General",
                  level: course.level || "Beginner",
                  rating: parseFloat(course.rate || course.rating || 0),
                  reviewCount:
                    course.ratingsCount || course.numberOfRatings || 0,
                  studentCount:
                    course.studentsCount || course.enrolledStudents || 0,
                  price: parseFloat(course.price || 0),
                  originalPrice: parseFloat(
                    course.originalPrice || course.price || 0
                  ),
                  duration: `${
                    course.duration || course.totalHours || 0
                  } Total Hours`,
                  lectures: course.lectures || course.totalLectures || 0,
                  image:
                    course.thumbnail ||
                    course.image ||
                    "/api/placeholder/300/200",
                  description:
                    course.description ||
                    course.courseOverview ||
                    "No description available",
                  bestseller: course.bestseller || false,
                  lastUpdated:
                    course.updatedAt ||
                    course.createdAt ||
                    new Date().toISOString(),
                  tags: course.tags || [],
                  language: course.language || [],
                  mentorInfo: course.mentor || {},
                  courseId: course._id || course.courseId,
                  _id: course._id,
                }));

                setMentorCourses(transformedCourses);
                setMentorCourseCount(transformedCourses.length);
                console.log(
                  `🎯 Fetched ${transformedCourses.length} courses for mentor ${mentorId}`
                );
                console.log("📚 Mentor courses:", transformedCourses);
              }
            } catch (error) {
              console.error("Error fetching mentor courses:", error);
              console.error("❌ Failed to fetch courses for mentor:", mentorId);
              setMentorCourseCount(0);
            }

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
              category: course.mentor.category || "IT",
              experience: course.mentor.experience || "Professional",
              skills: course.mentor.skills || [],
              totalCourses: "0", // Will be updated by useEffect when mentorCourseCount changes
              totalStudents: "100+", // Demo value as requested
            });
          }
        }

        // Handle purchased course details
        if (isPurchasedFromAPI) {
          console.log(
            "✅ Setting purchasedCourseData from API:",
            apiPurchasedData
          );
          setPurchasedCourseData(apiPurchasedData);
        } else if (
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
          } else {
            console.log(
              "ℹ️ Course not purchased according to API check endpoint"
            );
          }
        } else {
          console.warn(
            "❌ Purchased course data not available:",
            purchasedResult.reason
          );
          // This is not a critical error, user might be viewing course details without purchasing
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
  }, [courseId]);

  // Update mentor data when course count changes
  useEffect(() => {
    if (mentorData && mentorCourseCount >= 0) {
      setMentorData((prev) => ({
        ...prev,
        totalCourses: mentorCourseCount > 0 ? `${mentorCourseCount}` : "0",
      }));
    }
  }, [mentorCourseCount]);

  // Fetch purchased courses for button states
  useEffect(() => {
    const fetchPurchasedCourses = async () => {
      if (!user || user.role !== "mentee") return;

      try {
        const { response, error } =
          await purchasedCourseApi.getPurchasedCourses(dispatch);

        if (!error && response?.data?.courses) {
          const purchasedIds = response.data.courses.map(
            (item) => item.course?._id || item.course?.id || item.courseId
          );
          setPurchasedCourseIds(purchasedIds);
        }
      } catch (error) {
        console.error("Error fetching purchased courses:", error);
      }
    };

    fetchPurchasedCourses();
  }, [user, dispatch]);

  // Helper function to check if course is already purchased
  const isCourseAlreadyPurchased = (courseId) => {
    return purchasedCourseApi.isCourseAlreadyPurchased(courseId);
  };

  // Add to Cart function
  const handleAddToCart = async (e, course) => {
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to add courses to cart");
      navigate("/auth/signin");
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
        console.error("Failed to add course to cart:", apiError);
        toast.error("Failed to add course to cart");
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
      navigate("/auth/signin");
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
    navigate("/mentor/courses", {
      state: {
        mentorId: courseData.mentor?.id || 1,
        mentorName: courseData.mentor?.name || "John Doe",
      },
    });
  };

  // API-ready data fetching functions (currently using mockup data)
  // TODO: Replace mockup data with actual API calls when BE is ready

  const fetchCourseData = async (courseId) => {
    // TODO: Replace with actual API call
    // const response = await fetch(`/api/courses/${courseId}`);
    // return response.json();

    // Using mockup data for now
    return {
      id: courseId || "course_123",
      title: "Programming Fundamental",
      image:
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=400&fit=crop&crop=center",
      driveLink:
        "https://drive.google.com/drive/folders/1ABC123_programming_fundamental_course",
      description: `Welcome! A big part of programming is about thinking. Technology is so fast that programmers are always going deeper, challenge themselves with harder concepts. We recommend everyone starts with programming fundamental so that you can be ready for a bright future ahead. After this course you should be familiar with variables, operators, loops, conditionals, and functions to start a coding and create professional things that you want.`,
      keyLearningObjectives: [
        "Be familiar with the basic programming concepts like variables, loops and conditions.",
        "Learn how coding and computational logic and general instructions.",
        "Apply methods, data types, and loops to build programmatic logical patterns.",
        "Explain and demonstrate how algorithms are developed and how computational thinking works.",
        "Build a strong foundation for advancing programming language in the future.",
      ],
      courseDetails: {
        duration: "8 hours",
        level: "Beginner",
        language: "English",
        students: "430 students enrolled",
        lastUpdated: "March 2024",
        price: "$168.9",
        category: "Programming",
      },
    };
  };

  const fetchMentorData = async (mentorId) => {
    // TODO: Replace with actual API call
    // const response = await fetch(`/api/mentors/${mentorId}`);
    // return response.json();

    // Using mockup data for now
    try {
      const mentorData = generateMentors(1)[0];
      return {
        id: mentorId || "mentor_456",
        name: mentorData.name,
        avatar: mentorData.avatar,
        title: mentorData.jobTitle,
        company: mentorData.company,
        experience: `${mentorData.yearsExperience}+ years in software development`,
        students: `${mentorData.sessionsCompleted} Students`,
        courses: "239 Courses",
        rating: mentorData.rating.toString(),
        reviews: `${mentorData.reviewsCount} reviews`,
        bio: mentorData.bio,
        specialties: mentorData.skills,
        profileLink: "/mentor/profile",
        hourlyRate: mentorData.hourlyRate,
        isOnline: mentorData.isOnline,
      };
    } catch (error) {
      console.error("Error generating mentor data:", error);
      return null;
    }
  };

  const fetchRelatedCourses = async (mentorId, limit = 12) => {
    // TODO: Replace with actual API call
    // const response = await fetch(`/api/mentors/${mentorId}/courses?limit=${limit}`);
    // return response.json();

    // Using mockup data for now
    try {
      const courses = generateCourses(20);
      return courses.slice(0, limit);
    } catch (error) {
      console.error("Error generating courses:", error);
      return [];
    }
  };

  const fetchCourseReviews = async (courseId, limit = 15) => {
    // TODO: Replace with actual API call
    // const response = await fetch(`/api/courses/${courseId}/reviews?limit=${limit}`);
    // return response.json();

    // Using mockup data for now
    try {
      const reviews = generateReviews(20, [], []); // Pass empty arrays explicitly
      return reviews.slice(0, limit);
    } catch (error) {
      console.error("Error generating reviews:", error);
      return [];
    }
  };

  // State for API data
  const [allCourses, setAllCourses] = useState([]);
  const [allReviews, setAllReviews] = useState([]);

  // Fetch real data from APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch courses
        const coursesResponse = await courseApi.getAllCourses({ dispatch });
        if (!coursesResponse.error) {
          setAllCourses(coursesResponse.response.data.courses || []);
        }

        // Fetch reviews
        // const reviewsResponse = await reviewApi.getAllReviews({ dispatch });
        // if (!reviewsResponse.error) {
        //   setAllReviews(reviewsResponse.response.data.reviews || []);
        // }

        // Fetch mentor data if needed
        // const mentorResponse = await mentorApi.getMentorById({ id: course?.mentorId, dispatch });
        // if (!mentorResponse.error) {
        //   setMentorData(mentorResponse.response.data.mentor);
        // }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [dispatch]);

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
    return [...Array(5)].map((_, i) => (
      <span
        key={i}
        className={`text-sm ${
          i < Math.floor(rating) ? "text-yellow-400" : "text-gray-300"
        }`}
      >
        ★
      </span>
    ));
  };

  // Function to handle course access
  const handleCourseAccess = () => {
    const courseLink =
      courseData.link || "https://drive.google.com/drive/folders/example";
    window.open(courseLink, "_blank");
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
    try {
      // TODO: Replace with actual API call when BE is ready
      // const response = await fetch(`/api/courses/${courseData.id}/ratings`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${userToken}`,
      //   },
      //   body: JSON.stringify({
      //     rating: userRating,
      //     comment: userComment,
      //   }),
      // });
      // const result = await response.json();

      // Using mockup implementation for now
      console.log("Rating submitted:", {
        courseId: courseData.id,
        rating: userRating,
        comment: userComment,
        timestamp: new Date().toISOString(),
      });

      alert("Thank you for your rating!");
      handleCloseRatingPopup();
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Failed to submit rating. Please try again.");
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
              <p className="text-gray-700 mb-8 leading-relaxed text-lg">
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
                    icon: "📚",
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
                    value: "430+ enrolled", // Demo value as requested
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
                <img
                  src={
                    mentorData?.avatar ||
                    "https://via.placeholder.com/80x80/f3f4f6/6b7280?text=M"
                  }
                  alt={mentorData?.name || "Mentor"}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/80x80/f3f4f6/6b7280?text=M";
                  }}
                />
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-200/50">
                  <div className="text-sm font-medium text-blue-600 mb-2 uppercase tracking-wide">
                    Experience
                  </div>
                  <div className="text-sm font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                    {mentorData?.experience}
                  </div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-emerald-200/50">
                  <div className="text-sm font-medium text-emerald-600 mb-2 uppercase tracking-wide">
                    Category
                  </div>
                  <div className="text-sm font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                    {mentorData?.category}
                  </div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-200/50">
                  <div className="text-sm font-medium text-purple-600 mb-2 uppercase tracking-wide">
                    Courses
                  </div>
                  <div className="text-sm font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                    {mentorCourseCount >= 0
                      ? mentorCourseCount
                      : mentorData?.totalCourses}
                  </div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-orange-200/50">
                  <div className="text-sm font-medium text-orange-600 mb-2 uppercase tracking-wide">
                    Students
                  </div>
                  <div className="text-sm font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
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
                {mentorCourses.length > 0 ? (
                  mentorCourses.map((course, index) => (
                    <div
                      key={course.id || index}
                      onClick={() => navigate(`/course-detail/${course.id}`)}
                      className="flex-shrink-0 w-80 bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
                      style={{ minHeight: "480px" }}
                    >
                      {/* Course Image */}
                      <div className="h-[140px] w-full bg-gray-100 rounded-t-xl flex items-center justify-center">
                        <img
                          src={course.image}
                          alt={course.title}
                          className="object-cover h-[120px] w-[92%] rounded-xl"
                          style={{ marginTop: "4px", marginBottom: "4px" }}
                          onError={(e) => {
                            e.target.src = "/api/placeholder/300/200";
                          }}
                        />
                        {course.bestseller && (
                          <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                            Bestseller
                          </span>
                        )}
                      </div>

                      {/* Course Content */}
                      <div className="flex flex-col p-4 flex-1">
                        {/* Title */}
                        <div
                          className="font-bold text-[16px] text-gray-900 mb-2 leading-tight"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {course.title}
                        </div>

                        {/* Instructor */}
                        <div
                          className="text-sm text-gray-700 font-normal mb-2"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          By {course.instructor}
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-1 text-sm mb-2">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-base ${
                                i < Math.floor(course.rating || 0)
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                          <span className="text-sm text-gray-700 ml-2">
                            ({course.reviewCount || 0} Ratings)
                          </span>
                        </div>

                        {/* Duration, Lectures, Category */}
                        <div className="text-sm text-gray-700 mb-1">
                          {course.duration || "Self-paced"} •{" "}
                          {course.lectures || 0} Lectures
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {course.category || "General"}
                        </div>

                        {/* Hiển thị tags nếu có */}
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

                        {/* Hiển thị languages nếu có */}
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

                        {/* Price */}
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
                          <div className="flex gap-2 mt-3 mb-3 px-4">
                            {isCourseAlreadyPurchased(course.id) ? (
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
                  ))
                ) : (
                  <div className="w-full text-center py-12">
                    <div className="text-gray-400 text-lg mb-2">
                      No courses available
                    </div>
                    <p className="text-gray-500">
                      This mentor hasn't created any courses yet.
                    </p>
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
        const reviews = allReviews ? allReviews.slice(0, 15) : [];
        return (
          <div className="bg-white rounded-lg p-8">
            <h3 className="text-2xl font-bold mb-8 text-gray-800">
              Course Reviews
            </h3>

            {/* Overall Rating Summary */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 mb-8 border border-yellow-200">
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-8">
                <div className="text-center">
                  <div className="text-5xl font-bold text-gray-800 mb-2">
                    {courseData.rate || "N/A"}
                  </div>
                  <div className="flex items-center justify-center space-x-1 mb-2">
                    {renderStars(parseFloat(courseData.rate || 0))}
                  </div>
                  <p className="text-gray-600 text-sm">Course Rating</p>
                </div>

                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-white rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-blue-600">
                        {reviews.length}
                      </div>
                      <div className="text-sm text-gray-600">Total Reviews</div>
                    </div>
                    <div className="p-4 bg-white rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-green-600">
                        {reviews.length > 0
                          ? Math.round(
                              (reviews.filter((r) => r.rating >= 4).length /
                                reviews.length) *
                                100
                            )
                          : 0}
                        %
                      </div>
                      <div className="text-sm text-gray-600">
                        Positive Reviews
                      </div>
                    </div>
                    <div className="p-4 bg-white rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-purple-600">
                        {reviews.length > 0
                          ? Math.round(
                              (reviews.reduce((acc, r) => acc + r.rating, 0) /
                                reviews.length) *
                                10
                            ) / 10
                          : 0}
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
            <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-6">
                {reviews.map((review, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-start space-x-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {review.studentName.charAt(0)}
                        </div>
                      </div>

                      {/* Review Content */}
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-lg text-gray-800">
                              {review.studentName}
                            </h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex items-center space-x-1">
                                {renderStars(review.rating)}
                              </div>
                              <span className="text-sm font-medium text-gray-700">
                                {review.rating}.0
                              </span>
                              <span className="text-gray-400">•</span>
                              <span className="text-sm text-gray-500">
                                {new Date(review.reviewDate).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Helpful Counter */}
                          <div className="flex items-center space-x-2 mt-2 md:mt-0">
                            <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600 transition-colors">
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
                                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V9a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L9 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                                />
                              </svg>
                              <span>Helpful ({review.helpfulCount})</span>
                            </button>
                          </div>
                        </div>

                        <p className="text-gray-700 leading-relaxed">
                          {review.reviewText}
                        </p>

                        {/* Course Name Tag */}
                        <div className="mt-3">
                          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            {review.courseName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom CSS for scrollbar */}
            <style jsx>{`
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
            <img
              src={
                courseData.imageUrl ||
                "https://via.placeholder.com/800x300/f3f4f6/6b7280?text=Course+Image"
              }
              alt={courseData.title}
              className="w-full h-64 object-cover"
              onError={(e) => {
                e.target.src =
                  "https://via.placeholder.com/800x300/f3f4f6/6b7280?text=Course+Image";
              }}
            />
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
                    onClick={() => handleTabChange(tab)}
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
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50/80 via-white/70 to-purple-50/80 backdrop-blur-sm flex items-center justify-center z-50">
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
                    ★
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
