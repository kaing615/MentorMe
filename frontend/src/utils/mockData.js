// import { faker } from "@faker-js/faker";
import minatoImg from "../assets/minato.webp";
import oipImg from "../assets/OIP.webp";
import boImg from "../assets/Bơ.jpg";

// Set seed for consistent data across sessions
// faker.seed(123);

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
    firstName: "John",
    lastName: "Doe", 
    headline: "Senior Software Engineer",
    bio: "Experienced software engineer with 10+ years in full-stack development. Passionate about mentoring and helping others grow their technical skills.",
    profileImage: minatoImg,
    website: "https://johndoe.dev",
    twitter: "https://twitter.com/johndoe",
    linkedin: "https://linkedin.com/in/johndoe",
    youtube: "https://youtube.com/c/johndoe",
    facebook: "https://facebook.com/johndoe",
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
    "Programming",
    "Business",
    "Design",
    "Marketing"
  ];

  const courseData = [
    {
      title: "Complete React Development Course",
      instructor: "John Doe",
      description: "Master React.js from basics to advanced concepts including hooks, context, and modern patterns.",
      category: "Web Development",
      price: 99,
      rating: 4.8,
      totalHours: 25,
      lectures: 120
    },
    {
      title: "Python Data Science Bootcamp",
      instructor: "Jane Smith", 
      description: "Learn Python for data analysis, visualization, and machine learning with real-world projects.",
      category: "Data Science",
      price: 129,
      rating: 4.7,
      totalHours: 35,
      lectures: 180
    },
    {
      title: "Modern JavaScript ES6+",
      instructor: "Mike Johnson",
      description: "Complete guide to modern JavaScript including ES6, async/await, modules, and best practices.",
      category: "Programming", 
      price: 79,
      rating: 4.6,
      totalHours: 20,
      lectures: 95
    },
    {
      title: "UI/UX Design Fundamentals",
      instructor: "Sarah Wilson",
      description: "Design beautiful and user-friendly interfaces using modern design principles and tools.",
      category: "Design",
      price: 89,
      rating: 4.9,
      totalHours: 18,
      lectures: 75
    },
    {
      title: "Node.js Backend Development",
      instructor: "David Lee",
      description: "Build scalable backend applications with Node.js, Express, and MongoDB.",
      category: "Web Development",
      price: 119,
      rating: 4.5,
      totalHours: 30,
      lectures: 140
    },
    {
      title: "Digital Marketing Mastery",
      instructor: "Emily Chen",
      description: "Complete digital marketing course covering SEO, social media, and paid advertising.",
      category: "Marketing",
      price: 29,
      rating: 4.4,
      totalHours: 22,
      lectures: 110
    },
    {
      title: "Machine Learning with Python", 
      instructor: "Alex Thompson",
      description: "Learn machine learning algorithms and implement them using Python and scikit-learn.",
      category: "Machine Learning",
      price: 149,
      rating: 4.8,
      totalHours: 40,
      lectures: 200
    },
    {
      title: "Business Strategy for Startups",
      instructor: "Robert Brown",
      description: "Essential business strategies and frameworks for building successful startups.",
      category: "Business",
      price: 10,
      rating: 4.6,
      totalHours: 15,
      lectures: 60
    }
  ];

  return Array.from({ length: count }, (_, index) => {
    const baseData = courseData[index % courseData.length];
    return {
      id: index + 1,
      _id: `course_${index + 1}`,
      ...baseData,
      title: index < courseData.length ? baseData.title : `${baseData.title} ${Math.floor(index / courseData.length) + 1}`,
      image: courseImages[index % courseImages.length],
      ratingsCount: 100 + index * 15,
      price: baseData.price + (index % 3) * 10,
      level: levels[index % 3],
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      isPublished: true,
      studentsEnrolled: 50 + index * 20
    };
  });
};

