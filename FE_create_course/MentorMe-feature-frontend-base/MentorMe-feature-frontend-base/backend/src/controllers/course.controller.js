import Course from "../models/course.model.js";
import { uploadFile } from "../utils/cloudinary.js";

const courseController = {
  // Create a new course
  createCourse: async (req, res) => {
    try {
      console.log('Request body:', req.body);
      console.log('Request files:', req.files);
      
      const { title, description, price, category, duration, link, lectures } = req.body;
      const userId = req.user.id; // Get mentor ID from authenticated user

      // Validate required fields
      if (!title || !description || !price || !category || !duration || !link || !lectures) {
        return res.status(400).json({
          success: false,
          message: "All required fields must be provided"
        });
      }

      // Validate that files were uploaded
      if (!req.files || (!req.files.files && !req.files.image)) {
        return res.status(400).json({
          success: false,
          message: "At least one file must be uploaded"
        });
      }

      let courseImageUrl = null;
      let uploadedFiles = [];

      try {
        // Upload course image if provided
        if (req.files.image) {
          const imageFile = Array.isArray(req.files.image) ? req.files.image[0] : req.files.image;
          console.log('Uploading course image:', imageFile.originalname);
          courseImageUrl = await uploadFile(imageFile.buffer, {
            folder: 'courses/images',
            resource_type: 'image'
          });
        }

        // Upload course files if provided
        if (req.files.files) {
          const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
          
          for (const file of files) {
            console.log('Uploading file:', file.originalname);
            const fileUrl = await uploadFile(file.buffer, {
              folder: 'courses/files',
              resource_type: 'auto'
            });
            
            uploadedFiles.push({
              filename: fileUrl.split('/').pop().split('.')[0], // Extract filename from URL
              originalName: file.originalname,
              url: fileUrl,
              size: file.size,
              mimetype: file.mimetype
            });
          }
        }
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: "Error uploading files",
          error: uploadError.message
        });
      }

      // Create new course
      const newCourse = new Course({
        title,
        description,
        price: parseFloat(price),
        category,
        duration: parseInt(duration),
        link,
        lectures: parseInt(lectures),
        mentor: userId,
        image: courseImageUrl,
        files: uploadedFiles
      });

      const savedCourse = await newCourse.save();

      // Populate mentor information
      await savedCourse.populate('mentor', 'username email');

      res.status(201).json({
        success: true,
        message: "Course created successfully",
        data: savedCourse
      });

    } catch (error) {
      console.error('Create course error:', error);
      res.status(500).json({
        success: false,
        message: "Error creating course",
        error: error.message
      });
    }
  },

  // Get all courses
  getAllCourses: async (req, res) => {
    try {
      const { page = 1, limit = 10, category, search } = req.query;
      
      let query = {};
      
      if (category) {
        query.category = category;
      }
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const courses = await Course.find(query)
        .populate('mentor', 'username email')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await Course.countDocuments(query);

      res.json({
        success: true,
        data: courses,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      });
    } catch (error) {
      console.error('Get courses error:', error);
      res.status(500).json({
        success: false,
        message: "Error fetching courses",
        error: error.message
      });
    }
  },

  // Get course by ID
  getCourseById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const course = await Course.findById(id)
        .populate('mentor', 'username email')
        .populate('mentees', 'username email');

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found"
        });
      }

      res.json({
        success: true,
        data: course
      });
    } catch (error) {
      console.error('Get course error:', error);
      res.status(500).json({
        success: false,
        message: "Error fetching course",
        error: error.message
      });
    }
  },

  // Get courses by mentor
  getCoursesByMentor: async (req, res) => {
    try {
      const { mentorId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const courses = await Course.find({ mentor: mentorId })
        .populate('mentor', 'username email')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await Course.countDocuments({ mentor: mentorId });

      res.json({
        success: true,
        data: courses,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total
        }
      });
    } catch (error) {
      console.error('Get mentor courses error:', error);
      res.status(500).json({
        success: false,
        message: "Error fetching mentor courses",
        error: error.message
      });
    }
  },

  // Update course
  updateCourse: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const course = await Course.findById(id);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found"
        });
      }

      // Check if user is the mentor of this course
      if (course.mentor.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to update this course"
        });
      }

      const updatedCourse = await Course.findByIdAndUpdate(
        id,
        { ...req.body },
        { new: true, runValidators: true }
      ).populate('mentor', 'username email');

      res.json({
        success: true,
        message: "Course updated successfully",
        data: updatedCourse
      });
    } catch (error) {
      console.error('Update course error:', error);
      res.status(500).json({
        success: false,
        message: "Error updating course",
        error: error.message
      });
    }
  },

  // Delete course
  deleteCourse: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const course = await Course.findById(id);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found"
        });
      }

      // Check if user is the mentor of this course
      if (course.mentor.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to delete this course"
        });
      }

      await Course.findByIdAndDelete(id);

      res.json({
        success: true,
        message: "Course deleted successfully"
      });
    } catch (error) {
      console.error('Delete course error:', error);
      res.status(500).json({
        success: false,
        message: "Error deleting course",
        error: error.message
      });
    }
  }
};

export default courseController;
