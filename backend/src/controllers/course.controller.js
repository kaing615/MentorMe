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

export default {
    getCourses,
}