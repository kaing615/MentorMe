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
      category: "Programming"
    },
    coursesCount: 15,
    subjects: ["Web Development", "JavaScript", "React"]
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
      category: "Design"
    },
    coursesCount: 8,
    subjects: ["UI Design", "UX Research", "Design Systems"]
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
      category: "Business"
    },
    coursesCount: 22,
    subjects: ["Business Strategy", "Entrepreneurship", "Marketing"]
  }
];

const mentorApi = {
  // Search mentors với các filters
  searchMentors: async ({ name, id, category, skills, location, page = 1, limit = 10 }) => {
    try {
      // Build query params properly
      const params = new URLSearchParams();
      
      if (name && name.trim()) params.append('name', name.trim());
      if (id && id.trim()) params.append('id', id.trim());
      if (category && category.trim()) params.append('category', category.trim());
      if (skills && skills.trim()) params.append('skills', skills.trim());
      if (location && location.trim()) params.append('location', location.trim());
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await publicClient.get(`/profile/search/mentors?${params}`);
      
      // Return standardized format
      return { 
        response: {
          data: {
            success: true,
            mentors: response.data?.data || response.data?.mentors || [],
            pagination: response.data?.pagination || {
              currentPage: page,
              totalPages: 1,
              totalMentors: 0,
              hasNextPage: false,
              hasPrevPage: false
            }
          }
        }
      };
    } catch (err) {
      console.log('Backend API not available, using mock data');
      
      // Simulate API delay - ADJUST THIS NUMBER TO CHANGE LOADING TIME
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms = 0.1 seconds

      // Filter mock data based on search criteria
      let filteredMentors = [...mockMentors];
      
      if (name && name.trim()) {
        const searchTerm = name.trim().toLowerCase();
        console.log('Searching for:', searchTerm);
        filteredMentors = filteredMentors.filter(mentor => {
          const fullName = `${mentor.firstName} ${mentor.lastName}`.toLowerCase();
          const matches = fullName.includes(searchTerm);
          console.log(`${mentor.firstName} ${mentor.lastName}: ${fullName} includes "${searchTerm}" = ${matches}`);
          return matches;
        });
        console.log('Filtered mentors:', filteredMentors);
      }
      
      if (category && category.trim()) {
        filteredMentors = filteredMentors.filter(mentor => 
          mentor.profile.category.toLowerCase().includes(category.toLowerCase())
        );
      }
      
      if (skills && skills.trim()) {
        const skillTerm = skills.trim().toLowerCase();
        filteredMentors = filteredMentors.filter(mentor => 
          mentor.profile.skills.some(skill => 
            skill.toLowerCase().includes(skillTerm)
          )
        );
      }
      
      if (location && location.trim()) {
        filteredMentors = filteredMentors.filter(mentor => 
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
            hasPrevPage: page > 1
          }
        }
      };
      
      return { response: mockResponse };
    }
  },

  // Lấy chi tiết mentor
  getMentorById: async (mentorId) => {
    try {
      const response = await publicClient.get(`/profile/${mentorId}`);
      return { response };
    } catch (err) {
      // If API fails, use mock data
      const mentor = mockMentors.find(m => m._id === mentorId);
      if (mentor) {
        const mockResponse = {
          data: {
            success: true,
            mentor: mentor
          }
        };
        return { response: mockResponse };
      }
      return { err };
    }
  }
};

// Export named functions for easier importing
export const searchMentors = mentorApi.searchMentors;
export const getMentorById = mentorApi.getMentorById;

export default mentorApi;
