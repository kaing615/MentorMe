import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BoImg from "../assets/Bơ.jpg";
import OipImg from "../assets/OIP.webp";
import GradImg from "../assets/grad.png";
import WhiteImg from "../assets/white.png";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconFilter,
  IconSearch,
  IconSearchOff,
  IconStar,
  IconStarFilled,
} from "@tabler/icons-react";

const mentorPortraits = [BoImg, OipImg, GradImg, WhiteImg];

const AllMentors = () => {
  const navigate = useNavigate();

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
  const [mentors, setMentors] = useState<any[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState<any>(true);
  const [error, setError] = useState<any>(null);

  // Filter states
  const [selectedRating, setSelectedRating] = useState<any>("");
  const [selectedSkills, setSelectedSkills] = useState<any[]>([]);
  const [selectedJobTitles, setSelectedJobTitles] = useState<any[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<any>("");
  const [sortBy, setSortBy] = useState<any>("relevance");
  const [searchTerm, setSearchTerm] = useState<any>("");

  // Filter collapse states
  const [isRatingExpanded, setIsRatingExpanded] = useState<any>(true);
  const [isSkillsExpanded, setIsSkillsExpanded] = useState<any>(true);
  const [isJobTitlesExpanded, setIsJobTitlesExpanded] = useState<any>(true);
  const [isPriceExpanded, setIsPriceExpanded] = useState<any>(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<any>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState<any>(1);
  const [mentorsPerPage] = useState<any>(6);

  // TODO: Replace with actual API call to fetch all mentors
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setLoading(true);

        // TODO: Replace with actual API endpoint
        // const response = await fetch('/api/mentors');
        // const data = await response.json();
        // setMentors(data);

        // Mock data for now
        const mockMentors = [
          {
            id: 1,
            name: "Sarah Johnson",
            title: "Senior Frontend Developer",
            avatar: "/api/placeholder/200/200",
            rating: 4.9,
            reviewCount: 245,
            studentCount: 3521,
            skills: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
            hourlyRate: 75,
            description:
              "Expert in modern frontend technologies with 8+ years experience",
            verified: true,
            online: true,
          },
          {
            id: 2,
            name: "Michael Chen",
            title: "Full Stack Engineer",
            avatar: "/api/placeholder/200/200",
            rating: 4.8,
            reviewCount: 189,
            studentCount: 2847,
            skills: ["Node.js", "React", "PostgreSQL", "AWS"],
            hourlyRate: 85,
            description:
              "Full-stack developer specializing in scalable web applications",
            verified: true,
            online: true,
          },
          {
            id: 3,
            name: "Emily Rodriguez",
            title: "UX/UI Designer",
            avatar: "/api/placeholder/200/200",
            rating: 4.7,
            reviewCount: 156,
            studentCount: 1923,
            skills: ["Figma", "Adobe XD", "User Research", "Prototyping"],
            hourlyRate: 65,
            description:
              "Creative designer focused on user-centered design principles",
            verified: true,
            online: false,
          },
          {
            id: 4,
            name: "David Kim",
            title: "DevOps Engineer",
            avatar: "/api/placeholder/200/200",
            rating: 4.6,
            reviewCount: 98,
            studentCount: 1456,
            skills: ["Docker", "Kubernetes", "AWS", "CI/CD"],
            hourlyRate: 95,
            description: "Infrastructure expert with cloud computing expertise",
            verified: true,
            online: true,
          },
          {
            id: 5,
            name: "Lisa Wang",
            title: "Mobile Developer",
            avatar: "/api/placeholder/200/200",
            rating: 4.8,
            reviewCount: 267,
            studentCount: 2156,
            skills: ["React Native", "Flutter", "iOS", "Android"],
            hourlyRate: 80,
            description: "Cross-platform mobile development specialist",
            verified: true,
            online: true,
          },
          {
            id: 6,
            name: "James Thompson",
            title: "Data Scientist",
            avatar: "/api/placeholder/200/200",
            rating: 4.5,
            reviewCount: 134,
            studentCount: 987,
            skills: ["Python", "Machine Learning", "TensorFlow", "SQL"],
            hourlyRate: 90,
            description: "AI/ML expert with strong statistical background",
            verified: true,
            online: false,
          },
          {
            id: 7,
            name: "Maria Garcia",
            title: "Backend Developer",
            avatar: "/api/placeholder/200/200",
            rating: 4.7,
            reviewCount: 178,
            studentCount: 2234,
            skills: ["Java", "Spring Boot", "MongoDB", "Microservices"],
            hourlyRate: 70,
            description: "Scalable backend systems and API development expert",
            verified: true,
            online: true,
          },
          {
            id: 8,
            name: "Robert Brown",
            title: "Cybersecurity Specialist",
            avatar: "/api/placeholder/200/200",
            rating: 4.9,
            reviewCount: 89,
            studentCount: 765,
            skills: [
              "Penetration Testing",
              "Network Security",
              "CISSP",
              "Ethical Hacking",
            ],
            hourlyRate: 110,
            description:
              "Cybersecurity expert with enterprise security experience",
            verified: true,
            online: true,
          },
          {
            id: 9,
            name: "Jennifer Liu",
            title: "Product Manager",
            avatar: "/api/placeholder/200/200",
            rating: 4.6,
            reviewCount: 145,
            studentCount: 1234,
            skills: [
              "Product Strategy",
              "Agile",
              "User Analytics",
              "Roadmapping",
            ],
            hourlyRate: 85,
            description:
              "Strategic product management with 6+ years at tech startups",
            verified: true,
            online: false,
          },
          {
            id: 10,
            name: "Alex Martinez",
            title: "Blockchain Developer",
            avatar: "/api/placeholder/200/200",
            rating: 4.4,
            reviewCount: 67,
            studentCount: 543,
            skills: ["Solidity", "Web3", "Smart Contracts", "DeFi"],
            hourlyRate: 120,
            description: "Blockchain and cryptocurrency development specialist",
            verified: true,
            online: true,
          },
          {
            id: 11,
            name: "Sophie Anderson",
            title: "Digital Marketing Expert",
            avatar: "/api/placeholder/200/200",
            rating: 4.8,
            reviewCount: 223,
            studentCount: 1876,
            skills: ["SEO", "Google Ads", "Social Media", "Content Marketing"],
            hourlyRate: 55,
            description: "Digital marketing strategist with proven ROI results",
            verified: true,
            online: true,
          },
          {
            id: 12,
            name: "Carlos Oliveira",
            title: "Game Developer",
            avatar: "/api/placeholder/200/200",
            rating: 4.5,
            reviewCount: 112,
            studentCount: 892,
            skills: ["Unity", "C#", "3D Modeling", "Game Design"],
            hourlyRate: 65,
            description: "Indie game developer with published titles on Steam",
            verified: true,
            online: false,
          },
        ];

        const mentorsWithImages = mockMentors.map((mentor, index) => ({
          ...mentor,
          avatar: mentorPortraits[index % mentorPortraits.length],
        }));
        setMentors(mentorsWithImages);
        setFilteredMentors(mentorsWithImages);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching mentors:", err);
        setError("Failed to load mentors");
        setLoading(false);
      }
    };

    fetchMentors();
  }, []);

  // Filter options
  const skillOptions = [
    "React",
    "Vue.js",
    "Angular",
    "Node.js",
    "JavaScript",
    "TypeScript",
    "Python",
    "Java",
    "C#",
    "PHP",
    "Ruby",
    "Go",
    "Rust",
    "Mobile Development",
    "iOS",
    "Android",
    "React Native",
    "Flutter",
    "Data Science",
    "Machine Learning",
    "AI",
    "DevOps",
    "AWS",
    "Docker",
  ];

  const jobTitleOptions = [
    "Frontend Developer",
    "Backend Developer",
    "Full Stack",
    "Mobile Developer",
    "Data Scientist",
    "UX/UI Designer",
    "DevOps Engineer",
    "Cybersecurity",
    "Product Manager",
    "Blockchain Developer",
    "Digital Marketing",
    "Game Developer",
  ];

  const priceRanges = [
    { label: "Under $25/hr", value: "0-25" },
    { label: "$25 - $50/hr", value: "25-50" },
    { label: "$50 - $75/hr", value: "50-75" },
    { label: "$75 - $100/hr", value: "75-100" },
    { label: "Over $100/hr", value: "100+" },
  ];

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedRating("");
    setSelectedSkills([]);
    setSelectedJobTitles([]);
    setSelectedPriceRange("");
    setSortBy("relevance");
    setSearchTerm("");
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return getActiveFilterCount() > 0;
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedRating) count++;
    if (selectedSkills.length > 0) count++;
    if (selectedJobTitles.length > 0) count++;
    if (selectedPriceRange) count++;
    if (searchTerm) count++;
    return count;
  };

  // TODO: Implement filtering logic when API is ready
  const applyFilters = () => {
    let filtered = [...mentors];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (mentor) =>
          mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mentor.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mentor.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mentor.skills.some((skill) =>
            skill.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Filter by rating
    if (selectedRating) {
      const minRating = parseFloat(selectedRating);
      filtered = filtered.filter((mentor) => mentor.rating >= minRating);
    }

    // Filter by skills
    if (selectedSkills.length > 0) {
      filtered = filtered.filter((mentor) =>
        selectedSkills.some((skill) => mentor.skills.includes(skill))
      );
    }

    // Filter by job titles - improved matching
    if (selectedJobTitles.length > 0) {
      filtered = filtered.filter((mentor) =>
        selectedJobTitles.some((jobTitle) => {
          // Check for exact match or partial match
          return (
            mentor.title === jobTitle ||
            mentor.title.toLowerCase().includes(jobTitle.toLowerCase()) ||
            jobTitle.toLowerCase().includes(mentor.title.toLowerCase())
          );
        })
      );
    }

    // Filter by price range
    if (selectedPriceRange) {
      const [min, max] = selectedPriceRange
        .split("-")
        .map((p) => (p === "+" ? Infinity : parseInt(p)));
      filtered = filtered.filter((mentor) => {
        if (max === undefined) return mentor.hourlyRate >= min;
        return mentor.hourlyRate >= min && mentor.hourlyRate <= max;
      });
    }

    // Sort mentors
    switch (sortBy) {
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "price-low":
        filtered.sort((a, b) => a.hourlyRate - b.hourlyRate);
        break;
      case "price-high":
        filtered.sort((a, b) => b.hourlyRate - a.hourlyRate);
        break;
      case "students":
        filtered.sort((a, b) => b.studentCount - a.studentCount);
        break;
      default:
        // relevance - keep original order
        break;
    }

    setFilteredMentors(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    applyFilters();
  }, [
    selectedRating,
    selectedSkills,
    selectedJobTitles,
    selectedPriceRange,
    sortBy,
    searchTerm,
    mentors,
  ]);

  // Pagination logic
  const indexOfLastMentor = currentPage * mentorsPerPage;
  const indexOfFirstMentor = indexOfLastMentor - mentorsPerPage;
  const currentMentors = filteredMentors.slice(
    indexOfFirstMentor,
    indexOfLastMentor
  );
  const totalPages = Math.ceil(filteredMentors.length / mentorsPerPage);

  // TODO: Implement mentor profile navigation
  const handleViewProfile = (mentorId) => {
    // TODO: Navigate to mentor profile page when route is ready
    // navigate(`/mentor/${mentorId}`);
    console.log(`Navigate to mentor profile: ${mentorId}`);
  };

  // TODO: Implement skill filter toggle
  const toggleSkillFilter = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  // TODO: Implement job title filter toggle
  const toggleJobTitleFilter = (jobTitle) => {
    setSelectedJobTitles((prev) =>
      prev.includes(jobTitle)
        ? prev.filter((jt) => jt !== jobTitle)
        : [...prev, jobTitle]
    );
  };

  // Render star rating
  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      index < Math.floor(rating) ? (
        <IconStarFilled key={index} aria-hidden="true" className="h-4 w-4 text-yellow-400" />
      ) : (
        <IconStar key={index} aria-hidden="true" className="h-4 w-4 text-gray-300" stroke={1.6} />
      )
    ));
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[var(--ui-page)] px-4 py-10" aria-live="polite">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 h-10 w-52 animate-pulse rounded-xl bg-[var(--ui-surface-muted)]" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="overflow-hidden rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4">
                <div className="aspect-[4/3] animate-pulse rounded-xl bg-[var(--ui-surface-muted)]" />
                <div className="mt-4 h-5 w-2/3 animate-pulse rounded bg-[var(--ui-surface-muted)]" />
                <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-[var(--ui-surface-muted)]" />
              </div>
            ))}
          </div>
          <p className="sr-only">Loading mentors</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center bg-[var(--ui-page)] px-4">
        <div className="max-w-md rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-8 text-center">
          <h1 className="mb-3 text-3xl font-extrabold text-[var(--ui-text)]">Mentors unavailable</h1>
          <p className="mb-6 text-[var(--ui-text-muted)]">{error}</p>
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
                Our Mentors
              </h1>
              <p className="text-gray-600">All mentors</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:flex sm:items-center sm:gap-4">
              <p className="text-gray-600">
                {filteredMentors.length} mentors found
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Sort by</span>
                <select
                  aria-label="Sort mentors"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="relevance">Relevance</option>
                  <option value="rating">Rating</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="students">Most Students</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          aria-controls="mentor-filters"
          aria-expanded={mobileFiltersOpen}
          onClick={() => setMobileFiltersOpen((open) => !open)}
          className="mb-5 inline-flex min-h-11 w-full items-center justify-between rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--ui-text)] lg:hidden"
        >
          <span>Mentor filters</span>
          <span>{getActiveFilterCount() ? `${getActiveFilterCount()} active` : mobileFiltersOpen ? "Close" : "Open"}</span>
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Filters */}
          <div
            id="mentor-filters"
            className={`${mobileFiltersOpen ? "block" : "hidden"} lg:block lg:w-1/4`}
          >
            <div className="max-h-[70dvh] overflow-y-auto rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-6 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)]">
              {/* Filter Button */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
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
                  Search Mentors
                </label>
                <div className="relative">
                  <input
                    aria-label="Search mentors"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, title, skills..."
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
                    {[5, 4, 3, 2, 1].map((rating) => (
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

              {/* Skills Filter */}
              <div className="mb-6">
                <h3
                  className="font-semibold text-gray-900 mb-3 flex items-center justify-between cursor-pointer"
                  onClick={() => setIsSkillsExpanded(!isSkillsExpanded)}
                >
                  <span>Skills</span>
                  <IconChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${isSkillsExpanded ? "rotate-180" : ""}`} stroke={1.8} />
                </h3>
                {isSkillsExpanded && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {skillOptions.map((skill) => (
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
                )}
              </div>

              {/* Job Titles Filter */}
              <div className="mb-6">
                <h3
                  className="font-semibold text-gray-900 mb-3 flex items-center justify-between cursor-pointer"
                  onClick={() => setIsJobTitlesExpanded(!isJobTitlesExpanded)}
                >
                  <span>Job Titles</span>
                  <IconChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${isJobTitlesExpanded ? "rotate-180" : ""}`} stroke={1.8} />
                </h3>
                {isJobTitlesExpanded && (
                  <div className="space-y-2">
                    {jobTitleOptions.map((jobTitle) => (
                      <label key={jobTitle} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedJobTitles.includes(jobTitle)}
                          onChange={() => toggleJobTitleFilter(jobTitle)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">
                          {jobTitle}
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
                  <span>Prices</span>
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
            {/* Mentors Grid */}
            {currentMentors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                {currentMentors.map((mentor) => (
                  <div
                    key={mentor.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Mentor Avatar */}
                    <div className="aspect-w-16 aspect-h-12 bg-gray-200">
                      <img
                        src={mentor.avatar}
                        alt={mentor.name}
                        className="w-full h-48 object-cover"
                        onError={(event) => {
                          event.currentTarget.src = BoImg;
                        }}
                      />
                    </div>

                    {/* Mentor Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {mentor.name}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {mentor.title}
                          </p>
                        </div>
                        {mentor.online && (
                          <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                        )}
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-2">
                        {renderStars(mentor.rating)}
                        <span className="text-sm text-gray-600 ml-1">
                          {mentor.rating} ({mentor.reviewCount} reviews)
                        </span>
                      </div>

                      {/* Student Count */}
                      <p className="text-sm text-gray-600 mb-3">
                        {mentor.studentCount.toLocaleString()} Students
                      </p>

                      {/* View Profile Button */}
                      <button
                        onClick={() => handleViewProfile(mentor.id)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        View Info
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <IconSearchOff aria-hidden="true" className="mx-auto h-12 w-12 text-gray-400" stroke={1.5} />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No mentors found
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

export default AllMentors;
