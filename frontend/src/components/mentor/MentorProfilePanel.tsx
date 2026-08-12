import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import profileApi from "../../api/modules/profile.api";
import { buildMentorProfilePayload } from "../../utils/mentor-profile-payload";

type Props = {
  profile: any;
  onUpdated: (profile: any) => void;
};

const emptyForm = {
  userName: "",
  firstName: "",
  lastName: "",
  jobTitle: "",
  category: "",
  bio: "",
  mentorReason: "",
  experience: "",
  skills: "",
  location: "",
  greatestAchievement: "",
  headline: "",
  introVideo: "",
  languages: "",
  timezone: "",
  sessionPrice: 0,
  website: "",
  twitter: "",
  linkedin: "",
  youtube: "",
  facebook: "",
};

const categories = ["Programming", "Design", "Business", "Marketing"] as const;
const normalizeCategory = (value: string) =>
  categories.find((category) => category.toLowerCase() === value.toLowerCase()) || "";

const toForm = (data: any) => {
  const user = data?.user || {};
  const detail = data?.profile || {};
  const links = detail.links || {};
  return {
    ...emptyForm,
    userName: user.userName || "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    jobTitle: detail.jobTitle || user.jobTitle || "",
    category: normalizeCategory(detail.category || user.category || ""),
    bio: detail.bio || user.bio || "",
    mentorReason: detail.mentorReason || user.mentorReason || "",
    experience: detail.experience || user.experience || "",
    skills: (detail.skills || user.skills || []).join(", "),
    location: detail.location || user.location || "",
    greatestAchievement:
      detail.greatestAchievement || user.greatestAchievement || "",
    headline: detail.headline || "",
    introVideo: detail.introVideo || user.introVideo || "",
    languages: (detail.languages || []).join(", "),
    timezone: detail.timezone || "",
    sessionPrice: detail.sessionPrice || 0,
    website: links.website || "",
    twitter: links.twitter || "",
    linkedin: links.linkedin || user.linkedinUrl || "",
    youtube: links.youtube || "",
    facebook: links.facebook || "",
  };
};

const inputClass =
  "mt-1 w-full rounded-xl border-2 border-[var(--ui-border)] bg-white px-3 py-2.5 text-sm text-[var(--ui-text)] outline-none transition focus:border-[var(--ui-accent)] focus:ring-2 focus:ring-[var(--ui-accent-soft)]";

const MentorProfilePanel = ({ profile, onUpdated }: Props) => {
  const [form, setForm] = useState(() => toForm(profile));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => setForm(toForm(profile)), [profile]);

  const change = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const refresh = async () => {
    const response = await profileApi.getProfile();
    const updated = response?.data || {};
    onUpdated(updated);
    setForm(toForm(updated));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await profileApi.updateMentorProfile(
        buildMentorProfilePayload({
          ...form,
          languages: form.languages.split(","),
        }),
      );
      await refresh();
      toast.success("Profile updated");
    } catch (error: any) {
      toast.error(error?.message || "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await profileApi.changeAvatar(file);
      await refresh();
      toast.success("Avatar updated");
    } catch (error: any) {
      toast.error(error?.message || "Could not update avatar");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const fields = [
    ["Username", "userName"],
    ["First name", "firstName"],
    ["Last name", "lastName"],
    ["Job title", "jobTitle"],
    ["Location", "location"],
    ["Skills, separated by commas", "skills"],
    ["Experience", "experience"],
    ["Headline", "headline"],
    ["Languages, separated by commas", "languages"],
    ["Timezone", "timezone"],
    ["Intro video URL", "introVideo", "url"],
  ] as const;
  const links = [
    ["Website", "website"],
    ["LinkedIn", "linkedin"],
    ["X / Twitter", "twitter"],
    ["YouTube", "youtube"],
    ["Facebook", "facebook"],
  ] as const;

  return (
    <form onSubmit={save} className="space-y-6">
      <header className="ui-card p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {profile?.user?.avatarUrl ? (
            <img
              src={profile.user.avatarUrl}
              alt={`${form.firstName} ${form.lastName}`.trim() || "Mentor"}
              className="h-24 w-24 rounded-2xl border-2 border-[var(--ui-border)] object-cover"
            />
          ) : (
            <div className="grid h-24 w-24 place-items-center rounded-2xl bg-[var(--ui-accent-soft)] text-2xl font-black text-[var(--ui-accent)]">
              {(form.firstName[0] || "M").toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--ui-accent)]">Profile settings</p>
            <h1 className="mt-1 text-2xl font-black text-[var(--ui-text)]">Your public mentor profile</h1>
            <p className="mt-2 text-sm text-[var(--ui-text-muted)]">Keep your expertise and session details accurate for learners.</p>
          </div>
          <label className="cursor-pointer rounded-xl border-2 border-[var(--ui-border)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--ui-text)] transition hover:border-[var(--ui-accent)]">
            {uploading ? "Uploading..." : "Change avatar"}
            <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={uploadAvatar} />
          </label>
        </div>
      </header>

      <section className="ui-card p-5 sm:p-7">
        <h2 className="text-lg font-bold text-[var(--ui-text)]">Profile details</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {fields.map(([label, name, type = "text"]) => (
            <label key={name} className="text-sm font-semibold text-[var(--ui-text-muted)]">
              {label}
              <input name={name} type={type} value={form[name]} onChange={change} className={inputClass} />
            </label>
          ))}
          <label className="text-sm font-semibold text-[var(--ui-text-muted)]">
            Category
            <select name="category" value={form.category} onChange={change} className={inputClass} required>
              <option value="" disabled>Select a category</option>
              <option value="Programming">Programming</option>
              <option value="Design">Design</option>
              <option value="Business">Business</option>
              <option value="Marketing">Marketing</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-[var(--ui-text-muted)]">
            Consultation price (VND)
            <input name="sessionPrice" type="number" min="0" step="10000" value={form.sessionPrice} onChange={change} className={inputClass} />
          </label>
        </div>
        <div className="mt-4 grid gap-4">
          {[
            ["Bio", "bio", 4],
            ["Why you mentor", "mentorReason", 3],
            ["Greatest achievement", "greatestAchievement", 3],
          ].map(([label, name, rows]) => (
            <label key={String(name)} className="text-sm font-semibold text-[var(--ui-text-muted)]">
              {label}
              <textarea name={String(name)} rows={Number(rows)} value={String(form[name as keyof typeof form])} onChange={change} className={`${inputClass} resize-y`} />
            </label>
          ))}
        </div>
      </section>

      <section className="ui-card p-5 sm:p-7">
        <h2 className="text-lg font-bold text-[var(--ui-text)]">Social links</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {links.map(([label, name]) => (
            <label key={name} className="text-sm font-semibold text-[var(--ui-text-muted)]">
              {label}
              <input name={name} type="url" value={form[name]} onChange={change} className={inputClass} />
            </label>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="ui-button-highlight rounded-full px-6 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
};

export default MentorProfilePanel;
