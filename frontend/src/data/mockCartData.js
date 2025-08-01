// Mock data for shopping cart courses
export const mockCartCourses = [
  {
    id: 1,
    name: "Complete Web Development Bootcamp",
    instructor: "Dr. Angela Yu",
    price: 199.99,
    originalPrice: 249.99,
    rating: 4.8,
    totalRating: 2847,
    totalHours: 65,
    lectures: 375,
    level: "Beginner to Advanced",
    category: "Web Development",
    image:
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop&crop=center",
    selected: false,
    tags: ["HTML", "CSS", "JavaScript", "React", "Node.js"],
    description: "Learn web development from scratch with hands-on projects",
    lastUpdated: "2024-12-01",
  },
  {
    id: 2,
    name: "UI/UX Design Masterclass",
    instructor: "Jonas Schmedtmann",
    price: 179.99,
    originalPrice: 219.99,
    rating: 4.9,
    totalRating: 1923,
    totalHours: 42,
    lectures: 189,
    level: "Intermediate",
    category: "Design",
    image:
      "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=400&h=250&fit=crop&crop=center",
    selected: false,
    tags: ["Figma", "Adobe XD", "Prototyping", "User Research"],
    description:
      "Master UI/UX design with real-world projects and case studies",
    lastUpdated: "2024-11-15",
  },
  {
    id: 3,
    name: "Digital Marketing Strategy 2025",
    instructor: "Neil Patel",
    price: 149.99,
    originalPrice: 199.99,
    rating: 4.7,
    totalRating: 3456,
    totalHours: 38,
    lectures: 142,
    level: "Beginner",
    category: "Marketing",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop&crop=center",
    selected: false,
    tags: ["SEO", "Social Media", "Google Ads", "Analytics"],
    description:
      "Complete digital marketing course covering all major platforms",
    lastUpdated: "2025-01-01",
  },
  {
    id: 4,
    name: "Data Science & Machine Learning",
    instructor: "Jose Marcial Portilla",
    price: 229.99,
    originalPrice: 279.99,
    rating: 4.8,
    totalRating: 1567,
    totalHours: 88,
    lectures: 312,
    level: "Advanced",
    category: "Data Science",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop&crop=center",
    selected: false,
    tags: ["Python", "TensorFlow", "Pandas", "Machine Learning"],
    description: "Complete data science bootcamp with Python and ML algorithms",
    lastUpdated: "2024-10-20",
  },
  {
    id: 5,
    name: "React & Redux Complete Course",
    instructor: "Maximilian Schwarzmüller",
    price: 189.99,
    originalPrice: 239.99,
    rating: 4.9,
    totalRating: 4821,
    totalHours: 52,
    lectures: 287,
    level: "Intermediate to Advanced",
    category: "Frontend Development",
    image:
      "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&h=250&fit=crop&crop=center",
    selected: false,
    tags: ["React", "Redux", "JavaScript", "Hooks", "Context API"],
    description: "Master React and Redux with modern development practices",
    lastUpdated: "2024-12-10",
  },
  {
    id: 6,
    name: "Mobile App Development with Flutter",
    instructor: "Academind by Maximilian",
    price: 169.99,
    originalPrice: 209.99,
    rating: 4.6,
    totalRating: 2134,
    totalHours: 45,
    lectures: 198,
    level: "Beginner to Intermediate",
    category: "Mobile Development",
    image:
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop&crop=center",
    selected: false,
    tags: ["Flutter", "Dart", "iOS", "Android", "Firebase"],
    description: "Build native mobile apps for iOS and Android with Flutter",
    lastUpdated: "2024-11-28",
  },
];

// Mock pricing configuration
export const mockPricingConfig = {
  taxRate: 0.08, // 8% tax
  discountTiers: [
    { minAmount: 500, discount: 75, name: "Premium Bundle" },
    { minAmount: 300, discount: 50, name: "Value Pack" },
    { minAmount: 150, discount: 25, name: "Starter Discount" },
    { minAmount: 0, discount: 10, name: "Basic Discount" },
  ],
  currency: "USD",
  currencySymbol: "$",
};

// Mock user cart state (could come from localStorage or API)
export const mockUserCartState = {
  userId: "user123",
  cartId: "cart456",
  lastUpdated: new Date().toISOString(),
  appliedCoupon: null,
  savedForLater: [],
};

// Mock breadcrumb navigation
export const mockBreadcrumbItems = [
  { label: "Home", path: "/", active: false },
  { label: "Courses", path: "/courses", active: false },
  { label: "Categories", path: "/categories", active: false },
  { label: "Shopping Cart", path: "/cart", active: true },
];

// Helper function to calculate discount based on subtotal
export const calculateDiscount = (subtotal) => {
  const config = mockPricingConfig.discountTiers.find(
    (tier) => subtotal >= tier.minAmount
  );
  return config ? config.discount : 0;
};

// Helper function to format currency
export const formatCurrency = (amount) => {
  return `${mockPricingConfig.currencySymbol}${amount.toFixed(2)}`;
};

export default {
  mockCartCourses,
  mockPricingConfig,
  mockUserCartState,
  mockBreadcrumbItems,
  calculateDiscount,
  formatCurrency,
};
