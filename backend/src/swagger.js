import swaggerJsdoc from "swagger-jsdoc";
import dotenv from "dotenv";
dotenv.config();

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MentorMe API Documentation",
      version: "2.0.0",
      description: "API documentation cho hệ thống MentorMe - Bao gồm Auth, Courses, Cart, Checkout, Orders và Payment",
      contact: {
        name: "MentorMe Development Team",
        email: "dev@mentorme.vn"
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 4000}`,
        description: "Development server"
      },
      {
        url: "https://api.mentorme.vn",
        description: "Production server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT Authorization header sử dụng Bearer scheme. Example: 'Authorization: Bearer {token}'"
        }
      },
      schemas: {
        // Cart Schemas
        CartItem: {
          type: "object",
          required: ["courseId", "quantity"],
          properties: {
            courseId: {
              type: "string",
              format: "objectid",
              description: "ID của khóa học",
              example: "60f7b3b3e1b3c72a8c8b4567"
            },
            title: {
              type: "string",
              description: "Tên khóa học",
              example: "React Native cho người mới bắt đầu"
            },
            price: {
              type: "number",
              minimum: 0,
              description: "Giá khóa học (VND)",
              example: 299000
            },
            quantity: {
              type: "integer",
              minimum: 1,
              default: 1,
              description: "Số lượng",
              example: 1
            },
            thumbnail: {
              type: "string",
              description: "Ảnh thumbnail khóa học",
              example: "/uploads/courses/react-native-thumb.jpg"
            }
          }
        },
        Cart: {
          type: "object",
          properties: {
            userId: {
              type: "string",
              format: "objectid",
              description: "ID người dùng"
            },
            items: {
              type: "array",
              items: {
                $ref: "#/components/schemas/CartItem"
              }
            },
            totalAmount: {
              type: "number",
              description: "Tổng tiền trước giảm giá",
              example: 598000
            },
            discountCode: {
              type: "string",
              description: "Mã giảm giá",
              example: "SALE20"
            },
            discountAmount: {
              type: "number",
              description: "Số tiền được giảm",
              example: 119600
            },
            finalAmount: {
              type: "number",
              description: "Tổng tiền sau giảm giá",
              example: 478400
            },
            createdAt: {
              type: "string",
              format: "date-time"
            },
            updatedAt: {
              type: "string",
              format: "date-time"
            }
          }
        },

        // Order Schemas
        BillingInfo: {
          type: "object",
          required: ["email", "firstName", "lastName"],
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "Email thanh toán",
              example: "john.doe@example.com"
            },
            firstName: {
              type: "string",
              description: "Họ",
              example: "John"
            },
            lastName: {
              type: "string",
              description: "Tên",
              example: "Doe"
            },
            country: {
              type: "string",
              default: "Vietnam",
              description: "Quốc gia",
              example: "Vietnam"
            },
            address: {
              type: "string",
              description: "Địa chỉ",
              example: "123 Nguyễn Văn Linh, Q7, TP.HCM"
            }
          }
        },
        PaymentInfo: {
          type: "object",
          properties: {
            method: {
              type: "string",
              enum: ["credit_card", "paypal", "vnpay", "momo", "bank_transfer"],
              description: "Phương thức thanh toán"
            },
            transactionId: {
              type: "string",
              description: "ID giao dịch từ payment gateway"
            },
            paymentGateway: {
              type: "string",
              enum: ["stripe", "paypal", "vnpay", "momo", "manual"],
              description: "Cổng thanh toán"
            },
            paidAt: {
              type: "string",
              format: "date-time",
              description: "Thời gian thanh toán"
            }
          }
        },
        Order: {
          type: "object",
          properties: {
            orderNumber: {
              type: "string",
              description: "Mã đơn hàng",
              example: "1690876543210-ABC123"
            },
            formattedOrderNumber: {
              type: "string",
              description: "Mã đơn hàng có format",
              example: "MTM-1690876543210-ABC123"
            },
            userId: {
              type: "string",
              format: "objectid",
              description: "ID người dùng"
            },
            items: {
              type: "array",
              items: {
                $ref: "#/components/schemas/CartItem"
              }
            },
            subtotalAmount: {
              type: "number",
              description: "Tổng tiền trước giảm giá",
              example: 598000
            },
            discountCode: {
              type: "string",
              description: "Mã giảm giá"
            },
            discountAmount: {
              type: "number",
              description: "Số tiền giảm"
            },
            totalAmount: {
              type: "number",
              description: "Tổng tiền sau giảm giá",
              example: 478400
            },
            billingInfo: {
              $ref: "#/components/schemas/BillingInfo"
            },
            paymentInfo: {
              $ref: "#/components/schemas/PaymentInfo"
            },
            status: {
              type: "string",
              enum: ["pending", "processing", "paid", "completed", "failed", "cancelled", "refunded"],
              description: "Trạng thái đơn hàng"
            },
            coursesGranted: {
              type: "boolean",
              description: "Đã cấp quyền truy cập khóa học"
            },
            createdAt: {
              type: "string",
              format: "date-time"
            },
            updatedAt: {
              type: "string",
              format: "date-time"
            }
          }
        },

        // Response Schemas
        ApiResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true
            },
            message: {
              type: "string",
              example: "Thành công"
            },
            data: {
              type: "object"
            }
          }
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false
            },
            message: {
              type: "string",
              example: "Có lỗi xảy ra"
            },
            error: {
              type: "string"
            }
          }
        },

        // Payment Schemas
        VNPayCreateRequest: {
          type: "object",
          required: ["orderNumber"],
          properties: {
            orderNumber: {
              type: "string",
              description: "Mã đơn hàng",
              example: "1690876543210-ABC123"
            },
            bankCode: {
              type: "string",
              description: "Mã ngân hàng (optional)",
              example: "NCB"
            }
          }
        },
        MoMoCreateRequest: {
          type: "object",
          required: ["orderNumber"],
          properties: {
            orderNumber: {
              type: "string",
              description: "Mã đơn hàng",
              example: "1690876543210-ABC123"
            }
          }
        },
        PaymentResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Tạo link thanh toán thành công!"
            },
            paymentUrl: {
              type: "string",
              description: "URL thanh toán",
              example: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?..."
            },
            orderNumber: {
              type: "string",
              example: "1690876543210-ABC123"
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: "Authentication",
        description: "API xác thực người dùng"
      },
      {
        name: "Users",
        description: "API quản lý người dùng"
      },
      {
        name: "Courses",
        description: "API quản lý khóa học"
      },
      {
        name: "Cart",
        description: "API quản lý giỏ hàng"
      },
      {
        name: "Checkout",
        description: "API xử lý checkout"
      },
      {
        name: "Orders",
        description: "API quản lý đơn hàng"
      },
      {
        name: "Payment",
        description: "API xử lý thanh toán"
      }
    ]
  },
  apis: ["./src/routes/*.js", "./src/models/*.js", "./src/controllers/*.js"],
};

const specs = swaggerJsdoc(options);
export default specs;
