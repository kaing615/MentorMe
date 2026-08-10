import publicClient from "../clients/public.client.js";
import { filterMentors } from "../../utils/mentor-list";

type MentorSearch = {
  name?: string;
  category?: string;
  skills?: string;
  location?: string;
  page?: number;
  limit?: number;
};

const getTopMentors = async (limit = 6) => {
  const response = await publicClient.get("/profile/top-mentors", {
    params: { limit },
  });
  return { response };
};

const searchMentors = async ({
  name = "",
  category = "",
  skills = "",
  location = "",
  page = 1,
  limit = 20,
}: MentorSearch = {}) => {
  const response = await publicClient.get("/profile/top-mentors", {
    params: { limit: 100 },
  });
  const allMentors = Array.isArray(response.data?.mentors)
    ? response.data.mentors
    : [];
  const query = [name, category, skills, location].filter(Boolean).join(" ");
  const filtered = filterMentors(allMentors, query);
  const start = (page - 1) * limit;

  return {
    response: {
      ...response,
      data: {
        ...response.data,
        mentors: filtered.slice(start, start + limit),
        total: filtered.length,
      },
    },
  };
};

const getMentorById = async (mentorId: string) => {
  const response = await publicClient.get(`/profile/mentor/${mentorId}`);
  return { response };
};

const mentorApi = { searchMentors, getTopMentors, getMentorById };

export { searchMentors, getTopMentors, getMentorById };
export default mentorApi;
