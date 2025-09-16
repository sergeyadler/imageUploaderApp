// src/features/imageApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type AuthParams = {
    token: string;
    expire: number;      // сервер отдаёт число (unix seconds)
    signature: string;
};



export const imageApi = createApi({
    reducerPath: "imageApi",
    baseQuery: fetchBaseQuery({
        baseUrl: "http://localhost:3001"
    }),
    endpoints: (builder) => ({
        // 1) Получаем параметры подписи с твоего backend (порт 3001 через Vite proxy)
        getAuth: builder.query<AuthParams, void>({
            query: () => ({ url: "/auth", method: "GET" }),
        }),


    }),
});

export const {
    useGetAuthQuery,
   } = imageApi;