export const generateMentors = (count = 10) => {
  const mentorImages = [minatoImg, oipImg, boImg];
  const specialties = [
    "Web Development",
    "Data Science", 
    "UI/UX Design",
    "Business",
    "Marketing",
    "Programming",
    "Machine Learning",
  ];
  
  const skillSets = {
    "Web Development": ["JavaScript", "React", "Node.js", "HTML", "CSS"],
    "Data Science": ["Python", "R", "SQL", "Tableau", "Machine Learning"],
    "UI/UX Design": ["Figma", "Adobe XD", "Sketch", "Prototyping", "User Research"],
    "Business": ["Strategy", "Finance", "Marketing", "Leadership", "Analytics"],
    "Marketing": ["SEO", "Social Media", "Content Marketing", "PPC", "Analytics"],
    "Programming": ["Python", "Java", "C++", "JavaScript", "SQL"],
    "Machine Learning": ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "Deep Learning"]
  };

  return Array.from({ length: count }, (_, index) => {
    const specialty = specialties[index % specialties.length];
    const hourlyRates = [25, 45, 65, 85, 120, 150, 180, 220]; // Mix of different price ranges
    const ratings = [4.2, 4.5, 4.7, 4.8, 4.9, 5.0];
    
    return {
      id: index + 1,
      _id: `mentor_${index + 1}`,
      firstName: `Mentor`,
      lastName: `${index + 1}`,
      name: `Mentor ${index + 1}`,
      email: `mentor${index + 1}@example.com`,
      avatar: mentorImages[index % mentorImages.length],
      avatarUrl: mentorImages[index % mentorImages.length],
      specialty: specialty,
      rating: ratings[index % ratings.length],
      reviewsCount: 50 + index * 10,
      sessionsCompleted: 100 + index * 20,
      yearsExperience: 3 + (index % 8), // 3-10 years experience
      hourlyRate: hourlyRates[index % hourlyRates.length],
      bio: `Experienced ${specialty.toLowerCase()} professional with ${3 + (index % 8)} years of industry experience. Passionate about mentoring and helping students succeed in their learning journey.`,
      skills: skillSets[specialty] || ["JavaScript", "React", "Node.js"],
      isOnline: index % 2 === 0,
      nextAvailable: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000), // Next 7 days
      company: `Tech Company ${index + 1}`,
      jobTitle: `Senior ${specialty} Specialist`,
      profile: {
        bio: `Experienced ${specialty.toLowerCase()} professional with ${3 + (index % 8)} years of industry experience.`,
        location: ["San Francisco, CA", "New York, NY", "Austin, TX", "Seattle, WA", "Boston, MA"][index % 5],
        skills: skillSets[specialty] || ["JavaScript", "React", "Node.js"],
        category: specialty
      },
      subjects: [specialty, ...skillSets[specialty].slice(0, 2)],
      coursesCount: 5 + (index % 15) // 5-20 courses
    };
  });
};

// Simple review generator without faker
export const generateReviews = (count = 25, courses = [], mentees = []) => {
  const reviews = [];
  const reviewTexts = [
    "Great course! Learned a lot from this mentor.",
    "Excellent teaching style and very helpful feedback.",
    "Highly recommend this course for beginners.",
    "The instructor was very knowledgeable and patient.",
    "Clear explanations and practical examples.",
    "Perfect course for advancing my skills.",
    "Amazing mentor with real-world experience.",
    "Course content was well structured and engaging."
  ];
  
  for (let i = 0; i < count; i++) {
    reviews.push({
      id: i + 1,
      rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
      comment: reviewTexts[i % reviewTexts.length],
      studentName: `Student ${i + 1}`,
      date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      courseId: courses.length > 0 ? courses[i % courses.length].id : i + 1,
      helpful: Math.floor(Math.random() * 20)
    });
  }
  
  return reviews;
};

// Temporarily comment out to avoid faker errors
/*
export const generateMentees = (count = 20, courses = []) => {
  // Implementation here
};

export const generateConversations = (count = 10, mentees = []) => {
  // Implementation here  
};

export const generateReviews = (count = 25, courses = [], mentees = []) => {
  // Implementation here
};

export const generateMenteeEnrolledCourses = (count = 6) => {
  // Implementation here
};

export const generateMenteeMessages = (count = 8) => {
  // Implementation here
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