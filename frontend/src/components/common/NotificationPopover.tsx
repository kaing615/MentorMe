import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
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
import notificationApi from "../../api/modules/notifications.api";
import type { AppNotification } from "../../utils/engagement-response";
import { getNotificationTarget } from "../../utils/notification-navigation";

const NotificationIcon = ({ type }: { type: string }) => {
  if (type.startsWith("booking_")) return <IconCalendarEvent size={19} />;
  if (type.startsWith("payment_")) return <IconCreditCard size={19} />;
  if (type === "message_received") return <IconMessageCircle size={19} />;
  if (type === "review_received") return <IconStar size={19} />;
  if (type === "course_completed") return <IconBook2 size={19} />;
  return <IconBell size={19} />;
};

const NotificationPopover = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notifications = useQuery({
    queryKey: ["notifications", "popover"],
    queryFn: () => notificationApi.list({ limit: 5 }),
    refetchInterval: 30_000,
  });
  const markRead = useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markAll = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const items = notifications.data?.items ?? [];
  const unreadCount = notifications.data?.unreadCount ?? 0;

  const openNotification = async (notification: AppNotification) => {
    if (!notification.readAt) await markRead.mutateAsync(notification._id);
    const target = getNotificationTarget(
      notification.type,
      localStorage.getItem("mentorMode") === "true",
      notification.link,
      notification.metadata,
    );
    if (target.storageKey && target.tab) {
      localStorage.setItem(target.storageKey, target.tab);
    }
    setOpen(false);
    navigate(target.path);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
          title="Notifications"
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-surface-muted)] hover:text-[var(--ui-accent)]"
        >
          <IconBell aria-hidden="true" size={21} stroke={1.8} />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-[var(--ui-danger)] px-1 text-[10px] font-extrabold leading-none text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={10}
          collisionPadding={8}
          className="z-[70] w-[min(25rem,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-raised)] shadow-[var(--ui-shadow-lg)]"
        >
          <div className="flex items-center justify-between border-b border-[var(--ui-border)] px-5 py-4">
            <div>
              <h2 className="text-base font-extrabold text-[var(--ui-text)]">
                Notifications
              </h2>
              <p className="mt-0.5 text-xs font-semibold text-[var(--ui-text-muted)]">
                {unreadCount ? `${unreadCount} unread` : "You're all caught up"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                disabled={markAll.isPending}
                onClick={() => markAll.mutate()}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-[var(--ui-accent)] transition-colors hover:bg-[var(--ui-accent-soft)] disabled:opacity-50"
              >
                <IconChecks size={17} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[25rem] overflow-y-auto p-2">
            {notifications.isLoading &&
              [0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="m-2 h-16 animate-pulse rounded-xl bg-[var(--ui-surface-muted)]"
                />
              ))}
            {notifications.isError && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-semibold text-[var(--ui-text-muted)]">
                  Couldn't load notifications.
                </p>
                <button
                  type="button"
                  onClick={() => notifications.refetch()}
                  className="mt-3 min-h-10 rounded-full bg-[var(--ui-accent-fill)] px-4 text-xs font-bold text-white"
                >
                  Try again
                </button>
              </div>
            )}
            {!notifications.isLoading &&
              !notifications.isError &&
              items.length === 0 && (
                <div className="px-5 py-10 text-center">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--ui-accent-soft)] text-[var(--ui-accent)]">
                    <IconBell size={22} />
                  </span>
                  <p className="mt-3 text-sm font-bold text-[var(--ui-text)]">
                    No notifications yet
                  </p>
                  <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
                    New activity will appear here.
                  </p>
                </div>
              )}
            {items.map((notification) => {
              const unread = !notification.readAt;
              return (
                <button
                  key={notification._id}
                  type="button"
                  onClick={() => void openNotification(notification)}
                  className={`flex min-h-20 w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-[var(--ui-surface-muted)] ${
                    unread ? "bg-[color-mix(in_srgb,var(--ui-accent-soft)_55%,transparent)]" : ""
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--ui-accent-soft)] text-[var(--ui-accent)]"
                  >
                    <NotificationIcon type={notification.type} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span className="line-clamp-1 text-sm font-extrabold text-[var(--ui-text)]">
                        {notification.title}
                      </span>
                      {unread ? (
                        <span
                          className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--ui-secondary-accent)]"
                          aria-label="Unread"
                        />
                      ) : (
                        <IconCheck
                          className="shrink-0 text-[var(--ui-text-muted)]"
                          size={15}
                          aria-label="Read"
                        />
                      )}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-[var(--ui-text-muted)]">
                      {notification.body}
                    </span>
                    <span className="mt-1 block text-[11px] font-semibold text-[var(--ui-text-muted)]">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-[var(--ui-border)] p-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/notifications");
              }}
              className="min-h-11 w-full rounded-xl text-sm font-extrabold text-[var(--ui-accent)] transition-colors hover:bg-[var(--ui-accent-soft)]"
            >
              See all notifications
            </button>
          </div>
          <Popover.Arrow className="fill-[var(--ui-surface-raised)]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default NotificationPopover;
