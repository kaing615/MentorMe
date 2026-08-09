import { createSlice } from "@reduxjs/toolkit";

// Initial state is always null - user must login to set state
const initialState = null;

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      const userData = action.payload;
      // Update localStorage when user data changes (persists across tabs and sessions)
      if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("isLoggedIn", "true");

        // NOTE: Removed cross-user localStorage cleanup for production safety
        // Each user should have isolated storage or use sessionStorage
      }
      return userData;
    },
    clearUser: () => {
      // Clear localStorage when user is cleared
      localStorage.removeItem("user");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("token");
      localStorage.removeItem("actkn");
      return null;
    },
    updateUser: (state, action) => {
      if (state) {
        const updatedUser = { ...state, ...action.payload };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        return updatedUser;
      }
      return state;
    },
    // Action to restore user from localStorage (called manually)
    restoreUser: () => {
      try {
        const storedUser = localStorage.getItem("user");
        const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
        const token =
          localStorage.getItem("actkn") || localStorage.getItem("token");

        if (storedUser && isLoggedIn && token) {
          return {
            ...JSON.parse(storedUser),
            isLoggedIn: true,
          };
        }
      } catch (error) {
        console.error("Error reading user data from localStorage:", error);
        // Clear invalid data
        localStorage.removeItem("user");
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("token");
        localStorage.removeItem("actkn");
      }

      return null;
    },
  },
});

export const { setUser, clearUser, updateUser, restoreUser } =
  userSlice.actions;

export default userSlice.reducer;
