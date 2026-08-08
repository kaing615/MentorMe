import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import courseApi from "../api/modules/course.api";
import { showLoading, hideLoading } from "../redux/features/loading.slice";
import { resolveAssetUrl } from "../config/runtime.js";

const EditCoursePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // --- AUTH & ROLE CHECK ---
  useEffect(() => {
    const token =
      localStorage.getItem("actkn") || localStorage.getItem("token");
    const userStr =
      localStorage.getItem("user") || localStorage.getItem("user");
    console.log("Token:", token);
    let user = null;
    if (!token) {
      navigate("/auth/signin");
      return;
    }
    // Check user object
    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      user = null;
    }
    if (!user || !user.role) {
      navigate("/auth/signin");
      return;
    }
    // Check role
    if (user.role === "mentor") {
      return;
    }
    if (user.role === "mentee") {
      navigate("/home");
      return;
    }
    // For admin
    // if (user.role === "admin") {
    //   navigate("/admin/profile");
    //   return;
    // }
  }, [navigate]);

  // Hide loading when component mounts
  useEffect(() => {
    dispatch(hideLoading());
  }, [dispatch]);

  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageError, setImageError] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // State for Key Learning Objectives
  const [objectives, setObjectives] = useState([""]);

  // State for character counts
  const [titleCount, setTitleCount] = useState(0);
  const [overviewCount, setOverviewCount] = useState(0);

  // Functions to manage objectives
  const addObjective = () => {
    setObjectives([...objectives, ""]);
  };

  const removeObjective = (index) => {
    if (objectives.length > 1) {
      const newObjectives = objectives.filter((_, i) => i !== index);
      setObjectives(newObjectives);
    }
  };

  const updateObjective = (index, value) => {
    const newObjectives = [...objectives];
    newObjectives[index] = value;
    setObjectives(newObjectives);
  };

  const predefinedCategories = [
    "Programming",
    "Design",
    "Business",
    "Marketing",
    "Photography",
    "Music",
    "Health & Fitness",
    "Language",
    "Academic",
    "Lifestyle",
  ];

  // Validation schema
  const courseSchema = yup.object({
    title: yup
      .string()
      .min(5, "Course title must be between 5-100 characters")
      .max(100, "Course title must be between 5-100 characters")
      .required("Course title is required"),
    price: yup
      .number()
      .typeError("Price must be a number")
      .min(0, "Price must be greater than or equal to 0")
      .required("Course price is required"),
    courseOverview: yup
      .string()
      .min(20, "Course overview must be between 20-1000 characters")
      .max(1000, "Course overview must be between 20-1000 characters")
      .required("Course overview is required"),
    lectures: yup
      .number()
      .typeError("Number of lectures must be a number")
      .min(1, "Number of lectures must be between 1-500")
      .max(500, "Number of lectures must be between 1-500")
      .required("Number of lectures is required"),
    driveLink: yup
      .string()
      .url("Drive link must be a valid URL")
      .min(10, "Drive link must be between 10-500 characters")
      .max(500, "Drive link must be between 10-500 characters")
      .required("Google Drive link is required"),
    duration: yup
      .number()
      .transform((value, originalValue) => {
        return originalValue === "" ? undefined : value;
      })
      .min(0, "Duration must be between 0-1000 hours")
      .max(1000, "Duration must be between 0-1000 hours")
      .optional()
      .nullable(),
    category: yup
      .string()
      .min(2, "Category must be between 2-50 characters")
      .max(50, "Category must be between 2-50 characters")
      .required("Category is required"),
    level: yup
      .string()
      .oneOf(
        ["Beginner", "Intermediate", "Advanced", "Expert"],
        "Level must be one of: Beginner, Intermediate, Advanced, Expert"
      )
      .required("Level is required"),
    tags: yup
      .string()
      .test(
        "tags-length",
        "Each tag must be between 1-30 characters",
        function (value) {
          if (typeof value === "string" && value.trim()) {
            const tags = value
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean);
            return tags.every((tag) => tag.length >= 1 && tag.length <= 30);
          }
          return true;
        }
      )
      .test(
        "is-required-for-programming",
        "Programming languages are required for Programming category",
        function (value) {
          const { category } = this.parent;
          const isProgramming = category?.toLowerCase() === "programming";
          if (isProgramming) {
            return value && value.trim().length > 0;
          }
          return true; // Not required for other categories
        }
      ),
    language: yup
      .string()
      .min(2, "Language field must be between 2-100 characters")
      .max(100, "Language field must be between 2-100 characters")
      .test(
        "language-tags-length",
        "Each language must be between 2-30 characters",
        function (value) {
          if (typeof value === "string" && value.trim()) {
            const languages = value
              .split(",")
              .map((lang) => lang.trim())
              .filter(Boolean);
            return languages.every(
              (lang) => lang.length >= 2 && lang.length <= 30
            );
          }
          return true;
        }
      )
      .required("Language is required"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(courseSchema),
  });

  useEffect(() => {
    if (!id) return;
    const fetchCourse = async () => {
      try {
        const { response, error } = await courseApi.getDetail({ courseId: id });
        if (error || !response?.data?.course) {
          toast.error("Cannot load course data", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            style: {
              backgroundColor: "#fee2e2",
              color: "#dc2626",
              border: "1px solid #fca5a5",
            },
          });
          return;
        }
        const course = response.data.course;
        console.log("Course data for edit:", course);

        // Set selected category for UI logic
        setSelectedCategory(course.category || "");
        if (
          course.category &&
          !predefinedCategories.includes(course.category)
        ) {
          setCustomCategory(course.category);
          setSelectedCategory("Other");
        }

        // Parse and set objectives
        let parsedObjectives = [""];
        if (course.keyLearningObjectives) {
          if (Array.isArray(course.keyLearningObjectives)) {
            parsedObjectives =
              course.keyLearningObjectives.length > 0
                ? course.keyLearningObjectives
                : [""];
          } else if (typeof course.keyLearningObjectives === "string") {
            try {
              const parsed = JSON.parse(course.keyLearningObjectives);
              if (Array.isArray(parsed)) {
                parsedObjectives = parsed.length > 0 ? parsed : [""];
              } else {
                parsedObjectives = [course.keyLearningObjectives];
              }
            } catch (e) {
              parsedObjectives = [course.keyLearningObjectives];
            }
          }
        }
        setObjectives(parsedObjectives);

        reset({
          title: course.title || "",
          price: course.price || "",
          category: course.category || "",
          level: course.level || "",
          lectures: course.lectures || "",
          courseOverview: course.description || "",
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

        // Set character counts for initial values
        setTitleCount((course.title || "").length);
        setOverviewCount((course.description || "").length);
        const thumb =
          course.thumbnail ||
          course.image ||
          course.courseImage ||
          course.avatar ||
          course.cover ||
          "";
        if (thumb) {
          setImagePreview(resolveAssetUrl(thumb));
        }
      } catch (err) {
        toast.error("Error loading course data", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: {
            backgroundColor: "#fee2e2",
            color: "#dc2626",
            border: "1px solid #fca5a5",
          },
        });
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
      // Validate objectives array
      const validObjectives = objectives.filter((obj) => obj.trim() !== "");
      if (validObjectives.length === 0) {
        toast.error("At least one learning objective is required", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: {
            backgroundColor: "#fee2e2",
            color: "#dc2626",
            border: "1px solid #fca5a5",
          },
        });
        return;
      }

      // Validate each objective length
      for (let i = 0; i < validObjectives.length; i++) {
        if (validObjectives[i].length < 10 || validObjectives[i].length > 200) {
          toast.error(
            `Learning objective ${i + 1} must be between 10-200 characters`,
            {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              style: {
                backgroundColor: "#fee2e2",
                color: "#dc2626",
                border: "1px solid #fca5a5",
              },
            }
          );
          return;
        }
      }

      // Xử lý tags khi submit (giống CreateCoursePage)
      if (typeof data.tags === "string") {
        data.tags = data.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);
      }
      // Xử lý language khi submit (giống CreateCoursePage)
      if (typeof data.language === "string") {
        data.language = data.language
          .split(",")
          .map((lang) => lang.trim())
          .filter(Boolean);
      }

      // Prepare FormData for multipart/form-data
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("price", data.price);
      formData.append("category", data.category);
      formData.append("level", data.level);
      formData.append("lectures", data.lectures);
      formData.append("courseOverview", data.courseOverview);

      // Use objectives array instead of form field for keyLearningObjectives
      formData.append("keyLearningObjectives", JSON.stringify(validObjectives));

      formData.append("driveLink", data.driveLink);
      if (imageFile) {
        formData.append("thumbnail", imageFile);
      }
      if (data.duration) {
        formData.append("duration", data.duration);
      }

      // Backend validation requires description and link fields (giống CreateCoursePage)
      formData.append("description", data.courseOverview); // Use courseOverview as description
      formData.append("link", data.driveLink); // Use driveLink as link

      formData.append("tags", JSON.stringify(data.tags)); // Send tags as JSON string
      formData.append("language", JSON.stringify(data.language)); // Send language as JSON string

      const { response, error } = await courseApi.updateCourse({
        courseId: id,
        courseData: formData,
      });
      if (error) {
        console.error("Error updating course:", error);
        const errorMessage = error.message || "Course update failed";
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: {
            backgroundColor: "#fee2e2",
            color: "#dc2626",
            border: "1px solid #fca5a5",
          },
        });
        return;
      }
      toast.success("Course updated successfully!");

      // Show loading page for navigation
      dispatch(showLoading());

      setTimeout(() => {
        navigate("/mentor/profile", { state: { tab: "mycourses" } });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 800);
    } catch (error) {
      console.error("Error updating course:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error updating course";
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          backgroundColor: "#fee2e2",
          color: "#dc2626",
          border: "1px solid #fca5a5",
        },
      });
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
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Course Overview <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs text-gray-500">
                      {overviewCount}/1000
                    </span>
                  </div>
                  <textarea
                    {...register("courseOverview")}
                    rows={4}
                    placeholder="Provide a comprehensive overview of your course..."
                    className="w-full px-0 py-3 text-gray-900 border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 bg-transparent placeholder-gray-400 resize-none"
                    onChange={(e) => {
                      setOverviewCount(e.target.value.length);
                      // Call the original register onChange if it exists
                      const originalOnChange =
                        register("courseOverview").onChange;
                      if (originalOnChange) originalOnChange(e);
                    }}
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
                  <div className="space-y-3">
                    {objectives.map((objective, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={objective}
                            onChange={(e) =>
                              updateObjective(index, e.target.value)
                            }
                            placeholder={`Learning objective ${index + 1}`}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                          {objectives.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeObjective(index)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 text-right">
                          {objective.length}/200
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addObjective}
                      className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Add another objective
                    </button>
                  </div>
                  {objectives.filter((obj) => obj.trim() !== "").length ===
                    0 && (
                    <p className="mt-1 text-sm text-red-600">
                      At least one learning objective is required
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column - Course Details */}
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs text-gray-500">
                      {titleCount}/100
                    </span>
                  </div>
                  <input
                    type="text"
                    {...register("title")}
                    placeholder="Enter course title"
                    className="w-full px-0 py-3 text-gray-900 border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 bg-transparent placeholder-gray-400"
                    onChange={(e) => {
                      setTitleCount(e.target.value.length);
                      // Call the original register onChange if it exists
                      const originalOnChange = register("title").onChange;
                      if (originalOnChange) originalOnChange(e);
                    }}
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
                    value={selectedCategory}
                    className="w-full px-4 py-3 text-gray-400 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white transition-all duration-200 focus:text-gray-700"
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      if (e.target.value !== "Other") {
                        setCustomCategory("");
                        setValue("category", e.target.value);
                      } else {
                        // When "Other" is selected, we'll update the form value when custom input changes
                        setValue("category", "");
                      }
                    }}
                  >
                    <option value="">Select category</option>
                    {predefinedCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="Other">Other (Enter custom category)</option>
                  </select>

                  {selectedCategory === "Other" && (
                    <input
                      type="text"
                      placeholder="Enter custom category"
                      value={customCategory}
                      className="w-full px-4 py-3 mt-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                      onChange={(e) => {
                        setCustomCategory(e.target.value);
                        setValue("category", e.target.value);
                      }}
                    />
                  )}

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
                    step="0.1"
                    min="0"
                    max="1000"
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

                {/* Dynamic Field based on Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {selectedCategory?.toLowerCase() === "programming"
                      ? "Programming Languages"
                      : "Tools & Technologies"}{" "}
                    {selectedCategory?.toLowerCase() === "programming" && (
                      <span className="text-red-500">*</span>
                    )}
                    {selectedCategory?.toLowerCase() !== "programming" && (
                      <span className="text-gray-400">(Optional)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    {...register("tags")}
                    placeholder={
                      selectedCategory?.toLowerCase() === "programming"
                        ? "Enter programming languages separated by commas (e.g. Python, JavaScript, Java)"
                        : "Enter tools, software, technologies, or certifications separated by commas (e.g. Photoshop, Excel, Google Analytics)"
                    }
                    className="w-full px-0 py-3 text-gray-900 border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 bg-transparent placeholder-gray-400"
                  />
                  {selectedCategory?.toLowerCase() === "programming" && (
                    <p className="mt-1 text-xs text-gray-500">
                      Required for Programming courses. Specify the programming
                      languages covered.
                    </p>
                  )}
                  {selectedCategory &&
                    selectedCategory.toLowerCase() !== "programming" && (
                      <p className="mt-1 text-xs text-gray-500">
                        List any tools, software, technologies, or
                        certifications relevant to your course topic.
                      </p>
                    )}
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
