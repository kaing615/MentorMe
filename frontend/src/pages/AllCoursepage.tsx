import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import courseApi from "../api/modules/course.api";
import cartApi from "../api/modules/cart.api";
import purchasedCourseApi from "../api/modules/purchasedCourse.api";
import { hasUserRole } from "../utils/user-role";
import { formatVnd } from "../utils/currency";
import { toast } from "react-toastify";
import { showLoading, hideLoading } from "../redux/features/loading.slice";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconFilter,
  IconSearch,
} from "@tabler/icons-react";
import OipImg from "../assets/OIP.webp";

const AllCoursePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.user);

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
    if (hasUserRole(user, "mentor") || hasUserRole(user, "mentee")) {
      return;
    }
    // Nếu không phải mentor hoặc mentee, redirect về signin
    navigate("/auth/signin");
    return;
  }, [navigate]);

  // State management
  const [courses, setCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState<any>(true);
  const [error, setError] = useState<any>(null);

  // State để lưu purchased courses mapping
  const [purchasedCoursesMap, setPurchasedCoursesMap] = useState<any>(new Map());

  // Filter states
  const [selectedRating, setSelectedRating] = useState<any>("");
  const [selectedCategories, setSelectedCategories] = useState<any[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<any[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<any>("");
  const [sortBy, setSortBy] = useState<any>("relevance");
  const [searchTerm, setSearchTerm] = useState<any>("");

  // Filter collapse states
  const [isRatingExpanded, setIsRatingExpanded] = useState<any>(true);
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState<any>(true);
  const [isLevelsExpanded, setIsLevelsExpanded] = useState<any>(true);
  const [isPriceExpanded, setIsPriceExpanded] = useState<any>(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<any>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState<any>(1);
  const [coursesPerPage] = useState<any>(9);

  // Helper function to check if course is already purchased
  const isCourseAlreadyPurchased = (courseId) => {
    // Check from API-based purchasedCoursesMap (Course.mentees array check)
    return (
      purchasedCoursesMap.has(courseId) && purchasedCoursesMap.get(courseId)
    );
  };

  // Helper function để lấy purchasedCourseId nếu course đã được mua
  const getPurchasedCourseId = (courseId) => {
    return purchasedCoursesMap.get(courseId) || null;
  };

  // Smart navigation function cho purchased courses
  const handleSmartViewCourse = (course) => {
    const courseId = course._id || course.id;
    const purchasedCourseId = getPurchasedCourseId(courseId);

    if (purchasedCourseId) {
      // NEW: Navigate với purchasedCourseId (course đã mua)
      navigate(`/order-complete-course/${purchasedCourseId}`, {
        state: {
          purchasedCourseId: purchasedCourseId,
          courseId: courseId,
          courseInfo: course,
        },
      });
    } else {
      // LEGACY: Navigate với courseId (course chưa mua hoặc legacy)
      console.log(`🔄 Navigating to legacy course: ${courseId}`);
      navigate(`/order-complete-course/${courseId}`, {
        state: {
          courseId: courseId,
          courseInfo: course,
          isLegacyCourse: true,
        },
      });
    }
  };

  // Add to Cart function
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

  // Buy Now function
  const handleBuyNow = async (e, course) => {
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

    dispatch(showLoading());
    const { response, error } = await cartApi.addToCart(
      { courseId },
      dispatch,
    );
    dispatch(hideLoading());
    if (error || !response) {
      toast.error("Failed to add course to cart");
      return;
    }
    navigate("/shoppingcart");
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
              course.thumbnail || course.image,
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
  }, [user, dispatch]);

  // Separate useEffect for checking purchase status when courses load
  useEffect(() => {
    const fetchPurchasedCourses = async () => {
      // Chỉ fetch purchased courses nếu user là mentee
      if (!hasUserRole(user, "mentee")) {
        return;
      }

      // Check purchase status for displayed courses
      if (courses.length > 0) {
        const statusMap = new Map();

        await Promise.all(
          courses.map(async (course) => {
            const courseId = course._id || course.id || course.courseId;
            if (courseId) {
              try {
                const { response, error } = await courseApi.checkPurchaseStatus(
                  courseId
                );
                if (response?.data?.isPurchased) {
                  statusMap.set(courseId, true);
                }
              } catch (error) {
                console.error(
                  `Error checking purchase status for course ${courseId}:`,
                  error
                );
              }
            }
          })
        );

        setPurchasedCoursesMap(statusMap);
        console.log("Purchase status checked for", statusMap.size, "courses");
      }
    };

    fetchPurchasedCourses();
  }, [user, courses]); // Depend on courses to check when they are loaded

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
    { label: "Under 100.000 ₫", value: "0-100000" },
    { label: "100.000 ₫ - 300.000 ₫", value: "100000-300000" },
    { label: "300.000 ₫ - 500.000 ₫", value: "300000-500000" },
    { label: "Over 500.000 ₫", value: "500000+" },
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
      const params: any = {
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
      const filters: any = {};

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
          image: course.thumbnail || course.image,
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
      <div className="min-h-[100dvh] bg-[var(--ui-page)] px-4 py-10" aria-live="polite">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 h-10 w-56 animate-pulse rounded-xl bg-[var(--ui-surface-muted)]" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="overflow-hidden rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4">
                <div className="aspect-[16/9] animate-pulse rounded-xl bg-[var(--ui-surface-muted)]" />
                <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-[var(--ui-surface-muted)]" />
                <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-[var(--ui-surface-muted)]" />
              </div>
            ))}
          </div>
          <p className="sr-only">Loading courses</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center bg-[var(--ui-page)] px-4">
        <div className="max-w-md rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Courses unavailable</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-[var(--ui-accent)] px-5 py-3 font-bold text-white hover:bg-[var(--ui-accent-strong)]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--ui-page)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-extrabold tracking-[-0.035em] text-[var(--ui-text)]">
                All Courses
              </h1>
              <p className="text-gray-600">Discover and learn new skills</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:flex sm:items-center sm:gap-4">
              <p className="text-gray-600">
                {filteredCourses.length} courses found
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Sort by</span>
                <select
                  aria-label="Sort courses"
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

        <button
          type="button"
          aria-controls="course-filters"
          aria-expanded={mobileFiltersOpen}
          onClick={() => setMobileFiltersOpen((open) => !open)}
          className="mb-5 inline-flex min-h-11 w-full items-center justify-between rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--ui-text)] lg:hidden"
        >
          <span>Course filters</span>
          <span>{getActiveFilterCount() ? `${getActiveFilterCount()} active` : mobileFiltersOpen ? "Close" : "Open"}</span>
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Filters */}
          <div
            id="course-filters"
            className={`${mobileFiltersOpen ? "block" : "hidden"} lg:block lg:w-1/4`}
          >
            <div
              className="max-h-[70dvh] overflow-y-auto rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-6 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)]"
            >
              {/* Filter Button */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <button
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    onClick={fetchCoursesWithFilters}
                  >
                    <IconFilter aria-hidden="true" size={17} stroke={1.8} />
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
                    aria-label="Search courses"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by title, instructor, category..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <IconSearch aria-hidden="true" className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" stroke={1.8} />
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-6">
                <h3
                  className="font-semibold text-gray-900 mb-3 flex items-center justify-between cursor-pointer"
                  onClick={() => setIsRatingExpanded(!isRatingExpanded)}
                >
                  <span>Rating</span>
                  <IconChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${isRatingExpanded ? "rotate-180" : ""}`} stroke={1.8} />
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
                  <IconChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${isCategoriesExpanded ? "rotate-180" : ""}`} stroke={1.8} />
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
                  <IconChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${isLevelsExpanded ? "rotate-180" : ""}`} stroke={1.8} />
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
                  <IconChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${isPriceExpanded ? "rotate-180" : ""}`} stroke={1.8} />
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
          <div className="min-w-0 lg:w-3/4">
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
                    <div className="h-[140px] w-full bg-white-100 rounded-t-xl flex items-center justify-center relative">
                      <img
                        src={course.image}
                        alt={course.title}
                        className="object-cover h-[120px] w-[92%] rounded-xl"
                        style={{ marginTop: "4px", marginBottom: "4px" }}
                        onError={(event) => {
                          event.currentTarget.src = OipImg;
                        }}
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
                            {Number(course.rate || 0).toFixed(1)} / 5
                          </span>
                        ))}
                        <span className="text-sm text-gray-700 ml-2">
                          ({course.reviewCount || 0} Ratings)
                        </span>
                      </div>
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
                        {formatVnd(Number(course.price) || 0)}
                      </div>

                      {/* Add to Cart and Buy Now buttons for mentees */}
                      {hasUserRole(user, "mentee") && (
                        <div className="flex flex-col gap-2 mt-3 mb-3 px-4">
                          {isCourseAlreadyPurchased(course.id) ? (
                            <>
                              <div className="w-full bg-green-100 text-green-700 py-2 px-3 rounded-md text-sm font-medium text-center">
                                Already Purchased
                              </div>
                              <button
                                className="w-full bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-700 transition"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSmartViewCourse(course);
                                }}
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
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-sm font-medium text-gray-900">
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
                  <IconChevronLeft aria-hidden="true" size={20} stroke={1.8} />
                </button>

                {/* Show pagination numbers intelligently */}
                {(() => {
                  const pages = [];
                  const showPages = 5; // Show 5 page numbers at most
                  let startPage = Math.max(
                    1,
                    currentPage - Math.floor(showPages / 2)
                  );
                  const endPage = Math.min(totalPages, startPage + showPages - 1);

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
                  <IconChevronRight aria-hidden="true" size={20} stroke={1.8} />
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
