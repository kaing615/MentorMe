export const getLoginPath = (returnTo: string) =>
  `/auth/signin?returnTo=${encodeURIComponent(returnTo)}`;

export const getPostLoginPath = (returnTo: string | null, fallbackPath: string) =>
  returnTo?.startsWith("/") && !returnTo.startsWith("//")
    ? returnTo
    : fallbackPath;
