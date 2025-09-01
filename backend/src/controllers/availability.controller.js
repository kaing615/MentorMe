import responseHandler from "../handlers/response.handler.js";
import Availability from "../models/availability.model.js";
import User from "../models/user.model.js";

/**
 * Mentor tạo hoặc cập nhật availability cho một ngày
 * POST /api/availability
 */
export const createOrUpdateAvailability = async (req, res) => {
  try {
    const mentorId = req.user.id;
    const { date, timezone = "Asia/Ho_Chi_Minh", slots } = req.body;

    // Kiểm tra user là mentor
    const mentor = await User.findById(mentorId);
    if (!mentor || !mentor.role.includes("mentor")) {
      return responseHandler.forbidden(
        res,
        "Chỉ mentor mới có thể tạo availability"
      );
    }

    // Validate date không phải quá khứ
    // Fix: Handle both string and Date object input - Always create UTC date
    let inputDate;
    if (typeof date === "string") {
      // String input - create UTC date to avoid timezone issues
      const dateStr = date.includes("T") ? date.split("T")[0] : date;
      // Ensure YYYY-MM-DD format by padding zeros
      const parts = dateStr.split("-");
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);

      // Create UTC date using ISO string format
      const isoDateStr = `${year}-${month.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}T00:00:00.000Z`;
      inputDate = new Date(isoDateStr);
    } else {
      // Date object input - extract date parts and recreate as UTC to avoid timezone issues
      const dateObj = new Date(date);
      // Get date parts in local timezone (which is what the original date string intended)
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1; // getMonth() is 0-based
      const day = dateObj.getDate();

      // Recreate as UTC date
      const isoDateStr = `${year}-${month.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}T00:00:00.000Z`;
      inputDate = new Date(isoDateStr);
    }

    // Today comparison in UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (inputDate < today) {
      return responseHandler.badRequest(
        res,
        "Không thể tạo availability cho ngày trong quá khứ"
      );
    }

    // Validate năm hiện tại (nếu cần)
    const currentYear = new Date().getFullYear();
    if (inputDate.getFullYear() !== currentYear) {
      return responseHandler.badRequest(
        res,
        `Chỉ có thể tạo availability trong năm ${currentYear}`
      );
    }

    // Chuẩn hóa date về 00:00 UTC - Use inputDate directly
    const normalizedDate = new Date(inputDate);

    // Validate slots format
    if (!Array.isArray(slots)) {
      return responseHandler.badRequest(res, "Slots phải là một array");
    }

    // Validate từng slot
    for (const slot of slots) {
      if (!slot.start || !slot.end) {
        return responseHandler.badRequest(
          res,
          "Mỗi slot phải có start và end time"
        );
      }

      // Validate time format (HH:mm)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(slot.start) || !timeRegex.test(slot.end)) {
        return responseHandler.badRequest(
          res,
          "Time format phải là HH:mm (24h)"
        );
      }

      // Validate slot duration (chính xác 30 phút)
      const startMinutes = slot.start
        .split(":")
        .reduce((h, m) => h * 60 + parseInt(m));
      const endMinutes = slot.end
        .split(":")
        .reduce((h, m) => h * 60 + parseInt(m));

      if (endMinutes <= startMinutes) {
        return responseHandler.badRequest(res, "End time phải sau start time");
      }

      const duration = endMinutes - startMinutes;
      if (duration !== 30) {
        return responseHandler.badRequest(
          res,
          "Mỗi slot phải có thời gian chính xác 30 phút"
        );
      }

      // Validate working hours: 6:00 - 22:00
      const startHour = parseInt(slot.start.split(":")[0]);
      const endHour = parseInt(slot.end.split(":")[0]);
      const endMinute = parseInt(slot.end.split(":")[1]);

      if (startHour < 6) {
        return responseHandler.badRequest(
          res,
          `Giờ bắt đầu không thể trước 6:00 (${slot.start})`
        );
      }

      if (endHour > 22 || (endHour === 22 && endMinute > 0)) {
        return responseHandler.badRequest(
          res,
          `Giờ kết thúc không thể sau 22:00 (${slot.end})`
        );
      }
    }

    // Validate không có slots trùng giờ
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const slot1 = slots[i];
        const slot2 = slots[j];

        const start1 = slot1.start
          .split(":")
          .reduce((h, m) => h * 60 + parseInt(m));
        const end1 = slot1.end
          .split(":")
          .reduce((h, m) => h * 60 + parseInt(m));
        const start2 = slot2.start
          .split(":")
          .reduce((h, m) => h * 60 + parseInt(m));
        const end2 = slot2.end
          .split(":")
          .reduce((h, m) => h * 60 + parseInt(m));

        // Check overlap: slot1 và slot2 có trùng không
        if (start1 < end2 && start2 < end1) {
          return responseHandler.badRequest(
            res,
            `Slots trùng giờ: ${slot1.start}-${slot1.end} và ${slot2.start}-${slot2.end}`
          );
        }
      }
    }

    // Tìm availability hiện tại hoặc tạo mới
    let availability = await Availability.findOne({
      mentor: mentorId,
      date: normalizedDate,
    });

    if (availability) {
      // Merge slots mới với slots hiện tại (không ghi đè)
      const existingSlots = availability.slots || [];
      const newSlots = slots.map((slot) => ({
        start: slot.start,
        end: slot.end,
        status: slot.status || "open",
      }));

      // Validate không trùng với slots hiện tại
      for (const newSlot of newSlots) {
        const newStart = newSlot.start
          .split(":")
          .reduce((h, m) => h * 60 + parseInt(m));
        const newEnd = newSlot.end
          .split(":")
          .reduce((h, m) => h * 60 + parseInt(m));

        for (const existingSlot of existingSlots) {
          const existingStart = existingSlot.start
            .split(":")
            .reduce((h, m) => h * 60 + parseInt(m));
          const existingEnd = existingSlot.end
            .split(":")
            .reduce((h, m) => h * 60 + parseInt(m));

          // Check overlap với slots hiện tại
          if (newStart < existingEnd && existingStart < newEnd) {
            return responseHandler.badRequest(
              res,
              `Slot ${newSlot.start}-${newSlot.end} trùng giờ với slot hiện tại ${existingSlot.start}-${existingSlot.end}`
            );
          }
        }
      }

      // Add slots mới vào availability hiện tại
      availability.slots.push(...newSlots);
      availability.timezone = timezone;
    } else {
      // Tạo mới
      availability = new Availability({
        mentor: mentorId,
        date: normalizedDate,
        timezone,
        slots: slots.map((slot) => ({
          start: slot.start,
          end: slot.end,
          status: slot.status || "open",
        })),
      });
    }

    await availability.save();

    return responseHandler.created(res, {
      message: "Availability đã được tạo/cập nhật thành công",
      availability: {
        ...availability.toObject(),
        dayOfWeek: normalizedDate.toLocaleDateString("vi-VN", {
          weekday: "long",
        }),
      },
    });
  } catch (error) {
    console.error("Error creating/updating availability:", error);
    if (error.name === "ValidationError") {
      return responseHandler.badRequest(res, error.message);
    }
    return responseHandler.error(res, "Lỗi khi tạo/cập nhật availability");
  }
};

