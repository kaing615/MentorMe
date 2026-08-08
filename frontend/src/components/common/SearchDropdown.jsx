import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { IoSearch } from "react-icons/io5";
import { FaStar, FaUser } from "react-icons/fa";
import { MdBook } from "react-icons/md";
import { searchMentors } from "../../api/modules/mentor.api";

import courseApi from "../../api/modules/course.api";
import { getTopMentors } from "../../api/modules/mentor.api";
import "../../styles/search-animations.css";

const SearchDropdown = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [mentors, setMentors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [featuredMentors, setFeaturedMentors] = useState([]);
  const [featuredCourses, setFeaturedCourses] = useState([]);

  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Load featured items when component mounts
  useEffect(() => {
    loadFeaturedItems();
  }, []);

  // Load featured mentors and courses
  const loadFeaturedItems = async () => {
    try {
      // Load featured mentors (top mentors from backend)
      const mentorResponse = await getTopMentors();
      if (mentorResponse.response?.data?.mentors) {
        setFeaturedMentors(mentorResponse.response.data.mentors.slice(0, 4));
      }

      // Load featured courses (all courses, then filter top rated)
      const courseResponse = await courseApi.getList({
        page: 1,
        limit: 8, // Load more to have variety for filtering
      });
      if (courseResponse.response?.data?.courses) {
        const sortedCourses = courseResponse.response.data.courses
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 4);
        setFeaturedCourses(sortedCourses);
      }
    } catch (error) {
      console.error("Error loading featured items:", error);
      // Use fallback data if API fails
      setFeaturedMentors([
        {
          _id: "1",
          firstName: "John",
          lastName: "Doe",
          profile: {
            jobTitle: "Senior Software Engineer",
            skills: ["JavaScript", "React", "Node.js"],
            category: "Programming",
          },
          rating: 4.8,
          avatarUrl: null,
        },
        {
          _id: "2",
          firstName: "Jane",
          lastName: "Smith",
          profile: {
            jobTitle: "UI/UX Designer",
            skills: ["Figma", "Adobe XD", "Design Systems"],
            category: "Design",
          },
          rating: 4.9,
          avatarUrl: null,
        },
        {
          _id: "3",
          firstName: "Alice",
          lastName: "Johnson",
          profile: {
            jobTitle: "Data Scientist",
            skills: ["Python", "Machine Learning", "SQL"],
            category: "Data Science",
          },
          rating: 4.7,
          avatarUrl: null,
        },
        {
          _id: "4",
          firstName: "Bob",
          lastName: "Wilson",
          profile: {
            jobTitle: "Business Consultant",
            skills: ["Strategy", "Marketing", "Finance"],
            category: "Business",
          },
          rating: 4.6,
          avatarUrl: null,
        },
      ]);
      setFeaturedCourses([
        {
          _id: "1",
          title: "Complete React Development",
          category: "Programming",
          tags: ["React", "JavaScript", "Frontend"],
          rating: 4.7,
          thumbnail: null,
        },
        {
          _id: "2",
          title: "UI/UX Design Fundamentals",
          category: "Design",
          tags: ["Design", "UX", "Figma"],
          rating: 4.8,
          thumbnail: null,
        },
        {
          _id: "3",
          title: "Data Science with Python",
          category: "Data Science",
          tags: ["Python", "Data Analysis", "Machine Learning"],
          rating: 4.6,
          thumbnail: null,
        },
        {
          _id: "4",
          title: "Digital Marketing Mastery",
          category: "Marketing",
          tags: ["Marketing", "SEO", "Social Media"],
          rating: 4.5,
          thumbnail: null,
        },
      ]);
    }
  };

  // Search function
  const performSearch = async (query) => {
    if (!query.trim()) {
      setMentors([]);
      setCourses([]);
      return;
    }

    setLoading(true);
    try {
      // Search mentors - get more results to filter
      const mentorResponse = await searchMentors({
        page: 1,
        limit: 20, // Get more results for better filtering
      });

      if (mentorResponse.response?.data?.mentors) {
        // Filter mentors based on search query
        const filteredMentors = mentorResponse.response.data.mentors
          .filter((mentor) => {
            const fullName =
              `${mentor.firstName} ${mentor.lastName}`.toLowerCase();
            const searchTerm = query.toLowerCase();

            return (
              fullName.includes(searchTerm) ||
              mentor.profile?.jobTitle?.toLowerCase().includes(searchTerm) ||
              mentor.profile?.category?.toLowerCase().includes(searchTerm) ||
              mentor.profile?.skills?.some((skill) =>
                skill.toLowerCase().includes(searchTerm)
              )
            );
          })
          .slice(0, 5); // Take top 5 results

        setMentors(filteredMentors);
      }

      // Search courses - get all courses and filter
      const courseResponse = await courseApi.getList({
        page: 1,
        limit: 20, // Get more results for better filtering
      });

      if (courseResponse.response?.data?.courses) {
        // Filter courses based on search query
        const filteredCourses = courseResponse.response.data.courses
          .filter((course) => {
            const searchTerm = query.toLowerCase();

            return (
              course.title?.toLowerCase().includes(searchTerm) ||
              course.category?.toLowerCase().includes(searchTerm) ||
              course.tags?.some((tag) => tag.toLowerCase().includes(searchTerm))
            );
          })
          .slice(0, 5); // Take top 5 results

        setCourses(filteredCourses);
      }
    } catch (error) {
      console.error("Search error:", error);
      // Show filtered results from featured items as fallback
      const filteredMentors = featuredMentors.filter((mentor) => {
        const fullName = `${mentor.firstName} ${mentor.lastName}`.toLowerCase();
        const searchTerm = query.toLowerCase();

        return (
          fullName.includes(searchTerm) ||
          mentor.profile?.jobTitle?.toLowerCase().includes(searchTerm) ||
          mentor.profile?.category?.toLowerCase().includes(searchTerm) ||
          mentor.profile?.skills?.some((skill) =>
            skill.toLowerCase().includes(searchTerm)
          )
        );
      });

      const filteredCourses = featuredCourses.filter((course) => {
        const searchTerm = query.toLowerCase();

        return (
          course.title?.toLowerCase().includes(searchTerm) ||
          course.category?.toLowerCase().includes(searchTerm) ||
          course.tags?.some((tag) => tag.toLowerCase().includes(searchTerm))
        );
      });

      setMentors(filteredMentors);
      setCourses(filteredCourses);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery && isOpen) {
        performSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, isOpen]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigate(
        `/platform/search?search=${encodeURIComponent(searchQuery.trim())}`
      );
      setIsOpen(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleMentorClick = (mentorId) => {
    navigate(`/mentor/${mentorId}`);
    setIsOpen(false);
  };

  const handleCourseClick = (courseId) => {
    navigate(`/course-detail/${courseId}`);
    setIsOpen(false);
  };

  const handleSeeAllMentors = () => {
    localStorage.setItem("searchPageActiveTab", "mentors");
    navigate(`/platform/search`);
  };

  const handleSeeAllCourses = () => {
    localStorage.setItem("searchPageActiveTab", "courses");
    navigate(`/platform/search`);
  };

  // Get display items based on search state
  const displayMentors = searchQuery.trim() ? mentors : featuredMentors;
  const displayCourses = searchQuery.trim() ? courses : featuredCourses;

  return (
    <div ref={searchRef} className="relative w-full max-w-md mx-auto">
      {/* Search Input */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="flex items-center gap-2 px-3 py-2 rounded-md bg-white border border-slate-300"
      >
        <IoSearch className="text-xl text-slate-500" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Find mentors, courses..."
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyPress}
          className="flex-1 text-base font-normal bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-400"
        />
        <button onClick={handleSearchSubmit} className="p-1 rounded-md">
          <IoSearch className="text-lg text-slate-500" />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-md z-50 max-h-[420px] overflow-auto border border-slate-200 shadow-lg"
          style={{ minWidth: 260 }}
        >
          {loading ? (
            <div className="p-4 text-center text-slate-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400 mx-auto"></div>
              <p className="mt-2 text-sm">Đang tìm kiếm...</p>
            </div>
          ) : (
            <div className="py-2">
              {/* Header with See All buttons */}
              {!searchQuery.trim() && (
                <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                  <div className="flex justify-between">
                    <button
                      onClick={() => {
                        localStorage.setItem(
                          "searchPageActiveTab",
                          "courses"
                        );
                        navigate("/platform/search");
                      }}
                      className="text-sm text-blue-600 hover:underline px-0 py-1 bg-transparent"
                    >
                      See all courses
                    </button>
                    <button
                      onClick={() => {
                        localStorage.setItem("searchPageActiveTab", "mentors");
                        navigate("/platform/search");
                      }}
                      className="text-sm text-green-600 hover:underline px-0 py-1 bg-transparent"
                    >
                      See all mentors
                    </button>
                  </div>
                </div>
              )}

              {/* Search Results Header */}
              {searchQuery.trim() && (
                <div className="p-3 border-b border-slate-100 bg-slate-50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-600">
                      Search results for "{searchQuery}"
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSeeAllCourses}
                        className="text-xs px-3 py-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors duration-200 btn-hover"
                      >
                        See All Courses
                      </button>
                      <button
                        onClick={handleSeeAllMentors}
                        className="text-xs px-3 py-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors duration-200 btn-hover"
                      >
                        See All Mentors
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Mentors Section */}
              {displayMentors.length > 0 && (
                <div className="py-2">
                  <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                    <span className="font-semibold text-slate-700">
                      Mentors
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {displayMentors.map((mentor) => (
                      <div
                        key={mentor._id}
                        onClick={() => handleMentorClick(mentor._id)}
                        className="flex items-center gap-2 px-3 py-2 rounded text-slate-800 text-base font-normal cursor-pointer hover:bg-slate-100 transition-all"
                        style={{ minHeight: 36 }}
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                          {mentor.avatarUrl ? (
                            <img
                              src={mentor.avatarUrl}
                              alt="avatar"
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <span className="text-slate-500 font-semibold text-base">
                              {mentor.firstName?.charAt(0)}
                              {mentor.lastName?.charAt(0)}
                            </span>
                          )}
                        </div>
                        <span className="flex-1 truncate block">
                          {mentor.firstName} {mentor.lastName}
                          <span className="ml-2 text-xs text-slate-500 font-medium">
                            {mentor.jobTitle ? mentor.jobTitle : "Mentor"}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Courses Section */}
              {displayCourses.length > 0 && (
                <div className="py-2">
                  <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                    <span className="font-semibold text-slate-700">
                      Courses
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {displayCourses.map((course) => (
                      <div
                        key={course._id}
                        onClick={() => handleCourseClick(course._id)}
                        className="flex items-center gap-2 px-3 py-2 rounded text-slate-800 text-base font-normal cursor-pointer hover:bg-slate-100 transition-all"
                        style={{ minHeight: 36 }}
                      >
                        <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center overflow-hidden">
                          {course.thumbnail ? (
                            <img
                              src={course.thumbnail}
                              alt="thumbnail"
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <MdBook className="text-slate-400 text-lg" />
                          )}
                        </div>
                        <span className="flex-1 truncate block">
                          {course.title}
                          {course.category && (
                            <span className="ml-2 text-xs text-slate-500">
                              {course.category}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {searchQuery.trim() &&
                displayMentors.length === 0 &&
                displayCourses.length === 0 &&
                !loading && (
                  <div className="p-8 text-center text-slate-400">
                    <IoSearch className="text-4xl mx-auto mb-3 text-slate-300 animate-pulse" />
                    <p className="font-medium">No results found</p>
                    <p className="text-sm mt-1">
                      Try another keyword or see all mentors/courses below
                    </p>
                    <div className="flex justify-between mt-4">
                      <button
                        onClick={() => {
                          localStorage.setItem(
                            "searchPageActiveTab",
                            "all-courses"
                          );
                          navigate("/platform/search");
                        }}
                        className="text-sm text-blue-600 hover:underline px-0 py-1 bg-transparent"
                      >
                        See all courses
                      </button>
                      <button
                        onClick={() => {
                          localStorage.setItem(
                            "searchPageActiveTab",
                            "mentors"
                          );
                          navigate("/platform/search");
                        }}
                        className="text-sm text-green-600 hover:underline px-0 py-1 bg-transparent"
                      >
                        See all mentors
                      </button>
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;
