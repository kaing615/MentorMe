import React, { useEffect, useState, useRef } from "react";
// import axios from "../api/clients/public.client"; // Uncomment and adjust path if you have a custom axios client
import minatoPic from "../assets/minato.jpg";
const MentorPage = () => {
  const defaultMentor = {
    name: "Cong Khoa Van",
    title: "Fullstack Developer, Teacher",
    totalStudents: 1000,
    reviewsCount: 154,
    website: "#",
    twitter: "#",
    youtube: "#",
    about:
      "Cong Khoa Van is a highly skilled professional with a solid foundation in computer science. He is known for his expertise in designing and developing user-centric digital solutions.",
    expertise: [
      "User Experience Design",
      "User Interface Design",
      "Web Development",
      "Mobile App Design",
    ],
    experience:
      "Van has a comprehensive background in UX/UI design, having worked with renowned companies. His portfolio includes a diverse range of projects across various sectors, mobile apps, and e-commerce platforms.",
    averageRating: 4.6,
    ratingStats: [
      { star: 5, percent: 65 },
      { star: 4, percent: 25 },
      { star: 3, percent: 6 },
      { star: 2, percent: 2 },
      { star: 1, percent: 2 },
    ],
  };
  const defaultCourses = [
    {
      id: 1,
      title: "Programming Fundamentals",
      duration: "24h",
      lessons: 100,
      level: "Beginner",
      rating: 4.8,
      lectures: 154,
      price: 149,
    },
    {
      id: 2,
      title: "JavaScript Basics",
      duration: "18h",
      lessons: 80,
      level: "Beginner",
      rating: 4.7,
      lectures: 120,
      price: 149,
    },
    {
      id: 3,
      title: "React for Beginners",
      duration: "20h",
      lessons: 90,
      level: "Beginner",
      rating: 4.9,
      lectures: 130,
      price: 149,
    },
    {
      id: 4,
      title: "Web Development",
      duration: "30h",
      lessons: 110,
      level: "Beginner",
      rating: 4.8,
      lectures: 140,
      price: 149,
    },
    {
      id: 5,
      title: "Node.js Backend Development",
      duration: "28h",
      lessons: 95,
      level: "Intermediate",
      rating: 4.9,
      lectures: 165,
      price: 199,
    },
    {
      id: 6,
      title: "Python for Data Science",
      duration: "35h",
      lessons: 120,
      level: "Intermediate",
      rating: 4.8,
      lectures: 180,
      price: 179,
    },
    {
      id: 7,
      title: "MongoDB Database Design",
      duration: "22h",
      lessons: 75,
      level: "Beginner",
      rating: 4.7,
      lectures: 125,
      price: 139,
    },
    {
      id: 8,
      title: "Advanced CSS & SASS",
      duration: "26h",
      lessons: 85,
      level: "Intermediate",
      rating: 4.8,
      lectures: 145,
      price: 159,
    },
    {
      id: 9,
      title: "Vue.js Complete Guide",
      duration: "32h",
      lessons: 105,
      level: "Intermediate",
      rating: 4.9,
      lectures: 175,
      price: 189,
    },
    {
      id: 10,
      title: "TypeScript Mastery",
      duration: "24h",
      lessons: 90,
      level: "Advanced",
      rating: 4.8,
      lectures: 155,
      price: 199,
    },
  ];
  const defaultReviews = [
    {
      id: 1,
      userName: "Lamine Yamal",
      rating: 5,
      date: "Reviewed on 22nd June, 2025",
      comment:
        "I was honestly nervous at first since I had zero experience in this field. But my mentor, Viet Thang Nguyen, made everything so easy to understand! He broke down all the tricky stuff into simple, real-life tips, and our chats were actually fun and super motivating. I feel way more confident now thanks to his guidance!",
    },
    {
      id: 2,
      userName: "Sarah Johnson",
      rating: 5,
      date: "Reviewed on 22nd June, 2025",
      comment:
        "I was honestly nervous at first since I had zero experience in this field. But my mentor, Viet Thang Nguyen, made everything so easy to understand! He broke down all the tricky stuff into simple, real-life tips, and our chats were actually fun and super motivating. I feel way more confident now thanks to his guidance!",
    },
    {
      id: 3,
      userName: "Michael Chen",
      rating: 5,
      date: "Reviewed on 22nd June, 2025",
      comment:
        "I was honestly nervous at first since I had zero experience in this field. But my mentor, Viet Thang Nguyen, made everything so easy to understand! He broke down all the tricky stuff into simple, real-life tips, and our chats were actually fun and super motivating. I feel way more confident now thanks to his guidance!",
    },
  ];

  const [mentor, setMentor] = useState(defaultMentor);
  const [courses, setCourses] = useState(defaultCourses);
  const [reviews, setReviews] = useState(defaultReviews);
  // You can set loading and error state if needed
  // const [loading, setLoading] = useState(false);
  // const [error, setError] = useState(null);

  // Fetch data from backend API and overwrite default data if available
  useEffect(() => {
    // Example API endpoints (replace with your actual endpoints)
    // const mentorId = "1"; // Get from route or props if needed
    // setLoading(true);
    // axios.get(`/mentors/${mentorId}`).then(res => {
    //   if (res.data) setMentor(res.data);
    // }).catch(err => setError(err));
    // axios.get(`/mentors/${mentorId}/courses`).then(res => {
    //   if (res.data && Array.isArray(res.data) && res.data.length > 0) setCourses(res.data);
    // });
    // axios.get(`/mentors/${mentorId}/reviews`).then(res => {
    //   if (res.data && Array.isArray(res.data) && res.data.length > 0) setReviews(res.data);
    // });
    // setLoading(false);
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
    <div className="min-h-screen bg-gray-50 flex flex-col py-0">
      <main className="w-full flex flex-col">
        <div className="w-full mt-8 p-0">
          {/* Mentor Info Section */}
          {mentor && (
            <div className="w-full flex flex-col md:flex-row md:items-start md:justify-between max-w-7xl mx-auto w-full px-2 md:px-4">
              {/* Left info + about */}
              <div className="flex-1 min-w-0 pr-0 md:pr-12">
                <div className="text-base text-gray-500 mb-1">Mentor</div>
                <h1 className="text-4xl font-bold text-gray-900 mb-1">
                  Viet Thang Nguyen
                </h1>
                <div className="text-lg text-gray-700 mb-4 font-medium">
                  Fullstack Developer, Teacher
                </div>
                <div className="flex gap-16 mb-6">
                  <div>
                    <div className="text-base text-gray-500 font-medium mb-1">
                      Total Students
                    </div>
                    <div className="text-3xl font-bold text-gray-900">1000</div>
                  </div>
                  <div>
                    <div className="text-base text-gray-500 font-medium mb-1">
                      Reviews
                    </div>
                    <div className="text-3xl font-bold text-gray-900">154</div>
                  </div>
                </div>
                {/* About Section merged here */}
                <div className="w-full mt-0">
                  <h3 className="text-xl font-bold mb-2 text-gray-900">
                    About Viet Thang Nguyen
                  </h3>
                  <p className="mb-6 text-gray-700 text-justify">
                    Viet Thang Nguyen is a highly skilled IT professional with a
                    solid foundation in computer science from the United States.
                    With over a decade of experience in designing and developing
                    user-centric digital solutions, Thang excels at building
                    intuitive and impactful applications. His strong background
                    in IT, combined with a keen eye for usability and
                    innovation, enables him to create seamless digital
                    experiences that truly make a difference.
                  </p>
                  <h4 className="font-bold mb-2 text-gray-900">
                    Areas of Expertise
                  </h4>
                  <ul className="list-disc list-inside mb-6 text-gray-800">
                    <li>User Experience (UX) Design</li>
                    <li>User Interface (UI) Design</li>
                    <li>Information Architecture</li>
                    <li>Interaction Design</li>
                    <li>Visual Design</li>
                    <li>Usability Testing</li>
                    <li>Wireframing and Prototyping</li>
                    <li>Design Thinking</li>
                  </ul>
                  <h4 className="font-bold mb-2 text-gray-900">
                    Professional Experience
                  </h4>
                  <p className="text-gray-700 text-justify">
                    Ronald Richard has an extensive professional background in
                    UX/UI design, having worked with renowned companies such as
                    [Company Name] and [Company Name]. His portfolio includes a
                    diverse range of projects spanning web applications, mobile
                    apps, and e-commerce platforms.
                  </p>
                </div>
              </div>
              {/* Right avatar & info buttons */}
              <div className="flex flex-col items-center w-80 flex-shrink-0 mt-8 md:mt-0">
                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gray-100 shadow mb-6 bg-gray-200 ">
                  <img
                    src="https://randomuser.me/api/portraits/men/32.jpg"
                    alt="Viet Thang Nguyen"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <a
                    href="#"
                    className="w-full border border-gray-300 rounded py-2 text-center text-gray-700 font-medium hover:bg-gray-100 transition"
                  >
                    Website
                  </a>
                  <a
                    href="#"
                    className="w-full border border-gray-300 rounded py-2 text-center text-gray-700 font-medium hover:bg-gray-100 transition"
                  >
                    Twitter
                  </a>
                  <a
                    href="#"
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
          <section
            className="w-full py-14 bg-white"
            style={{ background: "#f8f9fb" }}
          >
            <div className="max-w-7xl mx-auto w-full px-2 md:px-4">
              <div className="flex justify-between items-center mb-8 px-2">
                <h3 className="text-[24px] font-bold text-[#222]">
                  More Courses by{" "}
                  <span className="text-[#2563eb]">{mentor?.name}</span>
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
                    <div
                      key={course.id}
                      className="course-card bg-white rounded-2xl border border-[#e3eaf3] shadow-sm flex flex-col p-5 min-w-[270px] max-w-[300px] w-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                      style={{ scrollSnapAlign: "start" }}
                    >
                      <div className="h-[140px] w-full bg-gray-200 rounded-xl mb-4 overflow-hidden flex items-center justify-center">
                        <img
                          src={minatoPic}
                          alt="course"
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="font-semibold text-[18px] text-[#222] mb-1 leading-tight line-clamp-2">
                        {course.title}
                      </div>
                      <div className="text-xs text-[#6b7280] mb-1">
                        By {mentor?.name}
                      </div>
                      <div className="flex items-center gap-1 text-sm mb-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-[#fbbf24] text-base">
                            ★
                          </span>
                        ))}
                        <span className="text-xs text-[#6b7280] ml-2 font-semibold">
                          (1200 <span className="font-bold">Ratings</span>)
                        </span>
                      </div>
                      <div className="text-xs text-[#6b7280] mb-2">
                        {course.duration}. {course.lectures} Lectures.{" "}
                        {course.level}
                      </div>
                      <div className="font-bold text-[#222] text-lg mt-auto">
                        ${course.price}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Mentor Reviews */}
          <div className="mt-8">
            <div className="max-w-7xl mx-auto w-full px-2 md:px-4">
              <h3 className="text-2xl font-bold mb-6 text-gray-900">
                Mentee Reviews
              </h3>

              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left side - Rating Summary */}
                <div className="lg:w-1/3">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-yellow-500 text-4xl">★</span>
                    <div>
                      <div className="text-3xl font-bold text-gray-900">
                        {mentor?.averageRating || 4.6}
                      </div>
                      <div className="text-sm text-gray-600">
                        {(reviews.length * 48951).toLocaleString()} reviews
                      </div>
                    </div>
                  </div>

                  {/* Rating breakdown */}
                  <div className="space-y-2">
                    {mentor?.ratingStats?.map((stat, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-sm ${
                                i < stat.star
                                  ? "text-yellow-500"
                                  : "text-gray-300"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mx-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{ width: `${stat.percent}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8">
                          {stat.percent}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right side - Reviews */}
                <div className="lg:w-2/3">
                  <div className="space-y-4">
                    {reviews.map((review, index) => (
                      <div
                        key={review.id}
                        className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                            <img
                              src={`https://randomuser.me/api/portraits/${
                                index % 2 === 0 ? "men" : "women"
                              }/${30 + index}.jpg`}
                              alt={review.userName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-gray-900">
                                {review.userName}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-500 text-lg">
                                  ★
                                </span>
                                <span className="font-semibold text-gray-900">
                                  {review.rating}
                                </span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500 mb-3">
                              {review.date}
                            </div>
                            <p className="text-gray-700 leading-relaxed">
                              {review.comment}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-start mt-8">
                    <button
                      className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                      onClick={() => {
                        // API use
                        console.log(
                          "Navigate to reviews page - API to be implemented"
                        );
                      }}
                    >
                      View more Reviews
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MentorPage;
