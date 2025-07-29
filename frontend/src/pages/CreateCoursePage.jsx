import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
// import { toast } from "react-toastify"; // Tạm comment
// import { courseApi } from "../api/modules/course.api"; // Tạm comment

const CreateCoursePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm();

  const watchedTags = watch("tags", "");

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      
      // Xử lý tags thành array
      const processedData = {
        ...data,
        tags: data.tags ? data.tags.split(",").map(tag => tag.trim()).filter(tag => tag) : [],
        price: Number(data.price),
        duration: Number(data.duration),
        lectures: Number(data.lectures)
      };

      console.log("Course data:", processedData); // Debug log
      alert("Tạo khóa học thành công! (Mock)"); // Thay thế toast
      navigate("/mentor/courses");
    } catch (error) {
      console.error("Lỗi tạo khóa học:", error);
      alert("Có lỗi xảy ra khi tạo khóa học"); // Thay thế toast
    } finally {
      setIsLoading(false);
    }
  };

  const courseCategories = [
    "Lập trình",
    "Thiết kế",
    "Marketing",
    "Kinh doanh",
    "Ngoại ngữ",
    "Tài chính",
    "Khoa học dữ liệu",
    "Phát triển cá nhân",
    "Khác"
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Tạo khóa học mới</h1>
            <p className="mt-2 text-gray-600">
              Chia sẻ kiến thức và kinh nghiệm của bạn thông qua khóa học
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Tiêu đề khóa học */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Tiêu đề khóa học *
              </label>
              <input
                type="text"
                id="title"
                {...register("title", {
                  required: "Tiêu đề khóa học là bắt buộc",
                  minLength: { value: 3, message: "Tiêu đề phải có ít nhất 3 ký tự" },
                  maxLength: { value: 200, message: "Tiêu đề không được quá 200 ký tự" }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập tiêu đề khóa học..."
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Mô tả */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả khóa học *
              </label>
              <textarea
                id="description"
                rows={4}
                {...register("description", {
                  required: "Mô tả khóa học là bắt buộc",
                  minLength: { value: 10, message: "Mô tả phải có ít nhất 10 ký tự" },
                  maxLength: { value: 2000, message: "Mô tả không được quá 2000 ký tự" }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Mô tả chi tiết về khóa học, nội dung, mục tiêu..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Giá */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Giá (VNĐ) *
                </label>
                <input
                  type="number"
                  id="price"
                  min="0"
                  step="1000"
                  {...register("price", {
                    required: "Giá khóa học là bắt buộc",
                    min: { value: 0, message: "Giá không được âm" }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>

              {/* Danh mục */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Danh mục *
                </label>
                <select
                  id="category"
                  {...register("category", { required: "Vui lòng chọn danh mục" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Chọn danh mục --</option>
                  {courseCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Thời lượng */}
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                  Thời lượng (giờ) *
                </label>
                <input
                  type="number"
                  id="duration"
                  min="1"
                  {...register("duration", {
                    required: "Thời lượng khóa học là bắt buộc",
                    min: { value: 1, message: "Thời lượng phải lớn hơn 0" }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10"
                />
                {errors.duration && (
                  <p className="mt-1 text-sm text-red-600">{errors.duration.message}</p>
                )}
              </div>

              {/* Số bài giảng */}
              <div>
                <label htmlFor="lectures" className="block text-sm font-medium text-gray-700 mb-2">
                  Số bài giảng *
                </label>
                <input
                  type="number"
                  id="lectures"
                  min="1"
                  {...register("lectures", {
                    required: "Số bài giảng là bắt buộc",
                    min: { value: 1, message: "Số bài giảng phải lớn hơn 0" }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5"
                />
                {errors.lectures && (
                  <p className="mt-1 text-sm text-red-600">{errors.lectures.message}</p>
                )}
              </div>
            </div>

            {/* Link khóa học */}
            <div>
              <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-2">
                Link khóa học *
              </label>
              <input
                type="url"
                id="link"
                {...register("link", {
                  required: "Link khóa học là bắt buộc",
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: "Link phải là URL hợp lệ (bắt đầu bằng http:// hoặc https://)"
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/course"
              />
              {errors.link && (
                <p className="mt-1 text-sm text-red-600">{errors.link.message}</p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags (phân cách bằng dấu phẩy)
              </label>
              <input
                type="text"
                id="tags"
                {...register("tags")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="javascript, react, frontend"
              />
              <p className="mt-1 text-sm text-gray-500">
                Ví dụ: javascript, react, frontend
              </p>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Đang tạo..." : "Tạo khóa học"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCoursePage;
