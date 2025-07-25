import React from 'react';
import minatoImg from "../assets/minato.webp";
import oipImg from "../assets/OIP.webp";
import reactSvg from "../assets/react.svg";

const categories = [
  { icon: "📚", name: "Astrology", count: 17 },
  { icon: "💻", name: "Development", count: 19 },
  { icon: "📈", name: "Marketing", count: 15 },
  { icon: "🧠", name: "Mindset", count: 9 },
];

const courses = Array(4).fill({
  title: "Programming Fundamentals",
  mentor: "Ronald Richards",
  rating: 4.8,
  ratings: 1200,
  hours: 22,
  lectures: 155,
  level: "Beginner",
  price: 149.9,
  img: oipImg, 
});

const mentors = Array(4).fill({
  name: "Ronald Richards",
  students: "2400",
  reviews: "4.8",
  img: minatoImg,
});

const testimonials = [
    {
        name: "Jane Doe",
        review: "This platform has transformed my learning experience!",
        img: minatoImg,
    },
    {
        name: "John Smith",
        review: "The mentors are incredibly knowledgeable and supportive.",
        img: minatoImg,
    },
];


const HomeScreen = () => {
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="w-full bg-white pt-8 pb-4 px-2 md:px-0 flex flex-col items-center">
        <div className="max-w-7xl w-full flex flex-col md:flex-row items-center gap-8 mx-auto">
          <div className="flex-1 flex flex-col gap-4 items-start">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 leading-tight">
              Unlock Your Potential
              <br />
              with MentorMe
            </h1>
            <p className="text-slate-600 text-base md:text-lg max-w-xl">
              Connect with top mentors, learn new skills, and accelerate your
              growth. MentorMe helps you find the right guidance for your
              personal and professional journey.
            </p>
            <button className="mt-2 px-6 py-2 bg-blue-700 text-white rounded-lg font-semibold shadow hover:bg-blue-800 transition">
              Get Started
            </button>
          </div>
          <div className="flex-1 flex justify-center items-center">
            <div className="flex flex-col gap-4 items-center">
              <img
                src= {reactSvg}
                alt="hero"
                className="w-48 h-48 object-contain rounded-full border-4 border-blue-200"
              />
              <div className="flex gap-2">
                <img
                  src= {minatoImg}
                  alt="mentor1"
                  className="w-16 h-16 rounded-full border-2 border-white -ml-2"
                />
                <img
                  src= {minatoImg}
                  alt="mentor2"
                  className="w-16 h-16 rounded-full border-2 border-white -ml-2"
                />
                <img
                  src= {reactSvg}
                  alt="mentor3"
                  className="w-16 h-16 rounded-full border-2 border-white -ml-2"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full bg-white py-6 border-b">
        <div className="max-w-7xl mx-auto w-full flex flex-row justify-between items-center text-center gap-2">
          {[
            "Download our app",
            "Courses for all levels",
            "Top mentors",
            "Success stories",
          ].map((stat, idx) => (
            <div key={idx} className="flex-1 flex flex-col gap-1">
              <span className="text-2xl font-bold text-blue-700">X+</span>
              <span className="text-slate-500 text-sm">{stat}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Top Categories */}
      <section className="w-full py-8">
        <div className="max-w-7xl mx-auto w-full">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Top Categories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((cat, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow p-6 flex flex-col items-center gap-2 border hover:shadow-md transition"
              >
                <span className="text-3xl">{cat.icon}</span>
                <span className="font-semibold text-base">{cat.name}</span>
                <span className="text-xs text-slate-500">
                  {cat.count} Courses
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Courses */}
      <section className="w-full py-8 bg-white border-t">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">Top Courses</h2>
            <button className="text-blue-700 text-sm font-semibold hover:underline">
              View all
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {courses.map((course, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow p-0 border flex flex-col hover:shadow-lg transition"
              >
                <img
                  src={course.img}
                  alt={course.title}
                  className="w-full h-32 object-cover rounded-t-xl"
                />
                <div className="p-4 flex flex-col flex-1">
                  <div className="font-semibold mb-1 text-base line-clamp-2">
                    {course.title}
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    By {course.mentor}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-yellow-500 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>
                        {i < Math.round(course.rating) ? "★" : "☆"}
                      </span>
                    ))}
                    <span className="text-gray-500 ml-1">
                      ({course.ratings} Ratings)
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    {course.hours} Total Hours. {course.lectures} Lectures.{" "}
                    {course.level}
                  </div>
                  <div className="font-bold text-blue-600 text-lg mt-auto">
                    ${course.price}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Mentors */}
      <section className="w-full py-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">Top Mentors</h2>
            <button className="text-blue-700 text-sm font-semibold hover:underline">
              See all
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {mentors.map((mentor, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow p-0 border flex flex-col items-center hover:shadow-lg transition"
              >
                <img
                  src={mentor.img}
                  alt={mentor.name}
                  className="w-24 h-24 object-cover rounded-full mt-4"
                />
                <div className="p-4 flex flex-col items-center flex-1">
                  <div className="font-semibold mb-1 text-base text-center">
                    {mentor.name}
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    {mentor.students} Students
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    {mentor.reviews} Reviews
                  </div>
                  <button className="mt-2 px-4 py-1 bg-blue-700 text-white rounded font-semibold text-xs">
                    See Mentor
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="w-full py-8 bg-white border-t">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">
              What Our Customer Say
            </h2>
            <div className="flex gap-2">
              <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                &lt;
              </button>
              <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                &gt;
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow p-6 border flex flex-col gap-4"
              >
                <div className="text-blue-700 text-3xl">“</div>
                <div className="text-slate-700 text-base flex-1">{t.text}</div>
                <div className="flex items-center gap-2 mt-2">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <span className="font-semibold text-sm text-slate-700">
                    {t.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Become a Mentor & Education Section */}
      <section className="w-full py-12">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <img
              src= {minatoImg}
              alt="mentor"
              className="w-32 h-32 rounded-full object-cover"
            />
            <h3 className="text-xl font-bold text-slate-800">
              Become an Mentor
            </h3>
            <p className="text-slate-600">
              MentorMe provides you with tools and access to reach millions of
              students as a mentor. Join now and make the most out of the mentor
              cycle.
            </p>
            <button className="px-4 py-2 bg-blue-700 text-white rounded font-semibold">
              Become a Mentor
            </button>
          </div>
          <div className="flex flex-col items-center md:items-start gap-4">
            <img
              src= {oipImg}
              alt="education"
              className="w-32 h-32 object-contain"
            />
            <h3 className="text-xl font-bold text-slate-800">
              Transform your life through education
            </h3>
            <p className="text-slate-600">
              Access thousands of courses, mentoring sessions, and learning
              resources to help you grow and succeed.
            </p>
            <button className="px-4 py-2 bg-blue-700 text-white rounded font-semibold">
              Discover Courses
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeScreen;



