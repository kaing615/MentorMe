import publicClient from "../clients/public.client.js";

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
  const response = await publicClient.get("/profile/mentors", {
    params: {
      search: name || location,
      category,
      skills,
      page,
      limit,
    },
  });
  return { response };
};

const getMentorById = async (mentorId: string) => {
  const response = await publicClient.get(`/profile/mentor/${mentorId}`);
  return { response };
};

const mentorApi = { searchMentors, getTopMentors, getMentorById };

export { searchMentors, getTopMentors, getMentorById };
export default mentorApi;
