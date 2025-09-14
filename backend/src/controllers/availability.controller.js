import responseHandler from "../handlers/response.handler.js";
import Availability from "../models/availability.model.js";
import User from "../models/user.model.js";
import Booking from "../models/booking.model.js";

/**
 * Mentor tạo hoặc cập nhật availability cho một ngày
 * POST /api/availability
 */
export const createOrUpdateAvailability = async (req, res) => {
  try {
    const mentorId = req.user.id;
    const { date, timezone = "Asia/Ho_Chi_Minh", slots } = req.body;

    // Debug logging
    console.log("=== CREATE/UPDATE AVAILABILITY DEBUG ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("Mentor ID:", mentorId);
    console.log("Date:", date, "Type:", typeof date);
    console.log("Timezone:", timezone);
    console.log("Slots:", JSON.stringify(slots, null, 2));
    console.log("=====================================");

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
    console.log("Processing date:", date, "Type:", typeof date);

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

    console.log("Input date after processing:", inputDate);

    // Today comparison in UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    console.log("Today UTC:", today);

    if (inputDate < today) {
      console.log("Date validation failed: inputDate < today");
      return responseHandler.badRequest(
        res,
        "Không thể tạo availability cho ngày trong quá khứ"
      );
    }

    // Validate năm hiện tại (nếu cần)
    const currentYear = new Date().getFullYear();
    console.log(
      "Current year:",
      currentYear,
      "Input year:",
      inputDate.getFullYear()
    );
    if (inputDate.getFullYear() !== currentYear) {
      console.log("Year validation failed");
      return responseHandler.badRequest(
        res,
        `Chỉ có thể tạo availability trong năm ${currentYear}`
      );
    }

    // Chuẩn hóa date về 00:00 UTC - Use inputDate directly
    const normalizedDate = new Date(inputDate);

    // Validate slots format
    console.log("Validating slots:", slots, "Type:", Array.isArray(slots));
    if (!Array.isArray(slots)) {
      console.log("Slots validation failed: not array");
      return responseHandler.badRequest(res, "Slots phải là một array");
    }

    // Validate từng slot
    console.log("Validating individual slots...");
    for (const slot of slots) {
      console.log("Validating slot:", slot);
      if (!slot.start || !slot.end) {
        console.log("Slot validation failed: missing start/end");
        return responseHandler.badRequest(
          res,
          "Mỗi slot phải có start và end time"
        );
      }

      // Validate time format (HH:mm)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(slot.start) || !timeRegex.test(slot.end)) {
        console.log("Time format validation failed:", slot.start, slot.end);
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

      console.log(
        `Slot ${slot.start}-${slot.end}: start=${startMinutes}, end=${endMinutes}`
      );

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

      console.log(
        `Working hours validation: startHour=${startHour}, endHour=${endHour}, endMinute=${endMinute}`
      );

      if (startHour < 6) {
        return responseHandler.badRequest(
          res,
          `Giờ bắt đầu không thể trước 6:00 (${slot.start})`
        );
      }

      if (endHour > 22 || (endHour === 22 && endMinute > 0)) {
        console.log(
          "Working hours validation failed: endHour > 22 or (endHour === 22 && endMinute > 0)"
        );
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

        console.log(
          `Checking overlap: slot1(${start1}-${end1}) vs slot2(${start2}-${end2})`
        );

        // Check overlap: slot1 và slot2 có trùng không
        if (start1 < end2 && start2 < end1) {
          return responseHandler.badRequest(
            res,
            `Slots trùng giờ: ${slot1.start}-${slot1.end} và ${slot2.start}-${slot2.end}`
          );
        }
      }
    }

    // Chuẩn hóa date về 00:00 UTC - Use inputDate directly

    // Tìm availability hiện tại hoặc tạo mới
    let availability = await Availability.findOne({
      mentor: mentorId,
      date: normalizedDate,
    });

    if (availability) {
      // Preserve existing booked/held slots and their booking info
      // Note: held slots (pending bookings) can be removed by mentor
      const existingBookedSlots = availability.slots.filter((slot) =>
        ["booked", "held"].includes(slot.status)
      );

      // Find slots that will be removed (excluding booked slots which must be preserved)
      const removedSlots = availability.slots.filter((slot) => {
        const stillExists = slots.find(
          (newSlot) => newSlot.start === slot.start
        );
        return !stillExists && slot.status !== "booked"; // Don't remove booked slots
      });

      console.log(
        "Slots to be removed (will also check for associated bookings):",
        removedSlots
      );

      // Delete associated bookings for removed slots
      if (removedSlots.length > 0) {
        for (const removedSlot of removedSlots) {
          try {
            // Method 1: Delete by bookingId if available
            if (removedSlot.bookingId) {
              const existingBooking = await Booking.findById(
                removedSlot.bookingId
              );
              if (
                existingBooking &&
                ["pending", "cancelled"].includes(existingBooking.status)
              ) {
                await Booking.findByIdAndDelete(removedSlot.bookingId);
                console.log(
                  `Deleted ${existingBooking.status} booking ${removedSlot.bookingId} for removed slot ${removedSlot.start}`
                );
              }
            }

            // Method 2: Also find and delete by date + time + mentor (in case bookingId is missing)
            const bookingsToDelete = await Booking.find({
              mentor: mentorId,
              date: normalizedDate,
              start: removedSlot.start,
              status: { $in: ["pending", "cancelled"] }, // Delete pending/cancelled bookings
            });

            console.log(
              `Found ${bookingsToDelete.length} pending/cancelled bookings for removed slot ${removedSlot.start}`
            );

            for (const booking of bookingsToDelete) {
              await Booking.findByIdAndDelete(booking._id);
              console.log(
                `Deleted ${booking.status} booking ${booking._id} for removed slot ${removedSlot.start}`
              );
            }
          } catch (error) {
            console.error(
              `Failed to delete bookings for slot ${removedSlot.start}:`,
              error
            );
          }
        }
      }

      // Create new slots array from incoming slots
      const newSlots = slots.map((slot) => ({
        start: slot.start,
        end: slot.end,
        status: slot.status || "open",
      }));

      // Merge: add existing booked slots that don't conflict with new slots
      existingBookedSlots.forEach((bookedSlot) => {
        const conflictingNewSlot = newSlots.find(
          (newSlot) => newSlot.start === bookedSlot.start
        );
        if (conflictingNewSlot) {
          // Replace the new slot with the existing booked slot to preserve booking info
          const index = newSlots.findIndex(
            (newSlot) => newSlot.start === bookedSlot.start
          );
          newSlots[index] = bookedSlot;
        } else {
          // Add the booked slot that wasn't in new slots (force preserve)
          newSlots.push(bookedSlot);
        }
      });

      // Sort by start time
      newSlots.sort((a, b) => a.start.localeCompare(b.start));

      availability.slots = newSlots;
      availability.timezone = timezone;
      console.log(
        "Slots updated with",
        availability.slots.length,
        "total slots (including preserved bookings)"
      );
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
    console.error("=== ERROR IN CREATE/UPDATE AVAILABILITY ===");
    console.error("Error details:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Request body was:", JSON.stringify(req.body, null, 2));
    console.error("==========================================");

    if (error.name === "ValidationError") {
      return responseHandler.badRequest(res, error.message);
    }
    return responseHandler.error(res, "Lỗi khi tạo/cập nhật availability");
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

    if (availability.slots.some((s) => ["booked", "held"].includes(s.status))) {
      return responseHandler.badRequest(
        res,
        "Không thể xóa ngày có slot đang booked/held"
      );
    }

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

    availabilities.forEach((avail) => {
      console.log(
        `- ${avail.date.toISOString().split("T")[0]}: ${
          avail.slots.length
        } slots`
      );
    });

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

/**
 * Lấy danh sách tất cả availability/schedules của mentor
 * GET /api/availability/my-schedules
 */
export const getMySchedules = async (req, res) => {
  try {
    const mentorId = req.user.id;

    // Kiểm tra user là mentor
    const mentor = await User.findById(mentorId);
    if (!mentor || !mentor.role.includes("mentor")) {
      return responseHandler.forbidden(
        res,
        "Chỉ mentor mới có thể xem schedules của mình"
      );
    }

    // Lấy tất cả availability của mentor, sắp xếp theo ngày
    const availabilities = await Availability.find({
      mentor: mentorId,
    }).sort({ date: 1 });

    // Nhóm theo tháng để dễ quản lý
    const schedulesByMonth = {};

    availabilities.forEach((availability) => {
      const dateStr = availability.date.toISOString().split("T")[0];
      const monthKey = dateStr.substring(0, 7); // YYYY-MM

      if (!schedulesByMonth[monthKey]) {
        schedulesByMonth[monthKey] = [];
      }

      schedulesByMonth[monthKey].push({
        _id: availability._id,
        date: dateStr,
        dayOfWeek: availability.date.toLocaleDateString("vi-VN", {
          weekday: "long",
        }),
        timezone: availability.timezone,
        totalSlots: availability.slots.length,
        openSlots: availability.slots.filter((slot) => slot.status === "open")
          .length,
        bookedSlots: availability.slots.filter(
          (slot) => slot.status === "booked"
        ).length,
        blockedSlots: availability.slots.filter(
          (slot) => slot.status === "blocked"
        ).length,
        slots: availability.slots,
        createdAt: availability.createdAt,
        updatedAt: availability.updatedAt,
        // Thêm thông tin trạng thái
        status: availability.date < new Date() ? "past" : "upcoming",
        canDelete: availability.slots.every(
          (slot) => !["booked", "held"].includes(slot.status)
        ),
      });
    });

    // Convert object to array và sort theo tháng
    const scheduleList = Object.keys(schedulesByMonth)
      .sort((a, b) => b.localeCompare(a)) // Tháng mới nhất trước
      .map((monthKey) => ({
        month: monthKey,
        monthName: new Date(monthKey + "-01").toLocaleDateString("vi-VN", {
          year: "numeric",
          month: "long",
        }),
        schedules: schedulesByMonth[monthKey],
      }));

    // Thống kê tổng quan
    const totalSchedules = availabilities.length;
    const upcomingSchedules = availabilities.filter(
      (a) => a.date >= new Date()
    ).length;
    const pastSchedules = totalSchedules - upcomingSchedules;
    const totalSlots = availabilities.reduce(
      (sum, a) => sum + a.slots.length,
      0
    );
    const totalOpenSlots = availabilities.reduce(
      (sum, a) => sum + a.slots.filter((slot) => slot.status === "open").length,
      0
    );

    return responseHandler.ok(res, {
      mentor: {
        _id: mentor._id,
        firstName: mentor.firstName,
        lastName: mentor.lastName,
        avatarUrl: mentor.avatarUrl,
      },
      schedulesByMonth: scheduleList,
      summary: {
        totalSchedules,
        upcomingSchedules,
        pastSchedules,
        totalSlots,
        totalOpenSlots,
      },
    });
  } catch (error) {
    console.error("Error getting my schedules:", error);
    return responseHandler.error(res, "Lỗi khi lấy danh sách schedules");
  }
};

/**
 * Mentee lấy availability của mentor để booking (public view)
 * GET /api/availability/mentor/:mentorId/public
 */
export const getMentorPublicAvailability = async (req, res) => {
  try {
    const { mentorId } = req.params;
    let { startDate, endDate } = req.query;

    // Validate mentor exists and is actually a mentor
    const mentor = await User.findById(mentorId);
    if (!mentor || !mentor.role.includes("mentor")) {
      return responseHandler.notFound(res, "Mentor không tồn tại");
    }

    // Default to next 14 days if no date range provided
    if (!startDate || !endDate) {
      const today = new Date();
      const twoWeeksLater = new Date(today);
      twoWeeksLater.setDate(today.getDate() + 14);

      startDate = startDate || today.toISOString().split("T")[0];
      endDate = endDate || twoWeeksLater.toISOString().split("T")[0];
    }

    // Normalize dates to UTC
    const start = new Date(startDate + "T00:00:00.000Z");
    const end = new Date(endDate + "T00:00:00.000Z");

    if (start > end) {
      return responseHandler.badRequest(
        res,
        "startDate không thể lớn hơn endDate"
      );
    }

    // Find availabilities for the mentor in date range
    const availabilities = await Availability.find({
      mentor: mentorId,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 });

    // Format response for mentee booking với color coding
    const formattedAvailabilities = availabilities.map((availability) => ({
      _id: availability._id,
      date: availability.date.toISOString().split("T")[0],
      dayOfWeek: availability.date.toLocaleDateString("vi-VN", {
        weekday: "long",
      }),
      timezone: availability.timezone,
      slots: availability.slots.map((slot) => ({
        _id: slot._id,
        start: slot.start,
        end: slot.end,
        status: slot.status, // open, held, booked, blocked
        // Không trả về thông tin private như bookedBy, bookingId
      })),
    }));

    console.log(
      "Sample availability data:",
      JSON.stringify(formattedAvailabilities[0], null, 2)
    );

    const responseData = {
      mentor: {
        _id: mentor._id,
        firstName: mentor.firstName,
        lastName: mentor.lastName,
        avatarUrl: mentor.avatarUrl,
        jobTitle: mentor.jobTitle,
      },
      availabilities: formattedAvailabilities,
      count: formattedAvailabilities.length,
      period: {
        startDate: startDate,
        endDate: endDate,
      },
    };

    console.log(
      "Response.availabilities length:",
      responseData.availabilities.length
    );

    return responseHandler.ok(res, responseData);
  } catch (error) {
    console.error("Error getting mentor public availability:", error);
    return responseHandler.error(res, "Lỗi khi lấy lịch mentor");
  }
};

export default {
  createOrUpdateAvailability,
  getTodaySchedule,
  deleteAvailability,
  getMentorAvailabilityRange,
  getAvailabilityOverview,
  getMySchedules,
  manualCleanupOldAvailabilities,
  getMentorPublicAvailability,
};
