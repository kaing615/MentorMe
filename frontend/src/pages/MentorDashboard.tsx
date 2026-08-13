import { useEffect, useMemo, useState } from "react";
import bookingApi from "../api/modules/booking.api";
import courseApi from "../api/modules/course.api";
import earningsApi from "../api/modules/earnings.api";
import profileApi from "../api/modules/profile.api";
import purchasedCourseApi from "../api/modules/purchasedCourse.api";
import MentorProfilePanel from "../components/mentor/MentorProfilePanel";
import MentorProfile from "./mentor-profile";

type MentorSection =
  | "overview"
  | "response"
  | "schedule"
  | "mycourses"
  | "mentees"
  | "messages"
  | "reviews"
  | "earnings"
  | "profile";

const money = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value || 0);

const MentorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>({});
  const [bookings, setBookings] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [mentees, setMentees] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>({ items: [], summary: {} });
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState<MentorSection>(() => {
    const saved = localStorage.getItem("mentorProfileTab") as MentorSection | null;
    return saved && saved !== "overview" ? saved : "overview";
  });

  useEffect(() => {
    const load = async () => {
      try {
        const profileResponse = await profileApi.getProfile();
        const mentorId = profileResponse?.data?.user?._id;
        const [bookingResult, courseResult, menteeResult, earningResult] =
          await Promise.all([
            bookingApi.getMentorBookings({ limit: 100 }),
            mentorId ? courseApi.getCoursesByMentor(mentorId) : [],
            purchasedCourseApi.getMenteesOfMentor(undefined),
            earningsApi.mine(),
          ]);
        setProfile(profileResponse?.data || {});
        setBookings(
          Array.isArray(bookingResult?.response?.data)
            ? bookingResult.response.data
            : [],
        );
        setCourses(Array.isArray(courseResult) ? courseResult : []);
        setMentees(menteeResult?.response?.data?.mentees || []);
        setEarnings(earningResult?.data?.data || { items: [], summary: {} });
      } catch {
        setError("We could not load your mentor workspace. Refresh the page to try again.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const upcoming = useMemo(
    () =>
      bookings
        .filter((booking) =>
          ["pending", "active"].includes(booking.status),
        )
        .sort(
          (left, right) =>
            new Date(left.date).getTime() - new Date(right.date).getTime(),
        )
        .slice(0, 4),
    [bookings],
  );

  const openSection = (tab: MentorSection) => {
    localStorage.setItem("mentorProfileTab", tab);
    setActiveSection(tab);
  };

  const navigation = [
    ["Bookings", "response"],
    ["Schedule", "schedule"],
    ["Courses", "mycourses"],
    ["Mentees", "mentees"],
    ["Messages", "messages"],
    ["Reviews", "reviews"],
    ["Earnings", "earnings"],
    ["Settings", "profile"],
  ] as const;

  const paid = Number(earnings.summary?.paid || 0);
  const available = Number(earnings.summary?.eligible || 0);
  const pendingBookings = bookings.filter(
    ({ status }) => status === "pending",
  ).length;
  const metricSpans = [
    "xl:col-span-5",
    "xl:col-span-3",
    "xl:col-span-2",
    "xl:col-span-2",
  ];

  return (
    <main className="min-h-[100dvh] bg-[var(--ui-page)] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto grid max-w-[1500px] gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="ui-card h-fit overflow-hidden p-3 lg:sticky lg:top-24">
          <div className="mb-2 h-2 rounded-full bg-[var(--ui-highlight)]" />
          <div className="flex items-center gap-3 px-3 pb-4 pt-3">
            {profile?.user?.avatarUrl ? (
              <img
                src={profile.user.avatarUrl}
                alt={`${profile.user.firstName || ""} ${profile.user.lastName || ""}`.trim() || "Mentor"}
                className="h-12 w-12 shrink-0 rounded-xl border-2 border-[var(--ui-border)] object-cover"
              />
            ) : (
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--ui-accent-soft)] font-black text-[var(--ui-accent)]">
                {(profile?.user?.firstName?.[0] || "M").toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-bold text-[var(--ui-text)]">
                {profile?.user?.firstName} {profile?.user?.lastName}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-[var(--ui-accent)]">Mentor</p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.setItem("mentorProfileTab", "overview");
              setActiveSection("overview");
            }}
            className={`w-full rounded-xl px-3 py-3 text-left font-bold transition ${
              activeSection === "overview"
                ? "border-2 border-[var(--ui-highlight)] bg-[var(--ui-highlight-soft)] text-[var(--ui-warning)] shadow-[3px_3px_0_var(--ui-accent-soft)]"
                : "text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-muted)]"
            }`}
          >
            Overview
          </button>
          <div className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-1">
            {navigation.map(([label, tab]) => (
              <button
                key={tab}
                onClick={() => openSection(tab)}
                className={`rounded-xl px-3 py-2.5 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)] ${
                  tab === "profile" && activeSection === "profile"
                    ? "bg-[var(--ui-accent-soft)] font-bold text-[var(--ui-accent)]"
                    : "text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-muted)] hover:text-[var(--ui-text)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </aside>

        <section className="min-w-0 space-y-6">
          {activeSection === "profile" ? (
            <MentorProfilePanel profile={profile} onUpdated={setProfile} />
          ) : activeSection !== "overview" ? (
            <MentorProfile
              embedded
              selectedTab={activeSection}
              onTabChange={(tab) => setActiveSection(tab as MentorSection)}
            />
          ) : (
            <>
          <header className="ui-brand-hero overflow-hidden rounded-[28px] border-2 border-blue-300/30 px-6 py-7 text-white shadow-[var(--ui-shadow-lg)] sm:px-8 sm:py-9">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-semibold text-yellow-300">Your mentoring pulse</p>
                <h1 className="mt-2 max-w-2xl text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                  Keep every learner moving.
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100">
                  Review requests, protect your calendar and track earnings from one focused workspace.
                </p>
              </div>
              <button
                onClick={() => openSection("schedule")}
                className="ui-button-highlight inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-bold transition-all"
              >
                Publish availability
              </button>
            </div>
          </header>

          {error && (
            <div role="alert" className="ui-sketch-note p-4 text-sm font-semibold text-[var(--ui-text)]">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-12">
            {[
              ["Requests to review", pendingBookings, "Needs your response"],
              ["Active mentees", mentees.length, "Courses and consultations"],
              ["Published courses", courses.length, "Available to learners"],
              ["Available payout", money(available), `${money(paid)} paid`],
            ].map(([label, value, note], index) => (
              <article
                key={String(label)}
                className={`ui-card ${metricSpans[index]} ${index === 0 ? "ui-card-blue" : index === 3 ? "ui-card-yellow" : ""} p-5 sm:p-6`}
              >
                <p className="text-sm font-medium text-[var(--ui-text-muted)]">{label}</p>
                {loading ? (
                  <div className="mt-4 h-9 w-24 animate-pulse rounded-lg bg-[var(--ui-surface-muted)]" />
                ) : (
                  <p className="mt-4 text-3xl font-black tabular-nums tracking-[-0.04em] text-[var(--ui-text)]">{value}</p>
                )}
                <p className="mt-2 text-xs text-[var(--ui-text-muted)]">{note}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
            <article className="ui-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ui-accent)]">Session pulse</p>
                  <h2 className="mt-1 text-xl font-bold text-[var(--ui-text)]">Upcoming work</h2>
                </div>
                <button onClick={() => openSection("response")} className="text-sm font-semibold text-[var(--ui-accent)]">View all</button>
              </div>
              <div className="mt-5 space-y-3">
                {!loading && upcoming.length === 0 && (
                  <div className="rounded-2xl bg-[var(--ui-surface-muted)] px-5 py-8 text-center text-sm text-[var(--ui-text-muted)]">
                    No sessions waiting. Publish availability to invite new bookings.
                  </div>
                )}
                {upcoming.map((booking) => (
                  <button
                    key={booking._id}
                    onClick={() => openSection("response")}
                    className="group flex w-full items-center gap-4 rounded-2xl border-2 border-[var(--ui-border)] p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--ui-accent)] hover:bg-[var(--ui-accent-soft)]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[var(--ui-text)]">
                        {booking.mentee?.firstName} {booking.mentee?.lastName}
                      </p>
                      <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
                        {new Date(booking.date).toLocaleDateString("vi-VN")}, {booking.start}-{booking.end}
                      </p>
                    </div>
                    <span className="rounded-full bg-[var(--ui-surface-muted)] px-3 py-1 text-xs font-bold uppercase text-[var(--ui-text-muted)]">
                      {booking.status}
                    </span>
                  </button>
                ))}
              </div>
            </article>

            <article className="ui-card p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ui-accent)]">Earnings</p>
              <h2 className="mt-1 text-xl font-bold text-[var(--ui-text)]">Clear money trail</h2>
              <div className="ui-sketch-note mt-6 p-5">
                <p className="text-sm text-[var(--ui-text-muted)]">Pending completion</p>
                <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-[var(--ui-text)]">
                  {money(Number(earnings.summary?.pending || 0))}
                </p>
                <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[var(--ui-border)] pt-4 text-sm">
                  <div>
                    <p className="text-[var(--ui-text-muted)]">Available</p>
                    <p className="mt-1 font-bold tabular-nums text-[var(--ui-text)]">{money(available)}</p>
                  </div>
                  <div>
                    <p className="text-[var(--ui-text-muted)]">Paid</p>
                    <p className="mt-1 font-bold tabular-nums text-[var(--ui-text)]">{money(paid)}</p>
                  </div>
                </div>
              </div>
              <button onClick={() => openSection("earnings")} className="mt-4 w-full rounded-xl px-2 py-3 text-left text-sm font-semibold text-[var(--ui-text)]">
                Open earnings ledger
              </button>
            </article>
          </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default MentorDashboard;
