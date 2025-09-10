import responseHandler from "../handlers/response.handler.js";
import Course from "../models/course.model.js";
import User from "../models/user.model.js";

/**
 * @desc Lấy thống kê của mentor
 * @route GET /api/mentor/:id/stats
 * @access Public
 */
export const getMentorStats = async (req, res) => {
  try {
    const { id } = req.params;

    // Lấy thông tin mentor
    const mentor = await User.findById(id).select(
      "userName firstName lastName jobTitle category"
    );

    if (!mentor) {
      return responseHandler.notFound(res, "Mentor không tồn tại!");
    }

    // Đếm số courses của mentor
    const totalCourses = await Course.countDocuments({ mentor: id });

    // Đếm tổng số students từ tất cả courses của mentor
    const courses = await Course.find({ mentor: id }).select("mentees");
    const uniqueStudents = new Set();
    courses.forEach((course) => {
      course.mentees.forEach((student) => {
        uniqueStudents.add(student.toString());
      });
    });
    const totalStudents = uniqueStudents.size;

    return responseHandler.ok(res, {
      message: "Lấy thống kê mentor thành công!",
      stats: {
        totalCourses,
        totalStudents,
        experience: mentor.jobTitle || "Professional",
        category: mentor.category || "IT",
      },
    });
  } catch (err) {
    console.error("Lỗi lấy thống kê mentor:", err);
    responseHandler.error(res, err.message);
  }
};

export default {
  getMentorStats,
};
