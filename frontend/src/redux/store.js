import { configureStore } from "@reduxjs/toolkit";
import userSlice from "./features/user.slice";
import loadingSlice from "./features/loading.slice";
import authSlice from "./features/auth.slice";

const store = configureStore({
  reducer: {
    user: userSlice,
    loading: loadingSlice,
    auth: authSlice,
  },
  devTools: true,
});

export default store;
