import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  generateCourses,
  generateReviews,
  generateMentors,
} from "../utils/mockData";
import courseApi from "../api/modules/course.api";
import purchasedCourseApi from "../api/modules/purchasedCourse.api";
import { toast } from "react-toastify";

const OrderCompleteCourse = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("Details");
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [courseScrollPosition, setCourseScrollPosition] = useState(0);

  // Course data state
  const [courseData, setCourseData] = useState(null);
  const [mentorData, setMentorData] = useState(null);
  const [purchasedCourseData, setPurchasedCourseData] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

        // Check localStorage for purchased courses first
        const mockPurchasedCourses = localStorage.getItem(
          "mockPurchasedCourses"
        );
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
                item.courseId === courseId || item.courseInfo?._id === courseId
            );

            console.log("🔍 Found purchased course:", purchasedCourse);

            if (purchasedCourse) {
              isPurchasedFromLocalStorage = true;
              localPurchasedData = {
                courseId: purchasedCourse.courseId,
                progress: purchasedCourse.progress || 0,
                purchaseDate: purchasedCourse.purchaseDate,
                isCompleted: purchasedCourse.progress === 100,
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

        // Get course info from location state if available
        const courseFromState = location.state?.courseInfo;

        // Use course from state if available, otherwise fetch from API
        if (courseFromState) {
          setCourseData({
            id: courseFromState._id,
            title: courseFromState.title,
            description: courseFromState.description,
            price: courseFromState.price,
            category: courseFromState.category,
            duration: courseFromState.duration,
            rate: courseFromState.rate,
            lectures: courseFromState.lectures,
            link: courseFromState.link,
            imageUrl: courseFromState.thumbnail || courseFromState.imageUrl,
            mentor: courseFromState.mentor,
            createdAt: courseFromState.createdAt,
            updatedAt: courseFromState.updatedAt,
          });

          // Set mentor data from course
          if (courseFromState.mentor) {
            setMentorData({
              id: courseFromState.mentor._id,
              name: `${courseFromState.mentor.firstName} ${courseFromState.mentor.lastName}`,
              firstName: courseFromState.mentor.firstName,
              lastName: courseFromState.mentor.lastName,
              avatar: courseFromState.mentor.avatarUrl,
              title: courseFromState.mentor.jobTitle || "Mentor",
              bio: courseFromState.mentor.bio,
              email: courseFromState.mentor.email,
            });
          }

          // Set purchased data if found in localStorage
          if (isPurchasedFromLocalStorage) {
            console.log(
              "✅ Setting purchasedCourseData from localStorage:",
              localPurchasedData
            );
            setPurchasedCourseData(localPurchasedData);
            setProgress(localPurchasedData.progress || 0);
          } else {
            console.log("❌ No purchased data found in localStorage");
          }

          setLoading(false);
          return;
        }

        // Fetch both course details and purchased course details from API
        const [courseResult, purchasedResult] = await Promise.allSettled([
          courseApi.getDetail({ courseId }),
          purchasedCourseApi.getPurchasedCourseDetails({ courseId }),
        ]);

        // Handle course details
        if (courseResult.status === "fulfilled" && !courseResult.value.error) {
          const course =
            courseResult.value.response?.data?.course ||
            courseResult.value.response?.data?.data ||
            courseResult.value.response?.data;
          if (course) {
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
              imageUrl: course.imageUrl,
              mentor: course.mentor,
              createdAt: course.createdAt,
              updatedAt: course.updatedAt,
            });

            // Set mentor data from course
            if (course.mentor) {
              setMentorData({
                id: course.mentor._id,
                name: `${course.mentor.firstName} ${course.mentor.lastName}`,
                firstName: course.mentor.firstName,
                lastName: course.mentor.lastName,
                avatar: course.mentor.avatarUrl,
                title: course.mentor.jobTitle || "Mentor",
                bio: course.mentor.bio,
                email: course.mentor.email,
              });
            }
          }
        } else {
          console.error("Error fetching course:", courseResult.reason);
          setError("Failed to load course details");
        }

        // Handle purchased course details (prioritize localStorage over API)
        if (isPurchasedFromLocalStorage) {
          setPurchasedCourseData(localPurchasedData);
          setProgress(localPurchasedData.progress || 0);
        } else if (
          purchasedResult.status === "fulfilled" &&
          !purchasedResult.value.error
        ) {
          const purchasedCourse =
            purchasedResult.value.response?.data?.purchasedCourse ||
            purchasedResult.value.response?.data;
          if (purchasedCourse) {
            setPurchasedCourseData(purchasedCourse);
            setProgress(purchasedCourse.progress || 0);
          }
        } else {
          console.warn(
            "Purchased course data not available:",
            purchasedResult.reason
          );
          // This is not a critical error, user might be viewing course details without purchasing
        }
      } catch (err) {
        console.error("Error in fetchCourseDetails:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId, location.state]);

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
    navigate(courseData.mentor.profileLink);
  };

  // Function to update course progress
  const handleUpdateProgress = async (newProgress) => {
    if (!purchasedCourseData) {
      toast.warning("Bạn cần mua khóa học để cập nhật tiến độ");
      return;
    }

    try {
      const { response, error } = await purchasedCourseApi.updateProgress({
        courseId: courseId,
        progress: newProgress,
      });

      if (error) {
        throw new Error(error.message || "Không thể cập nhật tiến độ");
      }

      setProgress(newProgress);
      toast.success(`Đã cập nhật tiến độ: ${newProgress}%`);
    } catch (error) {
      console.error("Update progress error:", error);
      toast.error(error.message || "Có lỗi khi cập nhật tiến độ");
    }
  };

  // Function to mark course as completed
  const handleCompleteCourse = async () => {
    if (!purchasedCourseData) {
      toast.warning("Bạn cần mua khóa học trước");
      return;
    }

    try {
      const { response, error } = await purchasedCourseApi.completeCourse({
        courseId: courseId,
      });

      if (error) {
        throw new Error(error.message || "Không thể hoàn thành khóa học");
      }

      setProgress(100);
      toast.success("🎉 Chúc mừng! Bạn đã hoàn thành khóa học!");
    } catch (error) {
      console.error("Complete course error:", error);
      toast.error(error.message || "Có lỗi khi hoàn thành khóa học");
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
                    label: "Duration",
                    value: courseData.duration || "Self-paced",
                    icon: "⏰",
                  },
                  {
                    label: "Lectures",
                    value: courseData.lectures || "Multiple",
                    icon: "📚",
                  },
                  {
                    label: "Rating",
                    value: `${courseData.rate || "N/A"} ⭐`,
                    icon: "⭐",
                  },
                  {
                    label: "Category",
                    value: courseData.category || "General",
                    icon: "📂",
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
                    {mentorData?.name || "Anonymous Mentor"}
                  </h4>
                  <p className="text-blue-600 font-semibold mb-1">
                    {mentorData?.title || "Mentor"}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {mentorData?.email || "Contact information not available"}
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
                  <div className="text-lg font-bold text-gray-800">
                    Professional
                  </div>
                  <div className="text-xs text-gray-500">Experience</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-lg font-bold text-gray-800">
                    Multiple
                  </div>
                  <div className="text-xs text-gray-500">Students</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-lg font-bold text-gray-800">Various</div>
                  <div className="text-xs text-gray-500">Courses</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    {renderStars(5)}
                  </div>
                  <div className="text-xs text-gray-500">Rating</div>
                </div>
              </div>

              {/* Bio */}
              <div className="mb-4">
                <p className="text-gray-700 leading-relaxed text-sm">
                  {mentorData?.bio ||
                    "An experienced mentor dedicated to helping students achieve their learning goals."}
                </p>
              </div>

              {/* Specialties */}
              <div>
                <h5 className="font-medium mb-2 text-gray-800">Specialties:</h5>
                <div className="flex flex-wrap gap-2">
                  {(
                    mentorData?.specialties || [
                      "Teaching",
                      "Mentoring",
                      "Professional Development",
                    ]
                  ).map((specialty, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                    >
                      {specialty}
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
                {courseData.relatedCourses.map((course, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-80 bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
                  >
                    <div className="relative">
                      <img
                        src={course.image}
                        alt={course.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3 bg-white bg-opacity-90 backdrop-blur-sm px-2 py-1 rounded-full">
                        <span className="text-sm font-bold text-gray-800">
                          ${course.price}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
                        {course.level}
                      </div>
                    </div>
                    <div className="p-6">
                      <h4 className="font-bold text-lg mb-2 text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {course.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        by {course.instructor}
                      </p>

                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-1">
                          {renderStars(course.rating)}
                          <span className="text-sm font-medium text-gray-700">
                            {course.rating}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({course.ratingsCount})
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {course.students} students
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <span>📚 {course.lectures} lectures</span>
                        <span>⏱️ {course.totalHours}h total</span>
                      </div>

                      <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
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
      {/* Header */}
      <header className="w-full bg-slate-800 text-white py-3 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h1
              className="text-lg font-bold cursor-pointer hover:text-gray-300 transition-colors"
              onClick={() => navigate("/home")}
            >
              MentorMe
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <span
              className="flex items-center space-x-2 cursor-pointer hover:text-gray-300 transition-colors"
              onClick={handleShowRatingPopup}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm">Provide Rating</span>
            </span>
          </div>
        </div>
      </header>

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

              {/* Progress Section - Only show if course is purchased */}
              {purchasedCourseData && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-blue-900">
                      Tiến độ học tập
                    </span>
                    <span className="text-sm font-bold text-blue-900">
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-3 mb-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>

                  <div className="flex gap-2">
                    {progress < 100 ? (
                      <>
                        <button
                          onClick={() =>
                            handleUpdateProgress(Math.min(progress + 25, 100))
                          }
                          className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        >
                          +25% Tiến độ
                        </button>
                        <button
                          onClick={handleCompleteCourse}
                          className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                        >
                          Hoàn thành khóa học
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 font-medium text-sm">
                          🎉 Khóa học đã hoàn thành!
                        </span>
                        <button className="text-xs px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition">
                          📜 Tải chứng chỉ
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

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