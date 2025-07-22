import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authApi } from "../../api/modules/auth.api.js";

export const loginUser = createAsyncThunk(
	"auth/loginUser",
	async ({ email, password }, { rejectWithValue }) => {
		try {
			const response = await authApi.signin({ email, password });
			console.log(response);

			if (response?.data?.token) {
				localStorage.setItem("user", JSON.stringify(response.data.user));
				localStorage.setItem("actkn", response.data.token);
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

const authSlice = createSlice({
	name: "auth",
	initialState: {
		user: JSON.parse(localStorage.getItem("user")) || null,
		token: localStorage.getItem("actkn") || null,
		isAuthenticated: !!localStorage.getItem("actkn"),
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
			localStorage.removeItem("user");
			localStorage.removeItem("actkn");
			window.location.replace("/auth/signin");
		},

		initializeAuth: (state) => {
			const storedUser = localStorage.getItem("user");
			const storedToken = localStorage.getItem("actkn");
			if (storedUser && storedToken) {
				try {
					state.user = JSON.parse(storedUser);
					state.token = storedToken;
					state.isAuthenticated = true;
					state.status = "succeeded"; // If initialized successfully
				} catch (e) {
					console.error("Failed to parse stored user or token:", e);
					localStorage.removeItem("user");
					localStorage.removeItem("actkn"); // Clean up 'actkn'
					state.user = null;
					state.token = null;
					state.isAuthenticated = false;
					state.status = "failed"; // If initialization failed
				}
			} else {
				state.status = "idle";
			}
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
				state.error =
					action.payload || "Login failed due to an unknown error.";
				state.isAuthenticated = false;
				state.user = null;
				state.token = null;
			});
	},
});

export const { logout, initializeAuth } = authSlice.actions;
export default authSlice.reducer;
