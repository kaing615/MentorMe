const fields = [
  "userName",
  "firstName",
  "lastName",
  "jobTitle",
  "category",
  "bio",
  "mentorReason",
  "experience",
  "location",
  "greatestAchievement",
  "headline",
  "introVideo",
  "timezone",
] as const;

export const buildMentorProfilePayload = (form: Record<string, any>) => {
  const payload = Object.fromEntries(fields.map((field) => [field, form[field] ?? ""]));
  payload.skills = Array.isArray(form.skills)
    ? form.skills.map(String).map((skill) => skill.trim()).filter(Boolean)
    : String(form.skills || "").split(",").map((skill) => skill.trim()).filter(Boolean);
  payload.sessionPrice = Number(form.sessionPrice) || 0;
  if (Array.isArray(form.languages)) {
    payload.languages = form.languages.map(String).map((language) => language.trim()).filter(Boolean);
  }
  payload.links = Object.fromEntries(
    ["website", "twitter", "linkedin", "youtube", "facebook"].map((key) => [
      key,
      String(form[key] || "").trim(),
    ]),
  );
  return payload;
};
