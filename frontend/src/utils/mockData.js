import { faker } from "@faker-js/faker";
import minatoImg from "../assets/minato.webp";
import oipImg from "../assets/OIP.webp";
import boImg from "../assets/Bơ.jpg";

// Set seed for consistent data across sessions
faker.seed(123);

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

export const generateMentorProfile = () => {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    headline: faker.person.jobTitle(),
    bio: faker.lorem.paragraphs(2),
    profileImage: faker.image.avatar(),
    website: faker.internet.url(),
    twitter: `https://twitter.com/${faker.internet.userName()}`,
    linkedin: `https://linkedin.com/in/${faker.internet.userName()}`,
    youtube: `https://youtube.com/c/${faker.internet.userName()}`,
    facebook: `https://facebook.com/${faker.internet.userName()}`,
  };
};

export const generateCourses = (count = 10) => {
  const courseImages = [minatoImg, oipImg, boImg];
  const levels = ["Beginner", "Intermediate", "Advanced"];
  const categories = [
    "Web Development",
    "Data Science",
    "Machine Learning",
    "Mobile Development",
    "UI/UX Design",
  ];

  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    title: faker.lorem.words(3),
    instructor: faker.person.fullName(),
    description: faker.lorem.paragraph(),
    image: courseImages[index % courseImages.length],
    rating: parseFloat(faker.number.float({ min: 4, max: 5 }).toFixed(1)),
    ratingsCount: faker.number.int({ min: 50, max: 2000 }),
    price: faker.number.int({ min: 49, max: 299 }),
    totalHours: faker.number.int({ min: 10, max: 50 }),
    lectures: faker.number.int({ min: 20, max: 200 }),
    level: levels[faker.number.int({ min: 0, max: 2 })],
    category: categories[faker.number.int({ min: 0, max: 4 })],
    students: faker.number.int({ min: 100, max: 5000 }),
    createdAt: faker.date.past(),
    progress: faker.number.int({ min: 0, max: 100 }),
    isCompleted: faker.datatype.boolean(),
    enrolledDate: faker.date.past(),
    lastWatched: faker.date.recent(),
  }));
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

  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: faker.person.fullName(),
    email: faker.internet.email(),
    avatar: mentorImages[index % mentorImages.length],
    specialty: specialties[faker.number.int({ min: 0, max: 6 })],
    rating: parseFloat(faker.number.float({ min: 4, max: 5 }).toFixed(1)),
    reviewsCount: faker.number.int({ min: 10, max: 500 }),
    sessionsCompleted: faker.number.int({ min: 50, max: 1000 }),
    yearsExperience: faker.number.int({ min: 2, max: 15 }),
    hourlyRate: faker.number.int({ min: 25, max: 150 }),
    bio: faker.lorem.paragraph(),
    skills: faker.helpers.arrayElements(
      ["JavaScript", "Python", "React", "Node.js", "AWS", "Docker", "MongoDB"],
      { min: 3, max: 6 }
    ),
    isOnline: faker.datatype.boolean(),
    nextAvailable: faker.date.future(),
    company: faker.company.name(),
    jobTitle: faker.person.jobTitle(),
  }));
};

export const generateMentees = (count = 20, courses = []) => {
  const menteeImages = [minatoImg, oipImg, boImg];

  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: faker.person.fullName(),
    email: faker.internet.email(),
    avatar: menteeImages[index % menteeImages.length],
    joinedDate: faker.date.past(),
    lastActive: faker.date.recent(),
    totalCourses: faker.number.int({ min: 1, max: 10 }),
    enrolledCourses: Array.from(
      { length: faker.number.int({ min: 1, max: 5 }) },
      () => {
        const course =
          courses[faker.number.int({ min: 0, max: courses.length - 1 })];
        return {
          courseName: course?.title || faker.lorem.words(3),
          progress: faker.number.int({ min: 0, max: 100 }),
          enrolledDate: faker.date.past(),
        };
      }
    ),
  }));
};

export const generateConversations = (count = 10, mentees = []) => {
  return Array.from({ length: count }, (_, index) => {
    const mentee = mentees[index % mentees.length];
    const messageCount = faker.number.int({ min: 5, max: 20 });

    return {
      id: index + 1,
      menteeId: mentee?.id || index + 1,
      menteeName: mentee?.name || faker.person.fullName(),
      menteeAvatar: mentee?.avatar || faker.image.avatar(),
      lastMessage: faker.lorem.sentence(),
      lastMessageTime: faker.date.recent().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isOnline: faker.datatype.boolean(),
      unreadCount: faker.number.int({ min: 0, max: 5 }),
      messages: Array.from({ length: messageCount }, (_, msgIndex) => ({
        id: msgIndex + 1,
        senderId: faker.helpers.arrayElement(["mentor", "mentee"]),
        content: faker.lorem.sentence(),
        timestamp: faker.date.recent().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      })),
    };
  });
};

export const generateReviews = (count = 25, courses = [], mentees = []) => {
  return Array.from({ length: count }, (_, index) => {
    const course =
      courses[faker.number.int({ min: 0, max: courses.length - 1 })];
    const mentee =
      mentees[faker.number.int({ min: 0, max: mentees.length - 1 })];

    return {
      id: index + 1,
      studentName: mentee?.name || faker.person.fullName(),
      studentAvatar: mentee?.avatar || faker.image.avatar(),
      courseName: course?.title || faker.lorem.words(3),
      rating: faker.number.int({ min: 3, max: 5 }),
      reviewText: faker.lorem.paragraph(),
      reviewDate: faker.date.past(),
      helpfulCount: faker.number.int({ min: 0, max: 50 }),
    };
  });
};

// For Mentee Profile specifically
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

  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    title: faker.lorem.words(3),
    instructor: instructors[index % instructors.length],
    image: courseImages[index % courseImages.length],
    rating: parseFloat(faker.number.float({ min: 4, max: 5 }).toFixed(1)),
    ratingsCount: faker.number.int({ min: 50, max: 2000 }),
    totalHours: faker.number.int({ min: 10, max: 50 }),
    lectures: faker.number.int({ min: 20, max: 200 }),
    level: levels[faker.number.int({ min: 0, max: 2 })],
    progress: faker.number.int({ min: 10, max: 100 }),
    enrolledDate: faker.date.past(),
    lastWatched: faker.date.recent(),
    isCompleted: faker.datatype.boolean(),
    price: faker.number.int({ min: 49, max: 299 }),
    certificate: faker.datatype.boolean(),
  }));
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

  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    mentorId: index + 1,
    mentorName: mentorNames[index % mentorNames.length],
    mentorAvatar: mentorImages[index % mentorImages.length],
    lastMessage: faker.lorem.sentence(),
    lastMessageTime: faker.date.recent().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    isOnline: faker.datatype.boolean(),
    unreadCount: faker.number.int({ min: 0, max: 3 }),
    messages: Array.from(
      { length: faker.number.int({ min: 5, max: 15 }) },
      (_, msgIndex) => ({
        id: msgIndex + 1,
        senderId: faker.helpers.arrayElement(["mentor", "mentee"]),
        content: faker.lorem.sentence(),
        timestamp: faker.date.recent().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      })
    ),
  }));
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

  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    courseName: faker.lorem.words(3),
    instructorName: instructors[index % instructors.length],
    courseImage: courseImages[index % courseImages.length],
    rating: faker.number.int({ min: 3, max: 5 }),
    reviewText: faker.lorem.paragraph(),
    reviewDate: faker.date.past(),
    isPublic: faker.datatype.boolean(),
    helpfulCount: faker.number.int({ min: 0, max: 25 }),
  }));
};
