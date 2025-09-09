import createPrivateClient from "../clients/private.client.js";

// Helper để luôn trả cả error và err (alias) cho code cũ
const ok = (response) => ({ response });
const fail = (error) => ({ error, err: error });

const purchasedCourseApi = {
  // Helper function to check if course is already purchased (sync version for immediate use)
  isCourseAlreadyPurchased: (courseId) => {
    try {
      // Get current user ID for user-specific localStorage cache
      const userStr = localStorage.getItem("user");
      let currentUserId = null;
      try {
        const user = userStr ? JSON.parse(userStr) : null;
        currentUserId = user?.id || user?._id;
      } catch (e) {
        // Ignore parse errors
      }

      const cacheKey = currentUserId
        ? `purchasedCourses_cache_${currentUserId}`
        : "purchasedCourses_cache";
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
          const userStr = localStorage.getItem("user");
          let currentUserId = null;
          try {
            const user = userStr ? JSON.parse(userStr) : null;
            currentUserId = user?.id || user?._id;
          } catch (e) {
            // Ignore parse errors
          }

          const cacheKey = currentUserId
            ? `purchasedCourses_cache_${currentUserId}`
            : "purchasedCourses_cache";

          // Store real API data in localStorage cache with timestamp
          const cacheData = {
            courses: response.data.courses,
            timestamp: new Date().getTime(),
            source: "api",
          };
          localStorage.setItem(cacheKey, JSON.stringify(cacheData));
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
        const userStr = localStorage.getItem("user");
        let currentUserId = null;
        try {
          const user = userStr ? JSON.parse(userStr) : null;
          currentUserId = user?.id || user?._id;
        } catch (e) {
          // Ignore parse errors
        }

        const cacheKey = currentUserId
          ? `purchasedCourses_cache_${currentUserId}`
          : "purchasedCourses_cache";
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
          const cacheObject = JSON.parse(cachedData);
          // Check if cache is not too old (24 hours)
          const cacheAge = new Date().getTime() - cacheObject.timestamp;
          const maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

          if (cacheAge < maxCacheAge && cacheObject.courses) {
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
      const userStr = localStorage.getItem("user");
      let currentUserId = null;
      try {
        const user = userStr ? JSON.parse(userStr) : null;
        currentUserId = user?.id || user?._id;
      } catch (e) {
        // Ignore parse errors
      }

      const cacheKey = currentUserId
        ? `purchasedCourses_cache_${currentUserId}`
        : "purchasedCourses_cache";

      // Get existing cached data
      let cacheObject = {
        courses: [],
        timestamp: new Date().getTime(),
        source: "api",
      };

      const existingCache = localStorage.getItem(cacheKey);
      if (existingCache) {
        try {
          cacheObject = JSON.parse(existingCache);
          if (!cacheObject.courses) {
            cacheObject.courses = [];
          }
        } catch (e) {
          console.warn("Failed to parse existing cache:", e);
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

        // Update timestamp
        cacheObject.timestamp = new Date().getTime();

        // Save back to localStorage cache
        localStorage.setItem(cacheKey, JSON.stringify(cacheObject));
        console.log("Added purchased course to cache:", courseId);
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
