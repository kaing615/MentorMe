import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import courseApi from "../api/modules/course.api";

const EditCoursePage = () => {
  const { id } = useParams();
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageError, setImageError] = useState("");
  const navigate = useNavigate();

  // Validation schema
  const courseSchema = yup.object({
    title: yup.string().required("Title is required"),
    price: yup
      .number()
      .typeError("Price must be a number")
      .positive("Price must be positive")
      .required("Price is required"),
    courseOverview: yup.string().required("Course overview is required"),
    keyLearningObjectives: yup
      .string()
      .required("Key learning objectives are required"),
    lectures: yup
      .number()
      .typeError("Number of lectures must be a number")
      .positive("Number of lectures must be positive")
      .required("Number of lectures is required"),
    driveLink: yup
      .string()
      .url("Must be a valid Google Drive URL")
      .required("Google Drive link is required"),
    duration: yup
      .number()
      .transform((value, originalValue) => {
        return originalValue === "" ? undefined : value;
      })
      .positive("Duration must be positive")
      .optional()
      .nullable(),
    category: yup.string().required("Category is required"),
    level: yup.string().required("Level is required"),
    tags: yup.string().required("Tags are required"),
    language: yup.string().required("Language is required"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: yupResolver(courseSchema),
  });

  useEffect(() => {
    if (!id) return;
    const fetchCourse = async () => {
      try {
        const { response, error } = await courseApi.getDetail({ courseId: id });
        if (error || !response?.data?.course) {
          toast.error("Không thể tải dữ liệu khóa học");
          return;
        }
        const course = response.data.course;
        console.log("Course data for edit:", course);
        reset({
          title: course.title || "",
          price: course.price || "",
          category: course.category || "",
          level: course.level || "",
          lectures: course.lectures || "",
          courseOverview: course.description || "",
          keyLearningObjectives: course.keyLearningObjectives || "",
          driveLink: course.link || "",
          duration: course.duration || "",
          tags: (() => {
            if (!course.tags) return "";
            if (Array.isArray(course.tags)) return course.tags.join(", ");
            try {
              const parsed = JSON.parse(course.tags);
              if (Array.isArray(parsed)) return parsed.join(", ");
            } catch (e) {}
            return String(course.tags)
              .replace(/\[|\]|"/g, "")
              .split(",")
              .map((tag) => tag.trim())
              .filter((tag) => tag.length > 0)
              .join(", ");
          })(),
          language: (() => {
            if (!course.language) return "";
            if (Array.isArray(course.language))
              return course.language.join(", ");
            try {
              const parsed = JSON.parse(course.language);
              if (Array.isArray(parsed)) return parsed.join(", ");
            } catch (e) {}
            return String(course.language)
              .replace(/\[|\]|"/g, "")
              .split(",")
              .map((lang) => lang.trim())
              .filter((lang) => lang.length > 0)
              .join(", ");
          })(),
        });
        const thumb =
          course.thumbnail ||
          course.image ||
          course.courseImage ||
          course.avatar ||
          course.cover ||
          "";
        if (thumb) {
          setImagePreview(
            thumb.startsWith("http") ? thumb : `http://localhost:4000/${thumb}`
          );
        }
      } catch (err) {
        toast.error("Lỗi khi tải dữ liệu khóa học");
      }
    };
    fetchCourse();
  }, [id, reset]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setImageError("Please select a valid image file");
        setImageFile(null);
        setImagePreview(null);
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setImageError("Image size must be less than 5MB");
        setImageFile(null);
        setImagePreview(null);
        return;
      }

      setImageError("");
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    try {
      // Prepare FormData for multipart/form-data
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("price", data.price);
      formData.append("category", data.category);
      formData.append("level", data.level);
      formData.append("lectures", data.lectures);
      formData.append("courseOverview", data.courseOverview);
      formData.append("keyLearningObjectives", data.keyLearningObjectives);
      formData.append("driveLink", data.driveLink);
      if (imageFile) {
        formData.append("thumbnail", imageFile);
      }
      if (data.duration) {
        formData.append("duration", data.duration);
      }
      // Đảm bảo tags gửi lên backend là array
      if (typeof data.tags === "string") {
        const tagsArray = data.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);
        formData.append("tags", JSON.stringify(tagsArray));
      } else if (Array.isArray(data.tags)) {
        formData.append("tags", JSON.stringify(data.tags));
      } else {
        formData.append("tags", "[]");
      }
      // Đảm bảo language gửi lên backend là array
      if (typeof data.language === "string") {
        const langArray = data.language
          .split(",")
          .map((lang) => lang.trim())
          .filter((lang) => lang.length > 0);
        formData.append("language", JSON.stringify(langArray));
      } else if (Array.isArray(data.language)) {
        formData.append("language", JSON.stringify(data.language));
      } else {
        formData.append("language", "[]");
      }
      const { response, error } = await courseApi.updateCourse({
        courseId: id,
        courseData: formData,
      });
      if (error) {
        toast.error("Cập nhật khóa học thất bại");
        return;
      }
      toast.success("Cập nhật khóa học thành công!");
      setTimeout(() => {
        navigate("/mentor/profile", { state: { tab: "mycourses" } });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 800);
    } catch (error) {
      toast.error("Lỗi khi cập nhật khóa học");
    }
  };

  return (
    <div className="min-h-screen bg-white-50">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={() =>
              navigate("/mentor/profile", { state: { tab: "mycourses" } })
            }
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors group"
            title="Back to My Courses"
          >
            <svg
              className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Edit Course</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left Column - Course Image & Descriptions */}
              <div className="space-y-6">
                {/* Course Image */}
                <div className="relative">
                  <div
                    className={`w-full h-72 bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed transition-colors cursor-pointer ${
                      imageError
                        ? "border-red-400 bg-red-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    onClick={() =>
                      document.getElementById("course-image").click()
                    }
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Course preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        Click or drag image here
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 text-center">
                      Course Image <span className="text-red-500">*</span>
                    </p>
                    <input
                      id="course-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    {imageError && (
                      <p className="mt-2 text-sm text-red-600 text-center">
                        {imageError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Course Overview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Overview <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register("courseOverview")}
                    rows={4}
                    placeholder="Provide a comprehensive overview of your course..."
                    className="w-full px-0 py-3 text-gray-900 border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 bg-transparent placeholder-gray-400 resize-none"
                  />
                  {errors.courseOverview && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.courseOverview.message}
                    </p>
                  )}
                </div>

                {/* Key Learning Objectives */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key Learning Objectives{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register("keyLearningObjectives")}
                    rows={4}
                    placeholder="List the main objectives students will achieve..."
                    className="w-full px-0 py-3 text-gray-900 border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 bg-transparent placeholder-gray-400 resize-none"
                  />
                  {errors.keyLearningObjectives && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.keyLearningObjectives.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column - Course Details */}
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("title")}
                    placeholder="Enter course title"
                    className="w-full px-0 py-3 text-gray-900 border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 bg-transparent placeholder-gray-400"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      {...register("price")}
                      placeholder="Enter course price"
                      className="w-full px-0 py-3 pr-8 text-gray-900 border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 bg-transparent placeholder-gray-400"
                    />
                    <div className="absolute right-0 bottom-3 text-gray-500 font-medium">
                      $
                    </div>
                  </div>
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.price.message}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("category")}
                    className="w-full px-4 py-3 text-gray-400 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white transition-all duration-200 focus:text-gray-700"
                  >
                    <option value="">Select category</option>
                    <option value="Programming">Programming</option>
                    <option value="Design">Design</option>
                    <option value="Business">Business</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Photography">Photography</option>
                    <option value="Music">Music</option>
                    <option value="Health & Fitness">Health & Fitness</option>
                    <option value="Language">Language</option>
                    <option value="Academic">Academic</option>
                    <option value="Lifestyle">Lifestyle</option>
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.category.message}
                    </p>
                  )}
                </div>

                {/* Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("level")}
                    className="w-full px-4 py-3 text-gray-400 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white transition-all duration-200 focus:text-gray-700"
                  >
                    <option value="">Select level</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                  {errors.level && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.level.message}
                    </p>
                  )}
                </div>

                {/* Number of Lectures */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Lectures <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    {...register("lectures")}
                    placeholder="Enter number of lectures"
                    className="w-full px-0 py-3 text-gray-900 border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 bg-transparent placeholder-gray-400"
                  />
                  {errors.lectures && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.lectures.message}
                    </p>
                  )}
                </div>

                {/* Duration (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (hours){" "}
                    <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="number"
                    {...register("duration")}
                    placeholder="Enter course duration in hours"
                    className="w-full px-0 py-3 text-gray-900 border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 bg-transparent placeholder-gray-400"
                  />
                  {errors.duration && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.duration.message}
                    </p>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("tags")}
                    placeholder="Enter tags separated by commas (e.g. Python, Backend, Web)"
                    className="w-full px-0 py-3 text-gray-900 border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 bg-transparent placeholder-gray-400"
                  />
                  {errors.tags && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.tags.message}
                    </p>
                  )}
                </div>
                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("language")}
                    placeholder="Enter languages separated by commas (e.g. English, Vietnamese)"
                    className="w-full px-0 py-3 text-gray-900 border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 bg-transparent placeholder-gray-400"
                  />
                  {errors.language && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.language.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Course Links Section */}
            <div className="mt-8">
              {/* Google Drive Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Drive Materials Link{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  {...register("driveLink")}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full px-0 py-3 text-gray-900 border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 bg-transparent placeholder-gray-400"
                />
                {errors.driveLink && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.driveLink.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Link to Google Drive folder containing course materials
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-8">
              <button
                type="button"
                onClick={() =>
                  navigate("/mentor/profile", { state: { tab: "mycourses" } })
                }
                className="px-8 py-3 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditCoursePage;
