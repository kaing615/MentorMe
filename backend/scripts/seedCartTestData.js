import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Cart from "../src/models/cart.model.js";
import Course from "../src/models/course.model.js";
import User from "../src/models/user.model.js";

// Load environment variables
dotenv.config();

// Kết nối MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Tạo dữ liệu test
const seedTestData = async () => {
  try {
    console.log("🗑️ Clearing existing data...");

    // Xóa dữ liệu cũ
    await User.deleteMany({});
    await Course.deleteMany({});
    await Cart.deleteMany({});

    console.log("👥 Creating test users...");

    // Tạo mentor users
    const mentors = await User.create([
      {
        email: "mentor1@test.com",
        userName: "mentor1",
        firstName: "John",
        lastName: "Doe",
        password: await bcrypt.hash("123456", 10),
        role: "mentor",
        isVerified: true,
        jobTitle: "Senior React Developer",
        location: "Ho Chi Minh City",
        category: "Web Development",
        bio: "Experienced React developer with 5+ years in the industry",
        skills: ["React", "JavaScript", "Node.js"],
      },
      {
        email: "mentor2@test.com",
        userName: "mentor2",
        firstName: "Jane",
        lastName: "Smith",
        password: await bcrypt.hash("123456", 10),
        role: "mentor",
        isVerified: true,
        jobTitle: "Python Data Scientist",
        location: "Hanoi",
        category: "Data Science",
        bio: "Data scientist specializing in machine learning and AI",
        skills: ["Python", "Machine Learning", "TensorFlow"],
      },
      {
        email: "mentor3@test.com",
        userName: "mentor3",
        firstName: "Mike",
        lastName: "Johnson",
        password: await bcrypt.hash("123456", 10),
        role: "mentor",
        isVerified: true,
        jobTitle: "Mobile App Developer",
        location: "Da Nang",
        category: "Mobile Development",
        bio: "Mobile developer with expertise in React Native and Flutter",
        skills: ["React Native", "Flutter", "iOS", "Android"],
      },
    ]);

    // Tạo mentee users
    const mentees = await User.create([
      {
        email: "mentee1@test.com",
        userName: "mentee1",
        firstName: "Alice",
        lastName: "Brown",
        password: await bcrypt.hash("123456", 10),
        role: "mentee",
        isVerified: true,
        jobTitle: "Junior Developer",
        location: "Ho Chi Minh City",
      },
      {
        email: "mentee2@test.com",
        userName: "mentee2",
        firstName: "Bob",
        lastName: "Wilson",
        password: await bcrypt.hash("123456", 10),
        role: "mentee",
        isVerified: true,
        jobTitle: "Student",
        location: "Hanoi",
      },
      {
        email: "mentee3@test.com",
        userName: "mentee3",
        firstName: "Carol",
        lastName: "Davis",
        password: await bcrypt.hash("123456", 10),
        role: "mentee",
        isVerified: true,
        jobTitle: "Fresher Developer",
        location: "Da Nang",
        // Thêm một số khóa học đã mua để test logic "already purchased"
        purchasedCourses: [],
      },
    ]);

    console.log("📚 Creating test courses...");

    // Tạo courses
    const courses = await Course.create([
      {
        title: "React Fundamentals - From Zero to Hero",
        description:
          "Complete React course covering hooks, state management, and modern React patterns",
        price: 299000,
        mentor: mentors[0]._id,
        category: "Web Development",
        tags: ["React", "JavaScript", "Frontend"],
        duration: 40,
        rate: 4.8,
        link: "https://example.com/react-course",
        lectures: 25,
      },
      {
        title: "Advanced React & Redux Toolkit",
        description:
          "Master advanced React concepts and Redux Toolkit for state management",
        price: 499000,
        mentor: mentors[0]._id,
        category: "Web Development",
        tags: ["React", "Redux", "Advanced"],
        duration: 60,
        rate: 4.9,
        link: "https://example.com/advanced-react",
        lectures: 35,
      },
      {
        title: "Python for Data Science",
        description:
          "Learn Python programming for data analysis and machine learning",
        price: 399000,
        mentor: mentors[1]._id,
        category: "Data Science",
        tags: ["Python", "Data Science", "ML"],
        duration: 50,
        rate: 4.7,
        link: "https://example.com/python-data-science",
        lectures: 30,
      },
      {
        title: "Machine Learning with TensorFlow",
        description:
          "Deep dive into machine learning using TensorFlow and Keras",
        price: 699000,
        mentor: mentors[1]._id,
        category: "Data Science",
        tags: ["TensorFlow", "ML", "Deep Learning"],
        duration: 80,
        rate: 4.9,
        link: "https://example.com/tensorflow-course",
        lectures: 45,
      },
      {
        title: "React Native Mobile Development",
        description: "Build cross-platform mobile apps with React Native",
        price: 549000,
        mentor: mentors[2]._id,
        category: "Mobile Development",
        tags: ["React Native", "Mobile", "Cross-platform"],
        duration: 70,
        rate: 4.6,
        link: "https://example.com/react-native",
        lectures: 40,
      },
      {
        title: "Flutter Complete Course",
        description: "Master Flutter development for iOS and Android",
        price: 599000,
        mentor: mentors[2]._id,
        category: "Mobile Development",
        tags: ["Flutter", "Dart", "Mobile"],
        duration: 75,
        rate: 4.8,
        link: "https://example.com/flutter-course",
        lectures: 50,
      },
    ]);

    console.log("🛒 Creating test carts...");

    // Tạo cart cho mentee1 với một số courses
    await Cart.create({
      user: mentees[0]._id,
      courses: [
        {
          course: courses[0]._id, // React Fundamentals
          addedAt: new Date(),
        },
        {
          course: courses[2]._id, // Python for Data Science
          addedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        },
      ],
      totalPrice: courses[0].price + courses[2].price, // 299000 + 399000 = 698000
    });

    // Tạo cart cho mentee2 với một course
    await Cart.create({
      user: mentees[1]._id,
      courses: [
        {
          course: courses[4]._id, // React Native
          addedAt: new Date(),
        },
      ],
      totalPrice: courses[4].price, // 549000
    });

    // mentee3 sẽ có cart trống (sẽ được tự động tạo khi cần)

    // Thêm purchased courses cho mentee3 để test logic "already purchased"
    await User.findByIdAndUpdate(mentees[2]._id, {
      $push: {
        purchasedCourses: {
          course: courses[1]._id, // Advanced React
          purchaseDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          progress: 25,
          lastAccessDate: new Date(),
          isCompleted: false,
        },
      },
    });

    console.log("✅ Test data created successfully!");
    console.log("\n📋 Test Data Summary:");
    console.log("=" * 50);

    console.log("\n👥 USERS:");
    console.log("Mentors:");
    mentors.forEach((mentor, index) => {
      console.log(
        `  ${index + 1}. ${mentor.email} (${mentor.firstName} ${
          mentor.lastName
        }) - ${mentor.jobTitle}`
      );
    });

    console.log("\nMentees:");
    mentees.forEach((mentee, index) => {
      console.log(
        `  ${index + 1}. ${mentee.email} (${mentee.firstName} ${
          mentee.lastName
        }) - ${mentee.jobTitle}`
      );
    });

    console.log("\n📚 COURSES:");
    courses.forEach((course, index) => {
      console.log(
        `  ${index + 1}. ${
          course.title
        } - ${course.price.toLocaleString()}đ (by ${
          mentors.find((m) => m._id.equals(course.mentor)).firstName
        })`
      );
    });

    console.log("\n🛒 CARTS:");
    console.log(
      `  1. mentee1@test.com: 2 courses (${(
        courses[0].price + courses[2].price
      ).toLocaleString()}đ)`
    );
    console.log(
      `  2. mentee2@test.com: 1 course (${courses[4].price.toLocaleString()}đ)`
    );
    console.log(
      `  3. mentee3@test.com: Empty cart (has purchased Advanced React)`
    );

    console.log("\n🔑 Login Credentials (all passwords: 123456):");
    console.log("  mentee1@test.com - Has cart with 2 courses");
    console.log("  mentee2@test.com - Has cart with 1 course");
    console.log("  mentee3@test.com - Empty cart, purchased 1 course");

    console.log("\n🧪 TEST SCENARIOS:");
    console.log("1. Login as mentee1@test.com to test:");
    console.log("   - GET /cart (should return 2 courses)");
    console.log("   - POST /cart with new courseId (add course)");
    console.log("   - DELETE /cart/courseId (remove course)");
    console.log("   - GET /cart/check/courseId (check if course in cart)");

    console.log("\n2. Login as mentee3@test.com to test:");
    console.log("   - GET /cart (auto-create empty cart)");
    console.log(
      `   - POST /cart with courseId: ${courses[1]._id} (should fail - already purchased)`
    );
    console.log("   - POST /cart with other courseId (should succeed)");

    console.log("\n📝 USEFUL IDs FOR TESTING:");
    console.log("Course IDs:");
    courses.forEach((course, index) => {
      console.log(`  ${course.title}: ${course._id}`);
    });
  } catch (error) {
    console.error("❌ Error seeding data:", error);
  }
};

// Chạy script
const runSeed = async () => {
  await connectDB();
  await seedTestData();
  await mongoose.disconnect();
  console.log("\n🔌 Disconnected from MongoDB");
  process.exit(0);
};

runSeed();
