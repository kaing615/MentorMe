import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Course from '../models/course.model.js';
import Review from '../models/review.model.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mentorme', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample Users/Mentors Data
const usersData = [
  {
    userName: 'mentor1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.mentor@example.com',
    password: 'password123', // Will be hashed by pre-save middleware
    role: ['mentor'],
    jobTitle: 'Senior Full Stack Developer',
    bio: 'Experienced full-stack developer with 8+ years in the industry',
    skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
    avatarUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
    isVerified: true
  },
  {
    userName: 'mentor2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.mentor@example.com',
    password: 'password123',
    role: ['mentor'],
    jobTitle: 'Data Science Specialist',
    bio: 'Python expert and data science specialist',
    skills: ['Python', 'Data Science', 'Machine Learning', 'AI'],
    avatarUrl: 'https://randomuser.me/api/portraits/women/2.jpg',
    isVerified: true
  },
  {
    userName: 'mentor3',
    firstName: 'Mike',
    lastName: 'Wilson',
    email: 'mike.mentor@example.com',
    password: 'password123',
    role: ['mentor'],
    jobTitle: 'Java Enterprise Architect',
    bio: 'Java enterprise developer and system architect',
    skills: ['Java', 'Spring Boot', 'Microservices', 'AWS'],
    avatarUrl: 'https://randomuser.me/api/portraits/men/3.jpg',
    isVerified: true
  },
  {
    userName: 'student1',
    firstName: 'Alice',
    lastName: 'Brown',
    email: 'alice.student@example.com',
    password: 'password123',
    role: ['mentee'],
    isVerified: true
  },
  {
    userName: 'student2',
    firstName: 'Bob',
    lastName: 'Davis',
    email: 'bob.student@example.com',
    password: 'password123',
    role: ['mentee'],
    isVerified: true
  }
];

// Sample Courses Data
const coursesData = [
  {
    title: 'Complete JavaScript Bootcamp',
    description: 'Master JavaScript from basics to advanced concepts including ES6+, async programming, and modern development practices.',
    price: 99.99,
    duration: 40,
    lectures: 25,
    category: 'Programming',
    level: 'Beginner',
    thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=250&fit=crop',
    rate: 4.6,
    numberOfRatings: 156,
    mentor: null, // Will be populated with actual mentor ID
    status: 'published',
    link: 'https://drive.google.com/drive/folders/example1'
  },
  {
    title: 'React.js Complete Guide',
    description: 'Build modern web applications with React.js, including hooks, context, routing, and state management.',
    price: 149.99,
    duration: 35,
    lectures: 30,
    category: 'Programming',
    level: 'Intermediate',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop',
    rate: 4.8,
    numberOfRatings: 203,
    mentor: null,
    status: 'published',
    link: 'https://drive.google.com/drive/folders/example2'
  },
  {
    title: 'Python for Data Science',
    description: 'Learn Python programming focused on data analysis, visualization, and machine learning fundamentals.',
    price: 129.99,
    duration: 45,
    lectures: 35,
    category: 'Data Science',
    level: 'Beginner',
    thumbnail: 'https://images.unsplash.com/photo-1526379879527-8559ecfcaec0?w=400&h=250&fit=crop',
    rate: 4.5,
    numberOfRatings: 189,
    mentor: null,
    status: 'published',
    link: 'https://drive.google.com/drive/folders/example3'
  },
  {
    title: 'Node.js Backend Development',
    description: 'Build scalable backend applications with Node.js, Express, and MongoDB. Learn REST APIs and authentication.',
    price: 119.99,
    duration: 38,
    lectures: 28,
    category: 'Backend Development',
    level: 'Intermediate',
    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop',
    rate: 4.7,
    numberOfRatings: 134,
    mentor: null,
    status: 'published',
    link: 'https://drive.google.com/drive/folders/example4'
  }
];

// Sample Reviews Data
const reviewsData = [
  {
    targetType: 'Course',
    target: null, // Will be populated with actual course ID
    author: null, // Will be populated with actual student ID
    content: 'Excellent course! The instructor explains complex concepts very clearly.',
    rate: 5
  },
  {
    targetType: 'Course',
    target: null,
    author: null,
    content: 'Great content and practical examples. Highly recommended!',
    rate: 4
  },
  {
    targetType: 'Course',
    target: null,
    author: null,
    content: 'This course changed my career path. Amazing instructor and content.',
    rate: 5
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    await Review.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create Users
    const createdUsers = await User.create(usersData);
    console.log(`👥 Created ${createdUsers.length} users`);

    // Get mentors for course assignment
    const mentors = createdUsers.filter(user => user.role.includes('mentor'));
    const students = createdUsers.filter(user => user.role.includes('mentee'));

    // Assign mentors to courses and create courses
    const coursesWithMentors = coursesData.map((course, index) => {
      // Assign mentors to courses (cycle through available mentors)
      const assignedMentor = mentors[index % mentors.length];
      return {
        ...course,
        mentor: assignedMentor._id // Use singular mentor field
      };
    });

    const createdCourses = await Course.create(coursesWithMentors);
    console.log(`📚 Created ${createdCourses.length} courses`);

    // Create sample reviews
    const reviewsWithRefs = reviewsData.map((review, index) => {
      return {
        ...review,
        author: students[index % students.length]._id,
        target: createdCourses[index % createdCourses.length]._id
      };
    });

    const createdReviews = await Review.create(reviewsWithRefs);
    console.log(`⭐ Created ${createdReviews.length} reviews`);

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${createdUsers.length}`);
    console.log(`   Mentors: ${mentors.length}`);
    console.log(`   Students: ${students.length}`);
    console.log(`   Courses: ${createdCourses.length}`);
    console.log(`   Reviews: ${createdReviews.length}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run seeding
console.log('🚀 Starting seed script...');
connectDB().then(() => {
  seedDatabase();
}).catch((error) => {
  console.error('💥 Failed to connect to database:', error);
  process.exit(1);
});

export { seedDatabase, connectDB };
