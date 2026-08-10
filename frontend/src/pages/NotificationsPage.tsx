import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconBell,
  IconBook2,
  IconCalendarEvent,
  IconCheck,
  IconChecks,
  IconCreditCard,
  IconMessageCircle,
  IconStar,
} from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import notificationApi from "../api/modules/notifications.api";
import type { AppNotification } from "../utils/engagement-response";
import { getNotificationTarget } from "../utils/notification-navigation";

const NotificationIcon = ({ type }: { type: string }) => {
  const className = "text-[var(--ui-accent)]";
  if (type.startsWith("booking_")) return <IconCalendarEvent className={className} size={22} />;
  if (type.startsWith("payment_")) return <IconCreditCard className={className} size={22} />;
  if (type === "message_received") return <IconMessageCircle className={className} size={22} />;
  if (type === "review_received") return <IconStar className={className} size={22} />;
  if (type === "course_completed") return <IconBook2 className={className} size={22} />;
  return <IconBell className={className} size={22} />;
};

const NotificationsPage = () => {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notifications = useQuery({
    queryKey: ["notifications", "page", page],
    queryFn: () => notificationApi.list({ page, limit: 20 }),
    placeholderData: (previous) => previous,
  });
  const markRead = useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markAll = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const openNotification = async (notification: AppNotification) => {
    if (!notification.readAt) await markRead.mutateAsync(notification._id);
    const mentorMode = localStorage.getItem("mentorMode") === "true";
    const target = getNotificationTarget(
      notification.type,
      mentorMode,
      notification.link,
      notification.metadata,
    );
    if (target.storageKey && target.tab) {
      localStorage.setItem(target.storageKey, target.tab);
    }
    navigate(target.path);
  };

  const items = notifications.data?.items ?? [];
  const unreadCount = notifications.data?.unreadCount ?? 0;
  const hasMore = notifications.data?.hasMore ?? false;

  return (
    <main className="min-h-[calc(100dvh-4.5rem)] bg-[var(--ui-page)]">
      <section className="border-b border-[var(--ui-border)] bg-[var(--ui-surface)]">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
          <div>
            <span className="ui-eyebrow ui-eyebrow-plain">Activity center</span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.045em] text-[var(--ui-text)] sm:text-5xl">
              Notifications
            </h1>
            <p className="mt-3 text-[var(--ui-text-muted)]">
              Bookings, payments, messages, reviews and learning milestones in one place.
            </p>
          </div>
          <button
            type="button"
            disabled={unreadCount === 0 || markAll.isPending}
            onClick={() => markAll.mutate()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--ui-surface-muted)] px-5 text-sm font-bold text-[var(--ui-text)] transition-colors hover:bg-[var(--ui-accent-soft)] hover:text-[var(--ui-accent)] disabled:opacity-50"
          >
            <IconChecks size={19} /> Mark all as read
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">
            Recent activity
          </h2>
          <span className="rounded-full bg-[var(--ui-accent-soft)] px-3 py-1 text-xs font-extrabold text-[var(--ui-accent)]">
            {unreadCount} unread
          </span>
        </div>

        {notifications.isLoading && (
          <div className="space-y-3" aria-label="Loading notifications">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-[var(--ui-radius-md)] bg-[var(--ui-surface-muted)]" />
            ))}
          </div>
        )}
        {notifications.isError && (
          <div className="ui-card px-6 py-12 text-center">
            <h2 className="text-xl font-bold text-[var(--ui-text)]">We couldn't load your notifications.</h2>
            <button
              type="button"
              onClick={() => notifications.refetch()}
              className="mt-5 min-h-11 rounded-full bg-[var(--ui-accent-fill)] px-5 font-bold text-white hover:bg-[var(--ui-accent-fill-hover)]"
            >
              Try again
            </button>
          </div>
        )}
        {!notifications.isLoading && !notifications.isError && items.length === 0 && (
          <div className="ui-card px-6 py-16 text-center">
            <IconBell className="mx-auto text-[var(--ui-accent)]" size={40} stroke={1.5} />
            <h2 className="mt-5 text-2xl font-extrabold text-[var(--ui-text)]">You're all caught up</h2>
            <p className="mt-3 text-[var(--ui-text-muted)]">New activity will appear here as it happens.</p>
          </div>
        )}

        <div className="space-y-3">
          {items.map((notification) => {
            const unread = !notification.readAt;
            const actorName = [notification.actor?.firstName, notification.actor?.lastName]
              .filter(Boolean)
              .join(" ");
            return (
              <button
                key={notification._id}
                type="button"
                onClick={() => void openNotification(notification)}
                className={`ui-card ui-card-interactive relative flex w-full items-start gap-4 p-4 text-left sm:p-5 ${
                  unread ? "border-[color-mix(in_srgb,var(--ui-accent)_38%,var(--ui-border))]" : ""
                }`}
              >
                <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--ui-accent-soft)]">
                  <NotificationIcon type={notification.type} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                    <span className="font-extrabold text-[var(--ui-text)]">{notification.title}</span>
                    <span className="text-xs font-semibold text-[var(--ui-text-muted)]">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-[var(--ui-text-muted)]">{notification.body}</span>
                  {actorName && <span className="mt-1 block text-xs font-bold text-[var(--ui-accent)]">{actorName}</span>}
                </span>
                {unread ? (
                  <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--ui-secondary-accent)]" aria-label="Unread" />
                ) : (
                  <IconCheck className="mt-1 shrink-0 text-[var(--ui-text-muted)]" size={17} aria-label="Read" />
                )}
              </button>
            );
          })}
        </div>

        {(page > 1 || hasMore) && (
          <nav
            className="mt-8 flex items-center justify-center gap-3"
            aria-label="Notification pages"
          >
            <button
              type="button"
              disabled={page === 1 || notifications.isFetching}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="min-h-11 rounded-full border border-[var(--ui-border)] px-5 text-sm font-bold text-[var(--ui-text)] transition-colors hover:bg-[var(--ui-surface-muted)] disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm font-bold text-[var(--ui-text-muted)]">
              Page {page}
            </span>
            <button
              type="button"
              disabled={!hasMore || notifications.isFetching}
              onClick={() => setPage((value) => value + 1)}
              className="min-h-11 rounded-full bg-[var(--ui-accent-fill)] px-5 text-sm font-bold text-white transition-colors hover:bg-[var(--ui-accent-fill-hover)] disabled:opacity-40"
            >
              Next
            </button>
          </nav>
        )}
      </section>
    </main>
  );
};

export default NotificationsPage;
