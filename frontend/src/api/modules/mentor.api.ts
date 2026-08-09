import publicClient from "../clients/public.client.js";

// Mock data for testing when backend is not available
const mockMentors = [
  {
    _id: "1",
    firstName: "John",
    lastName: "Doe",
    avatarUrl: "https://via.placeholder.com/100",
    rating: 4.8,
    hourlyRate: 85,
    profile: {
      bio: "Experienced software engineer with 10+ years in full-stack development",
      location: "San Francisco, CA",
      skills: ["JavaScript", "React", "Node.js", "MongoDB"],
      category: "Programming",
    },
    coursesCount: 15,
    subjects: ["Web Development", "JavaScript", "React"],
  },
  {
    _id: "2",
    firstName: "Jane",
    lastName: "Smith",
    avatarUrl: "https://via.placeholder.com/100",
    rating: 4.9,
    hourlyRate: 120,
    profile: {
      bio: "UI/UX Designer passionate about creating user-centered designs",
      location: "New York, NY",
      skills: ["Figma", "Adobe XD", "Sketch", "Prototyping"],
      category: "Design",
    },
    coursesCount: 8,
    subjects: ["UI Design", "UX Research", "Design Systems"],
  },
  {
    _id: "3",
    firstName: "Mike",
    lastName: "Johnson",
    avatarUrl: "https://via.placeholder.com/100",
    rating: 4.6,
    hourlyRate: 75,
    profile: {
      bio: "Business strategist helping startups scale and grow",
      location: "Austin, TX",
      skills: ["Business Strategy", "Marketing", "Finance", "Leadership"],
      category: "Business",
    },
    coursesCount: 22,
    subjects: ["Business Strategy", "Entrepreneurship", "Marketing"],
  },
];

const mentorApi: any = {
  // Search mentors chỉ dùng mock data (không gọi API backend)
  searchMentors: async ({
    name,
    id,
    category,
    skills,
    location,
    page = 1,
    limit = 10,
  }) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    let filteredMentors = [...mockMentors];
    if (name && name.trim()) {
      const searchTerm = name.trim().toLowerCase();
      filteredMentors = filteredMentors.filter((mentor) => {
        const fullName = `${mentor.firstName} ${mentor.lastName}`.toLowerCase();
        return fullName.includes(searchTerm);
      });
    }
    if (category && category.trim()) {
      filteredMentors = filteredMentors.filter((mentor) =>
        mentor.profile.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    if (skills && skills.trim()) {
      const skillTerm = skills.trim().toLowerCase();
      filteredMentors = filteredMentors.filter((mentor) =>
        mentor.profile.skills.some((skill) =>
          skill.toLowerCase().includes(skillTerm)
        )
      );
    }
    if (location && location.trim()) {
      filteredMentors = filteredMentors.filter((mentor) =>
        mentor.profile.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    // Simulate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMentors = filteredMentors.slice(startIndex, endIndex);
    const mockResponse = {
      data: {
        success: true,
        mentors: paginatedMentors,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(filteredMentors.length / limit),
          totalMentors: filteredMentors.length,
          hasNextPage: endIndex < filteredMentors.length,
          hasPrevPage: page > 1,
        },
      },
    };
    return { response: mockResponse };
  },

  // Lấy top mentors từ backend
  getTopMentors: async () => {
    try {
      const response = await publicClient.get("/profile/top-mentors");
      return { response };
    } catch (err) {
      // Fallback to mock data
      return { response: { data: { mentors: mockMentors.slice(0, 4) } } };
    }
  },

  // Lấy chi tiết mentor
  getMentorById: async (mentorId) => {
    try {
      const response = await publicClient.get(`/profile/${mentorId}`);
      return { response };
    } catch (err) {
      // If API fails, use mock data
      const mentor = mockMentors.find((m) => m._id === mentorId);
      if (mentor) {
        const mockResponse = {
          data: {
            success: true,
            mentor: mentor,
          },
        };
        return { response: mockResponse };
      }
      return { err };
    }
  },
};

// Export named functions for easier importing
export const searchMentors = mentorApi.searchMentors;
export const getMentorById = mentorApi.getMentorById;
export const getTopMentors = mentorApi.getTopMentors;

export default mentorApi;
