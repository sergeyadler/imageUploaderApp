// src/features/imageApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type AuthParams = {
    token: string;
    expire: number;      // сервер отдаёт число (unix seconds)
    signature: string;
};

type UploadResponse = {
    fileId: string;
    name: string;
    url: string;
    thumbnailUrl?: string;
    height?: number;
    width?: number;
    size?: number;
    [k: string]: any;
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

        // 2) Прямая загрузка в ImageKit
        // ВАЖНО: сюда передаём НОВЫЙ FormData (не переиспользовать один и тот же)
        uploadImage: builder.mutation<UploadResponse, { formData: FormData; auth: AuthParams }>({
            queryFn: async ({ formData, auth }) => {
                try {
                    const fd = new FormData();
                    for (const [k, v] of formData.entries()) fd.append(k, v as Blob | string);

                    // Обязательное: auth
                    fd.append("signature", auth.signature);
                    fd.append("expire", String(auth.expire));   // строкой — надёжнее
                    fd.append("token", auth.token);

                    // Обязательное при прямом REST-запросе:
                    fd.append("publicKey", import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY);

                    const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
                        method: "POST",
                        body: fd,
                    });

                    if (!res.ok) {
                        return { error: { status: res.status, error: await res.text() } as any };
                    }
                    const data = (await res.json()) as UploadResponse;
                    return { data };
                } catch (err: any) {
                    return { error: { status: "CUSTOM_ERROR", error: err?.message ?? String(err) } as any };
                }
            },
        }),

        // 3) Удаление файла через твой backend (безопасно, т.к. privateKey только там)
        deleteFile: builder.mutation<{ success: boolean; response: any }, string>({
            query: (fileId) => ({
                url: `/api/delete/${fileId}`,
                method: "DELETE",
            }),
        }),
    }),
});

export const {
    useGetAuthQuery,
    useUploadImageMutation,
    useDeleteFileMutation,
} = imageApi;
