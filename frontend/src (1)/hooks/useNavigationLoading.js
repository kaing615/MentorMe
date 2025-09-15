import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Hook để quản lý loading state khi chuyển trang
export const useNavigationLoading = () => {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Bắt đầu loading khi location thay đổi
    setIsLoading(true);

    // Simulate loading time (có thể thay đổi tùy theo nhu cầu)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // 2 giây loading

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return isLoading;
};

export default useNavigationLoading;
