export type MentorListItem = {
  id: string;
  name: string;
  title: string;
  avatar: string;
  description: string;
  skills: string[];
  rating: number;
  reviewCount: number;
  studentCount: number;
  sessionPrice: number;
};

export const filterMentors = (mentors: any[], query: string) => {
  const term = query.trim().toLowerCase();
  if (!term) return mentors;

  return mentors.filter((mentor) =>
    [
      mentor.fullName,
      mentor.firstName,
      mentor.lastName,
      mentor.jobTitle,
      mentor.category,
      mentor.profile?.jobTitle,
      mentor.profile?.category,
      ...(mentor.skills || mentor.profile?.skills || []),
    ].some((value) => String(value || "").toLowerCase().includes(term)),
  );
};

export const mapMentorListResponse = (response: any): MentorListItem[] => {
  const mentors = response?.data?.mentors;
  if (!Array.isArray(mentors)) return [];

  return mentors.map((mentor) => ({
    id: String(mentor._id || mentor.id),
    name:
      mentor.fullName ||
      [mentor.firstName, mentor.lastName].filter(Boolean).join(" ") ||
      "Mentor",
    title: mentor.jobTitle || "Mentor",
    avatar: mentor.avatarUrl || "",
    description: mentor.bio || "",
    skills: Array.isArray(mentor.skills) ? mentor.skills : [],
    rating: Number(mentor.averageRating) || 0,
    reviewCount: Number(mentor.totalReviews) || 0,
    studentCount: Number(mentor.totalStudents) || 0,
    sessionPrice: Number(mentor.sessionPrice) || 0,
  }));
};
