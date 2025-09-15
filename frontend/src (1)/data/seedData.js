// seedData.js - mock data for local frontend testing (track by userId)

export const menteeUser = {
  _id: "mentee1234567890",
  name: "Test Mentee",
  email: "mentee@example.com",
  password: "123456",
  role: "mentee",
  isVerified: true,
};

export const courses = [
  {
    _id: "course1",
    name: "React for Beginners",
    instructor: "John Doe",
    price: 500000,
    lectures: 20,
    totalHours: 10,
    level: "Beginner",
    image: "https://placehold.co/300x200",
    rating: 4.5,
    totalRating: 100,
  },
  {
    _id: "course2",
    name: "Node.js Mastery",
    instructor: "Jane Smith",
    price: 700000,
    lectures: 30,
    totalHours: 15,
    level: "Intermediate",
    image: "https://placehold.co/300x200",
    rating: 4.7,
    totalRating: 80,
  },
  {
    _id: "course3",
    name: "Python for Data Science",
    instructor: "Alice Johnson",
    price: 600000,
    lectures: 25,
    totalHours: 12,
    level: "Intermediate",
    image: "https://placehold.co/300x200",
    rating: 4.6,
    totalRating: 90,
  },
  {
    _id: "course4",
    name: "Machine Learning A-Z",
    instructor: "Robert Brown",
    price: 800000,
    lectures: 40,
    totalHours: 20,
    level: "Advanced",
    image: "https://placehold.co/300x200",
    rating: 4.8,
    totalRating: 120,
  },
];
// Seed coupon for testing

export const coupon = {
  code: "DISCOUNT10",
  discountType: "percent",
  discountValue: 10,
  isActive: true,
};

export const coupon2 = {
  code: "TEST50",
  discountType: "percent",
  discountValue: 50,
  isActive: true,
};
//

export const cart = {
  _id: "cart1234567890",
  user: menteeUser._id,
  items: courses.map((course) => ({ courseId: course, quantity: 1 })),
  subtotalAmount: courses.reduce((sum, c) => sum + c.price, 0),
  discountAmount: 0,
  taxAmount: 0,
  totalAmount: courses.reduce((sum, c) => sum + c.price, 0),
};

export const order = {
  _id: "order1234567890",
  user: menteeUser._id,
  items: [
    { courseId: courses[0], quantity: 1 },
    { courseId: courses[1], quantity: 1 },
  ],
  subtotalAmount: courses[0].price + courses[1].price,
  discountAmount: 0,
  taxAmount: 0,
  totalAmount: courses[0].price + courses[1].price,
  status: "completed",
  createdAt: "2025-08-13T10:00:00.000Z",
};
