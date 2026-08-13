import React from "react";
import { createPortal } from "react-dom";
import { ClipLoader } from "react-spinners";
import BrandLogo from "./BrandLogo";

const LoadingPage = ({
  loading = true,
  text = "Loading...",
  fullscreen = true,
}) => {
  if (!loading) return null;

  const content = (
    <div
      role="status"
      aria-live="polite"
      aria-label={text}
      className={`${
        fullscreen ? "!fixed inset-0 z-[100] h-[100dvh] w-screen" : "relative"
      } ui-brand-hero flex min-h-72 flex-col items-center justify-center px-6`}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-16 top-16 h-44 w-44 rotate-6 rounded-[42%_58%_48%_52%] border-2 border-dashed border-yellow-300/45" />
        <div className="absolute -right-20 bottom-10 h-56 w-56 -rotate-6 rounded-[58%_42%_55%_45%] border-2 border-dashed border-blue-200/35" />
      </div>

      <div className="relative flex w-full max-w-sm flex-col items-center">
        <div className="loading-brand scale-125 sm:scale-150">
          <BrandLogo />
        </div>
        <p className="mt-7 text-sm font-semibold tracking-wide text-blue-100">Moving your next step closer</p>

        <div className="mt-8 flex flex-col items-center gap-4">
          <ClipLoader
            color="#FBBF24"
            loading={loading}
            size={46}
            speedMultiplier={1.05}
          />
          <p className="text-base font-semibold text-white">{text}</p>
        </div>

        <div className="mt-7 h-1.5 w-full overflow-hidden rounded-full border border-white/20 bg-white/10">
          <div className="ui-loading-progress h-full w-3/4 rounded-full bg-yellow-300" />
        </div>
      </div>
    </div>
  );

  return fullscreen ? createPortal(content, document.body) : content;
};

export default LoadingPage;
