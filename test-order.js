/**
 * Test script để test create order API
 */

// Test data
const testOrderData = {
  courses: [
    {
      courseId: "6bb1b1cda375a49a49e0c7", // Fake ID for testing
      title: "Test Course",
      price: 100000,
    },
  ],
  totalAmount: 100000,
  discountAmount: 0,
  billingInfo: {
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    country: "Vietnam",
    address: "Test Address",
  },
};

async function testCreateOrder() {
  try {
    const response = await fetch("http://localhost:4000/api/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // "Authorization": "Bearer YOUR_TOKEN_HERE" // Need real token
      },
      body: JSON.stringify(testOrderData),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);

    const data = await response.json();
    console.log("Response data:", data);
  } catch (error) {
    console.error("Test error:", error);
  }
}

// Run test
testCreateOrder();
