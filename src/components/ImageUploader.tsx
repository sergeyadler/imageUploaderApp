// import { useState } from "react";
// import { useGetAuthQuery, useUploadImageMutation } from "../features/imageApi";
//
// const ImageUploader = () => {
//     const [file, setFile] = useState<File | null>(null);
//     const [url, setUrl] = useState<string | null>(null);
//
//     // Получаем подпись (token/expire/signature) с бэка
//     const { data: auth, isFetching: isAuthLoading, refetch } = useGetAuthQuery();
//
//     // Мутация прямой загрузки в ImageKit
//     const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation();
//
//     const onSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         if (!file) return;
//
//         try {
//             // гарантируем свежие auth-параметры
//             const authParams = auth ?? (await refetch()).data;
//             if (!authParams) throw new Error("Не удалось получить параметры подписи");
//
//             // собираем FormData ТОЛЬКО с обязательным набором
//             const form = new FormData();
//             form.append("file", file);
//             form.append("fileName", file.name);
//             form.append("useUniqueFileName", "true");
//             form.append("folder", "/uploads");
//             const data = await uploadImage({ formData: form, auth: authParams }).unwrap();
//             setUrl(data.url);
//         } catch (err) {
//             console.error(err);
//             alert("Upload failed.");
//         }
//     };
//
//     return (
//         <div style={{ maxWidth: 520 }}>
//             <form onSubmit={onSubmit}>
//                 <input
//                     type="file"
//                     accept="image/*"
//                     onChange={(e) => setFile(e.target.files?.[0] ?? null)}
//                 />
//                 <button
//                     type="submit"
//                     disabled={!file || isUploading || isAuthLoading}
//                     style={{ marginLeft: 8 }}
//                 >
//                     {isUploading ? "Загружаю..." : "Upload"}
//                 </button>
//             </form>
//
//             {url && (
//                 <>
//                     <p>
//                         URL:{" "}
//                         <a href={url} target="_blank" rel="noreferrer">
//                             {url}
//                         </a>
//                     </p>
//                     <img
//                         src={url}
//                         alt="uploaded"
//                         style={{ maxWidth: "100%", marginTop: 12, borderRadius: 8 }}
//                     />
//                 </>
//             )}
//         </div>
//     );
// };
//
// export default ImageUploader;
import React, { useEffect, useState } from "react";
import { useGetAuthQuery } from "../features/imageApi"; // поправь путь, если у тебя другой

type UploadHistoryItem = { url: string; name: string; fileId: string };

