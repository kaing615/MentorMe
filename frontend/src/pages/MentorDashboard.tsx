import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconArrowUpRight,
  IconBook2,
  IconCalendarEvent,
  IconCash,
  IconChartDots3,
  IconChevronRight,
  IconClock,
  IconMessageCircle,
  IconSettings,
  IconStar,
  IconUsers,
} from "@tabler/icons-react";
import bookingApi from "../api/modules/booking.api";
import courseApi from "../api/modules/course.api";
import earningsApi from "../api/modules/earnings.api";
import profileApi from "../api/modules/profile.api";
import purchasedCourseApi from "../api/modules/purchasedCourse.api";

const money = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value || 0);

const MentorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>({});
  const [bookings, setBookings] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [mentees, setMentees] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>({ items: [], summary: {} });

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

  const openSection = (tab: string) => {
    localStorage.setItem("mentorProfileTab", tab);
    navigate("/mentor/profile");
  };

  const navigation = [
    ["Bookings", "response", IconCalendarEvent],
    ["Schedule", "schedule", IconClock],
    ["Courses", "mycourses", IconBook2],
    ["Mentees", "mentees", IconUsers],
    ["Messages", "messages", IconMessageCircle],
    ["Reviews", "reviews", IconStar],
    ["Earnings", "earnings", IconCash],
    ["Settings", "profile", IconSettings],
  ] as const;

  const paid = Number(earnings.summary?.paid || 0);
  const available = Number(earnings.summary?.eligible || 0);
  const pendingBookings = bookings.filter(
    ({ status }) => status === "pending",
  ).length;

  return (
    <main className="min-h-[100dvh] bg-[var(--ui-page)] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto grid max-w-[1500px] gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="ui-card h-fit p-3 lg:sticky lg:top-24">
          <div className="px-3 pb-4 pt-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ui-accent)]">
              Mentor workspace
            </p>
            <p className="mt-2 truncate text-lg font-bold text-[var(--ui-text)]">
              {profile?.user?.firstName} {profile?.user?.lastName}
            </p>
          </div>
          <button className="flex w-full items-center gap-3 rounded-xl bg-[var(--ui-accent-soft)] px-3 py-3 text-left font-semibold text-[var(--ui-accent)]">
            <IconChartDots3 size={19} /> Overview
          </button>
          <div className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-1">
            {navigation.map(([label, tab, Icon]) => (
              <button
                key={tab}
                onClick={() => openSection(tab)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[var(--ui-text-muted)] transition hover:bg-[var(--ui-surface-muted)] hover:text-[var(--ui-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)]"
              >
                <Icon size={18} /> {label}
              </button>
            ))}
          </div>
        </aside>

        <section className="min-w-0 space-y-6">
          <header className="overflow-hidden rounded-[28px] bg-[#083344] px-6 py-7 text-white shadow-[0_24px_70px_rgba(8,51,68,.18)] sm:px-8 sm:py-9">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-semibold text-cyan-200">Your mentoring pulse</p>
                <h1 className="mt-2 max-w-2xl text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                  Keep every learner moving.
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-cyan-50/75">
                  Review requests, protect your calendar and track earnings from one focused workspace.
                </p>
              </div>
              <button
                onClick={() => openSection("schedule")}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-200 px-5 py-3 text-sm font-bold text-cyan-950 transition hover:bg-white"
              >
                Publish availability <IconArrowUpRight size={18} />
              </button>
            </div>
          </header>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Requests to review", pendingBookings, "Needs your response"],
              ["Active mentees", mentees.length, "Courses and consultations"],
              ["Published courses", courses.length, "Available to learners"],
              ["Available payout", money(available), `${money(paid)} paid`],
            ].map(([label, value, note]) => (
              <article key={String(label)} className="ui-card p-5">
                <p className="text-sm font-medium text-[var(--ui-text-muted)]">{label}</p>
                <p className="mt-4 text-3xl font-black tracking-[-0.04em] text-[var(--ui-text)]">
                  {loading ? "—" : value}
                </p>
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
                    className="group flex w-full items-center gap-4 rounded-2xl border border-[var(--ui-border)] p-4 text-left transition hover:border-cyan-300 hover:bg-[var(--ui-accent-soft)]"
                  >
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-100 text-cyan-900">
                      <IconCalendarEvent size={21} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[var(--ui-text)]">
                        {booking.mentee?.firstName} {booking.mentee?.lastName}
                      </p>
                      <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
                        {new Date(booking.date).toLocaleDateString("vi-VN")} · {booking.start}–{booking.end}
                      </p>
                    </div>
                    <span className="rounded-full bg-[var(--ui-surface-muted)] px-3 py-1 text-xs font-bold uppercase text-[var(--ui-text-muted)]">
                      {booking.status}
                    </span>
                    <IconChevronRight className="text-[var(--ui-text-muted)] transition group-hover:translate-x-0.5" size={18} />
                  </button>
                ))}
              </div>
            </article>

            <article className="ui-card p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ui-accent)]">Earnings</p>
              <h2 className="mt-1 text-xl font-bold text-[var(--ui-text)]">Clear money trail</h2>
              <div className="mt-6 rounded-3xl bg-[var(--ui-surface-muted)] p-5">
                <p className="text-sm text-[var(--ui-text-muted)]">Pending completion</p>
                <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-[var(--ui-text)]">
                  {money(Number(earnings.summary?.pending || 0))}
                </p>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--ui-border)]">
                  <div className="h-full w-2/3 rounded-full bg-cyan-400" />
                </div>
              </div>
              <button onClick={() => openSection("earnings")} className="mt-4 flex w-full items-center justify-between rounded-xl px-2 py-3 text-sm font-semibold text-[var(--ui-text)]">
                Open earnings ledger <IconChevronRight size={18} />
              </button>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
};

export default MentorDashboard;
