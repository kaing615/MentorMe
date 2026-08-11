import React from "react";
import { Link } from "react-router-dom";
import { PATH, PLATFORM_PATH } from "../../routes/path";
import BrandLogo from "./BrandLogo";

const Footer = () => {
  return (
    <footer className="mt-20 w-full border-t border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-14 text-[var(--ui-text)] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 sm:grid-cols-[1.5fr_1fr_1fr]">
        <div className="max-w-sm">
          <BrandLogo className="mb-4" />
          <p className="max-w-[38ch] text-sm leading-6 text-[var(--ui-text-muted)]">
            Find the right mentor, book a focused session, and move forward with practical guidance.
          </p>
        </div>
        <div>
          <div className="mb-3 font-bold">Explore</div>
          <ul className="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li>
              <Link to="/all-mentors" className="hover:text-[var(--ui-accent)] hover:underline">
                Find mentors
              </Link>
            </li>
            <li>
              <Link to="/all-courses" className="hover:text-[var(--ui-accent)] hover:underline">
                Browse courses
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="mb-3 font-bold">Support</div>
          <ul className="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li>
              <Link
                to={`${PATH.PLATFORM}/${PLATFORM_PATH.HELP_REQUEST}`}
                className="hover:text-[var(--ui-accent)] hover:underline"
              >
                Help Request
              </Link>
            </li>
            <li>
              <a
                href="https://github.com/kaing615/MentorMe"
                className="hover:text-[var(--ui-accent)] hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Project repository
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-[var(--ui-border)] pt-6 text-xs text-[var(--ui-text-muted)]">
        © {new Date().getFullYear()} MentorMe. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
