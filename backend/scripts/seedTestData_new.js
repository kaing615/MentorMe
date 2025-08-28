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

    // Create users first
    console.log("👤 Creating users...");
    const usersToInsert = sampleUsers.map((user) => ({
      ...user,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const createdUsers = await User.insertMany(usersToInsert);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Find users by role for reference
    const mentor = createdUsers.find((user) => user.role === "mentor");
    const mentee = createdUsers.find((user) => user.role === "mentee");
    const testUser = createdUsers.find((user) => user.userName === "testuser");

    // Create courses with mentor reference
    console.log("📚 Creating courses...");
    const coursesToInsert = sampleCourses.map((course) => ({
      ...course,
      mentor: mentor._id, // Assign mentor to all courses
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const createdCourses = await Course.insertMany(coursesToInsert);
    console.log(`✅ Created ${createdCourses.length} courses`);

    // Create sample orders with dynamic references
    console.log("🛒 Creating orders...");
    const sampleOrders = [
      {
        mentee: mentee._id,
        courses: [createdCourses[0]._id, createdCourses[1]._id], // React + Node.js for mentee
        type: "course",
        amount: createdCourses[0].price + createdCourses[1].price,
        status: "paid",
        paymentMethod: "paypal",
        transactionId: "TXN001_PAID_MENTEE_REACT_NODEJS",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        mentee: testUser._id,
        courses: [createdCourses[2]._id], // JavaScript for testUser
        type: "course",
        amount: createdCourses[2].price,
        status: "paid",
        paymentMethod: "stripe",
        transactionId: "TXN002_PAID_TESTUSER_JAVASCRIPT",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        mentee: testUser._id,
        courses: [createdCourses[3]._id, createdCourses[4]._id], // Python + UI/UX for testUser
        type: "course",
        amount: createdCourses[3].price + createdCourses[4].price,
        status: "paid",
        paymentMethod: "bank",
        transactionId: "TXN003_PAID_TESTUSER_PYTHON_UIUX",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        mentee: mentee._id,
        courses: [createdCourses[2]._id], // JavaScript for mentee (PENDING for testing)
        type: "course",
        amount: createdCourses[2].price,
        status: "pending",
        paymentMethod: "momo",
        transactionId: "TXN004_PENDING_MENTEE_JAVASCRIPT",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const createdOrders = await Order.insertMany(sampleOrders);
    console.log(`✅ Created ${createdOrders.length} orders`);

    // Process PAID orders to create purchased courses and update mentees
    console.log("💰 Processing paid orders for purchased courses...");

    const paidOrders = createdOrders.filter((order) => order.status === "paid");

    for (const order of paidOrders) {
      console.log(`\n   📋 Processing order: ${order.transactionId}`);

      // Create purchased courses for the user
      const purchasedCourses = order.courses.map((courseId) => ({
        course: courseId, // Use 'course' field to match User model
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

    // Verify final data and display test information
    console.log("\n🔍 Final verification and test data...");

    const finalUsers = await User.find({});
    const finalCourses = await Course.find({});

    console.log("\n🎯 TEST CREDENTIALS:");
    console.log("===================");
    console.log("🧑‍🏫 Mentor account:");
    console.log("  Email: mentor1@test.com");
    console.log("  Password: 123456");
    console.log(`  User ID: ${mentor._id}`);

    console.log("\n🎓 Mentee account (2 purchased courses):");
    console.log("  Email: mentee1@test.com");
    console.log("  Password: 123456");
    console.log(`  User ID: ${mentee._id}`);
    console.log("  Purchased courses:");
    const menteeUser = finalUsers.find(
      (u) => u._id.toString() === mentee._id.toString()
    );
    menteeUser.purchasedCourses.forEach((pc, index) => {
      const course = finalCourses.find(
        (c) => c._id.toString() === pc.course.toString()
      );
      console.log(
        `    ${index + 1}. ${course?.title} (ID: ${pc.course}, Progress: ${
          pc.progress
        }%)`
      );
    });

    console.log("\n🧪 Test User account (3 purchased courses):");
    console.log("  Email: testuser@example.com");
    console.log("  Password: 123456");
    console.log(`  User ID: ${testUser._id}`);
    console.log("  Purchased courses:");
    const testUserData = finalUsers.find(
      (u) => u._id.toString() === testUser._id.toString()
    );
    testUserData.purchasedCourses.forEach((pc, index) => {
      const course = finalCourses.find(
        (c) => c._id.toString() === pc.course.toString()
      );
      console.log(
        `    ${index + 1}. ${course?.title} (ID: ${pc.course}, Progress: ${
          pc.progress
        }%)`
      );
    });

    console.log("\n📚 ALL AVAILABLE COURSES:");
    console.log("=========================");
    finalCourses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title}`);
      console.log(`   ID: ${course._id}`);
      console.log(`   Price: ${course.price.toLocaleString()}đ`);
      console.log(`   Mentees: ${course.mentees.length}`);
      console.log("");
    });

    console.log("📋 API TESTING GUIDE:");
    console.log("=====================");
    console.log("1️⃣ Login with testuser@example.com / 123456");
    console.log("2️⃣ Copy JWT token and authorize in Swagger");
    console.log("3️⃣ Test these endpoints:");
    console.log("   GET /api/v1/purchased-courses (should return 3 courses)");
    console.log(
      "   GET /api/v1/purchased-courses/stats (should show statistics)"
    );

    // Get first purchased course for testing
    if (testUserData.purchasedCourses.length > 0) {
      const firstCourse = testUserData.purchasedCourses[0];
      console.log(
        `   GET /api/v1/purchased-courses/check/${firstCourse.course} (should return isPurchased: true)`
      );
      console.log(
        `   PUT /api/v1/purchased-courses/${firstCourse.course}/progress (test progress update)`
      );
    }

    // Get a course that's not purchased for cart testing
    const notPurchasedCourse = finalCourses.find(
      (course) =>
        !testUserData.purchasedCourses.some(
          (pc) => pc.course.toString() === course._id.toString()
        )
    );

    if (notPurchasedCourse) {
      console.log(
        `   POST /api/v1/cart/add/${notPurchasedCourse._id} (add course to cart)`
      );
      console.log(`   GET /api/v1/cart (view cart contents)`);
    }

    console.log("\n✅ Database seeded successfully with dynamic ObjectIDs!");
    console.log("🎉 All data relationships are properly established!");
    console.log("🔗 Ready for comprehensive API testing!");
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
