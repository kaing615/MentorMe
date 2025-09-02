import Joi from "joi";

// Schema cho tạo/cập nhật availability
export const createAvailabilitySchema = Joi.object({
  date: Joi.date().required().messages({
    "date.base": "Date phải là ngày hợp lệ (YYYY-MM-DD)",
    "any.required": "Date là bắt buộc",
  }),

  timezone: Joi.string().default("Asia/Ho_Chi_Minh").messages({
    "string.base": "Timezone phải là string",
  }),

  slots: Joi.array()
    .items(
      Joi.object({
        start: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .required()
          .custom((value, helpers) => {
            const hour = parseInt(value.split(":")[0]);
            if (hour < 6) {
              return helpers.error("start.hour.min");
            }
            return value;
          })
          .messages({
            "string.pattern.base": "Start time phải có format HH:mm (24h)",
            "any.required": "Start time là bắt buộc",
            "start.hour.min": "Giờ bắt đầu không thể trước 6:00",
          }),

        end: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .required()
          .custom((value, helpers) => {
            const hour = parseInt(value.split(":")[0]);
            const minute = parseInt(value.split(":")[1]);
            if (hour > 22 || (hour === 22 && minute > 0)) {
              return helpers.error("end.hour.max");
            }
            return value;
          })
          .messages({
            "string.pattern.base": "End time phải có format HH:mm (24h)",
            "any.required": "End time là bắt buộc",
            "end.hour.max": "Giờ kết thúc không thể sau 22:00",
          }),

        status: Joi.string().valid("open", "blocked").default("open").messages({
          "any.only": "Status chỉ có thể là 'open' hoặc 'blocked'",
        }),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "Phải có ít nhất 1 slot",
      "any.required": "Slots là bắt buộc",
    }),
});

// Schema cho query parameters khi lấy availability
export const getAvailabilitySchema = Joi.object({
  date: Joi.date().optional().messages({
    "date.base": "Date phải là ngày hợp lệ (YYYY-MM-DD)",
  }),
});

// Schema cho get availability range
export const getAvailabilityRangeSchema = Joi.object({
  startDate: Joi.date().optional().messages({
    "date.base": "startDate phải là ngày hợp lệ (YYYY-MM-DD)",
  }),

  endDate: Joi.date().optional().min(Joi.ref("startDate")).messages({
    "date.base": "endDate phải là ngày hợp lệ (YYYY-MM-DD)",
    "date.min": "endDate không thể nhỏ hơn startDate",
  }),
});

// Schema cho availability overview (chỉ mentor xem của chính mình)
export const getAvailabilityOverviewSchema = Joi.object({
  // Không cần parameters - tự động lấy 7 ngày tới của mentor hiện tại
});
