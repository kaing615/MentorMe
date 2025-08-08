import Course from "../models/course.model.js"
import responseHandler from "../handlers/response.handler.js";

export const getCourses = async(req, res) => {
    try {
        const { category, rate } = req.query;
        let filter = {};
        if (category) filter.category = category;
        if (rate) filter.rate = { $gte: Number(rate) };

        const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

        const courses = await Course
            .find(filter)
            .populate('mentor', 'username email')
            .skip(skip)
            .limit(limit);

        const total = await Course.countDocuments(filter);

        const coursesWithId = courses.map((course) => {
            const obj = course.toObject();
            obj.courseId = obj._id;
            delete obj._id;
            delete obj.__v;
            return obj;
        })

        return responseHandler.ok(res, {
            message: "Lấy danh sách khoá học thành công!",
            total,
            skip,
            limit,
            courses: coursesWithId,
        })
    } catch (err) {
        console.error("Lỗi lấy danh sách khoá học: ", err);
        responseHandler.error(res, err.message);
    }
}

export const getCourseById = async (req, res) => {
    try {
        console.log('Searching for course with ID:', req.params.id); // Debug log
        const course = await Course.findById(req.params.id).populate('mentor');
        
        if (!course) {
            return responseHandler.notFound(res, "Khoá học không tồn tại!");
        }
        
        console.log('Course found:', course.title); // Debug log
        const courseWithId = course.toObject();
        courseWithId.courseId = courseWithId._id;
        delete courseWithId._id;
        delete courseWithId.__v;
        
        responseHandler.ok(res, {
            message: "Lấy thông tin khoá học thành công!",
            course: courseWithId,
        })
    } catch (err) {
        console.error("Lỗi lấy khoá học: ", err);
        responseHandler.error(res, err.message);
    }
}

// Lấy các khoá học liên quan theo category, loại trừ khoá học hiện tại
export const getRelatedCourses = async (req, res) => {
    try {
        const { courseId, category, limit } = req.query;

        // Parse categories: accept CSV, array, or single string
        let categories = [];
        if (Array.isArray(category)) {
            categories = category.filter(Boolean);
        } else if (typeof category === 'string') {
            categories = category
                .split(',')
                .map(c => c.trim())
                .filter(Boolean);
        }

        // Fallback: if no category passed, derive from the courseId
        if ((!categories || categories.length === 0) && courseId) {
            const current = await Course.findById(courseId).select('category');
            if (current && Array.isArray(current.category)) {
                categories = current.category;
            }
        }

        const max = Math.min(parseInt(limit) || 6, 50); // cap to 50

        const filter = {
            ...(courseId ? { _id: { $ne: courseId } } : {}),
            ...(categories && categories.length > 0
                ? { category: { $in: categories } }
                : {}),
        };

        const courses = await Course
            .find(filter)
            .populate('mentor', 'userName email avatarUrl')
            .sort({ rate: -1, createdAt: -1 })
            .limit(max);

        const coursesWithId = courses.map((course) => {
            const obj = course.toObject();
            obj.courseId = obj._id;
            delete obj._id;
            delete obj.__v;
            return obj;
        });

        return responseHandler.ok(res, {
            message: "Lấy khoá học liên quan thành công!",
            total: coursesWithId.length,
            courses: coursesWithId,
        });
    } catch (err) {
        console.error('Lỗi lấy khoá học liên quan:', err);
        return responseHandler.error(res, err.message || 'Đã xảy ra lỗi');
    }
}



export default {
    getCourses,
    getCourseById,
    getRelatedCourses,
}