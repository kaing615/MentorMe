import createPrivateClient from "../clients/private.client.js";

// Helper để luôn trả cả error và err (alias) cho code cũ
const ok = (response) => ({ response });
const fail = (error) => ({ error, err: error });

const purchasedCourseApi = {
  // Helper function to get current user ID consistently
  getCurrentUserId: () => {
    try {
      const userStr =
        localStorage.getItem("user") || sessionStorage.getItem("user");
      if (!userStr) return null;

      const user = JSON.parse(userStr);
      // Try multiple possible ID fields to ensure we get the correct ID
      return user?._id || user?.id || user?.userId || null;
    } catch (e) {
      console.error("Error parsing user for ID:", e);
      return null;
    }
  },

  // Helper function to clear mock data that might cause data mixing
  clearMockDataForUser: (userId) => {
    try {
      if (!userId) return;

      // Clear both user-specific and generic mock data keys
      const mockKeys = [
        `mockPurchasedCourses_${userId}`,
        "mockPurchasedCourses",
        `purchasedCourses_cache_${userId}_mock`,
      ];

      mockKeys.forEach((key) => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          console.log("[DEBUG] Removed mock data key:", key);
        }
      });
    } catch (e) {
      console.error("Error clearing mock data:", e);
    }
  },

  // Helper function to clear all cached data for user (useful when switching users)
  clearUserCache: (userId) => {
    try {
      if (!userId) return;

      const cacheKey = `purchasedCourses_cache_${userId}`;
      localStorage.removeItem(cacheKey);
      console.log("[DEBUG] Cleared cache for user:", userId);
    } catch (e) {
      console.error("Error clearing user cache:", e);
    }
  },

  // Function to detect and fix data corruption issues
  validateAndCleanCache: () => {
    try {
      const currentUserId = purchasedCourseApi.getCurrentUserId();
      if (!currentUserId) return;

      // Get all localStorage keys that might contain course data
      const allKeys = Object.keys(localStorage);
      const courseKeys = allKeys.filter(
        (key) =>
          key.includes("purchasedCourses") ||
          key.includes("mockPurchasedCourses")
      );

      console.log("[DEBUG] Found course-related keys:", courseKeys);

      // Remove any keys that don't belong to current user
      courseKeys.forEach((key) => {
        if (key.includes("_") && !key.includes(`_${currentUserId}`)) {
          console.log("[DEBUG] Removing foreign user cache:", key);
          localStorage.removeItem(key);
        }
      });

      // Validate current user's cache
      const userCacheKey = `purchasedCourses_cache_${currentUserId}`;
      const userCache = localStorage.getItem(userCacheKey);

      if (userCache) {
        try {
          const cacheData = JSON.parse(userCache);
          if (cacheData.userId && cacheData.userId !== currentUserId) {
            console.log(
              "[DEBUG] Cache user mismatch, clearing:",
              cacheData.userId,
              "vs",
              currentUserId
            );
            localStorage.removeItem(userCacheKey);
          }
        } catch (e) {
          console.log("[DEBUG] Corrupted cache detected, clearing");
          localStorage.removeItem(userCacheKey);
        }
      }
    } catch (error) {
      console.error("Error validating cache:", error);
    }
  },

  // Helper function to check if course is already purchased (sync version for immediate use)
  isCourseAlreadyPurchased: (courseId) => {
    try {
      // Get current user ID for user-specific localStorage cache
      const currentUserId = purchasedCourseApi.getCurrentUserId();

      if (!currentUserId) {
        console.warn("[DEBUG] No user ID found for checking purchased course");
        return false;
      }

      const cacheKey = `purchasedCourses_cache_${currentUserId}`;
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        try {
          const cacheObject = JSON.parse(cachedData);
          if (cacheObject.courses && Array.isArray(cacheObject.courses)) {
            return cacheObject.courses.some(
              (purchased) =>
                (purchased.course?._id ||
                  purchased.course?.id ||
                  purchased.courseId) === courseId
            );
          }
        } catch (error) {
          console.error("Error parsing cached purchased courses:", error);
          // Remove corrupted cache
          localStorage.removeItem(cacheKey);
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error("Error checking purchased course:", error);
      return false;
    }
  },

  // Async version to check with real API data
  checkIfCourseIsPurchased: async (courseId, dispatch) => {
    try {
      const privateClient = createPrivateClient(dispatch);
      const response = await privateClient.get(
        `/purchased-courses/check/${courseId}`
      );
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  // Lấy tất cả khóa học đã mua của user
  getPurchasedCourses: async (dispatch) => {
    try {
      // Try API first
      const privateClient = createPrivateClient(dispatch);
      const response = await privateClient.get("/purchased-courses");

      // If API success, cache real data to localStorage for quick access
      if (response && response.data && response.data.courses) {
        try {
          // Get current user ID for user-specific localStorage
          const currentUserId = purchasedCourseApi.getCurrentUserId();

          if (currentUserId) {
            const cacheKey = `purchasedCourses_cache_${currentUserId}`;

            // Store real API data in localStorage cache with timestamp and user ID for validation
            const cacheData = {
              userId: currentUserId, // Store user ID for validation
              courses: response.data.courses,
              timestamp: new Date().getTime(),
              source: "api",
            };
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
            console.log(
              "[DEBUG] Cached purchased courses for user:",
              currentUserId,
              "Courses count:",
              response.data.courses.length
            );
          } else {
            console.warn(
              "[DEBUG] No user ID available, cannot cache purchased courses"
            );
          }
        } catch (storageError) {
          console.warn(
            "Failed to cache purchased courses to localStorage:",
            storageError
          );
        }
      }

      return ok(response);
    } catch (apiError) {
      console.warn("API failed, trying localStorage fallback:", apiError);

      // Fallback to localStorage cache if API fails
      try {
        // Get current user ID for user-specific localStorage
        const currentUserId = purchasedCourseApi.getCurrentUserId();

        if (!currentUserId) {
          console.warn("[DEBUG] No user ID for cache fallback");
          return fail(apiError);
        }

        const cacheKey = `purchasedCourses_cache_${currentUserId}`;
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
          const cacheObject = JSON.parse(cachedData);

          // Validate cache belongs to current user
          if (cacheObject.userId !== currentUserId) {
            console.warn(
              "[DEBUG] Cache user ID mismatch, removing cache:",
              cacheObject.userId,
              "vs",
              currentUserId
            );
            localStorage.removeItem(cacheKey);
            return fail(apiError);
          }

          // Check if cache is not too old (24 hours)
          const cacheAge = new Date().getTime() - cacheObject.timestamp;
          const maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

          if (cacheAge < maxCacheAge && cacheObject.courses) {
            console.log(
              "[DEBUG] Using cached purchased courses for user:",
              currentUserId,
              "Courses count:",
              cacheObject.courses.length
            );
            // Return cached real data in API response format
            const cacheResponse = {
              data: {
                courses: cacheObject.courses,
                total: cacheObject.courses.length,
                message: "Data loaded from cache (API temporarily unavailable)",
              },
            };
            return ok(cacheResponse);
          } else {
            // Cache is too old, remove it
            console.log(
              "[DEBUG] Cache too old, removing for user:",
              currentUserId
            );
            localStorage.removeItem(cacheKey);
          }
        }
      } catch (localStorageError) {
        console.error(
          "localStorage cache fallback also failed:",
          localStorageError
        );
      }

      // If both API and localStorage fail, return the original API error
      return fail(apiError);
    }
  },

  // Lấy chi tiết một khóa học đã mua
  getPurchasedCourseDetails: async ({ courseId }, dispatch) => {
    try {
      const privateClient = createPrivateClient(dispatch);
      // Correct backend endpoint is /purchased-courses/check/:courseId
      const response = await privateClient.get(
        `/purchased-courses/check/${courseId}`
      );
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  // Tạo khóa học đã mua mới (thêm khóa học vào danh sách đã mua)
  createPurchasedCourse: async (
    { courseId, price, purchaseDate },
    dispatch
  ) => {
    try {
      const privateClient = createPrivateClient(dispatch);
      const response = await privateClient.post("/purchased-courses", {
        courseId,
        price,
        purchaseDate,
      });

      // If successful, add to localStorage as well
      if (response && response.data) {
        try {
          purchasedCourseApi.addPurchasedCourseToCache({
            courseId,
            price,
            purchaseDate,
            course: response.data.course || { _id: courseId },
          });
        } catch (syncError) {
          console.warn(
            "Failed to sync created purchased course to cache:",
            syncError
          );
        }
      }

      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  // Helper function to add purchased course to cache
  addPurchasedCourseToCache: (courseData) => {
    try {
      // Get current user ID for user-specific localStorage
      const currentUserId = purchasedCourseApi.getCurrentUserId();

      if (!currentUserId) {
        console.warn("[DEBUG] No user ID available, cannot add to cache");
        return;
      }

      const cacheKey = `purchasedCourses_cache_${currentUserId}`;

      // Get existing cached data
      let cacheObject = {
        userId: currentUserId,
        courses: [],
        timestamp: new Date().getTime(),
        source: "api",
      };

      const existingCache = localStorage.getItem(cacheKey);
      if (existingCache) {
        try {
          cacheObject = JSON.parse(existingCache);

          // Validate cache belongs to current user
          if (cacheObject.userId !== currentUserId) {
            console.warn(
              "[DEBUG] Cache user ID mismatch during add, creating new cache"
            );
            cacheObject = {
              userId: currentUserId,
              courses: [],
              timestamp: new Date().getTime(),
              source: "api",
            };
          }

          if (!cacheObject.courses) {
            cacheObject.courses = [];
          }
        } catch (e) {
          console.warn("Failed to parse existing cache:", e);
          // Create new cache object
          cacheObject = {
            userId: currentUserId,
            courses: [],
            timestamp: new Date().getTime(),
            source: "api",
          };
        }
      }

      // Check if course already exists
      const courseId =
        courseData.courseId || courseData.course?._id || courseData.course?.id;
      const alreadyExists = cacheObject.courses.some(
        (purchased) =>
          (purchased.course?._id ||
            purchased.course?.id ||
            purchased.courseId) === courseId
      );

      if (!alreadyExists) {
        // Add new purchased course to cache
        cacheObject.courses.push({
          courseId: courseId,
          course: courseData.course || courseData,
          purchaseDate: courseData.purchaseDate || new Date().toISOString(),
          price: courseData.price || 0,
          ...courseData,
        });

        // Update timestamp and ensure user ID is set
        cacheObject.timestamp = new Date().getTime();
        cacheObject.userId = currentUserId;

        // Save back to localStorage cache
        localStorage.setItem(cacheKey, JSON.stringify(cacheObject));
        console.log(
          "[DEBUG] Added purchased course to cache for user:",
          currentUserId,
          "Course:",
          courseId
        );
      }
    } catch (error) {
      console.error("Failed to add purchased course to cache:", error);
    }
  },

  // Xử lý khi thanh toán thành công - tự động thêm courses từ order
  handlePurchaseSuccess: async ({ orderId }, dispatch) => {
    try {
      const privateClient = createPrivateClient(dispatch);
      const response = await privateClient.post(
        "/purchased-courses/purchase-success",
        {
          orderId,
        }
      );

      // If successful, sync the new purchased courses to localStorage
      if (response && response.data && response.data.purchasedCourses) {
        try {
          response.data.purchasedCourses.forEach((courseData) => {
            purchasedCourseApi.addPurchasedCourseToCache(courseData);
          });
        } catch (syncError) {
          console.warn(
            "Failed to sync new purchased courses to cache:",
            syncError
          );
        }
      }

      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },
};

export default purchasedCourseApi;