const ImageUploader: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [progress, setProgress] = useState<number>(0);

    const [history, setHistory] = useState<UploadHistoryItem[]>([]);
    const [loaded, setLoaded] = useState<Record<string, boolean>>({});
    const [deleting, setDeleting] = useState<string | null>(null);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [closingModal, setClosingModal] = useState(false);

    const {  refetch, isFetching: isAuthLoading } = useGetAuthQuery();

    const PUBLIC_KEY = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;
    const API_BASE = (import.meta.env.VITE_API_URL as string) || "/api"; // ожидается /api в dev


    useEffect(() => {
        const saved = localStorage.getItem("uploadHistory");
        if (saved) {
           setHistory(JSON.parse(saved));
        }
    }, []);
    useEffect(() => {
        localStorage.setItem("uploadHistory", JSON.stringify(history));
    }, [history]);

    // чистим blob URL
    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    function handleFileSelect(f: File) {
        setFile(f);
        if (preview) URL.revokeObjectURL(preview);
        setPreview(URL.createObjectURL(f));
        setProgress(0);
    }

    async function handleUpload() {
        if (!file) return;
        if (!PUBLIC_KEY) {
            alert("VITE_IMAGEKIT_PUBLIC_KEY не найден");
            return;
        }

        const fresh = (await refetch()).data;
        if (!fresh) {
            alert("Не удалось получить подпись");
            return;
        }

        const form = new FormData();
        form.append("file", file);
        form.append("fileName", file.name);
        form.append("publicKey", PUBLIC_KEY);
        form.append("token", fresh.token);
        form.append("signature", fresh.signature);
        form.append("expire", String(fresh.expire));
        form.append("useUniqueFileName", "true");
        form.append("folder", "/uploads");

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "https://upload.imagekit.io/api/v1/files/upload");

        xhr.upload.onprogress = (evt) => {
            if (evt.lengthComputable) {
                setProgress(Math.round((evt.loaded / evt.total) * 100));
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                const res = JSON.parse(xhr.responseText) as { url: string; fileId: string };
                setHistory((prev) => [{ url: res.url, name: file.name, fileId: res.fileId }, ...prev]);
                setFile(null);
                if (preview) URL.revokeObjectURL(preview);
                setPreview(null);
                setProgress(0);
            } else {
                console.error("Upload failed:", xhr.responseText);
                alert("Upload failed");
            }
        };

        xhr.onerror = () => {
            console.error("Upload error");
            alert("Upload error");
        };

        xhr.send(form);
    }

    async function handleDelete(fileId: string) {
        setDeleting(fileId);
        setTimeout(async () => {
            try {
                const base = API_BASE.replace(/\/$/, "");
                const res = await fetch(`${base}/delete/${fileId}`, { method: "DELETE" });
                if (!res.ok) {
                    const txt = await res.text();
                    console.error("Delete failed:", res.status, txt);
                    throw new Error("Error deleting file");
                }
                setHistory((prev) => prev.filter((i) => i.fileId !== fileId));
            } catch (e) {
                console.error(e);
                alert("Ошибка удаления");
            } finally {
                setDeleting(null);
            }
        }, 150);
    }

    function handleClearHistory() {
        setHistory([]);
        localStorage.removeItem("uploadHistory");
    }

    function markAsLoaded(fileId: string) {
        setLoaded((prev) => ({ ...prev, [fileId]: true }));
    }

    function closeModal() {
        setClosingModal(true);
        setTimeout(() => {
            setSelectedImage(null);
            setClosingModal(false);
        }, 200);
    }

    return (
        <div className="uploader">
            <h1 className="uploader__title">ImageKit uploader</h1>

            <div className="picker">
                <input
                    className="picker__input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                />
                <div className="picker__hint">
                    {file ? `Выбран файл: ${file.name}` : "Выберите файл для загрузки"}
                </div>
            </div>

            {preview && (
                <div className="preview">
                    <img className="preview__img" src={preview} alt="preview" />
                </div>
            )}

            <button
                className="btn btn--primary"
                onClick={handleUpload}
                disabled={!file || isAuthLoading || (progress > 0 && progress < 100)}
                title={!PUBLIC_KEY ? "Нет VITE_IMAGEKIT_PUBLIC_KEY" : undefined}
            >
                {progress > 0 && progress < 100 ? "Загрузка..." : "Загрузить"}
            </button>

            {progress > 0 && (
                <div className="progress">
                    {/* нативный элемент без стилей; при желании заменишь на свою полоску */}
                    <progress className="progress__native" max={100} value={progress} />
                    <span className="progress__label">{progress}%</span>
                </div>
            )}

            <div className="history">
                <div className="history__header">
                    <h3 className="history__title">История загрузок</h3>
                    {history.length > 0 && (
                        <button className="btn btn--danger" onClick={handleClearHistory}>
                            Очистить
                        </button>
                    )}
                </div>

                {history.length === 0 && <p className="history__empty">История пуста</p>}

                <div className="grid">
                    {history.map((item) => {
                        const ext = item.name.split(".").pop()?.toUpperCase() || "FILE";
                        const isLoaded = loaded[item.fileId];

                        return (
                            <div
                                key={item.fileId}
                                className={`card ${deleting === item.fileId ? "card--shrinking" : ""}`}
                            >
                                <div className="card__badge">{ext}</div>

                                <div className="card__media" onClick={() => setSelectedImage(item.url)}>
                                    {!isLoaded && <div className="skeleton" />}
                                    <img
                                        src={item.url}
                                        alt={item.name}
                                        className={`card__img ${isLoaded ? "is-visible" : "is-hidden"}`}
                                        onLoad={() => markAsLoaded(item.fileId)}
                                    />
                                </div>

                                <div className="card__title" title={item.name}>
                                    {item.name}
                                </div>

                                <button className="card__delete" onClick={() => handleDelete(item.fileId)}>
                                    X
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {selectedImage && (
                <div
                    className={`lightbox ${closingModal ? "lightbox--closing" : ""}`}
                    onClick={closeModal}
                >
                    <img className="lightbox__img" src={selectedImage} alt="enlarged" />
                </div>
            )}
        </div>
    );
};

export default ImageUploader;
