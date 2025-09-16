import { configureStore } from "@reduxjs/toolkit";
import {imageApi} from "../features/imageApi.ts";


export const store = configureStore({
    reducer: {
        [imageApi.reducerPath]: imageApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(imageApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
