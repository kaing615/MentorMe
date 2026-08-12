import {
  IconMoonStars,
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
    <main className="app-shell min-h-[100dvh] overflow-x-hidden px-3 pb-3 sm:px-5 sm:pb-5">
      <header className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between rounded-b-2xl border-x border-b border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-surface)_88%,transparent)] px-4 shadow-[var(--ui-shadow-xs)] backdrop-blur-xl sm:px-6 lg:px-8">
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
            className="rounded-full bg-[var(--ui-accent-soft)] px-5 py-2.5 text-sm font-bold text-[var(--ui-accent)] transition-all hover:-translate-y-0.5 hover:bg-[var(--ui-surface-raised)]"
          >
            Log in
          </button>
        </div>
      </header>

      <section className="ui-brand-hero mx-auto mt-3 grid min-h-[calc(100dvh-6rem)] max-w-[90rem] grid-cols-1 items-center gap-12 rounded-[2rem] border-2 border-blue-300/35 px-5 py-12 shadow-[var(--ui-shadow-lg)] sm:px-8 lg:grid-cols-[0.88fr_1.12fr] lg:px-14 lg:py-16 xl:gap-20 xl:px-20">
        <div className="max-w-3xl">
          <p className="text-sm font-bold text-blue-100">Mentorship, drawn around your goals</p>
          <h1 className="mt-5 max-w-[17ch] text-4xl font-[780] leading-[0.98] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
            Your next chapter starts with the
            <span className="ui-marker">right guide.</span>
          </h1>
          <p className="mt-7 max-w-[50ch] text-base leading-7 text-blue-100 sm:text-lg">
            Meet vetted mentors, book focused sessions, and turn experience into progress you can measure.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("/auth/signup")}
              className="ui-button-highlight inline-flex min-h-12 items-center whitespace-nowrap rounded-full px-6 py-3 font-bold transition-all"
            >
              Find your mentor
            </button>
            <button
              type="button"
              onClick={() => navigate("/auth/apply-as-men")}
              className="inline-flex min-h-12 items-center whitespace-nowrap rounded-full border border-white/35 bg-white/12 px-6 py-3 font-bold text-white backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white hover:text-blue-800"
            >
              Become a mentor
            </button>
          </div>
        </div>

        <div className="ui-image-frame min-h-[24rem] rotate-[0.6deg] border-2 !border-yellow-300/70 lg:min-h-[38rem]">
          <img
            src={MentoringHero}
            alt="A learner working through a goal with an experienced mentor"
            className="absolute inset-0 h-full w-full object-cover"
            fetchPriority="high"
          />
          <div className="ui-sketch-note absolute bottom-5 left-5 right-5 z-10 p-4 text-blue-950 sm:bottom-7 sm:left-7 sm:right-auto sm:max-w-xs sm:p-5">
            <div>
              <p className="text-sm font-bold text-blue-700">Built for momentum</p>
              <p className="mt-2 text-lg font-bold leading-snug">Clear goals. Honest feedback. Better decisions.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default WelcomePage;
