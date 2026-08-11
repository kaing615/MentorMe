import {
  IconArrowRight,
  IconArrowUpRight,
  IconMoonStars,
  IconSparkles,
  IconSun,
} from "@tabler/icons-react";
import MentoringHero from "../assets/mentoring-hero.jpg";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import BrandLogo from "../components/common/BrandLogo";
import { applyTheme, getInitialTheme, type Theme } from "../utils/theme";

const WelcomePage = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    setTheme(nextTheme);
  };

  return (
    <main className="app-shell min-h-[100dvh]">
      <header className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/")}
          aria-label="Go to MentorMe home"
          className="rounded-xl transition-opacity hover:opacity-80"
        >
          <BrandLogo />
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-surface-muted)] hover:text-[var(--ui-accent)]"
          >
            {theme === "dark" ? (
              <IconSun aria-hidden="true" size={20} stroke={1.8} />
            ) : (
              <IconMoonStars aria-hidden="true" size={20} stroke={1.8} />
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate("/auth/signin")}
            className="rounded-full bg-[var(--ui-surface-muted)] px-5 py-2.5 text-sm font-bold text-[var(--ui-text)] transition-colors hover:bg-[var(--ui-accent-soft)]"
          >
            Log in
          </button>
        </div>
      </header>

      <section className="ui-hero-surface mx-auto grid min-h-[calc(100dvh-6rem)] max-w-[90rem] grid-cols-1 items-center gap-12 rounded-t-[2rem] border border-b-0 border-[var(--ui-border)] px-5 py-12 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-14 lg:py-16 xl:gap-20 xl:px-20">
        <div className="max-w-2xl">
          <span className="ui-eyebrow">
            <IconSparkles aria-hidden="true" size={14} stroke={2} />
            Mentorship, made personal
          </span>
          <h1 className="mt-6 max-w-[11ch] text-5xl font-[760] leading-[0.98] tracking-[-0.06em] text-[var(--ui-text)] sm:text-6xl lg:text-7xl">
            Your next chapter starts with the right guide.
          </h1>
          <p className="mt-7 max-w-[54ch] text-base leading-7 text-[var(--ui-text-muted)] sm:text-lg">
            Meet vetted mentors, book focused one-to-one sessions, and turn real-world experience into progress you can feel.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("/auth/signup")}
              className="inline-flex min-h-12 items-center gap-2 whitespace-nowrap rounded-full bg-[var(--ui-accent-fill)] px-6 py-3 font-bold text-white shadow-[var(--ui-shadow-sm)] transition-colors hover:bg-[var(--ui-accent-fill-hover)]"
            >
              Find your mentor
              <IconArrowRight aria-hidden="true" size={19} stroke={2} />
            </button>
            <button
              type="button"
              onClick={() => navigate("/auth/apply-as-men")}
              className="inline-flex min-h-12 items-center gap-2 whitespace-nowrap rounded-full bg-[var(--ui-surface-muted)] px-6 py-3 font-bold text-[var(--ui-text)] transition-colors hover:bg-[var(--ui-accent-soft)]"
            >
              Become a mentor
              <IconArrowUpRight aria-hidden="true" size={19} stroke={2} />
            </button>
          </div>
          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-[var(--ui-border)] pt-6">
            {[
              ["1:1", "Focused sessions"],
              ["Flexible", "Your schedule"],
              ["Practical", "Real outcomes"],
            ].map(([value, label]) => (
              <div key={value}>
                <dt className="text-lg font-extrabold tracking-[-0.03em] text-[var(--ui-text)]">{value}</dt>
                <dd className="mt-1 text-xs leading-5 text-[var(--ui-text-muted)] sm:text-sm">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="ui-image-frame min-h-[24rem] lg:min-h-[38rem]">
          <img
            src={MentoringHero}
            alt="A learner working through a goal with an experienced mentor"
            className="absolute inset-0 h-full w-full object-cover"
            fetchPriority="high"
          />
          <div className="absolute bottom-5 left-5 right-5 z-10 flex items-end justify-between gap-4 rounded-2xl border border-white/20 bg-black/35 p-4 text-white backdrop-blur-md sm:bottom-7 sm:left-7 sm:right-auto sm:max-w-xs sm:p-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">Built for momentum</p>
              <p className="mt-2 text-lg font-bold leading-snug">Clear goals. Honest feedback. Better decisions.</p>
            </div>
            <IconArrowUpRight aria-hidden="true" className="shrink-0" size={22} stroke={1.8} />
          </div>
        </div>
      </section>
    </main>
  );
};

export default WelcomePage;
