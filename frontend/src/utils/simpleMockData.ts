import minatoImg from "../assets/minato.webp";
import oipImg from "../assets/OIP.webp";
import boImg from "../assets/Bơ.jpg";

export const generateMenteeProfile = () => {
  return {
    firstName: "Minato",
    lastName: "Namikaze",
    email: "minato.namikaze@example.com",
    headline: "Computer Science Student",
    bio: "Passionate computer science student looking to learn from experienced professionals. Interested in web development, machine learning, and software engineering best practices.",
    profileImage: minatoImg,
    website: "https://minato-portfolio.com",
    twitter: "https://twitter.com/minato_dev",
    linkedin: "https://linkedin.com/in/minato-namikaze",
    youtube: "",
    facebook: "https://facebook.com/minato.namikaze",
    joinedDate: "2024-01-15",
    lastActive: new Date().toISOString(),
    coursesCompleted: 12,
    totalCoursesEnrolled: 18,
    totalLearningHours: 156,
    achievements: ["First Course Completed", "Active Learner", "Goal Achiever"],
    goals: [
      "Master Full-Stack Development",
      "Land Software Engineering Internship",
      "Build Portfolio Projects",
    ],
    interests: [
      "Web Development",
      "Machine Learning",
      "Mobile App Development",
      "Data Science",
    ],
  };
};

export const generateMenteeEnrolledCourses = (count = 6) => {
  const courseImages = [minatoImg, oipImg, boImg];
  const levels = ["Beginner", "Intermediate", "Advanced"];
  const instructors = [
    "Ronald Richards",
    "Devon Lane",
    "Sarah Johnson",
    "Mike Chen",
    "Emily Davis",
  ];

  const courses = [];
  for (let i = 0; i < count; i++) {
    courses.push({
      id: i + 1,
      title: `Course ${i + 1}: Web Development Fundamentals`,
      instructor: instructors[i % instructors.length],
      image: courseImages[i % courseImages.length],
      rating: 4.5 + Math.random() * 0.5,
      ratingsCount: 100 + Math.floor(Math.random() * 1900),
      totalHours: 10 + Math.floor(Math.random() * 40),
      lectures: 20 + Math.floor(Math.random() * 180),
      level: levels[Math.floor(Math.random() * 3)],
      progress: Math.floor(Math.random() * 101),
      enrolledDate: new Date(
        2024,
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28)
      ),
      lastWatched: new Date(),
      isCompleted: Math.random() > 0.6,
      price: 49 + Math.floor(Math.random() * 250),
      certificate: Math.random() > 0.5,
    });
  }
  return courses;
};

export const generateMentors = (count = 10) => {
  const mentorImages = [minatoImg, oipImg, boImg];
  const specialties = [
    "Frontend Development",
    "Backend Development",
    "Full Stack",
    "Data Science",
    "UI/UX Design",
    "DevOps",
    "Mobile Development",
  ];

  const teachingSubjects = [
    ["React", "JavaScript", "CSS"],
    ["Node.js", "Python", "Database"],
    ["React", "Node.js", "MongoDB"],
    ["Python", "Machine Learning", "Statistics"],
    ["Figma", "Design Systems", "User Research"],
    ["Docker", "AWS", "CI/CD"],
    ["React Native", "Flutter", "iOS"],
  ];

  const mentors = [];
  for (let i = 0; i < count; i++) {
    mentors.push({
      id: i + 1,
      name: `Mentor ${i + 1}`,
      email: `mentor${i + 1}@example.com`,
      avatar: mentorImages[i % mentorImages.length],
      specialty: specialties[i % specialties.length],
      teachingSubjects: teachingSubjects[i % teachingSubjects.length],
      rating: 4.0 + Math.random() * 1.0,
      reviewsCount: 10 + Math.floor(Math.random() * 490),
      sessionsCompleted: 50 + Math.floor(Math.random() * 950),
      yearsExperience: 2 + Math.floor(Math.random() * 13),
      hourlyRate: 25 + Math.floor(Math.random() * 125),
      bio: "Experienced professional with expertise in modern development practices.",
      skills: ["JavaScript", "React", "Node.js", "Python", "AWS"],
      isOnline: Math.random() > 0.5,
      nextAvailable: new Date(
        Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000
      ),
      company: "Tech Company",
      jobTitle: "Senior Developer",
    });
  }
  return mentors;
};

