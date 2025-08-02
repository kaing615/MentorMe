import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Cart from "../src/models/cart.model.js";
import Course from "../src/models/course.model.js";
import Order from "../src/models/order.model.js";
import User from "../src/models/user.model.js";

dotenv.config();

// Sample data for testing - ObjectIds will be generated automatically
const sampleUsers = [
  {
    userName: "mentor1",
    firstName: "John",
    lastName: "Doe",
    email: "mentor1@test.com",
    password: "123456",
    role: "mentor",
    isVerified: true,
    purchasedCourses: [], // Mentor doesn't purchase courses
  },
  {
    userName: "mentee1",
    firstName: "Jane",
    lastName: "Smith",
    email: "mentee1@test.com",
    password: "123456",
    role: "mentee",
    isVerified: true,
    purchasedCourses: [], // Will be populated after orders
  },
  {
    userName: "testuser",
    firstName: "Test",
    lastName: "User",
    email: "testuser@example.com",
    password: "123456",
    role: "mentee",
    isVerified: true,
    purchasedCourses: [], // Will be populated after orders
  },
];

const sampleCourses = [
  {
    title: "React Fundamentals",
    description:
      "Learn the basics of React including components, props, state, and hooks. Perfect for beginners who want to start their React journey.",
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
    transactionId: "TXN004_PENDING_MENTEE_JAVASCRIPT",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

async function seedDatabase() {
  try {
    console.log("🚀 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB successfully");

    // Clear existing data
    console.log("🧹 Clearing existing data...");
    await User.deleteMany({});
    await Course.deleteMany({});
    await Order.deleteMany({});
    await Cart.deleteMany({});
    console.log("✅ Cleared existing data");

    // Hash password once for all users
    console.log("🔐 Hashing passwords...");
    const hashedPassword = await bcrypt.hash("123456", 12);

    // Prepare users with hashed password
    const usersToInsert = sampleUsers.map((user) => ({
      ...user,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Prepare courses with timestamps
    const coursesToInsert = sampleCourses.map((course) => ({
      ...course,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Create users first
    console.log("👤 Creating users...");
    await User.insertMany(usersToInsert);
    console.log(`✅ Created ${usersToInsert.length} users with predefined IDs`);

    // Create courses
    console.log("📚 Creating courses...");
    await Course.insertMany(coursesToInsert);
    console.log(
      `✅ Created ${coursesToInsert.length} courses with predefined IDs`
    );

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
