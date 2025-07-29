const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Chào mừng đến với MentorMe
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Nền tảng kết nối mentor và mentee
        </p>
        <div className="space-x-4">
          <a
            href="/mentor/courses"
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors inline-block"
          >
            Quản lý khóa học (Mentor)
          </a>
          <a
            href="/mentor/courses/create"
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors inline-block"
          >
            Tạo khóa học mới
          </a>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