/**
 * Lấy availability của mentor cho một ngày (chỉ mentor xem của chính mình)
 * GET /api/availability?date=YYYY-MM-DD
 */
export const getAvailability = async (req, res) => {
  try {
    const mentorId = req.user.id; // Lấy từ token thay vì params
    let { date } = req.query;

    // Nếu không truyền date, sử dụng ngày hiện tại
    if (!date) {
      const today = new Date();
      date = today.toISOString().split("T")[0]; // Format YYYY-MM-DD
    }

    // Validate mentor
    const mentor = await User.findById(mentorId);
    if (!mentor || !mentor.role.includes("mentor")) {
      return responseHandler.forbidden(
        res,
        "Chỉ mentor mới có thể xem availability của mình"
      );
    }

    // Chuẩn hóa date
    const inputDate = new Date(date);
    const normalizedDate = new Date(
      inputDate.toISOString().split("T")[0] + "T00:00:00.000Z"
    );

    // Tìm availability
    const availability = await Availability.findOne({
      mentor: mentorId,
      date: normalizedDate,
    }).populate("mentor", "firstName lastName avatarUrl");

    if (!availability) {
      return responseHandler.ok(res, {
        message: "Không có availability cho ngày này",
        availability: null,
        dayOfWeek: normalizedDate.toLocaleDateString("vi-VN", {
          weekday: "long",
        }),
        mentor: {
          _id: mentor._id,
          firstName: mentor.firstName,
          lastName: mentor.lastName,
          avatarUrl: mentor.avatarUrl,
        },
      });
    }

    return responseHandler.ok(res, {
      availability,
      dayOfWeek: normalizedDate.toLocaleDateString("vi-VN", {
        weekday: "long",
      }),
    });
  } catch (error) {
    console.error("Error getting availability:", error);
    return responseHandler.error(res, "Lỗi khi lấy availability");
  }
};

/**
 * Lấy lịch trong ngày của mentor (detailed schedule)
 * GET /api/availability/today-schedule?date=YYYY-MM-DD
 */
