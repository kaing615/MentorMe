import cron from "node-cron";
import Availability from "../models/availability.model.js";

/**
 * Background job để xóa các availability cũ hơn 3 ngày
 * Chạy vào 00:01 mỗi ngày (khi sang ngày mới)
 */
const cleanupOldAvailabilities = cron.schedule(
  "1 0 * * *", // Chạy lúc 00:01 mỗi ngày
  async () => {
    try {
      console.log("🗑️ [CLEANUP JOB] Starting cleanup old availabilities...");

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Tính ngày cutoff (3 ngày trước)
      const cutoffDate = new Date(today);
      cutoffDate.setDate(today.getDate() - 3);

      // Xóa tất cả availability có date < cutoffDate (cũ hơn 3 ngày)
      const result = await Availability.deleteMany({
        date: { $lt: cutoffDate },
      });

      if (result.deletedCount > 0) {
        console.log(
          `✅ [CLEANUP JOB] Successfully deleted ${result.deletedCount} availability records older than 3 days`
        );
        console.log(
          `📅 [CLEANUP JOB] Cutoff date: ${
            cutoffDate.toISOString().split("T")[0]
          }`
        );
      } else {
        console.log("ℹ️ [CLEANUP JOB] No old availabilities found to delete");
      }

      // Log thống kê availability hiện tại
      const currentCount = await Availability.countDocuments();
      const upcomingCount = await Availability.countDocuments({
        date: { $gte: today },
      });

      console.log(
        `📊 [CLEANUP JOB] Total availability records: ${currentCount}`
      );
      console.log(
        `📊 [CLEANUP JOB] Upcoming availability records: ${upcomingCount}`
      );

      // Log memory usage sau cleanup
      const memUsage = process.memoryUsage();
      console.log(
        `💾 [CLEANUP JOB] Memory usage: ${Math.round(
          memUsage.heapUsed / 1024 / 1024
        )}MB`
      );
    } catch (error) {
      console.error(
        "❌ [CLEANUP JOB] Error during old availability cleanup:",
        error
      );
    }
  },
  {
    scheduled: false, // Không tự động start, sẽ start manual
    timezone: "Asia/Ho_Chi_Minh",
  }
);

/**
 * Manual cleanup function cho admin
 */
export const runManualOldAvailabilityCleanup = async (daysBack = 3) => {
  try {
    console.log(
      `🗑️ [MANUAL CLEANUP] Starting cleanup availabilities older than ${daysBack} days...`
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() - daysBack);

    const result = await Availability.deleteMany({
      date: { $lt: cutoffDate },
    });

    console.log(
      `✅ [MANUAL CLEANUP] Deleted ${result.deletedCount} availability records`
    );

    return {
      success: true,
      deletedCount: result.deletedCount,
      cutoffDate: cutoffDate.toISOString().split("T")[0],
      daysBack,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("❌ [MANUAL CLEANUP] Error:", error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date(),
    };
  }
};

export default cleanupOldAvailabilities;
