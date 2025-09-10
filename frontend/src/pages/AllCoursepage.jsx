import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import courseApi from "../api/modules/course.api";
import cartApi from "../api/modules/cart.api";
import purchasedCourseApi from "../api/modules/purchasedCourse.api";
import { toast } from "react-toastify";
import { showLoading, hideLoading } from "../redux/features/loading.slice";

const AllCoursePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);

  // --- AUTH CHECK (mentor và mentee đều được xem) ---
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
    // Check role - chỉ mentor và mentee được phép vào
    if (user.role === "mentor" || user.role === "mentee") {
      return;
    }
    // Nếu không phải mentor hoặc mentee, redirect về signin
    navigate("/auth/signin");
    return;
  }, [navigate]);

  // State management
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [selectedRating, setSelectedRating] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [searchTerm, setSearchTerm] = useState("");

  // Filter collapse states
  const [isRatingExpanded, setIsRatingExpanded] = useState(true);
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(true);
  const [isLevelsExpanded, setIsLevelsExpanded] = useState(true);
  const [isPriceExpanded, setIsPriceExpanded] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [coursesPerPage] = useState(9);

  // Helper function to check if course is already purchased
  const isCourseAlreadyPurchased = (courseId) => {
    return purchasedCourseApi.isCourseAlreadyPurchased(courseId);
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

    // Check if course is already purchased (sync check first for quick feedback)
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
          // Simply show the error message from backend
          const errorMessage =
            error.data?.message ||
            error.message ||
            "Failed to add course to cart";
          toast.error(errorMessage);
          return;
        }
      } catch (apiError) {
        // If it's a 400 error (business logic error), show message and don't fallback
        if (apiError.status === 400 || apiError.data?.status === 400) {
          const errorMessage =
            apiError.data?.message || apiError.message || "Bad request";
          toast.error(errorMessage);
          return;
        }

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
          image: course.image,
          mentor: course.mentor || "Unknown Mentor",
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

  // Fetch all courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all courses from backend API
        const { response, error } = await courseApi.getAllCourses({
          limit: 100, // Lấy nhiều courses cho AllCoursePage
          sortBy: "newest",
        });

        if (error) {
          console.error("API Error:", error);
          setError("Failed to load courses. Please try again later.");
          setCourses([]);
          setFilteredCourses([]);
        } else if (
          response &&
          response.data &&
          response.data.courses &&
          Array.isArray(response.data.courses)
        ) {
          // Backend trả về: { data: { courses: [...], total, totalPages, ... } }
          const coursesData = response.data.courses;

          // Transform API data to match expected frontend format
          const transformedCourses = coursesData.map((course, index) => ({
            id: course._id || course.courseId || index,
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
            reviewCount: course.ratingsCount || course.numberOfRatings || 0,
            studentCount: course.studentsCount || course.enrolledStudents || 0,
            price: parseFloat(course.price || 0),
            originalPrice: parseFloat(
              course.originalPrice || course.price || 0
            ),
            duration: `${
              course.duration || course.totalHours || 0
            } Total Hours`,
            lectures: course.lectures || course.totalLectures || 0,
            image:
              course.thumbnail || course.image || "/api/placeholder/300/200",
            description:
              course.description ||
              course.courseOverview ||
              "No description available",
            bestseller: course.bestseller || false,
            lastUpdated:
              course.updatedAt || course.createdAt || new Date().toISOString(),
            tags: course.tags || [],
            language: course.language || [],
            // Additional fields from backend
            mentorInfo: course.mentor || {},
            courseId: course._id || course.courseId,
          }));

          setCourses(transformedCourses);
          setFilteredCourses(transformedCourses);
          console.log(`Loaded ${transformedCourses.length} courses from API`);
        } else {
          console.warn("No courses data received from API", response);
          setCourses([]);
          setFilteredCourses([]);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Failed to load courses. Please try again later.");
        setCourses([]);
        setFilteredCourses([]);
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Dynamic filter options based on actual course data
  const categoryOptions = React.useMemo(() => {
    // Danh sách category đầy đủ như CreateCoursePage
    return [
      "Programming",
      "Design",
      "Business",
      "Marketing",
      "Photography",
      "Music",
      "Health & Fitness",
      "Language",
      "Academic",
      "Lifestyle",
    ];
  }, []);

  const levelOptions = React.useMemo(() => {
    const levels = [
      ...new Set(courses.map((course) => course.level).filter(Boolean)),
    ];
    return levels.length > 0
      ? levels.sort()
      : ["Beginner", "Intermediate", "Advanced", "Expert"];
  }, [courses]);

  const priceRanges = [
    { label: "Free", value: "free" },
    { label: "Under $50", value: "0-50" },
    { label: "$50 - $100", value: "50-100" },
    { label: "$100 - $200", value: "100-200" },
    { label: "Over $200", value: "200+" },
  ];

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedRating("");
    setSelectedCategories([]);
    setSelectedLevels([]);
    setSelectedPriceRange("");
    setSortBy("relevance");
    setSearchTerm("");
    setCurrentPage(1); // Reset to first page when clearing filters
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedRating) count++;
    if (selectedCategories.length > 0) count++;
    if (selectedLevels.length > 0) count++;
    if (selectedPriceRange) count++;
    if (searchTerm) count++;
    return count;
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return getActiveFilterCount() > 0;
  };

  // Fetch courses with filters from backend
  const fetchCoursesWithFilters = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters for backend filtering
      const params = {
        limit: 100,
        page: 1,
      };

      // Add search if exists
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      // Add rating filter
      if (selectedRating) {
        params.rate = selectedRating;
      }

      // Add sort options - map frontend values to backend values
      if (sortBy && sortBy !== "relevance") {
        switch (sortBy) {
          case "price-low":
            params.sortBy = "priceAsc";
            break;
          case "price-high":
            params.sortBy = "priceDesc";
            break;
          case "rating":
            params.sortBy = "rating";
            break;
          case "students":
            params.sortBy = "rating"; // Backend doesn't have students sort, use rating instead
            break;
          case "newest":
            params.sortBy = "newest";
            break;
          default:
            params.sortBy = sortBy;
        }
      }

      // Build filterBy object for complex filters
      const filters = {};

      if (selectedCategories.length > 0) {
        filters.category = selectedCategories[0]; // Backend chỉ hỗ trợ 1 category
      }

      if (selectedLevels.length > 0) {
        filters.level = selectedLevels[0]; // Backend chỉ hỗ trợ 1 level
      }

      // Price range filtering
      if (selectedPriceRange && selectedPriceRange !== "free") {
        const [min, max] = selectedPriceRange
          .split("-")
          .map((p) => p.replace("+", ""));
        if (min) filters.priceMin = parseInt(min);
        if (max && max !== min) filters.priceMax = parseInt(max);
        else if (selectedPriceRange.includes("+"))
          filters.priceMin = parseInt(min);
      } else if (selectedPriceRange === "free") {
        filters.priceMax = 0;
      }

      // Add filterBy to params if filters exist
      if (Object.keys(filters).length > 0) {
        params.filterBy = JSON.stringify(filters);
      }

      // Call API with filters
      const { response, error } = await courseApi.getAllCourses(params);

      if (error) {
        console.error("API Error:", error);
        setError("Failed to load courses. Please try again later.");
        setFilteredCourses([]);
      } else if (
        response &&
        response.data &&
        response.data.courses &&
        Array.isArray(response.data.courses)
      ) {
        const coursesData = response.data.courses;

        const transformedCourses = coursesData.map((course, index) => ({
          id: course._id || course.courseId || index,
          title: course.title || "Untitled Course",
          instructor:
            course.mentor?.userName || course.mentor?.firstName
              ? `${course.mentor.firstName || ""} ${
                  course.mentor.lastName || ""
                }`.trim()
              : "Unknown Instructor",
          category: course.category || "General",
          level: course.level || "Beginner",
          rating: parseFloat(course.rate || course.rating || 0),
          reviewCount: course.ratingsCount || course.numberOfRatings || 0,
          studentCount: course.studentsCount || course.enrolledStudents || 0,
          price: parseFloat(course.price || 0),
          originalPrice: parseFloat(course.originalPrice || course.price || 0),
          duration: `${course.duration || course.totalHours || 0} Total Hours`,
          lectures: course.lectures || course.totalLectures || 0,
          image: course.thumbnail || course.image || "/api/placeholder/300/200",
          description:
            course.description ||
            course.courseOverview ||
            "No description available",
          bestseller: course.bestseller || false,
          lastUpdated:
            course.updatedAt || course.createdAt || new Date().toISOString(),
          tags: course.tags || [],
          language: course.language || [],
          mentorInfo: course.mentor || {},
          courseId: course._id || course.courseId,
        }));

        setFilteredCourses(transformedCourses);
        console.log(`Filtered to ${transformedCourses.length} courses`);
      } else {
        setFilteredCourses([]);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching filtered courses:", err);
      setError("Failed to load courses. Please try again later.");
      setFilteredCourses([]);
      setLoading(false);
    }
  };

  // Bỏ tự động lọc khi thay đổi filter, chỉ lọc khi bấm nút Filter

  // Pagination logic
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = filteredCourses.slice(
    indexOfFirstCourse,
    indexOfLastCourse
  );
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);

  // Navigate to course detail
  const handleViewCourse = (courseId) => {
    // TODO: Navigate to course detail page when route is ready
    // navigate(`/course/${courseId}`);
    console.log(`Navigate to course detail: ${courseId}`);
  };

  // TODO: Implement category filter toggle
  const toggleCategoryFilter = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // TODO: Implement level filter toggle
  const toggleLevelFilter = (level) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  // Scroll to top when currentPage changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                All Courses
              </h1>
              <p className="text-gray-600">Discover and learn new skills</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-gray-600">
                {filteredCourses.length} courses found
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Sort by</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="relevance">Relevance</option>
                  <option value="rating">Highest Rating</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="students">Most Students</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Filters */}
          <div className="lg:w-1/4">
            <div
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8"
              style={{ height: "80vh", overflowY: "auto" }}
            >
              {/* Filter Button */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <button
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    onClick={fetchCoursesWithFilters}
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
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                      />
                    </svg>
                    <span className="text-sm font-medium">Filter</span>
                  </button>
                  {getActiveFilterCount() > 0 && (
                    <span className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                      {getActiveFilterCount()}
                    </span>
                  )}
                </div>
                {hasActiveFilters() && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Search Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Courses
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by title, instructor, category..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg
                    className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-6">
                <h3
                  className="font-semibold text-gray-900 mb-3 flex items-center justify-between cursor-pointer"
                  onClick={() => setIsRatingExpanded(!isRatingExpanded)}
                >
                  <span>Rating</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isRatingExpanded ? "rotate-180" : ""
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
                </h3>
                {isRatingExpanded && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 italic">
                      Rating filter coming soon...
                    </p>
                    {/* Temporarily disabled - backend doesn't support rating filter yet */}
                  </div>
                )}
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h3
                  className="font-semibold text-gray-900 mb-3 flex items-center justify-between cursor-pointer"
                  onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
                >
                  <span>Category</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isCategoriesExpanded ? "rotate-180" : ""
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
                </h3>
                {isCategoriesExpanded && (
                  <div className="space-y-2">
                    {categoryOptions.map((category) => (
                      <label key={category} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => toggleCategoryFilter(category)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">
                          {category}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Level Filter */}
              <div className="mb-6">
                <h3
                  className="font-semibold text-gray-900 mb-3 flex items-center justify-between cursor-pointer"
                  onClick={() => setIsLevelsExpanded(!isLevelsExpanded)}
                >
                  <span>Level</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isLevelsExpanded ? "rotate-180" : ""
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
                </h3>
                {isLevelsExpanded && (
                  <div className="space-y-2">
                    {levelOptions.map((level) => (
                      <label key={level} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedLevels.includes(level)}
                          onChange={() => toggleLevelFilter(level)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{level}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Range Filter */}
              <div className="mb-6">
                <h3
                  className="font-semibold text-gray-900 mb-3 flex items-center justify-between cursor-pointer"
                  onClick={() => setIsPriceExpanded(!isPriceExpanded)}
                >
                  <span>Price</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isPriceExpanded ? "rotate-180" : ""
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
                </h3>
                {isPriceExpanded && (
                  <div className="space-y-2">
                    {priceRanges.map((range) => (
                      <label key={range.value} className="flex items-center">
                        <input
                          type="radio"
                          name="priceRange"
                          value={range.value}
                          checked={selectedPriceRange === range.value}
                          onChange={(e) =>
                            setSelectedPriceRange(e.target.value)
                          }
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">
                          {range.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:w-3/4">
            {/* Courses Grid */}
            {currentCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8 auto-rows-max">
                {currentCourses.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => navigate(`/course-detail/${course.id}`)}
                    className="course-card bg-white rounded-xl border border-gray-200 shadow-lg flex flex-col w-full transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer overflow-hidden"
                    style={{
                      textDecoration: "none",
                      minHeight: "450px",
                    }}
                  >
                    <div className="h-[140px] w-full bg-white-100 rounded-t-xl flex items-center justify-center">
                      <img
                        src={course.image}
                        alt={course.title}
                        className="object-cover h-[120px] w-[92%] rounded-xl"
                        style={{ marginTop: "4px", marginBottom: "4px" }}
                      />
                      {course.bestseller && (
                        <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                          Bestseller
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col px-5 py-4 flex-1">
                      <div
                        className="font-bold text-[18px] text-gray-900 mb-2 leading-tight"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {course.title}
                      </div>
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
                      <div
                        className="text-sm text-gray-700 mb-2"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {course.duration} • {course.lectures} Lectures •{" "}
                        {course.category}
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
                            {course.language.slice(0, 2).map((lang, index) => (
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
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No courses found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search criteria or clearing some filters.
                </p>
                {hasActiveFilters() && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-8">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
                >
                  <svg
                    className="w-5 h-5"
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

                {/* Show pagination numbers intelligently */}
                {(() => {
                  const pages = [];
                  const showPages = 5; // Show 5 page numbers at most
                  let startPage = Math.max(
                    1,
                    currentPage - Math.floor(showPages / 2)
                  );
                  let endPage = Math.min(totalPages, startPage + showPages - 1);

                  // Adjust start if we're near the end
                  if (endPage - startPage < showPages - 1) {
                    startPage = Math.max(1, endPage - showPages + 1);
                  }

                  // Show first page if not visible
                  if (startPage > 1) {
                    pages.push(
                      <button
                        key={1}
                        onClick={() => setCurrentPage(1)}
                        className="flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        1
                      </button>
                    );
                    if (startPage > 2) {
                      pages.push(
                        <span
                          key="ellipsis1"
                          className="flex items-center justify-center w-10 h-10 text-gray-500"
                        >
                          ...
                        </span>
                      );
                    }
                  }

                  // Show page numbers
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`flex items-center justify-center w-10 h-10 text-sm font-medium rounded-md transition-colors ${
                          currentPage === i
                            ? "text-white bg-blue-600 border border-blue-600"
                            : "text-gray-700 bg-white hover:bg-gray-50"
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }

                  // Show last page if not visible
                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pages.push(
                        <span
                          key="ellipsis2"
                          className="flex items-center justify-center w-10 h-10 text-gray-500"
                        >
                          ...
                        </span>
                      );
                    }
                    pages.push(
                      <button
                        key={totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                        className="flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        {totalPages}
                      </button>
                    );
                  }

                  return pages;
                })()}

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <svg
                    className="w-5 h-5"
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllCoursePage;
