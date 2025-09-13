import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  generateCourses,
  generateReviews,
  generateMentors,
} from "../utils/mockData";
import courseApi from "../api/modules/course.api";
import purchasedCourseApi from "../api/modules/purchasedCourse.api";
import cartApi from "../api/modules/cart.api";
import { showLoading, hideLoading } from "../redux/features/loading.slice";
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

  const [activeTab, setActiveTab] = useState("Details");
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [courseScrollPosition, setCourseScrollPosition] = useState(0);
  const [categoryExpanded, setCategoryExpanded] = useState(false);
  const [mentorCourses, setMentorCourses] = useState([]); // Add mentor courses state

  // Course data state
  const [courseData, setCourseData] = useState(null);
  const [mentorData, setMentorData] = useState(null);
  const [purchasedCourseData, setPurchasedCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get courseId or purchasedCourseId from URL params, location state, or URL search
  // Logic: URL param 'id' could be either purchasedCourseId (24 chars) or courseId (24 chars)
  // We'll determine which one it is based on context and API response

  const urlId = id; // The ID from URL params (/order-complete-course/:id)

  const purchasedCourseId =
    location.state?.purchasedCourseId ||
    new URLSearchParams(location.search).get("purchasedCourseId") ||
    urlId; // Assume URL id is purchasedCourseId first

  const courseId =
    location.state?.courseId ||
    new URLSearchParams(location.search).get("courseId") ||
    (!location.state?.purchasedCourseId ? urlId : null); // Fallback: treat urlId as courseId

  // Helper function to check if course is already purchased (from mentor-page.jsx)
  const isCourseAlreadyPurchased = (courseId) => {
    // Get current user ID for user-specific localStorage
    const userStr = localStorage.getItem("user");
    let currentUserId = null;
    try {
      const user = userStr ? JSON.parse(userStr) : null;
      currentUserId = user?.id || user?._id;
    } catch (e) {
      // Ignore parse errors
    }

    const mockKey = currentUserId
      ? `mockPurchasedCourses_${currentUserId}`
      : "mockPurchasedCourses";
    const mockPurchasedCourses = localStorage.getItem(mockKey);

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

  // Add to Cart function (from mentor-page.jsx)
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

  // Buy Now function (from mentor-page.jsx)
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

    navigate(`/shoppingcart`);
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
            console.log(
              "🎯 Attempting to fetch using purchasedCourseId:",
              purchasedCourseId
            );

            const { response, error } =
              await purchasedCourseApi.getPurchasedCourseById(
                { purchasedCourseId },
                dispatch
              );

            if (!error && response?.data?.data) {
              console.log("✅ Successfully fetched using purchasedCourseId");
              usedPurchasedCourseId = true;

              const purchasedData = response.data.data;
              console.log("✅ Purchased course data:", purchasedData);

              // Set course data from purchased course
              setCourseData({
                id: purchasedData.courseInfo._id,
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
                // Additional purchased course data
                keyLearningObjectives:
                  purchasedData.courseInfo.keyLearningObjectives || [],
                tags: purchasedData.courseInfo.tags || [],
                language: purchasedData.courseInfo.language || [],
              });

              // Set mentor data
              if (purchasedData.courseInfo.mentor) {
                const mentor = purchasedData.courseInfo.mentor;
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
                  totalStudents: "100+",
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
                } catch (err) {
                  console.warn("Failed to fetch mentor courses:", err);
                }
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
            } else {
              console.log(
                "❌ PurchasedCourseId API failed, trying courseId fallback"
              );
            }
          } catch (err) {
            console.log(
              "❌ PurchasedCourseId API error, trying courseId fallback:",
              err
            );
          }
        }

        // Fallback to courseId logic (legacy or when purchasedCourseId fails)
        const finalCourseId = courseId || purchasedCourseId; // Use either courseId or treat purchasedCourseId as courseId

        if (finalCourseId && !usedPurchasedCourseId) {
          console.log("🔄 Using legacy courseId logic for:", finalCourseId);

          // Check localStorage for purchased courses first
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

          let isPurchasedFromLocalStorage = false;
          let localPurchasedData = null;

          if (mockPurchasedCourses) {
            try {
              const purchasedCourses = JSON.parse(mockPurchasedCourses);
              console.log(
                "🔍 Checking localStorage - Current courseId:",
                courseId
              );
              console.log("🔍 Available purchased courses:", purchasedCourses);

              const purchasedCourse = purchasedCourses.find(
                (item) =>
                  item.courseId === courseId ||
                  item.courseInfo?._id === courseId
              );

              console.log("🔍 Found purchased course:", purchasedCourse);

              if (purchasedCourse) {
                isPurchasedFromLocalStorage = true;
                localPurchasedData = {
                  courseId: purchasedCourse.courseId,
                  purchaseDate: purchasedCourse.purchaseDate,
                  lastAccessDate: new Date().toISOString(),
                };
                console.log(
                  "✅ Course is purchased from localStorage:",
                  localPurchasedData
                );
              } else {
                console.log("❌ Course not found in localStorage");
              }
            } catch (e) {
              console.warn("Error parsing localStorage purchased courses:", e);
            }
          }

          // Fetch both course details and purchased course details from API
          const [courseResult, purchasedResult] = await Promise.allSettled([
            courseApi.getDetail({ courseId }),
            purchasedCourseApi.getPurchasedCourseDetails({ courseId }),
          ]);

          // Handle course details (legacy logic continues...)
          if (courseResult.status === "fulfilled") {
            const { response, error } = courseResult.value;

            if (error || !response?.data?.course) {
              console.error("Error fetching course:", error);
              setError("Failed to load course details");
              toast.error("Không thể tải dữ liệu khóa học");
              return;
            }

            // Continue with existing course data processing...
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

            // Set mentor data with real API stats
            if (course.mentor) {
              // Fetch real mentor stats
              const fetchMentorStats = async (mentorId) => {
                try {
                  console.log("🔍 Fetching courses for mentor ID:", mentorId);

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

                  // Use data from course.mentor (no separate mentor API needed)
                  return {
                    totalCourses: totalCourses, // Return exact number
                    totalStudents: "100+", // Default fallback since no mentor API
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
                    totalStudents: "100+",
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

          // Handle purchased course details (prioritize localStorage over API)
          if (isPurchasedFromLocalStorage) {
            console.log(
              "✅ Setting purchasedCourseData from localStorage:",
              localPurchasedData
            );
            setPurchasedCourseData(localPurchasedData);
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
  }, [courseId, purchasedCourseId]); // ⭐ Add purchasedCourseId to dependencies

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

  // Generate mockup data for demo using useState to prevent re-render
  const [mockData] = useState(() => {
    try {
      const allCourses = generateCourses(20); // Generate 20 courses for scrolling
      const allReviews = generateReviews(20, [], []); // Generate 20 reviews for scrolling with empty arrays
      const fallbackMentorData = generateMentors(1)[0]; // Generate 1 mentor

      console.log("Generated mockup data:", {
        coursesCount: allCourses.length,
        reviewsCount: allReviews.length,
        mentorName: fallbackMentorData.name,
      });

      return {
        allCourses,
        allReviews,
        fallbackMentorData,
      };
    } catch (error) {
      console.error("Error generating mockup data:", error);
      // Create fallback data with at least 6 courses and 6 reviews
      return {
        allCourses: [
          {
            id: 1,
            title: "JavaScript Fundamentals",
            instructor: "John Doe",
            image:
              "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=250&fit=crop",
            price: 89.99,
            rating: 4.5,
            ratingsCount: 245,
            students: 1200,
            lectures: 25,
            totalHours: 8,
            level: "Beginner",
          },
          {
            id: 2,
            title: "React Advanced Patterns",
            instructor: "Jane Smith",
            image:
              "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop",
            price: 129.99,
            rating: 4.8,
            ratingsCount: 189,
            students: 850,
            lectures: 35,
            totalHours: 12,
            level: "Advanced",
          },
          {
            id: 3,
            title: "Node.js Backend Development",
            instructor: "Mike Johnson",
            image:
              "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop",
            price: 99.99,
            rating: 4.6,
            ratingsCount: 320,
            students: 950,
            lectures: 30,
            totalHours: 10,
            level: "Intermediate",
          },
          {
            id: 4,
            title: "Python Data Science",
            instructor: "Sarah Wilson",
            image:
              "https://images.unsplash.com/photo-1526379879527-8559ecfcaec0?w=400&h=250&fit=crop",
            price: 149.99,
            rating: 4.7,
            ratingsCount: 410,
            students: 1500,
            lectures: 40,
            totalHours: 15,
            level: "Intermediate",
          },
          {
            id: 5,
            title: "Database Design & SQL",
            instructor: "David Brown",
            image:
              "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=250&fit=crop",
            price: 79.99,
            rating: 4.4,
            ratingsCount: 156,
            students: 680,
            lectures: 22,
            totalHours: 7,
            level: "Beginner",
          },
          {
            id: 6,
            title: "Machine Learning Basics",
            instructor: "Emily Davis",
            image:
              "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=250&fit=crop",
            price: 179.99,
            rating: 4.9,
            ratingsCount: 298,
            students: 1100,
            lectures: 45,
            totalHours: 18,
            level: "Advanced",
          },
        ],
        allReviews: [
          {
            id: 1,
            studentName: "Alex Thompson",
            rating: 5,
            reviewDate: "2024-07-15",
            reviewText:
              "Excellent course! The instructor explains complex concepts in a very understandable way. I learned so much and feel confident applying these skills in real projects.",
            courseName: "Programming Fundamental",
            helpfulCount: 42,
          },
          {
            id: 2,
            studentName: "Maria Garcia",
            rating: 4,
            reviewDate: "2024-07-10",
            reviewText:
              "Great content and well-structured lessons. The examples are practical and relevant. Would recommend to anyone starting their programming journey.",
            courseName: "Programming Fundamental",
            helpfulCount: 38,
          },
          {
            id: 3,
            studentName: "James Wilson",
            rating: 5,
            reviewDate: "2024-07-08",
            reviewText:
              "Outstanding course! The step-by-step approach makes learning programming concepts so much easier. The instructor is knowledgeable and engaging.",
            courseName: "Programming Fundamental",
            helpfulCount: 55,
          },
          {
            id: 4,
            studentName: "Lisa Chen",
            rating: 4,
            reviewDate: "2024-07-05",
            reviewText:
              "Very comprehensive course covering all the fundamentals. The assignments help reinforce the learning. Highly recommended for beginners.",
            courseName: "Programming Fundamental",
            helpfulCount: 29,
          },
          {
            id: 5,
            studentName: "Robert Johnson",
            rating: 5,
            reviewDate: "2024-07-02",
            reviewText:
              "Perfect introduction to programming! The course is well-paced and the examples are clear. I went from zero knowledge to building my first programs.",
            courseName: "Programming Fundamental",
            helpfulCount: 67,
          },
          {
            id: 6,
            studentName: "Sophie Anderson",
            rating: 4,
            reviewDate: "2024-06-28",
            reviewText:
              "Solid foundation course. The instructor covers all important topics thoroughly. Great value for money and excellent support from the community.",
            courseName: "Programming Fundamental",
            helpfulCount: 34,
          },
        ],
        mentorData: {
          name: "John Doe",
          avatar: "https://via.placeholder.com/150",
          jobTitle: "Senior Developer",
          company: "Tech Corp",
          yearsExperience: 5,
          sessionsCompleted: 100,
          rating: 4.5,
          reviewsCount: 50,
          bio: "Experienced developer with 5+ years in the industry",
          skills: ["JavaScript", "React", "Node.js"],
          hourlyRate: 75,
          isOnline: true,
        },
      };
    }
  });

  const { allCourses, allReviews, fallbackMentorData } = mockData;

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
                      <div className="relative">
                        <img
                          src={
                            course.thumbnail ||
                            course.image ||
                            "https://via.placeholder.com/320x200/f3f4f6/6b7280?text=Course+Image"
                          }
                          alt={course.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src =
                              "https://via.placeholder.com/320x200/f3f4f6/6b7280?text=Course+Image";
                          }}
                        />
                        <div className="absolute top-3 right-3 bg-white bg-opacity-95 backdrop-blur-sm px-3 py-1 rounded-full shadow-md">
                          <span className="text-sm font-bold text-gray-800">
                            ${course.price || "170"}
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
                        {user && user.role === "mentee" && (
                          <div className="flex flex-col gap-2 mt-3">
                            {isCourseAlreadyPurchased(
                              course._id || course.id
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
        const mockReviews = allReviews ? allReviews.slice(0, 15) : [];
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
                        {mockReviews.length}
                      </div>
                      <div className="text-sm text-gray-600">Total Reviews</div>
                    </div>
                    <div className="p-4 bg-white rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-green-600">
                        {mockReviews.length > 0
                          ? Math.round(
                              (mockReviews.filter((r) => r.rating >= 4).length /
                                mockReviews.length) *
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
                        {mockReviews.length > 0
                          ? Math.round(
                              (mockReviews.reduce(
                                (acc, r) => acc + r.rating,
                                0
                              ) /
                                mockReviews.length) *
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
                {mockReviews.map((review, index) => (
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
                    onClick={() => setActiveTab(tab)}
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
