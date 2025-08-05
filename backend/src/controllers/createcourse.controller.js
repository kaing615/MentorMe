import responseHandler from "../handlers/response.handler.js";
import Course from "../models/course.model.js";
import User from "../models/user.model.js";

// [POST] /api/create-course
export const createNewCourse = async (req, res) => {
  try {
    const creatorId = req.user.id; 
    const { 
      title, 
      price, 
      category, 
      level, 
      numberOfLectures, 
      duration, 
      courseOverview, 
      keyLearningObjectives, 
      googleDriveMaterialsLink 
    } = req.body;

    // Validate required fields
    if (!title || !price || !category || !level || !numberOfLectures || !courseOverview || !keyLearningObjectives) {
      return responseHandler.badRequest(res, "Missing required fields");
    }

    // Validate price is positive number
    if (isNaN(price) || price <= 0) {
      return responseHandler.badRequest(res, "Price must be a positive number");
    }

    // Validate numberOfLectures is positive integer
    if (isNaN(numberOfLectures) || numberOfLectures <= 0 || !Number.isInteger(Number(numberOfLectures))) {
      return responseHandler.badRequest(res, "Number of lectures must be a positive integer");
    }

    // Validate level is one of the allowed values
    const allowedLevels = ['Beginner', 'Intermediate', 'Advanced'];
    if (!allowedLevels.includes(level)) {
      return responseHandler.badRequest(res, "Level must be one of: Beginner, Intermediate, Advanced");
    }

    // Validate Google Drive link format if provided
    if (googleDriveMaterialsLink && !googleDriveMaterialsLink.includes('drive.google.com')) {
      return responseHandler.badRequest(res, "Invalid Google Drive link format");
    }

    // Validate duration if provided
    if (duration && (isNaN(duration) || duration <= 0)) {
      return responseHandler.badRequest(res, "Duration must be a positive number");
    }

    // Check if user is a mentor
    const user = await User.findById(creatorId);
    if (!user || !user.role.includes('mentor')) {
      return responseHandler.forbidden(res, "Only mentors can create courses");
    }

    // Create new course with mapped fields
    const newCourse = new Course({
      name: title, // Map title to name (as per course model)
      description: courseOverview, // Map courseOverview to description
      shortDescription: keyLearningObjectives, // Map keyLearningObjectives to shortDescription
      price: Number(price),
      category: category,
      level: level, // Note: This field may need to be added to the Course model
      lectures: Number(numberOfLectures), // Map numberOfLectures to lectures
      duration: duration ? Number(duration) : undefined,
      link: googleDriveMaterialsLink || undefined, // Map googleDriveMaterialsLink to link
      mentors: [creatorId], // Set creator as mentor
      tags: [], // Empty tags array initially
      rate: 0, // Default rating
      numberOfRatings: 0 // Default number of ratings
    });

    await newCourse.save();

    // Note: User model doesn't have courses field, so we skip updating user

    return responseHandler.created(res, {
      message: "Course created successfully",
      course: newCourse
    });

  } catch (err) {
    console.error("Error creating course:", err);
    responseHandler.error(res);
  }
};

// [GET] /api/create-course/form-data - Get form data for creating course
export const getCourseFormData = async (req, res) => {
  try {
    // Return form configuration data
    const formData = {
      categories: [
        "Programming",
        "Design",
        "Business",
        "Marketing",
        "Photography",
        "Music",
        "Health & Fitness",
        "Language",
        "Academic",
        "Lifestyle"
      ],
      levels: [
        { value: "Beginner", label: "Beginner" },
        { value: "Intermediate", label: "Intermediate" },
        { value: "Advanced", label: "Advanced" }
      ],
      validation: {
        title: {
          maxLength: 100,
          required: true
        },
        price: {
          min: 0,
          required: true,
          type: "number"
        },
        numberOfLectures: {
          min: 1,
          required: true,
          type: "integer"
        },
        duration: {
          min: 0,
          required: false,
          type: "number",
          unit: "hours"
        },
        courseOverview: {
          maxLength: 1000,
          required: true
        },
        keyLearningObjectives: {
          maxLength: 500,
          required: true
        },
        googleDriveMaterialsLink: {
          required: false,
          pattern: "drive.google.com"
        }
      }
    };

    return responseHandler.ok(res, formData);

  } catch (err) {
    console.error("Error getting form data:", err);
    responseHandler.error(res);
  }
};

// [GET] /api/create-course/my-courses - Get courses created by current user
export const getMyCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const skip = (page - 1) * limit;
    
    let query = { mentors: userId };
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    const courses = await Course.find(query)
      .populate('mentors', 'userName avatar')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const totalCourses = await Course.countDocuments(query);
    const totalPages = Math.ceil(totalCourses / limit);

    return responseHandler.ok(res, {
      courses,
      totalCourses,
      totalPages,
      currentPage: Number(page)
    });

  } catch (err) {
    console.error("Error getting my courses:", err);
    responseHandler.error(res);
  }
};

// [POST] /api/create-course/validate - Validate course data before submission
export const validateCourseData = async (req, res) => {
  try {
    // Check if there are validation errors from middleware
    if (req.validationErrors && req.validationErrors.length > 0) {
      return responseHandler.badRequest(res, "Validation failed", { errors: req.validationErrors });
    }

    return responseHandler.ok(res, { 
      message: "Validation passed", 
      isValid: true 
    });

  } catch (err) {
    console.error("Error validating course data:", err);
    responseHandler.error(res);
  }
};