export const getTodaySchedule = async (req, res) => {
  try {
    const mentorId = req.user.id;
    let { date } = req.query;

    // Nếu không truyền date, sử dụng ngày hiện tại
    if (!date) {
      const today = new Date();
      date = today.toISOString().split("T")[0];
    }

    // Validate mentor
    const mentor = await User.findById(mentorId);
    if (!mentor || !mentor.role.includes("mentor")) {
      return responseHandler.forbidden(
        res,
        "Chỉ mentor mới có thể xem lịch của mình"
      );
    }

    // Chuẩn hóa date
    const inputDate = new Date(date);
    const normalizedDate = new Date(
      inputDate.toISOString().split("T")[0] + "T00:00:00.000Z"
    );

    // Tìm availability cho ngày đó
    const availability = await Availability.findOne({
      mentor: mentorId,
      date: normalizedDate,
    }).populate("mentor", "firstName lastName avatarUrl jobTitle");

    if (!availability) {
      return responseHandler.ok(res, {
        message: "Không có lịch cho ngày này",
        schedule: {
          date: date,
          dayOfWeek: normalizedDate.toLocaleDateString("vi-VN", {
            weekday: "long",
          }),
          mentor: {
            _id: mentor._id,
            firstName: mentor.firstName,
            lastName: mentor.lastName,
            avatarUrl: mentor.avatarUrl,
            jobTitle: mentor.jobTitle,
          },
          timezone: "Asia/Ho_Chi_Minh",
          totalSlots: 0,
          openSlots: 0,
          blockedSlots: 0,
          slots: [],
        },
      });
    }

    // Tính toán thống kê
    const totalSlots = availability.slots.length;
    const openSlots = availability.slots.filter(
      (slot) => slot.status === "open"
    ).length;
    const blockedSlots = availability.slots.filter(
      (slot) => slot.status === "blocked"
    ).length;

    // Format response với thông tin chi tiết
    const schedule = {
      date: date,
      dayOfWeek: normalizedDate.toLocaleDateString("vi-VN", {
        weekday: "long",
      }),
      mentor: {
        _id: availability.mentor._id,
        firstName: availability.mentor.firstName,
        lastName: availability.mentor.lastName,
        avatarUrl: availability.mentor.avatarUrl,
        jobTitle: availability.mentor.jobTitle,
      },
      timezone: availability.timezone,
      totalSlots,
      openSlots,
      blockedSlots,
      slots: availability.slots.map((slot) => ({
        _id: slot._id,
        start: slot.start,
        end: slot.end,
        status: slot.status,
        duration: calculateDuration(slot.start, slot.end),
        isAvailable: slot.status === "open",
      })),
    };

    return responseHandler.ok(res, {
      message: "Lịch trong ngày được tải thành công",
      schedule,
    });
  } catch (error) {
    console.error("Error getting today schedule:", error);
    return responseHandler.error(res, "Lỗi khi lấy lịch trong ngày");
  }
};

