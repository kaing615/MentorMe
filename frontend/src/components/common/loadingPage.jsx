import React from 'react';
import { ClipLoader } from 'react-spinners';

// Component loading khi chuyển trang hoặc đang tải dữ liệu
const LoadingPage = ({ 
  loading = true,      // Trạng thái loading
  text = 'Loading...', // Text hiển thị
  fullscreen = true    // Hiển thị toàn màn hình
}) => {
  // Không hiển thị gì nếu loading = false
  if (!loading) return null;

  return (
    <div className={`${fullscreen ? 'fixed inset-0 z-50' : 'relative'} flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800`}>
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-20 h-20 bg-white bg-opacity-10 rounded-full animate-ping"></div>
        <div className="absolute top-1/4 right-10 w-16 h-16 bg-white bg-opacity-5 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white bg-opacity-10 rounded-full animate-bounce"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* Logo/Brand */}
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-2">
            Mentor<span className="text-yellow-300">Me</span>
          </h1>
          <p className="text-xl text-blue-100 font-medium">
            Moving...
          </p>
        </div>

        {/* Loading Spinner */}
        <div className="flex flex-col items-center space-y-4">
          <ClipLoader 
            color="#FBBF24" 
            loading={loading} 
            size={60}
            speedMultiplier={1.2}
          />
          <p className="text-white text-lg font-medium animate-pulse">
            {text}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="w-64 h-1 bg-white bg-opacity-20 rounded-full overflow-hidden">
          <div className="h-full bg-yellow-300 rounded-full loading-progress"></div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-center">
        <p className="text-blue-200 text-sm">
          Please wait a moment...
        </p>
      </div>

      <style jsx>{`
        @keyframes loadingProgress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .loading-progress {
          animation: loadingProgress 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LoadingPage;
