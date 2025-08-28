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

// Kiểm tra dữ liệu
const checkData = async () => {
  try {
    console.log("🔍 Checking database collections...");

    // Kiểm tra Users
    const userCount = await User.countDocuments();
    console.log(`\n👥 Users: ${userCount} documents`);

    if (userCount > 0) {
      const users = await User.find({}, "email firstName lastName role").limit(
        10
      );
      users.forEach((user) => {
        console.log(
          `  - ${user.email} (${user.firstName} ${user.lastName}) - ${user.role}`
        );
      });
    }

    // Kiểm tra Courses
    const courseCount = await Course.countDocuments();
    console.log(`\n📚 Courses: ${courseCount} documents`);

    if (courseCount > 0) {
      const courses = await Course.find({}, "title price mentor")
        .populate("mentor", "firstName lastName")
        .limit(10);
      courses.forEach((course) => {
        console.log(
          `  - ${course.title} - ${course.price.toLocaleString()}đ (by ${
            course.mentor?.firstName || "Unknown"
          })`
        );
        console.log(`    ID: ${course._id}`);
      });
    }

    // Kiểm tra Carts
    const cartCount = await Cart.countDocuments();
    console.log(`\n🛒 Carts: ${cartCount} documents`);

    if (cartCount > 0) {
      const carts = await Cart.find({})
        .populate("user", "email firstName lastName")
        .populate("courses.course", "title price");

      carts.forEach((cart) => {
        console.log(
          `  - User: ${cart.user?.email || "Unknown"} (${
            cart.user?.firstName || ""
          } ${cart.user?.lastName || ""})`
        );
        console.log(
          `    Courses: ${
            cart.courses.length
          }, Total: ${cart.totalPrice.toLocaleString()}đ`
        );
        cart.courses.forEach((item) => {
          console.log(
            `      • ${item.course?.title || "Unknown Course"} - ${
              item.course?.price?.toLocaleString() || 0
            }đ`
          );
        });
        console.log(`    Cart ID: ${cart._id}`);
        console.log("");
      });
    } else {
      console.log("  ❌ No carts found in database!");

      // Tạo một cart test để kiểm tra
      console.log("\n🔧 Creating a test cart...");

      const testUser = await User.findOne({ email: "mentee1@test.com" });
      const testCourse = await Course.findOne();

      if (testUser && testCourse) {
        const testCart = await Cart.create({
          user: testUser._id,
          courses: [
            {
              course: testCourse._id,
              addedAt: new Date(),
            },
          ],
          totalPrice: testCourse.price,
        });

        console.log(`✅ Test cart created with ID: ${testCart._id}`);
        console.log(`   User: ${testUser.email}`);
        console.log(`   Course: ${testCourse.title}`);
        console.log(`   Price: ${testCourse.price.toLocaleString()}đ`);
      } else {
        console.log("❌ Cannot create test cart - missing user or course");
      }
    }

    // Kiểm tra purchased courses
    console.log("\n💰 Users with purchased courses:");
    const usersWithPurchases = await User.find(
      { "purchasedCourses.0": { $exists: true } },
      "email purchasedCourses"
    ).populate("purchasedCourses.course", "title");

    if (usersWithPurchases.length > 0) {
      usersWithPurchases.forEach((user) => {
        console.log(
          `  - ${user.email}: ${user.purchasedCourses.length} purchased courses`
        );
        user.purchasedCourses.forEach((pc) => {
          console.log(
            `    • ${pc.course?.title || "Unknown"} (${pc.progress}% complete)`
          );
        });
      });
    } else {
      console.log("  No users with purchased courses found");
    }

    // Thống kê tổng quan
    console.log("\n📊 DATABASE SUMMARY:");
    console.log("=" * 40);
    console.log(`Users: ${userCount}`);
    console.log(`Courses: ${courseCount}`);
    console.log(`Carts: ${cartCount}`);

    // Liệt kê tất cả collections
    console.log("\n📁 All collections in database:");
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    collections.forEach((collection) => {
      console.log(`  - ${collection.name}`);
    });
  } catch (error) {
    console.error("❌ Error checking data:", error);
  }
};

// Chạy script kiểm tra
const runCheck = async () => {
  await connectDB();
  await checkData();
  await mongoose.disconnect();
  console.log("\n🔌 Disconnected from MongoDB");
  process.exit(0);
};

runCheck();
