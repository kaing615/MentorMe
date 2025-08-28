import dotenv from "dotenv";
import mongoose from "mongoose";
import Cart from "../src/models/cart.model.js";
import Course from "../src/models/course.model.js";
import Order from "../src/models/order.model.js";
import User from "../src/models/user.model.js";

dotenv.config();

async function clearTestData() {
  try {
    console.log("🚀 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB successfully");

    console.log("🧹 Clearing all test data...");

    const userResult = await User.deleteMany({});
    const courseResult = await Course.deleteMany({});
    const orderResult = await Order.deleteMany({});
    const cartResult = await Cart.deleteMany({});

    console.log(`✅ Deleted ${userResult.deletedCount} users`);
    console.log(`✅ Deleted ${courseResult.deletedCount} courses`);
    console.log(`✅ Deleted ${orderResult.deletedCount} orders`);
    console.log(`✅ Deleted ${cartResult.deletedCount} carts`);

    console.log("🎉 All test data cleared successfully!");
  } catch (error) {
    console.error("❌ Error clearing test data:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

clearTestData();
