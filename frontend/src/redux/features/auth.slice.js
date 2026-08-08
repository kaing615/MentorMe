import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authApi from "../../api/modules/auth.api.js";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "../../auth/session.js";

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authApi.signin({ email, password });
      console.log(response);

      if (response?.data?.token) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
        setAccessToken(response.data.token);
        return response.data;
      } else {
        return rejectWithValue("Login failed.");
      }
    } catch (error) {
      const message = error.message || "An unexpected error occurred.";
      return rejectWithValue(message);
    }
  }
);

export const initializeAuth = createAsyncThunk(
  "auth/initializeAuth",
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.refresh();
      if (!response?.data?.token) return rejectWithValue("No active session");
      setAccessToken(response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      return response.data;
    } catch {
      clearAccessToken();
      return rejectWithValue("No active session");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: JSON.parse(localStorage.getItem("user")) || null,
    token: getAccessToken(),
    isAuthenticated: false,
    status: "idle", // Changed from 'initializing' to 'idle' as a standard initial state
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.status = "idle";
      state.error = null;
      clearAccessToken();
      localStorage.removeItem("user");
      localStorage.removeItem("actkn");
      localStorage.removeItem("token");
      localStorage.removeItem("isLoggedIn");
      window.location.replace("/auth/signin");
    },

  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = "loading"; // Use 'loading' for pending state
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Login failed due to an unknown error.";
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      .addCase(initializeAuth.pending, (state) => {
        state.status = "loading";
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.status = "idle";
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
