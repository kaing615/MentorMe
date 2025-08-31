import { createSlice } from "@reduxjs/toolkit";

// Initial state is always null - user must login to set state
const initialState = null;

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      const userData = action.payload;
      // Update sessionStorage when user data changes (only persists during session)
      if (userData) {
        sessionStorage.setItem('user', JSON.stringify(userData));
        sessionStorage.setItem('isLoggedIn', 'true');
      }
      return userData;
    },
    clearUser: () => {
      // Clear sessionStorage when user is cleared
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('isLoggedIn');
      sessionStorage.removeItem('token');
      return null;
    },
    updateUser: (state, action) => {
      if (state) {
        const updatedUser = { ...state, ...action.payload };
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
      }
      return state;
    },
    // Action to restore user from sessionStorage (called manually)
    restoreUser: () => {
      try {
        const storedUser = sessionStorage.getItem('user');
        const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
        const token = sessionStorage.getItem('token');
        
        if (storedUser && isLoggedIn && token) {
          return {
            ...JSON.parse(storedUser),
            isLoggedIn: true
          };
        }
      } catch (error) {
        console.error('Error reading user data from sessionStorage:', error);
        // Clear invalid data
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('token');
      }
      
      return null;
    }
  },
});

export const { setUser, clearUser, updateUser, restoreUser } = userSlice.actions;

export default userSlice.reducer;