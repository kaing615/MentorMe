import type { HTMLAttributes } from "react";

type BrandLogoProps = HTMLAttributes<HTMLSpanElement> & {
  markOnly?: boolean;
};

const BrandLogo = ({ markOnly = false, className = "", ...props }: BrandLogoProps) => (
  <span
    className={`brand-logo ${className}`.trim()}
    aria-label="MentorMe"
    {...props}
  >
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 40 40" role="img">
        <path d="M8.5 28V14.75a3.75 3.75 0 0 1 6.4-2.65L20 17.2l5.1-5.1a3.75 3.75 0 0 1 6.4 2.65V28" />
        <path d="m8.5 21.25 8.85 8.15a3.9 3.9 0 0 0 5.3 0l8.85-8.15" />
      </svg>
    </span>
    {!markOnly && (
      <span className="brand-wordmark" aria-hidden="true">
        mentor<span>·me</span>
      </span>
    )}
  </span>
);

export default BrandLogo;
