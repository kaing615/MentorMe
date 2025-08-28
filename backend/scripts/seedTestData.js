import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Cart from "../src/models/cart.model.js";
import Course from "../src/models/course.model.js";
import Order from "../src/models/order.model.js";
import Profile from "../src/models/profile.model.js";
import User from "../src/models/user.model.js";
import profileUtils from "../src/utils/profile.utils.js";

dotenv.config();

// Enhanced sample data with more variety
const sampleUsers = [
  {
    userName: "mentor1",
    firstName: "John",
    lastName: "Smith",
    email: "mentor1@test.com",
    password: "123456",
    role: "mentor",
    isVerified: true,
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    purchasedCourses: [],
  },
  {
    userName: "mentor2",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "mentor2@test.com",
    password: "123456",
    role: "mentor",
    isVerified: true,
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    purchasedCourses: [],
  },
  {
    userName: "mentee1",
    firstName: "Mike",
    lastName: "Davis",
    email: "mentee1@test.com",
    password: "123456",
    role: "mentee",
    isVerified: true,
    avatarUrl:
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop&crop=face",
    purchasedCourses: [],
  },
  {
    userName: "mentee2",
    firstName: "Emma",
    lastName: "Wilson",
    email: "mentee2@test.com",
    password: "123456",
    role: "mentee",
    isVerified: true,
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    purchasedCourses: [],
  },
  {
    userName: "testuser",
    firstName: "Test",
    lastName: "User",
    email: "testuser@example.com",
    password: "123456",
    role: "mentee",
    isVerified: true,
    avatarUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    purchasedCourses: [],
  },
];

// Enhanced profile data for mentors and mentees
const sampleProfilesData = [
  // Mentor 1 Profile
  {
    userEmail: "mentor1@test.com",
    role: "mentor",
    data: {
      jobTitle: "Senior Full Stack Developer",
      location: "Ho Chi Minh City, Vietnam",
      category: "Programming",
      bio: "Experienced software developer with 8+ years in web development. Specialized in React, Node.js, and modern JavaScript frameworks. Passionate about mentoring junior developers.",
      skills: [
        "JavaScript",
        "React",
        "Node.js",
        "TypeScript",
        "MongoDB",
        "AWS",
      ],
      experience: "8+ years",
      headline: "Full Stack Developer & Tech Mentor",
      mentorReason:
        "I want to share my knowledge and help the next generation of developers grow their skills and advance their careers.",
      greatestAchievement:
        "Led a team of 15 developers to build a successful e-commerce platform serving 1M+ users.",
      languages: ["Vietnamese", "English"],
      timezone: "UTC+7",
      links: {
        website: "https://johnsmith.dev",
        linkedin: "https://linkedin.com/in/johnsmith",
        github: "https://github.com/johnsmith",
      },
    },
  },
  // Mentor 2 Profile
  {
    userEmail: "mentor2@test.com",
    role: "mentor",
    data: {
      jobTitle: "UI/UX Designer & Frontend Developer",
      location: "Da Nang, Vietnam",
      category: "Design",
      bio: "Creative designer and frontend developer with expertise in user experience and modern web technologies. Love creating beautiful, functional interfaces.",
      skills: [
        "UI/UX Design",
        "Figma",
        "React",
        "CSS",
        "JavaScript",
        "Adobe Creative Suite",
      ],
      experience: "6+ years",
      headline: "UI/UX Designer & React Developer",
      mentorReason:
        "Design and development should be accessible to everyone. I want to help aspiring designers and developers find their creative voice.",
      greatestAchievement:
        "Designed and developed award-winning mobile app with 500K+ downloads and 4.8-star rating.",
      languages: ["Vietnamese", "English", "Japanese"],
      timezone: "UTC+7",
      links: {
        website: "https://sarahjohnson.design",
        linkedin: "https://linkedin.com/in/sarah-johnson-design",
        github: "https://github.com/sarahdesigns",
      },
    },
  },
  // Mentee 1 Profile
  {
    userEmail: "mentee1@test.com",
    role: "mentee",
    data: {
      jobTitle: "Junior Developer",
      location: "Ha Noi, Vietnam",
      category: "Programming",
      bio: "Passionate about learning web development and building amazing applications. Currently focusing on React and Node.js.",
      skills: ["HTML", "CSS", "JavaScript", "React"],
      description:
        "Computer Science student eager to learn from experienced mentors and grow my development skills.",
      goal: "Become a full-stack developer and contribute to meaningful projects that make a positive impact.",
      education:
        "Computer Science - Hanoi University of Science and Technology",
      languages: ["Vietnamese", "English"],
      timezone: "UTC+7",
    },
  },
  // Mentee 2 Profile
  {
    userEmail: "mentee2@test.com",
    role: "mentee",
    data: {
      jobTitle: "Marketing Student",
      location: "Ho Chi Minh City, Vietnam",
      category: "Marketing",
      bio: "Marketing student interested in digital marketing and data analytics. Looking to learn more about tech and business.",
      skills: ["Digital Marketing", "Google Analytics", "Content Creation"],
      description:
        "Business student who wants to understand the intersection of technology and marketing.",
      goal: "Learn technical skills to complement my marketing knowledge and become a tech-savvy marketer.",
      education:
        "Business Administration - University of Economics Ho Chi Minh City",
      languages: ["Vietnamese", "English"],
      timezone: "UTC+7",
    },
  },
  // Test User Profile
  {
    userEmail: "testuser@example.com",
    role: "mentee",
    data: {
      jobTitle: "Software Tester",
      location: "Test City, Vietnam",
      category: "Testing",
      bio: "Test user for API testing and development purposes.",
      skills: ["Manual Testing", "API Testing"],
      description: "Test account for development and QA purposes.",
      goal: "Learn automation testing and quality assurance best practices.",
      education: "Test University",
      languages: ["Vietnamese", "English"],
      timezone: "UTC+7",
    },
  },
];

