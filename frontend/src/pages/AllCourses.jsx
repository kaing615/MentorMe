import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
// import axios from "../api/clients/public.client"; // Uncomment and adjust path if you have a custom axios client
import minatoPic from "../assets/minato.jpg";

const AllCourses = () => {
  const { mentorId } = useParams(); // Get mentor ID from URL params
  const navigate = useNavigate();

  // Chuẩn bị cho tích hợp API, khởi tạo state rỗng
  const [mentor, setMentor] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 12;

  // Get unique categories and levels
  const categories = [
    "all",
    ...new Set(allCourses.map((course) => course.category)),
  ];
  const levels = ["all", ...new Set(allCourses.map((course) => course.level))];

  // Filter and search logic
  useEffect(() => {
    let filtered = allCourses;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (course) => course.category === selectedCategory
      );
    }

    // Level filter
    if (selectedLevel !== "all") {
      filtered = filtered.filter((course) => course.level === selectedLevel);
    }

    // Sort
    filtered = filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rating":
          return b.rating - a.rating;
        case "popular":
          return b.lectures - a.lectures;
        default: // latest
          return b.id - a.id;
      }
    });

    setFilteredCourses(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, selectedCategory, selectedLevel, sortBy, allCourses]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);
  const startIndex = (currentPage - 1) * coursesPerPage;
  const currentCourses = filteredCourses.slice(
    startIndex,
    startIndex + coursesPerPage
  );

  // Fetch data từ API (chuẩn bị tích hợp)
  useEffect(() => {
    // TODO: Tích hợp API ở đây, ví dụ:
    // axios.get(`/mentors/${mentorId}`).then(res => {
    //   if (res.data) setMentor(res.data);
    // });
    // axios.get(`/mentors/${mentorId}/courses`).then(res => {
    //   if (res.data) setAllCourses(res.data);
    // });
  }, [mentorId]);

  const handleCourseClick = (courseId) => {
    // Navigate to course detail page
    navigate(`/courses`); //return to /${courseId}
  };

  const handleBackToMentor = () => {
    navigate(`/mentor/home`); // return to ${mentorId}
  };

  return (
    <div className="min-h-screen bg-white-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handleBackToMentor}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
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
              Back to Mentor
            </button>
          </div>

          <div className="flex items-center gap-6">
            <img
              src={mentor?.avatar || "/vite.svg"}
              alt={mentor?.name || "Mentor"}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {mentor?.name || "Mentor Name"}
              </h1>
              <p className="text-gray-600">{mentor?.title || "Mentor Title"}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>{mentor?.totalCourses || 0} courses</span>
                <span>
                  {(mentor?.totalStudents || 0).toLocaleString()} students
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500">★</span>
                  <span>{mentor?.averageRating || 0} rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </option>
              ))}
            </select>

            {/* Level Filter */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level === "all" ? "All Levels" : level}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="latest">Latest</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-600">
              Showing {filteredCourses.length} of {allCourses.length} courses
            </span>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setSelectedLevel("all");
                setSortBy("latest");
              }}
              className="text-sm text-blue-600 hover:text-blue-800 transition"
            >
              Clear all filters
            </button>
          </div>
        </div>
      </div>

      {/* Courses Grid Section */}
      <div
        className="max-w-7xl mx-auto px-6 md:px-8 py-8"
        style={{ height: "1500px" }}
      >
        {/* Courses Grid - Fixed height for 3 rows */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          style={{
            minHeight: "900px",
            alignContent: "start",
          }}
        >
          {currentCourses.map((course) => (
            <div
              key={course.id}
              onClick={() => handleCourseClick(course.id)}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 cursor-pointer"
            >
              <div className="h-48 w-full bg-gray-200 rounded-t-lg overflow-hidden">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {course.category}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {course.level}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
                  {course.title}
                </h3>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {course.description}
                </p>

                <div className="flex items-center gap-1 mb-2">
                  <div className="flex text-yellow-400 text-sm">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={i < Math.floor(course.rating) ? "★" : "☆"}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 ml-1">
                    {course.rating} ({course.lectures})
                  </span>
                </div>

                <div className="text-xs text-gray-500 mb-3">
                  {course.duration} • {course.lessons} lessons
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">
                    ${course.price}
                  </span>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                    Enroll Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {currentCourses.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No courses found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 hover:bg-gray-100 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded transition ${
                    currentPage === page
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-gray-100 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllCourses;
