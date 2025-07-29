const TestPage = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Test Page</h1>
      <p>Nếu bạn thấy trang này, nghĩa là React đã hoạt động!</p>
      <div>
        <a href="/mentor/courses" style={{ 
          backgroundColor: "#3b82f6", 
          color: "white", 
          padding: "10px 20px", 
          textDecoration: "none", 
          borderRadius: "5px",
          marginRight: "10px"
        }}>
          Xem khóa học
        </a>
        <a href="/mentor/courses/create" style={{ 
          backgroundColor: "#10b981", 
          color: "white", 
          padding: "10px 20px", 
          textDecoration: "none", 
          borderRadius: "5px"
        }}>
          Tạo khóa học
        </a>
      </div>
    </div>
  );
};

export default TestPage;
