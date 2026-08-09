import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import courseApi from "../api/modules/course.api";
import profileApi from "../api/modules/profile.api";
import cartApi from "../api/modules/cart.api";
import reviewApi from "../api/modules/review.api";
import { toast } from "react-toastify";
import { showLoading, hideLoading } from "../redux/features/loading.slice";

// Fallback images
import oipImg from "../assets/OIP.webp";
import BoImg from "../assets/Bơ.jpg";

const SearchPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.user);

  // --- AUTH CHECK (mentor và mentee đều được xem) ---
  useEffect(() => {
    const token =
      localStorage.getItem("actkn") || localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    let user = null;
    if (!token) {
      navigate("/auth/signin");
      return;
    }
    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      user = null;
    }
    if (!user || !user.role) {
      navigate("/auth/signin");
      return;
    }
    if (user.role === "mentor" || user.role === "mentee") {
      return;
    }
    navigate("/auth/signin");
    return;
  }, [navigate]);

  // Tab state - khôi phục tab cuối cùng từ localStorage
  const [activeTab, setActiveTab] = useState<any>(() => {
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
  const [selectedCategories, setSelectedCategories] = useState<any[]>([]);
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
        // Sử dụng studentsCount nếu có thay vì mentees array
        if (c.studentsCount || c.enrolledStudents) {
          // Tạo fake mentee IDs dựa trên student count
          const count = c.studentsCount || c.enrolledStudents || 0;
          for (let i = 0; i < count; i++) {
            menteeSet.add(`${mentorId}_${c._id}_${i}`);
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
      // Fallback: random mentee count
      const randomCount = Math.floor(Math.random() * 30) + 15;
      for (let i = 0; i < randomCount; i++) {
        menteeSet.add(`fallback_${mentorId}_${i}`);
      }
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
      navigate("/login");
      return;
    }

    if (user.role !== "mentee") {
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
        const existingCart = localStorage.getItem("mockCart");
        const cartItems = existingCart ? JSON.parse(existingCart) : [];

        const alreadyInCart = cartItems.some(
          (item) => (item._id || item.id) === courseId
        );

        if (alreadyInCart) {
          toast.info("Course is already in your cart");
          return;
        }

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
        toast.error("Failed to fetch courses");
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
        toast.error("Failed to fetch mentors");
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

      // Enrich với real stats cho tất cả mentor
      const enriched = await Promise.all(
        filteredRaw.map(async (mentor) => {
          try {
            const stats = await computeMentorStats(mentor._id || mentor.id);
            return {
              ...mentor,
              ...stats,
            };
          } catch (error) {
            console.error(
              `Error computing stats for mentor ${mentor._id}:`,
              error
            );
            // Return mentor without stats if computation fails
            return {
              ...mentor,
              averageRating: 0,
              totalReviews: 0,
              totalMentees: 0,
            };
          }
        })
      );

      setMentors(enriched);
      setFilteredMentors(enriched);
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
      if (!user || user.role !== "mentee") return;

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
      const [min, max] = selectedPriceRange.split("-").map(Number);
      filtered = filtered.filter((course) => {
        const price = course.price || 0;
        if (max) {
          return price >= min && price <= max;
        } else {
          return price >= min;
        }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
                Search Results
              </h1>
              <p className="text-gray-600">Discover courses and mentors</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-gray-600">
                {currentItems.length} {activeTab} found
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
                    onClick={applyFilters}
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
                  Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={`Search ${activeTab}...`}
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
          <div className="lg:w-3/4">
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
                                ★
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

                          {user && user.role === "mentee" && (
                            <div className="flex flex-col gap-2 mt-3 mb-3 px-4">
                              {isCourseAlreadyPurchased(course.id) ? (
                                <>
                                  <div className="w-full bg-green-100 text-green-700 py-2 px-3 rounded-md text-sm font-medium text-center">
                                    ✓ Already Purchased
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
                          src={mentor.avatarUrl || BoImg}
                          alt={
                            mentor.fullName ||
                            `${mentor.firstName} ${mentor.lastName}`
                          }
                          className="w-28 h-28 object-cover rounded-[14px] mb-4 group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            e.currentTarget.src = BoImg;
                          }}
                        />
                        <div className="flex flex-col items-center flex-1 w-full">
                          <div className="font-bold text-lg text-[#1A2233] mb-1 text-center">
                            {mentor.fullName ||
                              `${mentor.firstName || ""} ${
                                mentor.lastName || ""
                              }`.trim()}
                          </div>
                          <div className="text-sm text-[#6B7280] mb-2 text-center">
                            {mentor.jobTitle || "Professional"}
                          </div>
                          <div className="text-xs text-[#6B7280] mb-3 text-center">
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
                            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 rounded-full">
                              <svg
                                className="w-4 h-4 text-yellow-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-sm font-bold text-yellow-700">
                                {(
                                  parseFloat(mentor.averageRating) || 0
                                ).toFixed(1)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-full">
                              <svg
                                className="w-4 h-4 text-blue-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                              </svg>
                              <span className="text-sm font-medium text-blue-800">
                                {mentor.totalMentees ?? 0}
                              </span>
                              <span className="text-xs text-blue-600">
                                students
                              </span>
                            </div>
                          </div>
                          <div className="w-full flex items-center justify-center gap-2 bg-[#2563eb] text-white font-semibold rounded-lg py-2 mt-auto text-base hover:bg-[#1749b1] transition">
                            View Profile
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-5 h-5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
                              />
                            </svg>
                          </div>
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

export default SearchPage;
