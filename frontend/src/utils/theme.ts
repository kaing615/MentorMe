export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "mentorme-theme";

export const resolveTheme = (
  savedTheme: string | null,
  prefersDark: boolean,
): Theme => {
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  return prefersDark ? "dark" : "light";
};

export const getInitialTheme = (): Theme =>
  resolveTheme(
    localStorage.getItem(THEME_STORAGE_KEY),
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

export const applyTheme = (theme: Theme, persist = true): void => {
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#0b1220" : "#f6f8fc");
  if (persist) localStorage.setItem(THEME_STORAGE_KEY, theme);
};