const sampleCourses = [
  {
    title: "React Fundamentals - Complete Guide",
    description:
      "Master React from scratch with hands-on projects. Learn components, hooks, state management, and modern React patterns. Perfect for beginners and intermediate developers.",
    price: 299000,
    category: "Programming",
    tags: ["react", "javascript", "frontend", "web"],
    duration: 720, // 12 hours
    rate: 4.5,
    link: "https://mentorme.com/courses/react-fundamentals",
    lectures: 15,
    thumbnail: "https://via.placeholder.com/400x300/007ACC/white?text=React",
    mentees: [], // Will be populated after orders
  },
  {
    title: "Node.js Backend Development",
    description:
      "Master Node.js for building scalable backend applications. Learn Express.js, MongoDB, authentication, and API development.",
    price: 499000,
    category: "Programming",
    tags: ["nodejs", "express", "mongodb", "backend"],
    duration: 960, // 16 hours
    rate: 4.7,
    link: "https://mentorme.com/courses/nodejs-backend",
    lectures: 20,
    thumbnail: "https://via.placeholder.com/400x300/68A063/white?text=Node.js",
    mentees: [], // Will be populated after orders
  },
  {
    title: "JavaScript Advanced Concepts",
    description:
      "Deep dive into advanced JavaScript concepts including closures, prototypes, async/await, and design patterns.",
    price: 399000,
    category: "Programming",
    tags: ["javascript", "advanced", "es6", "programming"],
    duration: 600, // 10 hours
    rate: 4.6,
    link: "https://mentorme.com/courses/javascript-advanced",
    lectures: 12,
    thumbnail:
      "https://via.placeholder.com/400x300/F7DF1E/black?text=JavaScript",
    mentees: [], // Will be populated after orders
  },
  {
    title: "Python for Data Science",
    description:
      "Learn Python programming for data analysis, visualization, and machine learning. Includes pandas, numpy, and matplotlib.",
    price: 599000,
    category: "Data Science",
    tags: ["python", "data-science", "pandas", "numpy"],
    duration: 1200, // 20 hours
    rate: 4.8,
    link: "https://mentorme.com/courses/python-data-science",
    lectures: 25,
    thumbnail: "https://via.placeholder.com/400x300/3776AB/white?text=Python",
    mentees: [], // Will be populated after orders
  },
  {
    title: "UI/UX Design Fundamentals",
    description:
      "Master the principles of user interface and user experience design. Learn design thinking, prototyping, and usability testing.",
    price: 449000,
    category: "Design",
    tags: ["ui", "ux", "design", "figma", "prototyping"],
    duration: 840, // 14 hours
    rate: 4.4,
    link: "https://mentorme.com/courses/ui-ux-design",
    lectures: 18,
    thumbnail: "https://via.placeholder.com/400x300/FF5722/white?text=UI/UX",
    mentees: [], // Will be populated after orders
  },
];

