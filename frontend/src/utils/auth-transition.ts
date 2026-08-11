export const getAuthTransitionPlan = (
  targetPath: string,
  reduceMotion: boolean,
) => {
  if (reduceMotion) {
    return { exitX: 0, enterX: 0, exitDuration: 0, enterDuration: 0 };
  }

  const isSignUp = targetPath.endsWith("/signup");
  return {
    exitX: isSignUp ? -24 : 24,
    enterX: isSignUp ? 32 : -32,
    exitDuration: 0.16,
    enterDuration: 0.34,
  };
};
