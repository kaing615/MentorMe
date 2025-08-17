import { faker } from "@faker-js/faker";

// Generate mentor profile data
export const generateMentorProfile = () => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  return {
    firstName,
    lastName,
    headline: faker.person.jobTitle() + " & Tech Mentor",
    bio: faker.lorem.paragraph(4),
    website: faker.internet.url(),
    twitter: `https://twitter.com/${faker.internet.userName()}`,
    linkedin: `https://linkedin.com/in/${faker.internet.userName()}`,
    youtube: `https://youtube.com/c/${faker.internet.userName()}`,
    facebook: `https://facebook.com/${faker.internet.userName()}`,
    profileImage: faker.image.avatar(),
  };
};

// Generate course data
export const generateCourses = (count = 15) => {
  const techTopics = [
    "JavaScript",
    "React",
    "Node.js",
    "Python",
    "Java",
    "TypeScript",
    "Vue.js",
    "Angular",
    "HTML/CSS",
    "MongoDB",
    "PostgreSQL",
    "Docker",
    "AWS",
    "Machine Learning",
    "Data Science",
    "DevOps",
    "Git",
    "GraphQL",
  ];

  const categories = [
    "Programming",
    "Frontend Development",
    "Backend Development",
    "Full Stack",
    "Database",
    "DevOps",
    "Data Science",
    "Mobile Development",
  ];

  const levels = ["Beginner", "Intermediate", "Advanced", "All Levels"];
  const statuses = ["published", "draft", "archived"];

  return Array.from({ length: count }, (_, index) => {
    const topic = faker.helpers.arrayElement(techTopics);
    const category = faker.helpers.arrayElement(categories);
    const level = faker.helpers.arrayElement(levels);
    const ratingsCount = faker.number.int({ min: 50, max: 5000 });
    const students = ratingsCount + faker.number.int({ min: 0, max: 1000 });

    return {
      id: index + 1,
      title: `${topic} ${faker.helpers.arrayElement([
        "Mastery",
        "Complete Guide",
        "Fundamentals",
        "Advanced",
        "Bootcamp",
        "Course",
      ])} - ${faker.lorem.words(2)}`,
      instructor: faker.person.fullName(),
      image: `https://picsum.photos/400/250?random=${index + 1}`,
      rating: parseFloat(faker.number.float({ min: 3.5, max: 5.0 }).toFixed(1)),
      ratingsCount,
      totalHours: faker.number.int({ min: 10, max: 100 }),
      lectures: faker.number.int({ min: 50, max: 500 }),
      level,
      price: parseFloat(
        faker.number.float({ min: 29.99, max: 399.99 }).toFixed(2)
      ),
      students,
      createdAt: faker.date.past({ years: 2 }).toISOString().split("T")[0],
      description: faker.lorem.sentence(15),
      category,
      status: faker.helpers.arrayElement(statuses),
    };
  });
};

// Generate mentee data
export const generateMentees = (count = 20, courses = []) => {
  const locations = [
    "San Francisco, CA",
    "New York, NY",
    "Austin, TX",
    "Seattle, WA",
    "Chicago, IL",
    "Boston, MA",
    "Los Angeles, CA",
    "Denver, CO",
    "Miami, FL",
    "Atlanta, GA",
    "Portland, OR",
    "Phoenix, AZ",
  ];

  const timezones = ["PST", "EST", "CST", "MST"];
  const learningGoals = [
    "Frontend Development",
    "Backend Development",
    "Full Stack Development",
    "Career Change to Tech",
    "Skill Enhancement",
    "Freelancing",
    "Startup Development",
    "Mobile Development",
    "Data Science",
  ];

  const courseStatuses = ["in_progress", "completed", "paused"];

  return Array.from({ length: count }, (_, index) => {
    const numCourses = faker.number.int({ min: 1, max: 4 });
    const selectedCourses = faker.helpers.arrayElements(courses, numCourses);

    const enrolledCourses = selectedCourses.map((course) => ({
      courseId: course.id,
      courseName: course.title,
      enrolledDate: faker.date.past({ years: 1 }).toISOString().split("T")[0],
      progress: faker.number.int({ min: 10, max: 100 }),
      status: faker.helpers.arrayElement(courseStatuses),
    }));

    return {
      id: index + 1,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      avatar: faker.image.avatar(),
      enrolledCourses,
      totalCourses: enrolledCourses.length,
      joinedDate: faker.date.past({ years: 2 }).toISOString().split("T")[0],
      lastActive: faker.date.recent({ days: 30 }).toISOString().split("T")[0],
      location: faker.helpers.arrayElement(locations),
      timezone: faker.helpers.arrayElement(timezones),
      learningGoal: faker.helpers.arrayElement(learningGoals),
    };
  });
};

// Generate conversation data
export const generateConversations = (count = 10, mentees = []) => {
  const timeAgo = [
    "2 hours ago",
    "1 day ago",
    "3 days ago",
    "5 days ago",
    "1 week ago",
    "2 weeks ago",
  ];

  return Array.from({ length: count }, (_, index) => {
    const mentee = faker.helpers.arrayElement(mentees);
    const messageCount = faker.number.int({ min: 2, max: 8 });

    const messages = Array.from({ length: messageCount }, (_, msgIndex) => ({
      id: msgIndex + 1,
      senderId: faker.helpers.arrayElement(["mentor", "mentee"]),
      content: faker.lorem.sentence(faker.number.int({ min: 5, max: 20 })),
      timestamp: faker.date.recent({ days: 7 }).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
      isRead: faker.datatype.boolean(),
    }));

    const lastMessage = messages[messages.length - 1];

    return {
      id: index + 1,
      menteeId: mentee.id,
      menteeName: mentee.name,
      menteeAvatar: mentee.avatar,
      lastMessage: lastMessage.content,
      lastMessageTime: faker.helpers.arrayElement(timeAgo),
      isOnline: faker.datatype.boolean(),
      unreadCount: faker.number.int({ min: 0, max: 5 }),
      messages,
    };
  });
};

// Generate review data
export const generateReviews = (count = 25, courses = [], students = []) => {
  const reviewTemplates = [
    "Outstanding course! {instructor} explains {topic} concepts so clearly.",
    "This {topic} course is incredible! The way {instructor} teaches made everything click.",
    "Excellent {topic} course! {instructor}'s teaching style is perfect.",
    "Great {topic} course! Learned so much about modern techniques.",
    "Perfect beginner course! {instructor} made it approachable and fun.",
    "Amazing course! Comprehensive curriculum that covers everything you need.",
    "Very thorough {topic} course. Covers all important topics with practical examples.",
  ];

  return Array.from({ length: count }, (_, index) => {
    const course = faker.helpers.arrayElement(courses);
    const student = faker.helpers.arrayElement(students);
    const template = faker.helpers.arrayElement(reviewTemplates);

    const reviewText =
      template
        .replace("{instructor}", course.instructor)
        .replace("{topic}", course.category) +
      " " +
      faker.lorem.sentence(faker.number.int({ min: 10, max: 25 }));

    return {
      id: index + 1,
      studentId: student.id,
      studentName: student.name,
      studentAvatar: student.avatar,
      courseId: course.id,
      courseName: course.title,
      rating: faker.number.int({ min: 3, max: 5 }),
      reviewText,
      reviewDate: faker.date.past({ years: 1 }).toISOString().split("T")[0],
      isHelpful: faker.datatype.boolean(),
      helpfulCount: faker.number.int({ min: 0, max: 50 }),
    };
  });
};
