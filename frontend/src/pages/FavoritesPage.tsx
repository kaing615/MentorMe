import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconArrowUpRight,
  IconBook2,
  IconHeartOff,
  IconStarFilled,
  IconUsers,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import favoriteApi, { type FavoriteType } from "../api/modules/favorite.api";
import { formatVnd } from "../utils/currency";

type Filter = "all" | "mentor" | "course";

const FavoritesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const favorites = useQuery({
    queryKey: ["favorites"],
    queryFn: favoriteApi.list,
  });
  const remove = useMutation({
    mutationFn: ({ type, id }: { type: FavoriteType; id: string }) =>
      favoriteApi.remove(type, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favorites"] }),
  });
  const courses = favorites.data?.courses ?? [];
  const mentors = favorites.data?.mentors ?? [];
  const total = courses.length + mentors.length;

  return (
    <main className="min-h-[calc(100dvh-4.5rem)] bg-[var(--ui-page)]">
      <section className="ui-hero-surface border-b border-[var(--ui-border)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <span className="ui-eyebrow ui-eyebrow-plain">Your learning shortlist</span>
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="max-w-3xl text-4xl font-extrabold tracking-[-0.045em] text-[var(--ui-text)] sm:text-5xl">
                Favorites worth coming back to.
              </h1>
              <p className="mt-4 max-w-2xl text-base text-[var(--ui-text-muted)] sm:text-lg">
                Keep your strongest mentor matches and courses together while you decide what comes next.
              </p>
            </div>
            <div className="text-sm font-semibold text-[var(--ui-text-muted)]">
              <span className="text-2xl font-extrabold text-[var(--ui-text)]">{total}</span>{" "}
              saved
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-2" aria-label="Filter favorites">
            {([
              ["all", "All"],
              ["mentor", "Mentors"],
              ["course", "Courses"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={`min-h-11 rounded-full px-5 text-sm font-bold transition-colors ${
                  filter === value
                    ? "bg-[var(--ui-accent-fill)] text-white"
                    : "bg-[var(--ui-surface)] text-[var(--ui-text-muted)] hover:bg-[var(--ui-accent-soft)] hover:text-[var(--ui-accent)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {favorites.isLoading && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-label="Loading favorites">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-72 animate-pulse rounded-[var(--ui-radius-md)] bg-[var(--ui-surface-muted)]" />
            ))}
          </div>
        )}
        {favorites.isError && (
          <div className="ui-card px-6 py-12 text-center">
            <h2 className="text-xl font-bold text-[var(--ui-text)]">We couldn't load your favorites.</h2>
            <button
              type="button"
              onClick={() => favorites.refetch()}
              className="mt-5 min-h-11 rounded-full bg-[var(--ui-accent-fill)] px-5 font-bold text-white hover:bg-[var(--ui-accent-fill-hover)]"
            >
              Try again
            </button>
          </div>
        )}
        {!favorites.isLoading && !favorites.isError && total === 0 && (
          <div className="ui-card mx-auto max-w-2xl px-6 py-16 text-center">
            <IconHeartOff className="mx-auto text-[var(--ui-accent)]" size={40} stroke={1.5} />
            <h2 className="mt-5 text-2xl font-extrabold text-[var(--ui-text)]">Nothing saved yet</h2>
            <p className="mx-auto mt-3 max-w-md text-[var(--ui-text-muted)]">
              Explore real mentors and courses, then use the heart to keep the right options close.
            </p>
            <button
              type="button"
              onClick={() => navigate("/all-mentors")}
              className="mt-6 min-h-11 rounded-full bg-[var(--ui-accent-fill)] px-6 font-bold text-white hover:bg-[var(--ui-accent-fill-hover)]"
            >
              Explore mentors
            </button>
          </div>
        )}

        {(filter === "all" || filter === "mentor") && mentors.length > 0 && (
          <section className="mb-12">
            <div className="mb-5 flex items-center gap-3">
              <IconUsers className="text-[var(--ui-accent)]" size={24} />
              <h2 className="text-2xl font-extrabold tracking-tight text-[var(--ui-text)]">Saved mentors</h2>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {mentors.map((mentor) => {
                const name = [mentor.firstName, mentor.lastName].filter(Boolean).join(" ") || mentor.userName || "Mentor";
                return (
                  <article key={mentor._id} className="ui-card ui-card-interactive flex min-h-64 flex-col p-6">
                    <div className="flex items-start gap-4">
                      <div className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[var(--ui-accent-soft)] text-xl font-extrabold text-[var(--ui-accent)]">
                        <span>{name.charAt(0).toUpperCase()}</span>
                        {mentor.avatarUrl && <img src={mentor.avatarUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-xl font-extrabold text-[var(--ui-text)]">{name}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-[var(--ui-text-muted)]">{mentor.jobTitle || mentor.category || "Mentor"}</p>
                      </div>
                    </div>
                    {mentor.skills?.length ? (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {mentor.skills.slice(0, 3).map((skill) => (
                          <span key={skill} className="rounded-full bg-[var(--ui-accent-soft)] px-3 py-1 text-xs font-bold text-[var(--ui-accent)]">{skill}</span>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-auto flex gap-2 pt-6">
                      <button
                        type="button"
                        onClick={() => navigate(`/mentor/${mentor._id}`)}
                        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--ui-accent-fill)] px-4 text-sm font-bold text-white hover:bg-[var(--ui-accent-fill-hover)]"
                      >
                        View mentor <IconArrowUpRight size={18} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${name} from favorites`}
                        disabled={remove.isPending}
                        onClick={() => remove.mutate({ type: "mentor", id: mentor._id })}
                        className="grid min-h-11 min-w-11 place-items-center rounded-full bg-[var(--ui-surface-muted)] text-[var(--ui-text-muted)] hover:bg-[var(--ui-danger-soft)] hover:text-[var(--ui-danger)] disabled:opacity-50"
                      >
                        <IconHeartOff size={19} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {(filter === "all" || filter === "course") && courses.length > 0 && (
          <section>
            <div className="mb-5 flex items-center gap-3">
              <IconBook2 className="text-[var(--ui-accent)]" size={24} />
              <h2 className="text-2xl font-extrabold tracking-tight text-[var(--ui-text)]">Saved courses</h2>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <article key={course._id} className="ui-card ui-card-interactive overflow-hidden">
                  <button
                    type="button"
                    aria-label={`View ${course.title}`}
                    onClick={() => navigate(`/course-detail/${course._id}`)}
                    className="relative block h-40 w-full overflow-hidden bg-[var(--ui-accent-soft)] text-left"
                  >
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]" />
                    ) : (
                      <IconBook2 className="absolute bottom-5 right-5 text-[var(--ui-accent)]" size={48} stroke={1.2} />
                    )}
                  </button>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="line-clamp-2 text-lg font-extrabold text-[var(--ui-text)]">{course.title}</h3>
                        <p className="mt-2 text-sm text-[var(--ui-text-muted)]">
                          {[course.mentor?.firstName, course.mentor?.lastName].filter(Boolean).join(" ") || course.mentor?.userName || "Mentor"}
                        </p>
                      </div>
                      {typeof course.rate === "number" && (
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-[var(--ui-text)]">
                          <IconStarFilled size={15} className="text-[var(--ui-warning)]" /> {course.rate.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="font-extrabold text-[var(--ui-text)]">
                        {typeof course.price === "number" ? formatVnd(course.price) : ""}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${course.title} from favorites`}
                        disabled={remove.isPending}
                        onClick={() => remove.mutate({ type: "course", id: course._id })}
                        className="grid min-h-11 min-w-11 place-items-center rounded-full bg-[var(--ui-surface-muted)] text-[var(--ui-text-muted)] hover:bg-[var(--ui-danger-soft)] hover:text-[var(--ui-danger)] disabled:opacity-50"
                      >
                        <IconHeartOff size={19} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
};

export default FavoritesPage;