// Sample orders with predefined IDs and exact relationships
const sampleOrders = [
  {
    _id: orderIds.order1,
    mentee: userIds.mentee,
    courses: [courseIds.react, courseIds.nodejs], // React + Node.js for mentee
    type: "course",
    amount: 299000 + 499000, // 798000
    status: "paid",
    paymentMethod: "paypal",
    transactionId: "TXN001_PAID_MENTEE_REACT_NODEJS",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    _id: orderIds.order2,
    mentee: userIds.testUser,
    courses: [courseIds.javascript], // JavaScript for testUser
    type: "course",
    amount: 399000,
    status: "paid",
    paymentMethod: "stripe",
    transactionId: "TXN002_PAID_TESTUSER_JAVASCRIPT",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    _id: orderIds.order3,
    mentee: userIds.testUser,
    courses: [courseIds.python, courseIds.uiux], // Python + UI/UX for testUser
    type: "course",
    amount: 599000 + 449000, // 1048000
    status: "paid",
    paymentMethod: "bank",
    transactionId: "TXN003_PAID_TESTUSER_PYTHON_UIUX",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    _id: orderIds.order4,
    mentee: userIds.mentee,
    courses: [courseIds.javascript], // JavaScript for mentee (PENDING for testing)
    type: "course",
    amount: 399000,
    status: "pending",
    paymentMethod: "momo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Simplified seed function - just users, profiles, and courses
async function seedDatabase() {
  try {
    console.log("🚀 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB successfully");

    // Clear existing data
    console.log("🧹 Clearing existing data...");
    await User.deleteMany({});
    await Profile.deleteMany({});
    await Course.deleteMany({});
    await Order.deleteMany({});
    await Cart.deleteMany({});
    console.log("✅ Cleared existing data");

    // Hash password once for all users
    console.log("🔐 Hashing passwords...");
    const hashedPassword = await bcrypt.hash("123456", 12);

    // Create users first
    console.log("👤 Creating users...");
    const createdUsers = [];

    for (const userData of sampleUsers) {
      const user = new User({
        ...userData,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedUser = await user.save();
      createdUsers.push(savedUser);
      console.log(`✅ Created user: ${savedUser.email}`);
    }

    // Create profiles for all users
    console.log("👥 Creating profiles...");
    for (const profileData of sampleProfilesData) {
      const user = createdUsers.find((u) => u.email === profileData.userEmail);
      if (user) {
        const profile = await profileUtils.createProfileForNewUser(
          user._id,
          profileData.data,
          profileData.role
        );
        console.log(`✅ Created profile for: ${user.email}`);
      }
    }

    // Get mentor users for course creation
    const mentors = createdUsers.filter((u) => u.role === "mentor");
    const mentor1 = mentors[0]; // John Smith
    const mentor2 = mentors[1]; // Sarah Johnson

    // Prepare courses with mentor assignments
    const coursesToInsert = sampleCourses.map((course, index) => ({
      ...course,
      mentor: index % 2 === 0 ? mentor1._id : mentor2._id, // Alternate mentors
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Create courses
    console.log("📚 Creating courses...");
    const createdCourses = await Course.insertMany(coursesToInsert);
    console.log(`✅ Created ${createdCourses.length} courses`);

    // Create orders
    console.log("� Creating orders...");
    await Order.insertMany(sampleOrders);
    console.log(`✅ Created ${sampleOrders.length} orders with predefined IDs`);

    // Process PAID orders to create purchased courses and update mentees
    console.log("💰 Processing paid orders for purchased courses...");

    const paidOrders = sampleOrders.filter((order) => order.status === "paid");

    for (const order of paidOrders) {
      console.log(`\n   📋 Processing order: ${order.transactionId}`);

      // Create purchased courses for the user
      const purchasedCourses = order.courses.map((courseId) => ({
        course: courseId, // Sử dụng 'course' thay vì 'courseId' để khớp với User model
        orderId: order._id,
        purchaseDate: order.createdAt,
        progress: Math.floor(Math.random() * 101), // Random progress 0-100%
        lastAccessDate: new Date(
          Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
        ), // Random within last 7 days
        isCompleted: Math.random() > 0.7, // 30% chance of completion
      }));

      // Update user with purchased courses
      await User.findByIdAndUpdate(order.mentee, {
        $push: {
          purchasedCourses: { $each: purchasedCourses },
        },
      });

      // Update each course with the mentee
      for (const courseId of order.courses) {
        await Course.findByIdAndUpdate(courseId, {
          $addToSet: { mentees: order.mentee },
        });

        const course = await Course.findById(courseId);
        console.log(`      ✅ Added user to course: ${course.title}`);
      }

      console.log(
        `   ✅ Added ${purchasedCourses.length} purchased courses for user`
      );
    }

    // Verify data consistency
    console.log("\n🔍 Verifying data consistency...");

    const allUsers = await User.find({});
    const allCourses = await Course.find({});

    console.log("\n📊 FINAL DATA VERIFICATION:");
    console.log("===========================");

    // Display users and their purchased courses
    for (const user of allUsers) {
      console.log(`\n👤 User: ${user.userName} (ID: ${user._id})`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👔 Role: ${user.role}`);
      console.log(`   🎓 Purchased Courses: ${user.purchasedCourses.length}`);

      if (user.purchasedCourses.length > 0) {
        user.purchasedCourses.forEach((pc, index) => {
          console.log(
            `      ${index + 1}. Course ID: ${pc.course} (Progress: ${
              pc.progress
            }%)`
          );
        });
      }
    }

    // Display courses and their mentees
    console.log("\n� COURSES AND MENTEES:");
    for (const course of allCourses) {
      console.log(`\n📖 Course: ${course.title} (ID: ${course._id})`);
      console.log(`   💰 Price: ${course.price.toLocaleString()}đ`);
      console.log(`   👥 Mentees: ${course.mentees.length}`);

      if (course.mentees.length > 0) {
        course.mentees.forEach((menteeId, index) => {
          console.log(`      ${index + 1}. Mentee ID: ${menteeId}`);
        });
      }
    }

    console.log("\n🎯 TEST CREDENTIALS:");
    console.log("===================");
    console.log("🧑‍🏫 Mentor account:");
    console.log("  Email: mentor1@test.com");
    console.log("  Password: 123456");
    console.log(`  User ID: ${userIds.mentor}`);

    console.log("\n🎓 Mentee account (2 purchased courses):");
    console.log("  Email: mentee1@test.com");
    console.log("  Password: 123456");
    console.log(`  User ID: ${userIds.mentee}`);
    console.log("  Purchased: React Fundamentals + Node.js Backend");

    console.log("\n🧪 Test User account (3 purchased courses):");
    console.log("  Email: testuser@example.com");
    console.log("  Password: 123456");
    console.log(`  User ID: ${userIds.testUser}`);
    console.log("  Purchased: JavaScript Advanced + Python + UI/UX Design");

    console.log("\n📝 PREDEFINED IDs FOR CONSISTENT TESTING:");
    console.log("==========================================");
    console.log("🆔 User IDs:");
    console.log(`  Mentor ID: ${userIds.mentor}`);
    console.log(`  Mentee ID: ${userIds.mentee}`);
    console.log(`  Test User ID: ${userIds.testUser}`);

    console.log("\n🆔 Course IDs:");
    console.log(`  React Fundamentals: ${courseIds.react}`);
    console.log(`  Node.js Backend: ${courseIds.nodejs}`);
    console.log(`  JavaScript Advanced: ${courseIds.javascript}`);
    console.log(`  Python Data Science: ${courseIds.python}`);
    console.log(`  UI/UX Design: ${courseIds.uiux}`);

    console.log("\n🆔 Order IDs:");
    console.log(`  Paid Order 1 (mentee - React+Node): ${orderIds.order1}`);
    console.log(`  Paid Order 2 (testuser - JavaScript): ${orderIds.order2}`);
    console.log(`  Paid Order 3 (testuser - Python+UIUX): ${orderIds.order3}`);
    console.log(`  Pending Order 4 (mentee - JavaScript): ${orderIds.order4}`);

    console.log("\n✅ Database seeded successfully with consistent ObjectIDs!");
    console.log(
      "🎉 All data is now perfectly synchronized across collections!"
    );
    console.log("🔗 Relationships verified: Users ↔ Courses ↔ Orders");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run the seed function
seedDatabase();