export const generateMenteeMessages = (count = 8) => {
  const mentorImages = [minatoImg, oipImg, boImg];
  const mentorNames = [
    "Ronald Richards",
    "Devon Lane",
    "Sarah Johnson",
    "Mike Chen",
    "Emily Davis",
    "Alex Turner",
    "Jessica Brown",
    "David Wilson",
  ];

  const specialties = [
    "Frontend Development",
    "Backend Development",
    "Full-Stack Development",
    "Data Science",
    "Machine Learning",
    "Mobile Development",
    "DevOps",
    "UI/UX Design",
  ];

  const sampleMessages = [
    "Hello! How can I help you today?",
    "I reviewed your project and have some feedback.",
    "Great progress on your latest assignment!",
    "Let's schedule our next session for this week.",
    "I found some resources that might help you.",
    "Your understanding of React is improving nicely.",
    "Have you tried implementing the authentication feature?",
    "The code review session was very productive.",
  ];

  const messages = [];
  for (let i = 0; i < count; i++) {
    const daysBefore = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysBefore);

    messages.push({
      id: i + 1,
      mentorId: i + 1,
      mentorName: mentorNames[i % mentorNames.length],
      mentorAvatar: mentorImages[i % mentorImages.length],
      mentorSpecialty: specialties[i % specialties.length],
      lastMessage: sampleMessages[i % sampleMessages.length],
      timestamp:
        daysBefore === 0
          ? "Today"
          : daysBefore === 1
          ? "Yesterday"
          : `${daysBefore} days ago`,
      isOnline: Math.random() > 0.6,
      unreadCount: Math.floor(Math.random() * 4),
      totalMessages: 5 + Math.floor(Math.random() * 20),
      lastSessionDate: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      ).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    });
  }
  return messages;
};

export const generateMenteeReviews = (count = 10) => {
  const courseImages = [minatoImg, oipImg, boImg];
  const instructors = [
    "Ronald Richards",
    "Devon Lane",
    "Sarah Johnson",
    "Mike Chen",
    "Emily Davis",
  ];

  const courseNames = [
    "Complete React Developer Course",
    "Advanced JavaScript Fundamentals",
    "Node.js & Express Masterclass",
    "Python Data Science Bootcamp",
    "Machine Learning with TensorFlow",
    "Full-Stack Web Development",
    "Mobile App Development with React Native",
    "UI/UX Design Principles",
  ];

  const mentorNames = [
    "Dr. Sarah Wilson",
    "Prof. Michael Chen",
    "Alex Rodriguez",
    "Jennifer Kim",
    "David Thompson",
  ];

  const specialties = [
    "Frontend Development",
    "Data Science",
    "Machine Learning",
    "Mobile Development",
    "UI/UX Design",
  ];

  const sampleComments = [
    "This course completely transformed my understanding of React. The instructor's explanations were clear and the projects were practical and engaging.",
    "Excellent mentor! Very patient and knowledgeable. Helped me land my first internship.",
    "Great course content and well-structured curriculum. The hands-on projects really helped solidify my learning.",
    "Amazing support throughout my learning journey. The mentor was always available to answer questions.",
    "Comprehensive coverage of the topic with real-world examples. Highly recommend!",
    "The mentor's expertise and teaching style made complex concepts easy to understand.",
  ];

  const reviews = [];
  for (let i = 0; i < count; i++) {
    const isCoursereview = Math.random() > 0.4;
    const rating = 3 + Math.floor(Math.random() * 3);
    const daysBefore = Math.floor(Math.random() * 90);
    const date = new Date();
    date.setDate(date.getDate() - daysBefore);

    reviews.push({
      id: i + 1,
      type: isCoursereview ? "course" : "mentor",
      targetTitle: isCoursereview
        ? courseNames[i % courseNames.length]
        : mentorNames[i % mentorNames.length],
      targetImage: isCoursereview
        ? courseImages[i % courseImages.length]
        : null,
      instructor: isCoursereview ? instructors[i % instructors.length] : null,
      mentorSpecialty: !isCoursereview
        ? specialties[i % specialties.length]
        : null,
      rating: rating,
      comment: sampleComments[i % sampleComments.length],
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      helpfulCount: Math.floor(Math.random() * 25),
      mentorReply:
        Math.random() > 0.7
          ? "Thank you for the feedback! I'm glad you found the session helpful."
          : null,
      mentorName: !isCoursereview ? mentorNames[i % mentorNames.length] : null,
      mentorAvatar: !isCoursereview
        ? courseImages[i % courseImages.length]
        : null,
    });
  }
  return reviews;
};
