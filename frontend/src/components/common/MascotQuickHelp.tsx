import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import {
  IconArrowUpRight,
  IconBook2,
  IconCalendarEvent,
  IconLogin,
  IconMessageCircle,
  IconSchool,
  IconUser,
  IconUserPlus,
  IconX,
} from "@tabler/icons-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import mimoMascot from "../../assets/mimo-mascot.png";
import {
  getMascotActions,
  type MascotAction,
} from "../../utils/mascot-actions";

const ActionIcon = ({ action }: { action: MascotAction["key"] }) => {
  if (action === "mentor") return <IconSchool size={20} />;
  if (action === "courses") return <IconBook2 size={20} />;
  if (action === "bookings") return <IconCalendarEvent size={20} />;
  if (action === "messages") return <IconMessageCircle size={20} />;
  if (action === "signin") return <IconLogin size={20} />;
  if (action === "signup") return <IconUserPlus size={20} />;
  return <IconUser size={20} />;
};

const MascotQuickHelp = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const reduxUser = useSelector(
    (state: any) => state.auth?.user || state.user,
  );
  let user = reduxUser;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null") || reduxUser;
  } catch {
    user = reduxUser;
  }
  const mentorMode = localStorage.getItem("mentorMode") === "true";
  const actions = getMascotActions(user, mentorMode);
  const isMentorWorkspace = actions[0]?.key === "bookings";
  const workspace = user
    ? isMentorWorkspace
      ? "Mentor workspace"
      : "Mentee workspace"
    : "Welcome to MentorMe";

  const runAction = (action: MascotAction) => {
    if (action.storageKey && action.tab) {
      localStorage.setItem(action.storageKey, action.tab);
    }
    setOpen(false);
    navigate(action.path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-3 z-[55] sm:bottom-5 sm:right-5">
        <Popover.Trigger asChild>
          <button
            type="button"
            aria-label="Open Mimo quick help"
            aria-expanded={open}
            className="group relative grid h-24 w-24 place-items-end rounded-[2rem] transition-transform duration-200 hover:-translate-y-1 sm:h-32 sm:w-32"
          >
            <span className="pointer-events-none absolute bottom-4 right-[88%] whitespace-nowrap rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-raised)] px-3 py-1.5 text-xs font-extrabold text-[var(--ui-accent)] opacity-0 shadow-[var(--ui-shadow-sm)] transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              Quick help
            </span>
            <img
              src={mimoMascot}
              alt=""
              width={512}
              height={512}
              className="mimo-float h-full w-full object-contain object-bottom drop-shadow-[0_14px_18px_rgb(8_47_57_/_0.22)]"
            />
          </button>
        </Popover.Trigger>
      </div>

      <Popover.Portal>
        <Popover.Content
          align="end"
          side="top"
          sideOffset={-2}
          collisionPadding={12}
          className="z-[80] w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface-raised)] shadow-[var(--ui-shadow-lg)]"
        >
          <div className="relative overflow-hidden border-b border-[var(--ui-border)] bg-[var(--ui-accent-soft)] px-5 py-5">
            <div className="absolute -right-8 -top-12 h-32 w-32 rounded-full border border-[color-mix(in_srgb,var(--ui-accent)_18%,transparent)]" />
            <div className="relative flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[var(--ui-surface-raised)]">
                <img
                  src={mimoMascot}
                  alt=""
                  width={64}
                  height={64}
                  className="h-14 w-14 object-contain object-bottom"
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--ui-accent)]">
                  {workspace}
                </p>
                <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[var(--ui-text)]">
                  Hi, I'm Mimo.
                </h2>
                <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
                  Where would you like to go?
                </p>
              </div>
              <Popover.Close asChild>
                <button
                  type="button"
                  aria-label="Close quick help"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-surface)] hover:text-[var(--ui-text)]"
                >
                  <IconX size={19} />
                </button>
              </Popover.Close>
            </div>
          </div>

          <div className="space-y-1 p-2">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => runAction(action)}
                className="group flex min-h-[4.25rem] w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--ui-surface-muted)]"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--ui-accent-soft)] text-[var(--ui-accent)] transition-colors group-hover:bg-[var(--ui-accent-fill)] group-hover:text-white">
                  <ActionIcon action={action.key} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-extrabold text-[var(--ui-text)]">
                    {action.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-[var(--ui-text-muted)]">
                    {action.description}
                  </span>
                </span>
                <IconArrowUpRight
                  aria-hidden="true"
                  className="shrink-0 text-[var(--ui-text-muted)] transition-colors group-hover:text-[var(--ui-accent)]"
                  size={18}
                />
              </button>
            ))}
          </div>
          <Popover.Arrow className="fill-[var(--ui-surface-raised)]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default MascotQuickHelp;
