import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import profileApi from "../api/modules/profile.api";
import { hasUserRole } from "../utils/user-role";
import { mapMentorListResponse } from "../utils/mentor-list";
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

const AllMentors = () => {
  const navigate = useNavigate();

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

    if (hasUserRole(user, "mentor") || hasUserRole(user, "mentee")) {
      return;
    }

    navigate("/auth/signin");
    return;
  }, [navigate]);

  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState<any>(true);
  const [error, setError] = useState<any>(null);

  const [selectedRating, setSelectedRating] = useState<any>("");
  const [selectedSkills, setSelectedSkills] = useState<any[]>([]);
  const [selectedJobTitles, setSelectedJobTitles] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<any>("relevance");
  const [searchTerm, setSearchTerm] = useState<any>("");

  const [isRatingExpanded, setIsRatingExpanded] = useState<any>(true);
  const [isSkillsExpanded, setIsSkillsExpanded] = useState<any>(true);
  const [isJobTitlesExpanded, setIsJobTitlesExpanded] = useState<any>(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<any>(false);

  const [currentPage, setCurrentPage] = useState<any>(1);
  const [mentorsPerPage] = useState<any>(6);
  const [serverTotalPages, setServerTotalPages] = useState(1);
  const [serverTotal, setServerTotal] = useState(0);
  const [facets, setFacets] = useState<any>({ skills: [], jobTitles: [] });

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await profileApi.searchMentors({
          search: searchTerm || undefined,
          minRating: selectedRating || undefined,
          skills: selectedSkills.join(",") || undefined,
          jobTitles: selectedJobTitles.join(",") || undefined,
          sort: sortBy === "relevance" ? undefined : sortBy,
          page: currentPage,
          limit: mentorsPerPage,
        });
        const realMentors = mapMentorListResponse(response);
        setMentors(realMentors);
        setServerTotalPages(response?.data?.totalPages || 1);
        setServerTotal(response?.data?.total || 0);
        setFacets(response?.data?.facets || { skills: [], jobTitles: [] });
      } catch (err) {
        console.error("Error fetching mentors:", err);
        setError("Failed to load mentors");
        setMentors([]);
        setServerTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, [
    currentPage,
    mentorsPerPage,
    searchTerm,
    selectedRating,
    selectedSkills,
    selectedJobTitles,
    sortBy,
  ]);

  const fallbackSkillOptions = [
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

  const fallbackJobTitleOptions = [
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
  const skillOptions = facets.skills.length ? facets.skills : fallbackSkillOptions;
  const jobTitleOptions = facets.jobTitles.length
    ? facets.jobTitles
    : fallbackJobTitleOptions;

  const clearAllFilters = () => {
    setSelectedRating("");
    setSelectedSkills([]);
    setSelectedJobTitles([]);
    setSortBy("relevance");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const hasActiveFilters = () => {
    return getActiveFilterCount() > 0;
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedRating) count++;
    if (selectedSkills.length > 0) count++;
    if (selectedJobTitles.length > 0) count++;
    if (searchTerm) count++;
    return count;
  };

  const currentMentors = mentors;
  const totalPages = serverTotalPages;

  const handleViewProfile = (mentorId) => {
    navigate(`/mentor/${mentorId}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleSkillFilter = (skill) => {
    setCurrentPage(1);
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const toggleJobTitleFilter = (jobTitle) => {
    setCurrentPage(1);
    setSelectedJobTitles((prev) =>
      prev.includes(jobTitle)
        ? prev.filter((jt) => jt !== jobTitle)
        : [...prev, jobTitle]
    );
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      index < Math.floor(rating) ? (
        <IconStarFilled key={index} aria-hidden="true" className="h-4 w-4 text-yellow-400" />
      ) : (
        <IconStar key={index} aria-hidden="true" className="h-4 w-4 text-[var(--ui-border-strong)]" stroke={1.6} />
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
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        <div className="ui-brand-hero relative mb-8 overflow-hidden p-6 sm:p-8">
          <span aria-hidden="true" className="absolute -right-5 -top-8 h-32 w-32 rotate-6 rounded-[38%_62%_45%_55%] border-2 border-dashed border-yellow-300/60" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="relative">
              <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-yellow-300">Find your guide</p>
              <h1 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
                Learn with a mentor who <span className="ui-marker text-blue-950">gets it</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">Filter by craft, role, and proven learner feedback.</p>
            </div>
            <div className="relative grid grid-cols-1 gap-3 sm:flex sm:items-center sm:gap-4">
              <p className="font-semibold text-blue-100">
                {serverTotal} mentors found
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-blue-100">Sort by</span>
                <select
                  aria-label="Sort mentors"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-xl border border-white/25 bg-white px-3 py-2 text-sm font-semibold text-blue-950 outline-none focus:ring-2 focus:ring-yellow-300"
                >
                  <option value="relevance">Relevance</option>
                  <option value="rating">Rating</option>
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

          <div
            id="mentor-filters"
            className={`${mobileFiltersOpen ? "block" : "hidden"} lg:block lg:w-1/4`}
          >
            <div className="ui-card ui-card-yellow max-h-[70dvh] overflow-y-auto p-6 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)]">

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-xl border-2 border-dashed border-[var(--ui-border)] px-4 py-2 text-[var(--ui-text)]">
                    <IconFilter aria-hidden="true" size={17} stroke={1.8} />
                    <span className="text-sm font-medium">Filter</span>
                  </div>
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

              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-[var(--ui-text)]">
                  Search Mentors
                </label>
                <div className="relative">
                  <input
                    aria-label="Search mentors"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search by name, title, skills..."
                    className="w-full rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] py-2.5 pl-10 pr-4 text-[var(--ui-text)] outline-none focus:border-[var(--ui-accent)] focus:ring-2 focus:ring-[var(--ui-accent-soft)]"
                  />
                  <IconSearch aria-hidden="true" className="absolute left-3 top-3 h-5 w-5 text-[var(--ui-text-muted)]" stroke={1.8} />
                </div>
              </div>

              <div className="mb-6">
                <h3
                  className="mb-3 flex cursor-pointer items-center justify-between font-semibold text-[var(--ui-text)]"
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
                          onChange={(e) => {
                            setSelectedRating(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="mr-2"
                        />
                        <div className="flex items-center">
                          {renderStars(rating)}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h3
                  className="mb-3 flex cursor-pointer items-center justify-between font-semibold text-[var(--ui-text)]"
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
                        <span className="text-sm text-[var(--ui-text-muted)]">{skill}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h3
                  className="mb-3 flex cursor-pointer items-center justify-between font-semibold text-[var(--ui-text)]"
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
                        <span className="text-sm text-[var(--ui-text-muted)]">
                          {jobTitle}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="min-w-0 lg:w-3/4">

            {currentMentors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                {currentMentors.map((mentor) => (
                  <div
                    key={mentor.id}
                    className="ui-card group overflow-hidden transition-transform hover:-translate-y-1"
                  >

                    <div className="relative bg-[var(--ui-surface-muted)]">
                      {mentor.avatar ? (
                        <img
                          src={mentor.avatar}
                          alt={mentor.name}
                          className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-52 w-full items-center justify-center bg-[var(--ui-accent-soft)] text-4xl font-extrabold text-[var(--ui-accent)]">
                          {mentor.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-[var(--ui-text)]">
                            {mentor.name}
                          </h3>
                          <p className="text-sm text-[var(--ui-text-muted)]">
                            {mentor.title}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 mb-2">
                        {renderStars(mentor.rating)}
                        <span className="ml-1 text-sm text-[var(--ui-text-muted)]">
                          {mentor.rating} ({mentor.reviewCount} reviews)
                        </span>
                      </div>

                      <p className="mb-3 text-sm text-[var(--ui-text-muted)]">
                        {mentor.studentCount.toLocaleString()} Students
                      </p>

                      <button
                        onClick={() => handleViewProfile(mentor.id)}
                        className="ui-button-highlight w-full px-4 py-2.5 font-black text-blue-950"
                      >
                        View Info
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ui-card ui-card-blue py-12 text-center">
                <IconSearchOff aria-hidden="true" className="mx-auto h-12 w-12 text-[var(--ui-accent)]" stroke={1.5} />
                <h3 className="mt-2 text-sm font-medium text-[var(--ui-text)]">
                  No mentors found
                </h3>
                <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
                  Try adjusting your search criteria or clearing some filters.
                </p>
                {hasActiveFilters() && (
                  <button
                    onClick={clearAllFilters}
                    className="ui-button-highlight mt-4 inline-flex items-center px-4 py-2 text-sm font-black text-blue-950"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}

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

export default AllMentors;
