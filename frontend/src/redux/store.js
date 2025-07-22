import { configureStore } from "@reduxjs/toolkit";
import userSlice from "./features/user.slice"
import loadingSlice from "./features/loading.slice"

const store = configureStore({
  reducer: {
    user: userSlice,
    loading: loadingSlice,
  },
  devTools: true,
});

export default store;
