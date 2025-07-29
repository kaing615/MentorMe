import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
// import { toast } from "react-toastify"; // Tạm comment
// import { courseApi } from "../api/modules/course.api"; // Tạm comment
import { PATH, MENTOR_PATH } from "../routes/path";

const MyCoursesPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);

  const fetchMyCourses = async () => {
    try {
      setIsLoading(true);
      // Tạm thời mock data để test
      setCourses([
        {
          _id: "1",
          title: "Test Course 1",
          description: "Test description",
          price: 100000,
          category: "Lập trình",
          duration: 10,
          lectures: 5,
          tags: ["react", "javascript"],
          createdAt: new Date().toISOString(),
          mentees: []
        }
      ]);
    } catch (error) {
      console.error("Lỗi tải khóa học:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!confirm("Bạn có chắc chắn muốn xóa khóa học này?")) return;

    try {
      setDeleteLoading(courseId);
      setCourses(courses.filter(course => course._id !== courseId));
      alert("Xóa khóa học thành công!"); // Thay thế toast tạm thời
    } catch (error) {
      console.error("Lỗi xóa khóa học:", error);
      alert("Không thể xóa khóa học"); // Thay thế toast tạm thời
    } finally {
      setDeleteLoading(null);
    }
  };

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const formatPrice = (price) => {
    if (price === 0) return "Miễn phí";
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải khóa học...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Khóa học của tôi</h1>
              <p className="mt-2 text-gray-600">
                Quản lý các khóa học bạn đã tạo ({courses.length} khóa học)
              </p>
            </div>
            <Link
              to={`${PATH.MENTOR}/${MENTOR_PATH.CREATE_COURSE}`}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              + Tạo khóa học mới
            </Link>
          </div>
        </div>

        {courses.length === 0 ? (
          // Empty state
          <div className="bg-white shadow-sm rounded-lg p-12 text-center">
            <div className="mb-4">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Chưa có khóa học nào
            </h3>
            <p className="text-gray-500 mb-6">
              Bắt đầu chia sẻ kiến thức của bạn bằng cách tạo khóa học đầu tiên!
            </p>
            <Link
              to={`${PATH.MENTOR}/${MENTOR_PATH.CREATE_COURSE}`}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Tạo khóa học đầu tiên
            </Link>
          </div>
        ) : (
          // Course grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <div key={course._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Course header */}
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {course.title}
                    </h3>
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {course.category}
                    </span>
                  </div>

                  {/* Course description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {course.description}
                  </p>

                  {/* Course stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-sm">
                      <span className="text-gray-500">Giá:</span>
                      <div className="font-semibold text-green-600">
                        {formatPrice(course.price)}
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Thời lượng:</span>
                      <div className="font-semibold">
                        {course.duration}h
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Bài giảng:</span>
                      <div className="font-semibold">
                        {course.lectures}
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Học viên:</span>
                      <div className="font-semibold">
                        {course.mentees?.length || 0}
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {course.tags?.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {course.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            {tag}
                          </span>
                        ))}
                        {course.tags.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            +{course.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Course footer */}
                  <div className="text-xs text-gray-500 mb-4">
                    Tạo ngày: {formatDate(course.createdAt)}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <a
                      href={course.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-blue-50 text-blue-600 text-center px-3 py-2 rounded text-sm font-medium hover:bg-blue-100 transition-colors"
                    >
                      Xem khóa học
                    </a>
                    <button
                      onClick={() => {/* TODO: Implement edit functionality */}}
                      className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course._id)}
                      disabled={deleteLoading === course._id}
                      className="px-3 py-2 text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                    >
                      {deleteLoading === course._id ? (
                        <div className="w-4 h-4 animate-spin rounded-full border-b-2 border-red-600"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCoursesPage;