// Helper function để tính duration
const calculateDuration = (start, end) => {
  const startMinutes = start.split(":").reduce((h, m) => h * 60 + parseInt(m));
  const endMinutes = end.split(":").reduce((h, m) => h * 60 + parseInt(m));
  const durationMinutes = endMinutes - startMinutes;

  if (durationMinutes >= 60) {
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${durationMinutes}m`;
};

/**
 * Xóa availability của mentor cho một ngày
 * DELETE /api/availability/:availabilityId
 */
export const deleteAvailability = async (req, res) => {
  try {
    const mentorId = req.user.id;
    const { availabilityId } = req.params;

    const availability = await Availability.findById(availabilityId);

    if (!availability) {
      return responseHandler.notFound(res, "Availability không tồn tại");
    }

    // Kiểm tra quyền sở hữu
    if (availability.mentor.toString() !== mentorId) {
      return responseHandler.forbidden(
        res,
        "Bạn không có quyền xóa availability này"
      );
    }

    // Đơn giản chỉ xóa availability (không cần check hold/booked)
    await Availability.findByIdAndDelete(availabilityId);

    return responseHandler.ok(res, {
      message: "Availability đã được xóa thành công",
    });
  } catch (error) {
    console.error("Error deleting availability:", error);
    return responseHandler.error(res, "Lỗi khi xóa availability");
  }
};

/**
 * Lấy danh sách availability của mentor trong khoảng thời gian
 * GET /api/availability/mentor/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const getMentorAvailabilityRange = async (req, res) => {
  try {
    const mentorId = req.user.id;
    let { startDate, endDate } = req.query;

    // Nếu không truyền startDate và endDate, sử dụng mặc định từ hôm nay đến 7 ngày tiếp theo
    if (!startDate || !endDate) {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      startDate = startDate || today.toISOString().split("T")[0];
      endDate = endDate || nextWeek.toISOString().split("T")[0];
    }

    // Chuẩn hóa dates
    const start = new Date(startDate + "T00:00:00.000Z");
    const end = new Date(endDate + "T00:00:00.000Z");

    if (start > end) {
      return responseHandler.badRequest(
        res,
        "startDate không thể lớn hơn endDate"
      );
    }

    const availabilities = await Availability.find({
      mentor: mentorId,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 });

    // Add dayOfWeek to each availability
    const availabilitiesWithDayOfWeek = availabilities.map((availability) => ({
      ...availability.toObject(),
      dayOfWeek: availability.date.toLocaleDateString("vi-VN", {
        weekday: "long",
      }),
    }));

    return responseHandler.ok(res, {
      availabilities: availabilitiesWithDayOfWeek,
      count: availabilities.length,
    });
  } catch (error) {
    console.error("Error getting mentor availability range:", error);
    return responseHandler.error(res, "Lỗi khi lấy danh sách availability");
  }
};

/**
 * Lấy availability của mentor trong 7 ngày tới (chỉ mentor của chính mình)
 * GET /api/availability/overview
 */
export const getAvailabilityOverview = async (req, res) => {
  try {
    const mentorId = req.user.id;

    // Kiểm tra user là mentor
    const mentor = await User.findById(mentorId);
    if (!mentor || !mentor.role.includes("mentor")) {
      return responseHandler.forbidden(
        res,
        "Chỉ mentor mới có thể xem availability overview của mình"
      );
    }

    // Lấy 7 ngày tới từ hôm nay (bao gồm hôm nay)
    const today = new Date();

    // Clear time để đảm bảo so sánh date only
    const startDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 7
    );

    const availabilities = await Availability.find({
      mentor: mentorId,
      date: { $gte: startDate, $lt: endDate },
    }).sort({ date: 1 });

    // Format response cho Frontend
    const overview = [];

    // Tạo template cho 7 ngày (từ hôm nay)
    for (let i = 0; i < 7; i++) {
      // Fix: Use UTC date arithmetic to avoid timezone issues
      const currentDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = currentDate.toISOString().split("T")[0];

      // Tìm availability cho ngày này
      const dayAvailability = availabilities.find((avail) => {
        const availDateStr = avail.date.toISOString().split("T")[0];
        return availDateStr === dateStr;
      });
      overview.push({
        date: dateStr,
        dayOfWeek: currentDate.toLocaleDateString("vi-VN", { weekday: "long" }),
        hasAvailability: !!dayAvailability,
        slots: dayAvailability ? dayAvailability.slots : [],
        totalSlots: dayAvailability ? dayAvailability.slots.length : 0,
        availableSlots: dayAvailability
          ? dayAvailability.slots.filter((slot) => slot.status === "open")
              .length
          : 0,
        timezone: dayAvailability
          ? dayAvailability.timezone
          : "Asia/Ho_Chi_Minh",
      });
    }

    return responseHandler.ok(res, {
      mentor: {
        _id: mentor._id,
        firstName: mentor.firstName,
        lastName: mentor.lastName,
        avatarUrl: mentor.avatarUrl,
      },
      overview,
      period: {
        startDate: startDate.toISOString().split("T")[0],
        endDate: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + 6
        )
          .toISOString()
          .split("T")[0], // Ngày thứ 7
        totalDays: 7,
      },
      summary: {
        totalDaysWithSlots: overview.filter((day) => day.hasAvailability)
          .length,
        totalSlots: overview.reduce((sum, day) => sum + day.totalSlots, 0),
        totalAvailableSlots: overview.reduce(
          (sum, day) => sum + day.availableSlots,
          0
        ),
      },
    });
  } catch (error) {
    console.error("Error getting availability overview:", error);
    return responseHandler.error(res, "Lỗi khi lấy tổng quan availability");
  }
};

/**
 * Manual cleanup old availabilities (Admin endpoint)
 * POST /api/availability/cleanup-old
 */
export const manualCleanupOldAvailabilities = async (req, res) => {
  try {
    const { daysBack = 3 } = req.body;

    const { runManualOldAvailabilityCleanup } = await import(
      "../jobs/cleanupOldAvailabilities.job.js"
    );

    const result = await runManualOldAvailabilityCleanup(daysBack);

    if (result.success) {
      return responseHandler.ok(res, {
        message: `Cleanup completed successfully`,
        deletedCount: result.deletedCount,
        cutoffDate: result.cutoffDate,
        daysBack: result.daysBack,
        timestamp: result.timestamp,
      });
    } else {
      return responseHandler.error(res, `Cleanup failed: ${result.error}`);
    }
  } catch (error) {
    console.error("Error in manual old availability cleanup:", error);
    return responseHandler.error(res, "Lỗi khi thực hiện cleanup");
  }
};

export default {
  createOrUpdateAvailability,
  getAvailability,
  getTodaySchedule,
  deleteAvailability,
  getMentorAvailabilityRange,
  getAvailabilityOverview,
  manualCleanupOldAvailabilities,
};
