# Faker.js Mockup Data Implementation

## Tính năng đã thêm

### 1. **Mentor Profile Data (Faker-generated)**
- Tên ngẫu nhiên với firstName và lastName
- Headline nghề nghiệp tự động
- Bio mô tả chi tiết
- Social media links (Twitter, LinkedIn, YouTube, Facebook)
- Profile image avatar ngẫu nhiên

### 2. **Course Data (15 khóa học ngẫu nhiên)**
- Tên khóa học với các chủ đề tech phổ biến
- Rating từ 3.5-5.0 sao
- Số lượng học viên và đánh giá thực tế
- Giá tiền từ $29.99-$399.99
- Categories: Programming, Frontend, Backend, Full Stack, Database, DevOps
- Levels: Beginner, Intermediate, Advanced, All Levels

### 3. **Mentee Data (20 học viên ngẫu nhiên)**
- Tên và email thực tế
- Avatar images ngẫu nhiên
- Địa điểm ở Mỹ (12 thành phố khác nhau)
- Timezone tương ứng (PST, EST, CST, MST)
- Learning goals đa dạng
- Enrolled courses với progress và status thực tế

### 4. **Conversation Data (10 cuộc trò chuyện)**
- Mentor-mentee conversations thực tế
- Messages với content ngẫu nhiên
- Timestamps và read status
- Online/offline status
- Unread message counts

### 5. **Review Data (25 đánh giá)**
- Review text tự động với template thực tế
- Rating từ 3-5 sao
- Helpful counts ngẫu nhiên
- Dates trong quá khứ
- Liên kết với courses và students thực tế

## Lợi ích của việc sử dụng Faker.js

### ✅ **Dữ liệu đa dạng và thực tế**
- Không còn hard-coded data
- Mỗi lần refresh sẽ có data khác nhau
- Names, emails, dates đều thực tế

### ✅ **Dễ dàng scale**
- Có thể tăng/giảm số lượng records bằng cách thay đổi parameters
- generateCourses(50) → 50 courses
- generateMentees(100, courses) → 100 mentees

### ✅ **Relationships được maintain**
- Mentees enrolled vào courses thật
- Reviews liên kết với courses và students thật
- Conversations match với mentees

### ✅ **API-ready structure**
- Tất cả fields đều có ID và timestamps
- Structure giống như API response
- Dễ dàng thay thế bằng API calls sau này

## Cách sử dụng

```javascript
// Generate data with custom quantities
const courses = generateCourses(20);        // 20 courses
const mentees = generateMentees(50, courses); // 50 mentees
const conversations = generateConversations(15, mentees); // 15 conversations  
const reviews = generateReviews(100, courses, mentees); // 100 reviews
```

## Các categories và topics được support

**Tech Topics:** JavaScript, React, Node.js, Python, Java, TypeScript, Vue.js, Angular, HTML/CSS, MongoDB, PostgreSQL, Docker, AWS, Machine Learning, Data Science, DevOps, Git, GraphQL

**Categories:** Programming, Frontend Development, Backend Development, Full Stack, Database, DevOps, Data Science, Mobile Development

**Learning Goals:** Frontend Development, Backend Development, Full Stack Development, Career Change to Tech, Skill Enhancement, Freelancing, Startup Development, Mobile Development, Data Science

## Next Steps

1. **Integration với API:** Replace faker data với API calls
2. **Caching:** Implement data caching để tránh regenerate mỗi lần
3. **Seed data:** Có thể tạo consistent seed để có data giống nhau cho testing
4. **More realistic content:** Thêm tech-specific content cho messages và reviews
