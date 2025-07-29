import Course from "../models/course.model.js";
import responseHandler from "../handlers/response.handler.js";

export const createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      category,
      tags,
      duration,
      link,
      lectures,
    } = req.body;

    // Lấy mentor ID từ user đã đăng nhập
    const mentorId = req.user.id;

    // Validation cơ bản
    if (!title || !description || !price || !category || !duration || !link || !lectures) {
      return responseHandler.badRequest(res, "Vui lòng điền đầy đủ thông tin khóa học.");
    }

    // Tạo course mới
    const newCourse = new Course({
      title,
      description,
      price,
      mentor: mentorId,
      category,
      tags: tags || [],
      duration,
      link,
      lectures,
    });

    await newCourse.save();

    // Populate mentor info để trả về
    const populatedCourse = await Course.findById(newCourse._id)
      .populate('mentor', 'userName firstName lastName email');

    return responseHandler.created(res, {
      message: "Tạo khóa học thành công!",
      course: populatedCourse,
    });
  } catch (error) {
    console.error("Lỗi tạo khóa học:", error);
    return responseHandler.error(res);
  }
};

export const getMyCourses = async (req, res) => {
  try {
    const mentorId = req.user.id;

    const courses = await Course.find({ mentor: mentorId })
      .populate('mentor', 'userName firstName lastName email')
      .sort({ createdAt: -1 });

    return responseHandler.ok(res, {
      courses,
      total: courses.length,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách khóa học:", error);
    return responseHandler.error(res);
  }
};

export const getAllCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    
    // Build query filter
    let filter = {};
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const courses = await Course.find(filter)
      .populate('mentor', 'userName firstName lastName email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Course.countDocuments(filter);

    return responseHandler.ok(res, {
      courses,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách khóa học:", error);
    return responseHandler.error(res);
  }
};

export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id)
      .populate('mentor', 'userName firstName lastName email avatar')
      .populate('mentees', 'userName firstName lastName email');

    if (!course) {
      return responseHandler.notFound(res, "Khóa học không tồn tại.");
    }

    return responseHandler.ok(res, { course });
  } catch (error) {
    console.error("Lỗi lấy thông tin khóa học:", error);
    return responseHandler.error(res);
  }
};

export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const mentorId = req.user.id;
    const updateData = req.body;

    // Kiểm tra khóa học có tồn tại và thuộc về mentor này không
    const course = await Course.findOne({ _id: id, mentor: mentorId });
    if (!course) {
      return responseHandler.notFound(res, "Khóa học không tồn tại hoặc bạn không có quyền chỉnh sửa.");
    }

    // Cập nhật khóa học
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        course[key] = updateData[key];
      }
    });

    await course.save();

    const updatedCourse = await Course.findById(course._id)
      .populate('mentor', 'userName firstName lastName email');

    return responseHandler.ok(res, {
      message: "Cập nhật khóa học thành công!",
      course: updatedCourse,
    });
  } catch (error) {
    console.error("Lỗi cập nhật khóa học:", error);
    return responseHandler.error(res);
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const mentorId = req.user.id;

    // Kiểm tra khóa học có tồn tại và thuộc về mentor này không
    const course = await Course.findOne({ _id: id, mentor: mentorId });
    if (!course) {
      return responseHandler.notFound(res, "Khóa học không tồn tại hoặc bạn không có quyền xóa.");
    }

    await Course.findByIdAndDelete(id);

    return responseHandler.ok(res, {
      message: "Xóa khóa học thành công!",
    });
  } catch (error) {
    console.error("Lỗi xóa khóa học:", error);
    return responseHandler.error(res);
  }
};

export default {
  createCourse,
  getMyCourses,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
};
