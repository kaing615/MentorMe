import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AllCoursePage = () => {
  const navigate = useNavigate();

  // State management
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [selectedRating, setSelectedRating] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [selectedDuration, setSelectedDuration] = useState("");
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [searchTerm, setSearchTerm] = useState("");

  // Filter collapse states
  const [isRatingExpanded, setIsRatingExpanded] = useState(true);
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(true);
  const [isLevelsExpanded, setIsLevelsExpanded] = useState(true);
  const [isDurationExpanded, setIsDurationExpanded] = useState(true);
  const [isPriceExpanded, setIsPriceExpanded] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [coursesPerPage] = useState(12);

  // TODO: Replace with actual API call to fetch all courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);

        // TODO: Replace with actual API endpoint
        // const response = await fetch('/api/courses');
        // const data = await response.json();
        // setCourses(data);

        // Mock data for now
        const mockCourses = [
          {
            id: 1,
            title: "Complete React Developer Course",
            instructor: "Sarah Johnson",
            category: "Web Development",
            level: "Beginner",
            rating: 4.8,
            reviewCount: 2456,
            studentCount: 12589,
            price: 89.99,
            originalPrice: 199.99,
            duration: "42 Total Hours",
            lectures: 156,
            image: "/api/placeholder/300/200",
            description:
              "Master React from basics to advanced concepts with real projects",
            bestseller: true,
            lastUpdated: "2024-03-15",
          },
          {
            id: 2,
            title: "Python for Data Science & Machine Learning",
            instructor: "Dr. Michael Chen",
            category: "Data Science",
            level: "Intermediate",
            rating: 4.9,
            reviewCount: 1892,
            studentCount: 8456,
            price: 129.99,
            originalPrice: 249.99,
            duration: "38 Total Hours",
            lectures: 89,
            image: "/api/placeholder/300/200",
            description:
              "Complete data science bootcamp with Python, pandas, and scikit-learn",
            bestseller: true,
            lastUpdated: "2024-02-28",
          },
          {
            id: 3,
            title: "UI/UX Design Masterclass",
            instructor: "Emily Rodriguez",
            category: "Design",
            level: "Beginner",
            rating: 4.7,
            reviewCount: 1234,
            studentCount: 6789,
            price: 79.99,
            originalPrice: 149.99,
            duration: "28 Total Hours",
            lectures: 67,
            image: "/api/placeholder/300/200",
            description:
              "Learn modern UI/UX design principles and create stunning interfaces",
            bestseller: false,
            lastUpdated: "2024-01-22",
          },
          {
            id: 4,
            title: "Node.js & Express.js Backend Development",
            instructor: "David Kim",
            category: "Backend Development",
            level: "Intermediate",
            rating: 4.6,
            reviewCount: 987,
            studentCount: 4321,
            price: 99.99,
            originalPrice: 179.99,
            duration: "32 Total Hours",
            lectures: 78,
            image: "/api/placeholder/300/200",
            description:
              "Build scalable backend applications with Node.js and Express",
            bestseller: false,
            lastUpdated: "2024-03-01",
          },
          {
            id: 5,
            title: "Mobile App Development with React Native",
            instructor: "Lisa Wang",
            category: "Mobile Development",
            level: "Intermediate",
            rating: 4.5,
            reviewCount: 756,
            studentCount: 3890,
            price: 119.99,
            originalPrice: 199.99,
            duration: "36 Total Hours",
            lectures: 95,
            image: "/api/placeholder/300/200",
            description: "Create cross-platform mobile apps with React Native",
            bestseller: false,
            lastUpdated: "2024-02-15",
          },
          {
            id: 6,
            title: "AWS Cloud Practitioner Complete Course",
            instructor: "James Thompson",
            category: "Cloud Computing",
            level: "Beginner",
            rating: 4.8,
            reviewCount: 1543,
            studentCount: 7234,
            price: 109.99,
            originalPrice: 189.99,
            duration: "25 Total Hours",
            lectures: 58,
            image: "/api/placeholder/300/200",
            description:
              "Master AWS fundamentals and prepare for certification",
            bestseller: true,
            lastUpdated: "2024-03-10",
          },
          {
            id: 7,
            title: "Digital Marketing Complete Masterclass",
            instructor: "Sophie Anderson",
            category: "Marketing",
            level: "Beginner",
            rating: 4.4,
            reviewCount: 2134,
            studentCount: 9876,
            price: 69.99,
            originalPrice: 149.99,
            duration: "30 Total Hours",
            lectures: 72,
            image: "/api/placeholder/300/200",
            description:
              "Complete digital marketing course covering SEO, PPC, and social media",
            bestseller: false,
            lastUpdated: "2024-01-18",
          },
          {
            id: 8,
            title: "Cybersecurity Fundamentals",
            instructor: "Robert Brown",
            category: "Cybersecurity",
            level: "Beginner",
            rating: 4.7,
            reviewCount: 876,
            studentCount: 3456,
            price: 139.99,
            originalPrice: 219.99,
            duration: "40 Total Hours",
            lectures: 85,
            image: "/api/placeholder/300/200",
            description:
              "Learn essential cybersecurity skills and ethical hacking",
            bestseller: false,
            lastUpdated: "2024-02-25",
          },
          {
            id: 9,
            title: "Game Development with Unity",
            instructor: "Carlos Oliveira",
            category: "Game Development",
            level: "Intermediate",
            rating: 4.5,
            reviewCount: 654,
            studentCount: 2345,
            price: 149.99,
            originalPrice: 249.99,
            duration: "45 Total Hours",
            lectures: 102,
            image: "/api/placeholder/300/200",
            description: "Create 2D and 3D games using Unity game engine",
            bestseller: false,
            lastUpdated: "2024-01-30",
          },
          {
            id: 10,
            title: "DevOps with Docker & Kubernetes",
            instructor: "Maria Garcia",
            category: "DevOps",
            level: "Advanced",
            rating: 4.6,
            reviewCount: 543,
            studentCount: 1987,
            price: 159.99,
            originalPrice: 279.99,
            duration: "38 Total Hours",
            lectures: 89,
            image: "/api/placeholder/300/200",
            description:
              "Master containerization and orchestration with Docker & Kubernetes",
            bestseller: false,
            lastUpdated: "2024-03-05",
          },
          {
            id: 11,
            title: "Blockchain Development Complete Course",
            instructor: "Alex Martinez",
            category: "Blockchain",
            level: "Advanced",
            rating: 4.3,
            reviewCount: 432,
            studentCount: 1567,
            price: 199.99,
            originalPrice: 349.99,
            duration: "50 Total Hours",
            lectures: 115,
            image: "/api/placeholder/300/200",
            description: "Learn blockchain development with Solidity and Web3",
            bestseller: false,
            lastUpdated: "2024-02-12",
          },
          {
            id: 12,
            title: "Complete Java Programming Bootcamp",
            instructor: "Jennifer Liu",
            category: "Programming",
            level: "Beginner",
            rating: 4.7,
            reviewCount: 1876,
            studentCount: 8765,
            price: 94.99,
            originalPrice: 179.99,
            duration: "55 Total Hours",
            lectures: 128,
            image: "/api/placeholder/300/200",
            description:
              "Master Java programming from scratch to advanced level",
            bestseller: true,
            lastUpdated: "2024-03-08",
          },
          {
            id: 13,
            title: "Flutter & Dart Mobile Development",
            instructor: "Ahmed Hassan",
            category: "Mobile Development",
            level: "Intermediate",
            rating: 4.4,
            reviewCount: 765,
            studentCount: 3214,
            price: 104.99,
            originalPrice: 189.99,
            duration: "33 Total Hours",
            lectures: 76,
            image: "/api/placeholder/300/200",
            description: "Build beautiful native apps with Flutter and Dart",
            bestseller: false,
            lastUpdated: "2024-01-28",
          },
          {
            id: 14,
            title: "Photography Masterclass Complete Course",
            instructor: "Isabella Romano",
            category: "Photography",
            level: "Beginner",
            rating: 4.8,
            reviewCount: 1432,
            studentCount: 5678,
            price: 59.99,
            originalPrice: 129.99,
            duration: "22 Total Hours",
            lectures: 54,
            image: "/api/placeholder/300/200",
            description:
              "Master photography basics, composition, and editing techniques",
            bestseller: true,
            lastUpdated: "2024-02-18",
          },
          {
            id: 15,
            title: "Artificial Intelligence & Deep Learning",
            instructor: "Dr. Yuki Tanaka",
            category: "Machine Learning",
            level: "Advanced",
            rating: 4.9,
            reviewCount: 987,
            studentCount: 2876,
            price: 179.99,
            originalPrice: 299.99,
            duration: "48 Total Hours",
            lectures: 98,
            image: "/api/placeholder/300/200",
            description:
              "Advanced AI and deep learning with TensorFlow and PyTorch",
            bestseller: true,
            lastUpdated: "2024-03-12",
          },
        ];

        setCourses(mockCourses);
        setFilteredCourses(mockCourses);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Failed to load courses");
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Filter options
  const categoryOptions = [
    "Web Development",
    "Data Science",
    "Design",
    "Backend Development",
    "Mobile Development",
    "Cloud Computing",
    "Marketing",
    "Cybersecurity",
    "Game Development",
    "DevOps",
    "Blockchain",
    "Programming",
    "Photography",
    "Machine Learning",
    "AI",
  ];

  const levelOptions = ["Beginner", "Intermediate", "Advanced", "Expert"];

  const durationOptions = [
    { label: "0-5 hours", value: "0-5" },
    { label: "5-15 hours", value: "5-15" },
    { label: "15-30 hours", value: "15-30" },
    { label: "30+ hours", value: "30+" },
  ];

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
    setSelectedDuration("");
    setSelectedPriceRange("");
    setSortBy("relevance");
    setSearchTerm("");
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedRating) count++;
    if (selectedCategories.length > 0) count++;
    if (selectedLevels.length > 0) count++;
    if (selectedDuration) count++;
    if (selectedPriceRange) count++;
    if (searchTerm) count++;
    return count;
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return getActiveFilterCount() > 0;
  };

  // TODO: Implement filtering logic when API is ready
  const applyFilters = () => {
    let filtered = [...courses];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by rating
    if (selectedRating) {
      const minRating = parseFloat(selectedRating);
      filtered = filtered.filter((course) => course.rating >= minRating);
    }

    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((course) =>
        selectedCategories.includes(course.category)
      );
    }

    // Filter by levels
    if (selectedLevels.length > 0) {
      filtered = filtered.filter((course) =>
        selectedLevels.includes(course.level)
      );
    }

    // Filter by duration
    if (selectedDuration) {
      const [min, max] = selectedDuration
        .split("-")
        .map((d) => (d === "+" ? Infinity : parseInt(d)));
      filtered = filtered.filter((course) => {
        const hours = parseInt(course.duration.split(" ")[0]);
        if (max === undefined) return hours >= min;
        return hours >= min && hours <= max;
      });
    }

    // Filter by price range
    if (selectedPriceRange) {
      if (selectedPriceRange === "free") {
        filtered = filtered.filter((course) => course.price === 0);
      } else {
        const [min, max] = selectedPriceRange
          .split("-")
          .map((p) => (p === "+" ? Infinity : parseInt(p)));
        filtered = filtered.filter((course) => {
          if (max === undefined) return course.price >= min;
          return course.price >= min && course.price <= max;
        });
      }
    }

    // Sort courses
    switch (sortBy) {
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "students":
        filtered.sort((a, b) => b.studentCount - a.studentCount);
        break;
      case "newest":
        filtered.sort(
          (a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)
        );
        break;
      default:
        // relevance - keep original order
        break;
    }

    setFilteredCourses(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    applyFilters();
  }, [
    selectedRating,
    selectedCategories,
    selectedLevels,
    selectedDuration,
    selectedPriceRange,
    sortBy,
    searchTerm,
    courses,
  ]);

  // Pagination logic
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = filteredCourses.slice(
    indexOfFirstCourse,
    indexOfLastCourse
  );
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);

  // TODO: Implement course detail navigation
  const handleViewCourse = (courseId) => {
    // TODO: Navigate to course detail page when route is ready
    // navigate(`/course/${courseId}`);
    console.log(`Navigate to course detail: ${courseId}`);
  };

  // TODO: Implement add to cart functionality
  const handleAddToCart = (courseId) => {
    // TODO: Add course to shopping cart when CartContext is ready
    console.log(`Add course to cart: ${courseId}`);
  };

  // TODO: Implement wishlist functionality
  const handleAddToWishlist = (courseId) => {
    // TODO: Add course to wishlist when WishlistContext is ready
    console.log(`Add course to wishlist: ${courseId}`);
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

  // Render star rating
  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <span
        key={index}
        className={`text-sm ${
          index < Math.floor(rating) ? "text-yellow-400" : "text-gray-300"
        }`}
      >
        ★
      </span>
    ));
  };

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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              {/* Filter Button */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
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
                    {[4.5, 4.0, 3.5, 3.0].map((rating) => (
                      <label key={rating} className="flex items-center">
                        <input
                          type="radio"
                          name="rating"
                          value={rating}
                          checked={selectedRating === rating.toString()}
                          onChange={(e) => setSelectedRating(e.target.value)}
                          className="mr-2"
                        />
                        <div className="flex items-center">
                          {renderStars(rating)}
                          <span className="ml-2 text-sm text-gray-600"></span>
                        </div>
                      </label>
                    ))}
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
                        <span className="text-sm text-gray-700">{level}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Duration Filter */}
              <div className="mb-6">
                <h3
                  className="font-semibold text-gray-900 mb-3 flex items-center justify-between cursor-pointer"
                  onClick={() => setIsDurationExpanded(!isDurationExpanded)}
                >
                  <span>Duration</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isDurationExpanded ? "rotate-180" : ""
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
                {isDurationExpanded && (
                  <div className="space-y-2">
                    {durationOptions.map((duration) => (
                      <label key={duration.value} className="flex items-center">
                        <input
                          type="radio"
                          name="duration"
                          value={duration.value}
                          checked={selectedDuration === duration.value}
                          onChange={(e) => setSelectedDuration(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">
                          {duration.label}
                        </span>
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8 auto-rows-max" style={{height: '2100px'}}>
                {currentCourses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                  >
                    {/* Course Image */}
                    <div className="relative">
                      <img
                        src={course.image}
                        alt={course.title}
                        className="w-full h-48 object-cover"
                      />
                      {course.bestseller && (
                        <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                          Bestseller
                        </span>
                      )}
                      <button
                        onClick={() => handleAddToWishlist(course.id)}
                        className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                      >
                        <svg
                          className="w-4 h-4 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Course Info */}
                    <div className="p-4">
                      <div className="mb-2">
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                          {course.category}
                        </span>
                      </div>

                      <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
                        {course.title}
                      </h3>

                      <p className="text-sm text-gray-600 mb-2">
                        By {course.instructor}
                      </p>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-2">
                        {renderStars(course.rating)}
                        <span className="text-sm text-gray-600 ml-1">
                          {course.rating} ({course.reviewCount} reviews)
                        </span>
                      </div>

                      {/* Course Details */}
                      <div className="text-sm text-gray-600 mb-3">
                        <span>
                          {course.lectures} lectures • {course.duration}
                        </span>
                        <br />
                        <span className="text-xs">{course.level}</span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-900">
                            ${course.price}
                          </span>
                          {course.originalPrice > course.price && (
                            <span className="text-sm text-gray-500 line-through">
                              ${course.originalPrice}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewCourse(course.id)}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          View Course
                        </button>
                        <button
                          onClick={() => handleAddToCart(course.id)}
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          title="Add to Cart"
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
                              d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
                            />
                          </svg>
                        </button>
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
