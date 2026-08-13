import MentoringHero from "../assets/mentoring-hero.jpg";
import { useNavigate } from "react-router-dom";

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <main className="app-shell min-h-[100dvh] overflow-x-hidden">
      <section className="ui-brand-hero grid min-h-[100dvh] w-full grid-cols-1 items-center gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[0.88fr_1.12fr] lg:px-14 lg:py-16 xl:gap-20 xl:px-20">
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
              onClick={() => navigate("/home")}
              className="ui-button-highlight inline-flex min-h-12 items-center whitespace-nowrap rounded-full px-6 py-3 font-bold transition-all"
            >
              Get started
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
