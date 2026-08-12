import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { IconSearch } from "@tabler/icons-react";
import { searchMentors } from "../../api/modules/mentor.api";

import courseApi from "../../api/modules/course.api";
import { getTopMentors } from "../../api/modules/mentor.api";
import "../../styles/search-animations.css";

const SearchDropdown = () => {
  const [searchQuery, setSearchQuery] = useState<any>("");
  const [isOpen, setIsOpen] = useState<any>(false);
  const [mentors, setMentors] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState<any>(false);
  const [searchError, setSearchError] = useState<any>(false);
  const [featuredMentors, setFeaturedMentors] = useState<any[]>([]);
  const [featuredCourses, setFeaturedCourses] = useState<any[]>([]);

  const searchRef = useRef<any>(null);
  const dropdownRef = useRef<any>(null);
  const inputRef = useRef<any>(null);
  const navigate = useNavigate();

  // Load featured items when component mounts
  useEffect(() => {
    loadFeaturedItems();
  }, []);

  // Load featured mentors and courses
  const loadFeaturedItems = async () => {
    setSearchError(false);
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
      setFeaturedMentors([]);
      setFeaturedCourses([]);
      setSearchError(true);
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
    setSearchError(false);
    try {
      // Search mentors - get more results to filter
      const mentorResponse = await searchMentors({
        name: query,
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
      setMentors([]);
      setCourses([]);
      setSearchError(true);
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
    <div ref={searchRef} className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="flex min-h-12 items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-0.5 shadow-[var(--ui-shadow-xs)] transition-all focus-within:border-[var(--ui-accent)] focus-within:shadow-[0_0_0_4px_var(--ui-accent-soft)]"
      >
        <IconSearch aria-hidden="true" className="text-[var(--ui-text-muted)]" size={20} stroke={1.8} />
        <input
          ref={inputRef}
          type="text"
          aria-label="Search mentors and courses"
          placeholder="Find mentors, courses..."
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyPress}
          className="min-w-0 flex-1 border-none bg-transparent text-sm font-normal text-[var(--ui-text)] outline-none placeholder:text-[var(--ui-text-muted)]"
        />
        <button aria-label="Submit search" onClick={handleSearchSubmit} className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--ui-text-muted)] hover:bg-[var(--ui-accent-soft)] hover:text-[var(--ui-accent)]">
          <IconSearch aria-hidden="true" size={18} stroke={1.8} />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full z-50 mt-3 max-h-[420px] overflow-auto rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[var(--ui-shadow-lg)]"
          style={{ minWidth: 260 }}
        >
          {loading ? (
            <div className="space-y-2 p-4" aria-live="polite">
              <div className="h-10 animate-pulse rounded-lg bg-[var(--ui-surface-muted)]" />
              <div className="h-10 animate-pulse rounded-lg bg-[var(--ui-surface-muted)]" />
              <p className="sr-only">Searching</p>
            </div>
          ) : (
            <div className="py-2">
              {/* Header with See All buttons */}
              {!searchQuery.trim() && (
                <div className="border-b border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-3 py-2">
                  <div className="flex justify-between">
                    <button
                      onClick={() => {
                        localStorage.setItem(
                          "searchPageActiveTab",
                          "courses"
                        );
                        navigate("/platform/search");
                      }}
                      className="bg-transparent px-0 py-1 text-sm text-[var(--ui-accent)] hover:underline"
                    >
                      See all courses
                    </button>
                    <button
                      onClick={() => {
                        localStorage.setItem("searchPageActiveTab", "mentors");
                        navigate("/platform/search");
                      }}
                      className="bg-transparent px-0 py-1 text-sm text-[var(--ui-accent)] hover:underline"
                    >
                      See all mentors
                    </button>
                  </div>
                </div>
              )}

              {/* Search Results Header */}
              {searchQuery.trim() && (
                <div className="border-b border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-[var(--ui-text-muted)]">
                      Search results for "{searchQuery}"
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSeeAllCourses}
                        className="rounded-lg bg-[var(--ui-accent)] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[var(--ui-accent-strong)]"
                      >
                        See All Courses
                      </button>
                      <button
                        onClick={handleSeeAllMentors}
                        className="rounded-lg bg-[var(--ui-accent)] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[var(--ui-accent-strong)]"
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
                  <div className="border-b border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-3 py-2">
                    <span className="font-semibold text-[var(--ui-text)]">
                      Mentors
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {displayMentors.map((mentor) => (
                      <div
                        key={mentor._id}
                        onClick={() => handleMentorClick(mentor._id)}
                        className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-base font-normal text-[var(--ui-text)] transition-all hover:bg-[var(--ui-accent-soft)]"
                        style={{ minHeight: 36 }}
                      >
                        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[var(--ui-accent-soft)]">
                          {mentor.avatarUrl ? (
                            <img
                              src={mentor.avatarUrl}
                              alt="avatar"
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <span className="text-base font-semibold text-[var(--ui-accent)]">
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
                  <div className="border-b border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-3 py-2">
                    <span className="font-semibold text-[var(--ui-text)]">
                      Courses
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {displayCourses.map((course) => (
                      <div
                        key={course._id}
                        onClick={() => handleCourseClick(course._id)}
                        className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-base font-normal text-[var(--ui-text)] transition-all hover:bg-[var(--ui-accent-soft)]"
                        style={{ minHeight: 36 }}
                      >
                        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded bg-[var(--ui-accent-soft)] text-[var(--ui-accent)]">
                          {course.thumbnail ? (
                            <img
                              src={course.thumbnail}
                              alt="thumbnail"
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <span className="text-[10px] font-bold">Course</span>
                          )}
                        </div>
                        <span className="flex-1 truncate block">
                          {course.title}
                          {course.category && (
                            <span className="ml-2 text-xs text-[var(--ui-text-muted)]">
                              {course.category}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchError && (
                <div className="px-5 py-8 text-center text-sm text-[var(--ui-text-muted)]">
                  Search is unavailable right now. Please try again.
                </div>
              )}

              {/* No Results */}
              {!searchError && searchQuery.trim() &&
                displayMentors.length === 0 &&
                displayCourses.length === 0 &&
                !loading && (
                  <div className="p-8 text-center text-[var(--ui-text-muted)]">
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
                        className="bg-transparent px-0 py-1 text-sm text-[var(--ui-accent)] hover:underline"
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
