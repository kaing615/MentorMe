// Script tạo booking request test để hiển thị trong tab Response

// Kết nối MongoDB và tạo booking request
const booking = {
  _id: ObjectId("68c1234567890abcdef12345"), // ID booking mới
  mentee: ObjectId("68a1111111111111111111111"), // ID của mentee (fake)
  mentor: ObjectId("68b4312f8860056ec6166905"), // ID mentor từ availability
  availability: ObjectId("68b9b67b4dc52edc5a0bff99"), // ID availability record
  slot: ObjectId("68b9b67b4dc52edc5a0bff9a"), // ID slot 10:00
  
  // Thông tin booking
  date: new Date("2025-09-06T00:00:00.000Z"),
  startTime: "10:00",
  endTime: "10:30",
  status: "pending", // Trạng thái chờ duyệt
  
  // Thông tin mentee (có thể fake để test)
  menteeInfo: {
    name: "Nguyễn Văn A",
    email: "mentee@example.com",
    phone: "0123456789"
  },
  
  // Message từ mentee
  message: "Xin chào mentor, em muốn đặt lịch học với anh/chị về React.js. Em mong được hướng dẫn chi tiết.",
  
  // Metadata
  createdAt: new Date(),
  updatedAt: new Date()
};

// Chạy lệnh này trong MongoDB Compass hoặc Studio 3T:
db.bookings.insertOne(booking);

console.log("Booking request created successfully!");
console.log("Booking ID:", booking._id);
