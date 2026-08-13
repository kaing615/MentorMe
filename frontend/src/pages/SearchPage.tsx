import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import courseApi from "../api/modules/course.api";
import profileApi from "../api/modules/profile.api";
import cartApi from "../api/modules/cart.api";
import reviewApi from "../api/modules/review.api";
import { hasUserRole } from "../utils/user-role";
import { formatVnd, parseVndPriceRange } from "../utils/currency";
import { toast } from "react-toastify";
import { showLoading, hideLoading } from "../redux/features/loading.slice";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconFilter,
  IconSearch,
} from "@tabler/icons-react";

// Fallback images
import oipImg from "../assets/OIP.webp";
import { getLoginPath } from "../utils/auth-return";

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.user);

  // Tab state - khôi phục tab cuối cùng từ localStorage
  const [activeTab, setActiveTab] = useState<any>(() => {
    if (searchParams.get("category")) return "courses";
    const savedTab = localStorage.getItem("searchPageActiveTab");
    return savedTab || "courses";
  });

  // Courses state
  const [courses, setCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState<any>(true);
  const [purchasedCoursesMap, setPurchasedCoursesMap] = useState<any>(new Map());

  // Mentors state
  const [mentors, setMentors] = useState<any[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<any[]>([]);
  const [mentorsLoading, setMentorsLoading] = useState<any>(true);

  // Common states
  const [error, setError] = useState<any>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState<any>("");
  const [selectedCategories, setSelectedCategories] = useState<any[]>(() => {
    const category = searchParams.get("category");
    return category ? [category] : [];
  });
  const [selectedLevels, setSelectedLevels] = useState<any[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<any>("");
  const [selectedRating, setSelectedRating] = useState<any>("");
  const [sortBy, setSortBy] = useState<any>("relevance");

  // Mentor-specific filter states
  const [selectedMentorCategories, setSelectedMentorCategories] = useState<any[]>([]);
  const [selectedMentorRating, setSelectedMentorRating] = useState<any>("");
  const [selectedLanguages, setSelectedLanguages] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<any[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<any[]>([]);

  // Filter application control
  const [pendingFilters, setPendingFilters] = useState<any>(false);

  // Filter collapse states
  const [isRatingExpanded, setIsRatingExpanded] = useState<any>(true);
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState<any>(true);
  const [isLevelsExpanded, setIsLevelsExpanded] = useState<any>(true);
  const [isPriceExpanded, setIsPriceExpanded] = useState<any>(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<any>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState<any>(1);
  const [itemsPerPage] = useState<any>(9);

  // Lưu activeTab vào localStorage và cuộn lên đầu trang khi component mount
  useEffect(() => {
    window.scrollTo(0, 0); // Cuộn lên đầu trang khi component mount
  }, []); // Chỉ chạy 1 lần khi component mount

  // Lưu activeTab vào localStorage khi thay đổi
  useEffect(() => {
    localStorage.setItem("searchPageActiveTab", activeTab);
  }, [activeTab]);

  // Helper function để chuyển tab và cuộn lên đầu
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" }); // Cuộn mượt lên đầu trang
  };

  // Helper functions với error handling cải thiện
  const computeMentorStats = async (mentorId) => {
    if (!mentorId) {
      return { totalMentees: 0, totalReviews: 0, averageRating: 0 };
    }

    // 1) Lấy toàn bộ khóa học của mentor để suy ra mentee (unique)
    const menteeSet = new Set();
    try {
      const coursesRes = await Promise.race([
        courseApi.getCoursesByMentor(mentorId),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 3000)
        ),
      ]);

      const courses = Array.isArray(coursesRes) ? coursesRes : [];
      courses.forEach((c) => {
        // Count reported enrolments when the API does not expose mentee IDs.
        if (c.studentsCount || c.enrolledStudents) {
          const count = c.studentsCount || c.enrolledStudents || 0;
          for (let i = 0; i < count; i++) {
            menteeSet.add(`${c._id}_${i}`);
          }
        }

        // Fallback: nếu có mentees array
        if (Array.isArray(c?.mentees)) {
          c.mentees.forEach((m) => {
            const id = typeof m === "string" ? m : m?._id || m?.id;
            if (id) menteeSet.add(id);
          });
        }
      });
    } catch (error) {
      console.log(
        `Error fetching courses for mentor ${mentorId}:`,
        error.message
      );
    }

    // 2) Lấy reviews (course + booking) rồi tính trung bình như HomeScreen
    let allReviews = [];
    try {
      const { response: cr } = await reviewApi.getMentorCourseReviews(mentorId);
      const courseReviews = cr?.data?.items || [];
      allReviews = allReviews.concat(courseReviews);
    } catch (_) {}
    try {
      const { response: br } = await reviewApi.getBookingReviews(mentorId);
      const bookingReviews = br?.data?.items || [];
      allReviews = allReviews.concat(bookingReviews);
    } catch (_) {}

    const totalReviews = allReviews.length;
    const averageRating = totalReviews
      ? Math.round(
          (allReviews.reduce((s, r) => s + (Number(r.rate) || 0), 0) /
            totalReviews) *
            10
        ) / 10
      : 0;

    return {
      totalMentees: menteeSet.size,
      totalReviews,
      averageRating,
    };
  };
  const isCourseAlreadyPurchased = (courseId) => {
    return (
      purchasedCoursesMap.has(courseId) && purchasedCoursesMap.get(courseId)
    );
  };

  const getPurchasedCourseId = (courseId) => {
    return purchasedCoursesMap.get(courseId) || null;
  };

  const handleSmartViewCourse = (course) => {
    const courseId = course._id || course.id;
    const purchasedCourseId = getPurchasedCourseId(courseId);

    if (purchasedCourseId) {
      navigate(`/order-complete-course/${purchasedCourseId}`, {
        state: {
          purchasedCourseId: purchasedCourseId,
          courseId: courseId,
          courseInfo: course,
        },
      });
    } else {
      navigate(`/order-complete-course/${courseId}`, {
        state: {
          courseId: courseId,
          courseInfo: course,
          isLegacyCourse: true,
        },
      });
    }
  };

  const handleAddToCart = async (e, course) => {
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to add courses to cart");
      navigate(getLoginPath(window.location.pathname));
      return;
    }

    if (!hasUserRole(user, "mentee")) {
      toast.error("Only mentees can purchase courses");
      return;
    }

    const courseId = course._id || course.id;

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

  const handleBuyNow = (e, course) => {
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to purchase courses");
      navigate(getLoginPath(window.location.pathname));
      return;
    }

    if (!hasUserRole(user, "mentee")) {
      toast.error("Only mentees can purchase courses");
      return;
    }

    const courseId = course._id || course.id;

    if (isCourseAlreadyPurchased(courseId)) {
      toast.info(
        "You have already purchased this course! Check 'My Courses' in your profile."
      );
      return;
    }

    dispatch(showLoading());
    setTimeout(() => {
      navigate(`/shoppingcart`);
    }, 300);
  };

  const handleMentorClick = (mentorId) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate(`/mentor/${mentorId}`);
  };

  // Filter options
  const categoryOptions = [
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

  const levelOptions = ["Beginner", "Intermediate", "Advanced", "Expert"];

  const priceRanges = [
    { label: "Free", value: "free" },
    { label: "Under 500,000 ₫", value: "0-500000" },
    { label: "500,000 ₫ - 1,000,000 ₫", value: "500000-1000000" },
    { label: "1,000,000 ₫ - 2,000,000 ₫", value: "1000000-2000000" },
    { label: "Over 2,000,000 ₫", value: "2000000+" },
  ];

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedRating("");
    setSelectedCategories([]);
    setSelectedLevels([]);
    setSelectedPriceRange("");
    setSortBy("relevance");
    setSearchTerm("");
    // Mentor filters
    setSelectedMentorCategories([]);
    setSelectedMentorRating("");
    setSelectedLanguages([]);
    setSelectedTags([]);
    setSelectedSkills([]);
    setCurrentPage(1);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchTerm) count++;

    if (activeTab === "courses") {
      if (selectedRating) count++;
      if (selectedCategories.length > 0) count++;
      if (selectedLevels.length > 0) count++;
      if (selectedPriceRange) count++;
      if (selectedLanguages.length > 0) count++;
      if (selectedTags.length > 0) count++;
    } else {
      if (selectedMentorRating) count++;
      if (selectedMentorCategories.length > 0) count++;
      if (selectedSkills.length > 0) count++;
    }

    return count;
  };
  const hasActiveFilters = () => {
    return getActiveFilterCount() > 0;
  };

  const toggleCategoryFilter = (category) => {
    if (activeTab === "courses") {
      setSelectedCategories((prev) =>
        prev.includes(category)
          ? prev.filter((c) => c !== category)
          : [...prev, category]
      );
    } else {
      setSelectedMentorCategories((prev) =>
        prev.includes(category)
          ? prev.filter((c) => c !== category)
          : [...prev, category]
      );
    }
  };

  const toggleLevelFilter = (level) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const toggleLanguageFilter = (language) => {
    setSelectedLanguages((prev) =>
      prev.includes(language)
        ? prev.filter((l) => l !== language)
        : [...prev, language]
    );
  };

  const toggleTagFilter = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleSkillFilter = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  // Fetch courses
  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      setError(null);

      const params: any = {
        limit: 50,
        page: 1,
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      if (selectedRating) {
        params.rate = selectedRating;
      }

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
          case "newest":
            params.sortBy = "newest";
            break;
          default:
            params.sortBy = sortBy;
        }
      }

      const filters: any = {};

      if (selectedCategories.length > 0) {
        filters.category = selectedCategories[0];
      }

      if (selectedLevels.length > 0) {
        filters.level = selectedLevels[0];
      }

      const priceRange = parseVndPriceRange(selectedPriceRange);
      if (priceRange.min !== undefined) filters.priceMin = priceRange.min;
      if (priceRange.max !== undefined) filters.priceMax = priceRange.max;

      if (Object.keys(filters).length > 0) {
        params.filterBy = JSON.stringify(filters);
      }

      let response;
      let coursesData = [];

      try {
        const result = await courseApi.getAllCourses(params);
        response = result.response;

        if (result.error) {
          throw new Error(result.error.message || "API failed");
        }

        if (
          response &&
          response.data &&
          response.data.courses &&
          Array.isArray(response.data.courses)
        ) {
          coursesData = response.data.courses;
        } else {
          throw new Error("Invalid response format");
        }
      } catch (apiError) {
        console.error("API Error:", apiError);
        coursesData = [];
      }

      const transformedCourses = coursesData.map((course, index) => ({
        id: course._id || course.courseId || index,
        title: course.title || "Untitled Course",
        instructor:
          course.mentor?.userName ||
          (course.mentor?.firstName
            ? `${course.mentor.firstName} ${course.mentor.lastName}`.trim()
            : "Unknown Instructor"),
        category: course.category || "General",
        level: course.level || "Beginner",
        rating: parseFloat(course.rate || course.rating || 0),
        reviewCount: course.ratingsCount || course.numberOfRatings || 0,
        studentCount: course.studentsCount || course.enrolledStudents || 0,
        price: parseFloat(course.price || 0),
        originalPrice: parseFloat(course.originalPrice || course.price || 0),
        duration: `${course.duration || course.totalHours || 0} Total Hours`,
        lectures: course.lectures || course.totalLectures || 0,
        image: course.thumbnail || course.image || oipImg,
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

      setCourses(transformedCourses);
      setFilteredCourses(transformedCourses);
      setCoursesLoading(false);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError("Failed to load courses. Please try again later.");
      setFilteredCourses([]);
      setCoursesLoading(false);
    }
  };

  // Fetch mentors
  const fetchMentors = async () => {
    try {
      setMentorsLoading(true);
      setError(null);

      // Sử dụng getTopMentors với limit cao để lấy tất cả mentors
      let response;
      let raw = [];

      try {
        response = await profileApi.getTopMentors(100);
        raw = response?.data?.mentors || [];
      } catch (apiError) {
        console.error("API error:", apiError);
        raw = [];
      }

      // Filter mentors dựa trên searchTerm nếu có
      let filteredRaw = raw;
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filteredRaw = raw.filter((mentor) => {
          const name = (
            mentor.fullName ||
            `${mentor.firstName || ""} ${mentor.lastName || ""}`
          ).toLowerCase();
          const jobTitle = (mentor.jobTitle || "").toLowerCase();
          const category = (mentor.category || "").toLowerCase();
          return (
            name.includes(searchLower) ||
            jobTitle.includes(searchLower) ||
            category.includes(searchLower)
          );
        });
      }

      setMentors(filteredRaw);
      setFilteredMentors(filteredRaw);
      setMentorsLoading(false);
    } catch (error) {
      console.error("Error fetching mentors:", error);
      setError("Failed to load mentors. Please try again later.");
      setMentors([]);
      setFilteredMentors([]);
      setMentorsLoading(false);
    }
  };

  // Fetch purchased courses for smart navigation
  useEffect(() => {
    const fetchPurchasedCourses = async () => {
      if (!hasUserRole(user, "mentee")) return;

      if (courses.length > 0) {
        const statusMap = new Map();

        await Promise.all(
          courses.map(async (course) => {
            const courseId = course._id || course.id || course.courseId;
            if (courseId) {
              try {
                const { response } = await courseApi.checkPurchaseStatus(
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
      }
    };

    fetchPurchasedCourses();
  }, [user, courses]);

  // Only apply sort when it changes (not other filters)
  useEffect(() => {
    if (activeTab === "courses") {
      applyCoursesFilter();
    } else {
      applyMentorsFilter();
    }
  }, [sortBy, activeTab, courses, mentors]); // Only re-run when sort or data changes

  // Apply filters for courses
  const applyCoursesFilter = () => {
    if (!courses.length) return;

    let filtered = [...courses];

    // Search filter - tìm kiếm trong title, category, tags, language, level, instructor
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((course) => {
        const title = (course.title || "").toLowerCase();
        const category = (course.category || "").toLowerCase();
        const level = (course.level || "").toLowerCase();
        const instructor = (course.instructor || "").toLowerCase();
        const tags = (course.tags || []).join(" ").toLowerCase();
        const languages = (course.language || []).join(" ").toLowerCase();
        const description = (course.description || "").toLowerCase();

        return (
          title.includes(searchLower) ||
          category.includes(searchLower) ||
          level.includes(searchLower) ||
          instructor.includes(searchLower) ||
          tags.includes(searchLower) ||
          languages.includes(searchLower) ||
          description.includes(searchLower)
        );
      });
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((course) =>
        selectedCategories.includes(course.category)
      );
    }

    // Level filter
    if (selectedLevels.length > 0) {
      filtered = filtered.filter((course) =>
        selectedLevels.includes(course.level)
      );
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((course) =>
        selectedTags.some((tag) => course.tags?.includes(tag))
      );
    }

    // Language filter
    if (selectedLanguages.length > 0) {
      filtered = filtered.filter((course) =>
        selectedLanguages.some((lang) => course.language?.includes(lang))
      );
    }

    // Price range filter
    if (selectedPriceRange) {
      const { min = 0, max } = parseVndPriceRange(selectedPriceRange);
      filtered = filtered.filter((course) => {
        const price = course.price || 0;
        return price >= min && (max === undefined || price <= max);
      });
    }

    // Rating filter
    if (selectedRating) {
      const minRating = parseFloat(selectedRating);
      filtered = filtered.filter((course) => course.rating >= minRating);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "price-low":
          return (a.price || 0) - (b.price || 0);
        case "price-high":
          return (b.price || 0) - (a.price || 0);
        case "newest":
          return new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime();
        default:
          return 0;
      }
    });

    setFilteredCourses(filtered);
    setCurrentPage(1);
  };

  // Apply filters for mentors
  const applyMentorsFilter = () => {
    if (!mentors.length) return;

    let filtered = [...mentors];

    // Search filter - tìm kiếm trong name, jobTitle, category, skills
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((mentor) => {
        const name = (
          mentor.fullName ||
          `${mentor.firstName || ""} ${mentor.lastName || ""}`
        ).toLowerCase();
        const jobTitle = (mentor.jobTitle || "").toLowerCase();
        const category = (mentor.category || "").toLowerCase();
        const email = (mentor.email || "").toLowerCase();
        const bio = (mentor.bio || mentor.about || "").toLowerCase();
        const skills = (mentor.skills || []).join(" ").toLowerCase();

        return (
          name.includes(searchLower) ||
          jobTitle.includes(searchLower) ||
          category.includes(searchLower) ||
          email.includes(searchLower) ||
          bio.includes(searchLower) ||
          skills.includes(searchLower)
        );
      });
    } // Category filter for mentors
    if (selectedMentorCategories.length > 0) {
      filtered = filtered.filter((mentor) => {
        const category = mentor.category || "";
        return selectedMentorCategories.some((cat) =>
          category.toLowerCase().includes(cat.toLowerCase())
        );
      });
    }

    // Skills filter for mentors
    if (selectedSkills.length > 0) {
      filtered = filtered.filter((mentor) => {
        const mentorSkills = mentor.skills || [];
        return selectedSkills.some((skill) =>
          mentorSkills.some((mentorSkill) =>
            mentorSkill.toLowerCase().includes(skill.toLowerCase())
          )
        );
      });
    }

    // Rating filter for mentors
    if (selectedMentorRating) {
      const minRating = parseFloat(selectedMentorRating);
      filtered = filtered.filter(
        (mentor) => (mentor.averageRating || 0) >= minRating
      );
    }

    // Sorting for mentors
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.averageRating || 0) - (a.averageRating || 0);
        case "students":
          return (b.totalMentees || 0) - (a.totalMentees || 0);
        case "reviews":
          return (b.totalReviews || 0) - (a.totalReviews || 0);
        default:
          return 0;
      }
    });

    setFilteredMentors(filtered);
    setCurrentPage(1);
  };

  // Initial data fetch
  useEffect(() => {
    fetchCourses();
    fetchMentors();
  }, []);

  // Apply filters
  const applyFilters = () => {
    if (activeTab === "courses") {
      applyCoursesFilter();
    } else {
      applyMentorsFilter();
    }
    setCurrentPage(1);
  };

  // Pagination logic
  const currentItems =
    activeTab === "courses" ? filteredCourses : filteredMentors;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedItems = currentItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(currentItems.length / itemsPerPage);

  // Scroll to top when currentPage changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  if (coursesLoading && mentorsLoading) {
    return (
      <div className="min-h-[100dvh] bg-[var(--ui-page)] px-4 py-10" aria-live="polite">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 h-10 w-64 animate-pulse rounded-xl bg-[var(--ui-surface-muted)]" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4">
                <div className="aspect-[16/9] animate-pulse rounded-xl bg-[var(--ui-surface-muted)]" />
                <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-[var(--ui-surface-muted)]" />
                <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-[var(--ui-surface-muted)]" />
              </div>
            ))}
          </div>
          <p className="sr-only">Loading search results</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--ui-page)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div role="status" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-extrabold tracking-[-0.035em] text-[var(--ui-text)]">
                Search Results
              </h1>
              <p className="text-gray-600">Discover courses and mentors</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:flex sm:items-center sm:gap-4">
              <p className="text-gray-600">
                {currentItems.length} {activeTab} found
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Sort by</span>
                <select
                  aria-label="Sort search results"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="relevance">Relevance</option>
                  <option value="rating">Highest Rating</option>
                  {activeTab === "courses" ? (
                    <>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="newest">Newest</option>
                    </>
                  ) : (
                    <>
                      <option value="students">Most Students</option>
                      <option value="reviews">Most Reviews</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange("courses")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "courses"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                All Courses ({filteredCourses.length})
              </button>
              <button
                onClick={() => handleTabChange("mentors")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "mentors"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Mentors ({filteredMentors.length})
              </button>
            </nav>
          </div>
        </div>

        <button
          type="button"
          aria-controls="search-filters"
          aria-expanded={mobileFiltersOpen}
          onClick={() => setMobileFiltersOpen((open) => !open)}
          className="mb-5 inline-flex min-h-11 w-full items-center justify-between rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--ui-text)] lg:hidden"
        >
          <span>Search filters</span>
          <span>{getActiveFilterCount() ? `${getActiveFilterCount()} active` : mobileFiltersOpen ? "Close" : "Open"}</span>
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Filters */}
          <div
            id="search-filters"
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
                    onClick={applyFilters}
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
                  Search
                </label>
                <div className="relative">
                  <input
                    aria-label={`Search ${activeTab}`}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={`Search ${activeTab}...`}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <IconSearch aria-hidden="true" className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" stroke={1.8} />
                </div>
              </div>

              {/* Conditional Filters based on activeTab */}
              {activeTab === "courses" ? (
                <>
                  {/* Course Filters */}
                  {/* Category Filter */}
                  <div className="mb-6">
                    <h3
                      className="font-semibold text-gray-900 mb-3 flex items-center justify-between cursor-pointer"
                      onClick={() =>
                        setIsCategoriesExpanded(!isCategoriesExpanded)
                      }
                    >
                      <span>Category</span>
                      <IconChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${isCategoriesExpanded ? "rotate-180" : ""}`} stroke={1.8} />
                    </h3>
                    {isCategoriesExpanded && (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
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
                            <span className="text-sm text-gray-700">
                              {level}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tags Filter for Courses */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {[
                        "React",
                        "JavaScript",
                        "Python",
                        "UI/UX",
                        "Figma",
                        "Node.js",
                        "Machine Learning",
                        "Data Science",
                      ].map((tag) => (
                        <label key={tag} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedTags.includes(tag)}
                            onChange={() => toggleTagFilter(tag)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">{tag}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Language Filter for Courses */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Language
                    </h3>
                    <div className="space-y-2">
                      {[
                        "English",
                        "Vietnamese",
                        "Spanish",
                        "French",
                        "German",
                      ].map((language) => (
                        <label key={language} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedLanguages.includes(language)}
                            onChange={() => toggleLanguageFilter(language)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">
                            {language}
                          </span>
                        </label>
                      ))}
                    </div>
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
                          <label
                            key={range.value}
                            className="flex items-center"
                          >
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

                  {/* Rating Filter for Courses */}
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
                        {[
                          { label: "4.5 & up", value: "4.5" },
                          { label: "4.0 & up", value: "4.0" },
                          { label: "3.5 & up", value: "3.5" },
                          { label: "3.0 & up", value: "3.0" },
                        ].map((rating) => (
                          <label
                            key={rating.value}
                            className="flex items-center"
                          >
                            <input
                              type="radio"
                              name="rating"
                              value={rating.value}
                              checked={selectedRating === rating.value}
                              onChange={(e) =>
                                setSelectedRating(e.target.value)
                              }
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">
                              {rating.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Mentor Filters */}
                  {/* Category Filter for Mentors */}
                  <div className="mb-6">
                    <h3
                      className="font-semibold text-gray-900 mb-3 flex items-center justify-between cursor-pointer"
                      onClick={() =>
                        setIsCategoriesExpanded(!isCategoriesExpanded)
                      }
                    >
                      <span>Category</span>
                      <IconChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${isCategoriesExpanded ? "rotate-180" : ""}`} stroke={1.8} />
                    </h3>
                    {isCategoriesExpanded && (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {[
                          "Programming",
                          "Design",
                          "Business",
                          "Marketing",
                          "Data Science",
                          "Photography",
                        ].map((category) => (
                          <label key={category} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedMentorCategories.includes(
                                category
                              )}
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

                  {/* Skills Filter for Mentors */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Skills</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {[
                        "JavaScript",
                        "React",
                        "Python",
                        "Node.js",
                        "UI/UX Design",
                        "Data Analysis",
                        "Machine Learning",
                        "Digital Marketing",
                        "Project Management",
                        "Figma",
                      ].map((skill) => (
                        <label key={skill} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedSkills.includes(skill)}
                            onChange={() => toggleSkillFilter(skill)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">{skill}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Rating Filter for Mentors */}
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
                        {[
                          { label: "4.5 & up", value: "4.5" },
                          { label: "4.0 & up", value: "4.0" },
                          { label: "3.5 & up", value: "3.5" },
                          { label: "3.0 & up", value: "3.0" },
                        ].map((rating) => (
                          <label
                            key={rating.value}
                            className="flex items-center"
                          >
                            <input
                              type="radio"
                              name="mentorRating"
                              value={rating.value}
                              checked={selectedMentorRating === rating.value}
                              onChange={(e) =>
                                setSelectedMentorRating(e.target.value)
                              }
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">
                              {rating.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Content Area */}
          <div className="min-w-0 lg:w-3/4">
            {/* Content Grid */}
            {paginatedItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8 auto-rows-max">
                {activeTab === "courses"
                  ? paginatedItems.map((course) => (
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

                          {course.level && (
                            <p className="text-green-500 text-xs mb-2">
                              <b>Level:</b> {course.level}
                            </p>
                          )}

                          <div className="font-bold text-xl text-gray-900 mt-auto">
                            {formatVnd(
                              typeof course.price === "number"
                                ? course.price
                                : parseFloat(course.price || 0),
                            )}
                          </div>

                          {(hasUserRole(user, "mentee") || !user) && (
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
                    ))
                  : paginatedItems.map((mentor) => (
                      <div
                        key={mentor._id}
                        onClick={() => handleMentorClick(mentor._id)}
                        className="bg-white rounded-[18px] border border-gray-200 shadow-sm flex flex-col items-center p-6 min-w-[260px] max-w-[300px] w-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                      >
                        <img
                          src={mentor.avatarUrl}
                          alt={
                            mentor.fullName ||
                            `${mentor.firstName} ${mentor.lastName}`
                          }
                          className="w-28 h-28 object-cover rounded-[14px] mb-4 group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            e.currentTarget.src = oipImg;
                          }}
                        />
                        <div className="flex flex-col items-center flex-1 w-full">
                          <div className="mb-1 text-center text-lg font-bold text-[var(--ui-text)]">
                            {mentor.fullName ||
                              `${mentor.firstName || ""} ${
                                mentor.lastName || ""
                              }`.trim()}
                          </div>
                          <div className="mb-2 text-center text-sm text-[var(--ui-text-muted)]">
                            {mentor.jobTitle || "Professional"}
                          </div>
                          <div className="mb-3 text-center text-xs text-[var(--ui-text-muted)]">
                            {(() => {
                              let category = mentor.category || "General";
                              if (Array.isArray(category)) {
                                category = category[0] || "General";
                              }
                              if (
                                typeof category === "string" &&
                                category.includes(",")
                              ) {
                                category = category.split(",")[0].trim();
                              }
                              return (
                                category.charAt(0).toUpperCase() +
                                category.slice(1).toLowerCase()
                              );
                            })()}
                          </div>
                          <div className="flex items-center justify-between w-full mb-4">
                            <div className="px-3 py-2 bg-yellow-50 rounded-full">
                              <span className="text-sm font-bold text-yellow-700">
                                {(
                                  parseFloat(mentor.averageRating) || 0
                                ).toFixed(1)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-full">
                              <span className="text-sm font-medium text-blue-800">
                                {mentor.totalMentees ?? 0}
                              </span>
                              <span className="text-xs text-blue-600">
                                students
                              </span>
                            </div>
                          </div>
                          <div className="mt-auto w-full rounded-lg bg-[#2563eb] py-2 text-center text-base font-semibold text-white transition hover:bg-[#1749b1]">
                            View Profile
                          </div>
                        </div>
                      </div>
                    ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-sm font-medium text-gray-900">
                  No {activeTab} found
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

                {(() => {
                  const pages = [];
                  const showPages = 5;
                  let startPage = Math.max(
                    1,
                    currentPage - Math.floor(showPages / 2)
                  );
                  const endPage = Math.min(totalPages, startPage + showPages - 1);

                  if (endPage - startPage < showPages - 1) {
                    startPage = Math.max(1, endPage - showPages + 1);
                  }

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

export default SearchPage;
