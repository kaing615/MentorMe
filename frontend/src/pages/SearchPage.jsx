import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { IoSearch, IoFilter, IoLocationSharp, IoStar, IoChevronDown, IoClose, IoBookSharp, IoPerson } from 'react-icons/io5';
import { toast } from 'react-toastify';
import { searchMentors } from '../api/modules/mentor.api';
import { generateCourses, generateMentors } from '../utils/mockData';

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Auth state
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  // Auth check ref to prevent multiple notifications
  const authNotificationShown = useRef(false);
  
  // Auth check state to prevent multiple redirects
  const [authChecked, setAuthChecked] = useState(false);
  
  // State management
  const [mentors, setMentors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'courses', 'mentors'

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    skills: [],
    jobTitles: [],
    location: '',
    priceRange: '',
    rating: '',
    level: ''
  });

  // Filter UI states
  const [sortBy, setSortBy] = useState('relevance');
  const [isRatingExpanded, setIsRatingExpanded] = useState(true);
  const [isSkillsExpanded, setIsSkillsExpanded] = useState(true);
  const [isJobTitlesExpanded, setIsJobTitlesExpanded] = useState(true);
  const [isPriceExpanded, setIsPriceExpanded] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  // Debounced search
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Initialize search from URL parameters
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch) {
      setSearchQuery(urlSearch);
      setDebouncedSearchQuery(urlSearch);
    }
    
    // Set active tab based on URL path
    if (location.pathname.includes('/find-mentor')) {
      setActiveTab('mentors');
    }
    
    console.log('URL search param:', urlSearch);
    console.log('Current path:', location.pathname);
  }, [searchParams, location.pathname]);

  // Auth check - redirect if not authenticated or not mentee
  useEffect(() => {
    // Only check once using ref to prevent multiple notifications
    if (authNotificationShown.current) return;
    
    // Single check with single toast message
    if (!isAuthenticated) {
      authNotificationShown.current = true;
      toast.error('Please login to access search functionality');
      navigate('/auth/signin');
      setAuthChecked(true);
    } else if (user && user.role && user.role !== 'mentee') {
      authNotificationShown.current = true;
      toast.error('Only mentees can access search functionality');
      navigate('/');
      setAuthChecked(true);
    } else {
      setAuthChecked(true);
    }
  }, [isAuthenticated, user, navigate]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch both mentors and courses
  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchPayload = {
        name: debouncedSearchQuery, // API expects 'name' not 'search'
        limit: 20,
        ...filters
      };

      // Remove empty filters
      Object.keys(searchPayload).forEach(key => {
        if (!searchPayload[key] || searchPayload[key] === '') {
          delete searchPayload[key];
        }
      });

      // Fetch mentors and courses in parallel
      const [mentorResponse] = await Promise.allSettled([
        searchMentors(searchPayload)
      ]);

      // Handle mentor results - combine API mentors with generated mentors for more data
      let allMentors = [];
      if (mentorResponse.status === 'fulfilled' && mentorResponse.value.response?.data?.success) {
        allMentors = mentorResponse.value.response.data.mentors || [];
      }
      
      // Add generated mentors for more test data
      const generatedMentors = generateMentors(15);
      allMentors = [...allMentors, ...generatedMentors];
      
      // Filter mentors by search query if provided
      if (debouncedSearchQuery) {
        allMentors = allMentors.filter(mentor => {
          const mentorName = `${mentor.firstName || ''} ${mentor.lastName || ''}`.toLowerCase();
          const searchTerm = debouncedSearchQuery.toLowerCase();
          return mentorName.includes(searchTerm) ||
                 mentor.profile?.bio?.toLowerCase().includes(searchTerm) ||
                 mentor.specialty?.toLowerCase().includes(searchTerm) ||
                 mentor.profile?.skills?.some(skill => skill.toLowerCase().includes(searchTerm));
        });
      }
      
      setMentors(allMentors);

      // Generate mock courses and filter them
      let allCourses = generateCourses(20);
      
      // Filter courses by search query if provided
      if (debouncedSearchQuery) {
        allCourses = allCourses.filter(course => 
          course.title?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          course.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          course.category?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          course.instructor?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        );
      }
      
      setCourses(allCourses);

    } catch (err) {
      console.error('Error fetching results:', err);
      setError(err.message || 'Failed to load results');
      toast.error('Failed to load search results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch results when search or filters change
  useEffect(() => {
    fetchResults();
    setCurrentPage(1); // Reset to first page when filters change
  }, [debouncedSearchQuery, filters]);

  // Fetch results when page changes (but don't reset page)
  useEffect(() => {
    // Always fetch when page changes, including page 1
    fetchResults();
  }, [currentPage]);

  // Reset pagination when active tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Handle page change
  const handlePageChange = (newPage) => {
    console.log('Changing to page:', newPage, 'Current page:', currentPage);
    setLoading(true); // Show loading immediately when changing pages
    setCurrentPage(newPage);
  };

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Handle multiple selection for skills
  const toggleSkillFilter = (skill) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) 
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  // Handle multiple selection for job titles
  const toggleJobTitleFilter = (jobTitle) => {
    setFilters(prev => ({
      ...prev,
      jobTitles: prev.jobTitles.includes(jobTitle)
        ? prev.jobTitles.filter(jt => jt !== jobTitle)
        : [...prev.jobTitles, jobTitle]
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      category: '',
      skills: [],
      jobTitles: [],
      location: '',
      priceRange: '',
      rating: '',
      level: ''
    });
    setSearchQuery('');
    setSearchParams({});
  };

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.skills && filters.skills.length > 0) count++;
    if (filters.jobTitles && filters.jobTitles.length > 0) count++;
    if (filters.location) count++;
    if (filters.priceRange) count++;
    if (filters.rating) count++;
    if (filters.level) count++;
    return count;
  }, [filters]);

  // Check if any filters are active
  const hasActiveFilters = () => {
    return activeFiltersCount > 0;
  };

  // Filter results based on active tab and filter criteria
  const filteredResults = useMemo(() => {
    // Helper function to filter courses by criteria
    const filterCourses = (coursesToFilter) => {
      return coursesToFilter.filter(course => {
        // Category filter
        if (filters.category && !course.category?.toLowerCase().includes(filters.category.toLowerCase())) {
          return false;
        }

        // Skills filter (check against course title, description, and category)
        if (filters.skills && filters.skills.length > 0) {
          const searchableText = `${course.title} ${course.description} ${course.category} ${course.instructor}`.toLowerCase();
          const hasMatchingSkill = filters.skills.some(skill => 
            searchableText.includes(skill.toLowerCase())
          );
          if (!hasMatchingSkill) {
            return false;
          }
        }

        // Price range filter
        if (filters.priceRange) {
          const price = parseFloat(course.price) || 0;
          switch (filters.priceRange) {
            case 'Under $50':
              if (price >= 50) return false;
              break;
            case '$50 - $100':
              if (price < 50 || price > 100) return false;
              break;
            case '$100 - $200':
              if (price < 100 || price > 200) return false;
              break;
            case 'Over $200':
              if (price <= 200) return false;
              break;
          }
        }

        // Rating filter
        if (filters.rating) {
          const rating = parseFloat(course.rating) || 0;
          const filterRating = parseFloat(filters.rating);
          if (rating < filterRating) return false;
        }

        return true;
      });
    };

    // Helper function to filter mentors by criteria
    const filterMentors = (mentorsToFilter) => {
      return mentorsToFilter.filter(mentor => {
        // Category filter (check against profile.category or specialty)
        if (filters.category) {
          const categoryTerm = filters.category.toLowerCase();
          const mentorCategory = mentor.profile?.category || mentor.specialty || '';
          if (!mentorCategory.toLowerCase().includes(categoryTerm)) {
            return false;
          }
        }

        // Skills filter (check against profile.skills array or skills array)
        if (filters.skills && filters.skills.length > 0) {
          const mentorSkills = mentor.profile?.skills || mentor.skills || [];
          const hasMatchingSkill = filters.skills.some(filterSkill => 
            mentorSkills.some(skill => 
              skill.toLowerCase().includes(filterSkill.toLowerCase())
            )
          );
          
          if (!hasMatchingSkill) {
            // Also check subjects if available
            const mentorSubjects = mentor.subjects || [];
            const hasSubjectMatch = filters.skills.some(filterSkill => 
              mentorSubjects.some(subject => 
                subject.toLowerCase().includes(filterSkill.toLowerCase())
              )
            );
            
            if (!hasSubjectMatch) {
              return false;
            }
          }
        }

        // Job Titles filter (check against title or profile.title)
        if (filters.jobTitles && filters.jobTitles.length > 0) {
          const mentorTitle = mentor.title || mentor.profile?.title || '';
          const hasMatchingJobTitle = filters.jobTitles.some(jobTitle => 
            mentorTitle.toLowerCase().includes(jobTitle.toLowerCase()) ||
            jobTitle.toLowerCase().includes(mentorTitle.toLowerCase())
          );
          
          if (!hasMatchingJobTitle) {
            return false;
          }
        }

        // Price range filter (check hourlyRate)
        if (filters.priceRange) {
          const price = parseFloat(mentor.hourlyRate) || 0;
          switch (filters.priceRange) {
            case 'Under $50':
              if (price >= 50) return false;
              break;
            case '$50 - $100':
              if (price < 50 || price > 100) return false;
              break;
            case '$100 - $200':
              if (price < 100 || price > 200) return false;
              break;
            case 'Over $200':
              if (price <= 200) return false;
              break;
          }
        }

        // Rating filter
        if (filters.rating) {
          const rating = parseFloat(mentor.rating) || 0;
          const filterRating = parseFloat(filters.rating);
          console.log(`Mentor ${mentor.name || mentor.firstName} rating: ${rating}, filter: ${filterRating}, passes: ${rating >= filterRating}`);
          if (rating < filterRating) return false;
        }

        return true;
      });
    };

    // Apply filters to get all filtered results
    const filteredCourses = filterCourses(courses);
    const filteredMentors = filterMentors(mentors);

    // Sort results based on sortBy
    const sortResults = (items, type) => {
      const sorted = [...items];
      switch (sortBy) {
        case 'rating':
          return sorted.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
        case 'price-low-high':
          if (type === 'courses') {
            return sorted.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
          } else {
            return sorted.sort((a, b) => (parseFloat(a.hourlyRate) || 0) - (parseFloat(b.hourlyRate) || 0));
          }
        case 'price-high-low':
          if (type === 'courses') {
            return sorted.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
          } else {
            return sorted.sort((a, b) => (parseFloat(b.hourlyRate) || 0) - (parseFloat(a.hourlyRate) || 0));
          }
        case 'relevance':
        default:
          return sorted; // Keep original order for relevance
      }
    };

    const sortedCourses = sortResults(filteredCourses, 'courses');
    const sortedMentors = sortResults(filteredMentors, 'mentors');

    // Pagination logic
    const allResults = activeTab === 'courses' ? sortedCourses : 
                      activeTab === 'mentors' ? sortedMentors : 
                      [...sortedCourses, ...sortedMentors];
    
    const totalPages = Math.ceil(allResults.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = allResults.slice(indexOfFirstItem, indexOfLastItem);

    // Separate paginated items back into courses and mentors
    let paginatedCourses = [];
    let paginatedMentors = [];
    
    if (activeTab === 'courses') {
      paginatedCourses = currentItems;
    } else if (activeTab === 'mentors') {
      paginatedMentors = currentItems;
    } else {
      // For 'all' tab, separate the mixed results
      paginatedCourses = currentItems.filter(item => item.category || item.title);
      paginatedMentors = currentItems.filter(item => item.name || item.firstName || item.hourlyRate !== undefined);
    }

    // Return all filtered results regardless of active tab
    return {
      courses: sortedCourses,
      mentors: sortedMentors,
      // Add separate properties for display based on active tab with pagination
      displayCourses: paginatedCourses,
      displayMentors: paginatedMentors,
      totalPages,
      currentPage,
      totalResults: allResults.length,
      // Add total count for all results
      total: sortedCourses.length + sortedMentors.length
    };
  }, [activeTab, courses, mentors, filters, sortBy, currentPage]);

  // Course Card Component
  const CourseCard = ({ course }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
            <IoBookSharp className="text-2xl" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{course.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{course.category}</p>
            <div className="flex items-center gap-2 mb-2">
              <IoStar className="text-yellow-400 text-sm" />
              <span className="text-sm text-gray-600">
                {course.rating || '4.5'} ({course.reviewCount || '0'} reviews)
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {course.description}
            </p>
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-green-600">
                ${course.price || '99'}
              </div>
              <button 
                onClick={() => navigate(`/course-detail/${course._id || course.id}`)}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                View Course
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Mentor Card Component
  const MentorCard = ({ mentor }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-lg">
            {mentor.name?.charAt(0)?.toUpperCase() || mentor.firstName?.charAt(0)?.toUpperCase() || 'M'}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {mentor.name || `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim() || 'Mentor'}
            </h3>
            <p className="text-sm text-gray-600 mb-2">{mentor.title || mentor.profile?.bio || 'Experienced Mentor'}</p>
            <div className="flex items-center gap-2 mb-2">
              <IoStar className="text-yellow-400 text-sm" />
              <span className="text-sm text-gray-600">
                {mentor.rating || '4.5'} ({mentor.reviewCount || '0'} reviews)
              </span>
            </div>
            {(mentor.location || mentor.profile?.location) && (
              <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                <IoLocationSharp className="text-xs" />
                <span>{mentor.location || mentor.profile?.location}</span>
              </div>
            )}
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {mentor.bio || mentor.profile?.bio || 'Experienced mentor ready to help you grow your skills.'}
            </p>
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-blue-600">
                ${mentor.hourlyRate || '50'}/hour
              </div>
              <button 
                onClick={() => navigate(`/platform/mentor/${mentor._id || mentor.id}`)}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                View Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white-50">
      {/* Show loading if auth is being checked */}
      {!isAuthenticated || (user && user.role && user.role !== 'mentee') ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-3 text-gray-600 bg-white rounded-xl shadow-lg border px-8 py-6">
              <svg className="animate-spin w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
              </svg>
              <span className="text-lg font-medium text-gray-700">Checking authentication...</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Header Section */}
          <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {activeTab === 'all' ? 'Search Results' : 
                 activeTab === 'mentors' ? 'Our Mentors' : 'Our Courses'}
              </h1>
              {activeTab === 'all' ? (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigate('/all-mentors')}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
                  >
                    <IoPerson className="w-4 h-4" />
                    All mentors
                  </button>
                  <button
                    onClick={() => navigate('/all-courses')}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
                  >
                    <IoBookSharp className="w-4 h-4" />
                    All courses
                  </button>
                </div>
              ) : activeTab === 'courses' ? (
                <button
                  onClick={() => navigate('/all-courses')}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
                >
                  <IoBookSharp className="w-4 h-4" />
                  All courses
                </button>
              ) : activeTab === 'mentors' ? (
                <button
                  onClick={() => navigate('/all-mentors')}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
                >
                  <IoPerson className="w-4 h-4" />
                  All mentors
                </button>
              ) : (
                <p className="text-gray-600">
                  {activeTab === 'mentors' ? 'All mentors' : 'All courses'}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-600">
                {filteredResults.totalResults} results found
              </p>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="relevance">Relevance</option>
                <option value="rating">Rating</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              All Results ({filteredResults.total})
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`py-4 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center gap-2 ${
                activeTab === 'courses'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <IoBookSharp />
              Courses ({filteredResults.courses?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('mentors')}
              className={`py-4 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center gap-2 ${
                activeTab === 'mentors'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <IoPerson />
              Mentors ({filteredResults.mentors?.length || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-8">
          {/* Left Sidebar - Filters */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
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
                  {activeFiltersCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>
                {hasActiveFilters() && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Search Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search {activeTab === 'courses' ? 'Courses' : 'Mentors'}
                </label>
                <div className="relative">
                  <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    placeholder={`Search by ${activeTab === 'courses' ? 'title, category, instructor' : 'name, title, skills'}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-6">
                <h3
                  className="font-semibold text-gray-900 mb-3 flex items-center justify-between cursor-pointer"
                  onClick={() => setIsRatingExpanded(!isRatingExpanded)}
                >
                  <span>Rating</span>
                  <IoChevronDown className={`w-4 h-4 transition-transform duration-200 ${isRatingExpanded ? 'rotate-180' : ''}`} />
                </h3>
                {isRatingExpanded && (
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <label key={rating} className="flex items-center">
                        <input
                          type="radio"
                          name="rating"
                          value={rating}
                          checked={filters.rating === rating.toString()}
                          onChange={(e) => handleFilterChange('rating', e.target.value)}
                          className="mr-2"
                        />
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <IoStar key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} />
                          ))}
                          {rating < 5 && <span className="ml-2 text-sm text-gray-600">& up</span>}
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
                  <IoChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSkillsExpanded ? 'rotate-180' : ''}`} />
                </h3>
                {isSkillsExpanded && (
                  <div className="space-y-2">
                    {['React', 'Vue.js', 'Angular', 'Node.js', 'JavaScript', 'TypeScript', 'Python'].map((skill) => (
                      <label key={skill} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.skills.includes(skill)}
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
                  <IoChevronDown className={`w-4 h-4 transition-transform duration-200 ${isJobTitlesExpanded ? 'rotate-180' : ''}`} />
                </h3>
                {isJobTitlesExpanded && (
                  <div className="space-y-2">
                    {[
                      'Frontend Developer',
                      'Backend Developer', 
                      'Full Stack',
                      'Mobile Developer',
                      'Data Scientist',
                      'UX/UI Designer',
                      'DevOps Engineer',
                      'Cybersecurity',
                      'Product Manager',
                      'Blockchain Developer',
                      'Digital Marketing',
                      'Game Developer'
                    ].map((title) => (
                      <label key={title} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.jobTitles.includes(title)}
                          onChange={() => toggleJobTitleFilter(title)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{title}</span>
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
                  <IoChevronDown className={`w-4 h-4 transition-transform duration-200 ${isPriceExpanded ? 'rotate-180' : ''}`} />
                </h3>
                {isPriceExpanded && (
                  <div className="space-y-2">
                    {[
                      'Under $50',
                      '$50 - $100',
                      '$100 - $200', 
                      'Over $200'
                    ].map((range) => (
                      <label key={range} className="flex items-center">
                        <input
                          type="radio"
                          name="priceRange"
                          value={range}
                          checked={filters.priceRange === range}
                          onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{range}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Search Button */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={fetchResults}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium flex items-center justify-center gap-2"
                >
                  <IoSearch className="w-4 h-4" />
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Right Content - Results */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center min-h-[500px] w-full">
                <div className="flex flex-col items-center justify-center">
                  <div className="flex items-center gap-3 text-gray-600 bg-white rounded-xl shadow-lg border px-8 py-6">
                    <svg className="animate-spin w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                    </svg>
                    <span className="text-lg font-medium text-gray-700">Loading results...</span>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="text-red-600 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Results</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={fetchResults}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Try Again
                </button>
              </div>
            ) : filteredResults.displayCourses.length === 0 && filteredResults.displayMentors.length === 0 && !loading ? (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or filters to find more results.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Courses Section */}
                {filteredResults.displayCourses.length > 0 && (
                  <div>
                    {activeTab === 'all' && (
                      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <IoBookSharp className="text-green-600" />
                        Courses
                      </h2>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredResults.displayCourses.map((course, index) => (
                        <CourseCard key={course._id || course.id || `course-${index}`} course={course} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Mentors Section */}
                {filteredResults.displayMentors.length > 0 && (
                  <div>
                    {activeTab === 'all' && (
                      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <IoPerson className="text-blue-600" />
                        Mentors
                      </h2>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredResults.displayMentors.map((mentor, index) => (
                        <MentorCard key={mentor._id || mentor.id || `mentor-${index}`} mentor={mentor} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Pagination */}
                {filteredResults.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 mt-8">
                    <button
                      onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
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
                      let endPage = Math.min(filteredResults.totalPages, startPage + showPages - 1);

                      // Adjust start if we're near the end
                      if (endPage - startPage < showPages - 1) {
                        startPage = Math.max(1, endPage - showPages + 1);
                      }

                      // Show first page if not visible
                      if (startPage > 1) {
                        pages.push(
                          <button
                            key={1}
                            onClick={() => handlePageChange(1)}
                            className={`flex items-center justify-center w-10 h-10 text-sm font-medium rounded-md transition-colors ${
                              currentPage === 1
                                ? "text-white bg-blue-600 border border-blue-600"
                                : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                            }`}
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
                            onClick={() => handlePageChange(i)}
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
                      if (endPage < filteredResults.totalPages) {
                        if (endPage < filteredResults.totalPages - 1) {
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
                            key={filteredResults.totalPages}
                            onClick={() => handlePageChange(filteredResults.totalPages)}
                            className={`flex items-center justify-center w-10 h-10 text-sm font-medium rounded-md transition-colors ${
                              currentPage === filteredResults.totalPages
                                ? "text-white bg-blue-600 border border-blue-600"
                                : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {filteredResults.totalPages}
                          </button>
                        );
                      }

                      return pages;
                    })()}

                    <button
                      onClick={() => handlePageChange(Math.min(currentPage + 1, filteredResults.totalPages))}
                      disabled={currentPage === filteredResults.totalPages}
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
            )}
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default SearchPage;
