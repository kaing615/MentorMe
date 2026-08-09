import { IconArrowRight } from "@tabler/icons-react";
import MentoringHero from "../assets/mentoring-hero.jpg";
import { useNavigate } from "react-router-dom";

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <main className="app-shell min-h-[100dvh] bg-[var(--ui-page)]">
      <header className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-xl font-extrabold tracking-[-0.03em] text-[var(--ui-text)]"
        >
          MentorMe
        </button>
        <button
          type="button"
          onClick={() => navigate("/auth/signin")}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-surface-muted)] hover:text-[var(--ui-text)]"
        >
          Log in
        </button>
      </header>

      <section className="mx-auto grid min-h-[calc(100dvh-4.5rem)] max-w-7xl grid-cols-1 items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:px-8 lg:py-14">
        <div className="max-w-xl">
          <h1 className="max-w-[12ch] text-4xl font-extrabold leading-[1.04] tracking-[-0.045em] text-[var(--ui-text)] sm:text-5xl lg:text-6xl">
            Learn faster with the right mentor.
          </h1>
          <p className="mt-6 max-w-[48ch] text-base leading-7 text-[var(--ui-text-muted)] sm:text-lg">
            Find experienced mentors, book focused sessions, and turn practical advice into measurable progress.
          </p>
          <button
            type="button"
            onClick={() => navigate("/auth/signup")}
            className="mt-8 inline-flex min-h-12 items-center gap-2 whitespace-nowrap rounded-xl bg-[var(--ui-accent)] px-6 py-3 font-bold text-white shadow-[var(--ui-shadow)] transition hover:bg-[var(--ui-accent-strong)] active:translate-y-px"
          >
            Create account
            <IconArrowRight aria-hidden="true" size={19} stroke={2} />
          </button>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[var(--ui-shadow)]">
          <img
            src={MentoringHero}
            alt="A learner working through a goal with an experienced mentor"
            className="aspect-[3/2] h-full w-full object-cover"
            fetchPriority="high"
          />
        </div>
      </section>
    </main>
  );
};

export default WelcomePage;
