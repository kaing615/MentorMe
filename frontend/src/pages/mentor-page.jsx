import React, { useEffect, useState, useRef } from "react";
import profileApi from "../api/modules/profile.api";
import courseApi from "../api/modules/course.api";
// import axios from "../api/clients/public.client"; // Uncomment and adjust path if you have a custom axios client
import minatoPic from "../assets/minato.jpg";
const MentorPage = () => {
  // State declarations
  const [mentor, setMentor] = useState(null);
  const [courses, setCourses] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch data from backend API and overwrite default data if available
  useEffect(() => {
    const fetchMentorData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch mentor profile
        const mentorRes = await profileApi.getProfile();
        if (mentorRes?.data) setMentor(mentorRes.data);

        // Fetch mentor's courses
        const mentorId = mentorRes?.data?.user?._id;
        if (mentorId) {
          const coursesRes = await courseApi.getCoursesByMentor(mentorId);
          if (Array.isArray(coursesRes)) setCourses(coursesRes);
        }

        // Fetch mentor's reviews (if you have this API)
        // const reviewsRes = await reviewApi.getReviewsByMentor(mentorId);
        // if (Array.isArray(reviewsRes)) setReviews(reviewsRes);
      } catch (err) {
        setError("Không thể tải dữ liệu mentor hoặc khóa học");
      }
      setLoading(false);
    };
    fetchMentorData();
  }, []);

  // --- Carousel logic for More Courses section ---
  const mentorCoursesRef = useRef(null);
  const [hoveredCarousel, setHoveredCarousel] = useState(null);
  const scrollCarouselBy = (ref, direction) => {
    const container = ref.current;
    if (!container) return;

    // Get the first card to calculate dimensions
    const card = container.querySelector(".course-card");
    if (!card) return;

    const cardWidth = card.offsetWidth;
    const gap = 24; // gap-6 = 1.5rem = 24px
    const scrollAmount = (cardWidth + gap) * 3; // Scroll exactly 3 cards

    container.scrollBy({
      left: direction * scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="min-h-screen bg-white-50 flex flex-col py-0">
      <main className="w-full flex flex-col">
        <div className="w-full mt-8 p-0">
          {/* Mentor Info Section - fetch and display real data */}
          {mentor && (
            <div className="w-full flex flex-col md:flex-row md:items-start md:justify-between max-w-7xl mx-auto w-full px-2 md:px-4">
              {/* Left info + about */}
              <div className="flex-1 min-w-0 pr-0 md:pr-12">
                <div className="text-base text-gray-500 mb-1">Mentor</div>
                <h1 className="text-4xl font-bold text-gray-900 mb-1">
                  {mentor?.user?.firstName || "Mentor"}{" "}
                  {mentor?.user?.lastName || ""}
                </h1>
                <div className="text-lg text-gray-700 mb-4 font-medium">
                  {mentor?.jobTitle || mentor?.user?.jobTitle || ""}
                </div>
                <div className="flex gap-16 mb-6">
                  <div>
                    <div className="text-base text-gray-500 font-medium mb-1">
                      Total Students
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                      {mentor?.totalStudents || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-base text-gray-500 font-medium mb-1">
                      Reviews
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                      {mentor?.reviewsCount || "N/A"}
                    </div>
                  </div>
                </div>
                {/* About Section merged here */}
                <div className="w-full mt-0">
                  <h3 className="text-xl font-bold mb-2 text-gray-900">
                    About {mentor?.user?.firstName || "Mentor"}
                  </h3>
                  <p className="mb-6 text-gray-700 text-justify">
                    {mentor?.bio || mentor?.user?.bio || "No bio available."}
                  </p>
                  <h4 className="font-bold mb-2 text-gray-900">
                    Areas of Expertise
                  </h4>
                  <ul className="list-disc list-inside mb-6 text-gray-800">
                    {(mentor?.skills || mentor?.user?.skills || []).map(
                      (skill, idx) => (
                        <li key={idx}>{skill}</li>
                      )
                    )}
                  </ul>
                  <h4 className="font-bold mb-2 text-gray-900">
                    Professional Experience
                  </h4>
                  <p className="text-gray-700 text-justify">
                    {mentor?.greatestAchievement ||
                      mentor?.user?.greatestAchievement ||
                      "No professional experience provided."}
                  </p>
                </div>
              </div>
              {/* Right avatar & info buttons */}
              <div className="flex flex-col items-center w-80 flex-shrink-0 mt-8 md:mt-0">
                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gray-100 shadow mb-6 bg-gray-200 ">
                  <img
                    src={
                      mentor?.user?.avatarUrl ||
                      "https://randomuser.me/api/portraits/men/32.jpg"
                    }
                    alt={mentor?.user?.firstName || "Mentor"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <a
                    href={mentor?.links?.website || "#"}
                    className="w-full border border-gray-300 rounded py-2 text-center text-gray-700 font-medium hover:bg-gray-100 transition"
                  >
                    Website
                  </a>
                  <a
                    href={mentor?.links?.twitter || "#"}
                    className="w-full border border-gray-300 rounded py-2 text-center text-gray-700 font-medium hover:bg-gray-100 transition"
                  >
                    Twitter
                  </a>
                  <a
                    href={mentor?.links?.youtube || "#"}
                    className="w-full border border-gray-300 rounded py-2 text-center text-gray-700 font-medium hover:bg-gray-100 transition"
                  >
                    Youtube
                  </a>
                  <button className="w-full bg-gray-900 text-white rounded py-2 font-semibold mt-2 hover:bg-gray-800 transition">
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* More Courses Section - Figma style, horizontal carousel, closer match */}
          <section className="w-full py-14" style={{ background: "#f9fbfd" }}>
            <div className="max-w-7xl mx-auto w-full px-2 md:px-4">
              <div className="flex justify-between items-center mb-8 px-2">
                <h3 className="text-[24px] font-bold text-[#222]">
                  More Courses by {mentor?.user?.firstName || "Mentor"}
                  <span className="text-[#F8FAFC]">{mentor?.name}</span>
                </h3>
                <div className="flex gap-3">
                  <button
                    type="button"
                    aria-label="Scroll left"
                    className="w-10 h-10 rounded-md bg-[#c9d6e7] flex items-center justify-center text-xl text-white hover:bg-[#b0c4de] transition"
                    onClick={() => scrollCarouselBy(mentorCoursesRef, -1)}
                  >
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    aria-label="Scroll right"
                    className="w-10 h-10 rounded-md bg-[#c9d6e7] flex items-center justify-center text-xl text-white hover:bg-[#b0c4de] transition"
                    onClick={() => scrollCarouselBy(mentorCoursesRef, 1)}
                  >
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div
                className="overflow-x-auto no-scrollbar"
                ref={mentorCoursesRef}
                style={{
                  WebkitOverflowScrolling: "touch",
                  scrollSnapType: "x mandatory",
                  scrollBehavior: "smooth",
                }}
                tabIndex={-1}
              >
                <div className="inline-flex gap-6 pb-2">
                  {courses.map((course, idx) => (
                    <a
                      key={course._id || course.id || idx}
                      href={`/mentor/courses/${course._id || course.id}`}
                      className="course-card bg-white rounded-xl border border-gray-200 shadow-lg flex flex-col min-w-[300px] max-w-[340px] w-full transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer overflow-hidden"
                      style={{
                        scrollSnapAlign: "start",
                        textDecoration: "none",
                      }}
                    >
                      <div className="h-[140px] w-full bg-white-100 rounded-t-xl flex items-center justify-center">
                        <img
                          src={course.thumbnail || minatoPic}
                          alt={course.title}
                          className="object-cover h-[120px] w-[92%] rounded-xl"
                          style={{ marginTop: "4px", marginBottom: "4px" }}
                        />
                      </div>
                      <div className="flex flex-col px-5 py-4 flex-1">
                        <div className="font-bold text-[20px] text-gray-900 mb-2 leading-tight">
                          {course.title}
                        </div>
                        <div className="text-base text-gray-700 font-normal mb-1">
                          By{" "}
                          {course.authorName ||
                            course.mentorName ||
                            mentor?.user?.firstName ||
                            "Mentor"}
                        </div>
                        <div className="flex items-center gap-1 text-base mb-2">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-lg ${
                                i < (course.rating || 0)
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                          <span className="text-base text-gray-700 ml-2 font-bold">
                            ({course.ratingsCount || 0}{" "}
                            <span className="font-bold">Ratings</span>)
                          </span>
                        </div>
                        <div className="text-base text-gray-700 mb-2">
                          {course.duration || course.totalHours || ""}.{" "}
                          {course.lectures || course.totalLectures || ""}{" "}
                          Lectures. {course.category || course.level || ""}
                        </div>
                        {course.level && (
                          <div className="font-bold text-green-600 mb-2">
                            Level: {course.level}
                          </div>
                        )}
                        <div className="font-bold text-black text-2xl mt-auto">
                          ${course.price}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </section>
          {/* Mentor Reviews Section - empty UI, ready for API, aligned with My Courses */}
          <section
            className="w-full py-10 bg-white"
            style={{ background: "white" }}
          >
            <div className="max-w-7xl mx-auto w-full px-2 md:px-4">
              <h3 className="text-[24px] font-bold text-[#222] mb-8">
                Mentee Reviews
              </h3>
              <div className="flex flex-col gap-6 min-h-[180px]">
                {/* No reviews yet, ready for API integration */}
              </div>
              <div className="flex justify-center mt-8">
                <button className="border border-gray-300 rounded px-6 py-2 text-gray-700 font-medium hover:bg-gray-100 transition">
                  View more Reviews
                </button>
              </div>
            </div>
          </section>
        </div>
        {/* Close .w-full.mt-8.p-0 */}
      </main>
    </div>
  );
};

export default MentorPage;
