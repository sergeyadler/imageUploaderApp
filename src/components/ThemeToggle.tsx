import  { useEffect, useMemo, useState } from "react";

type ThemeChoice = "light" | "dark" | "system";
const STORAGE_KEY = "theme";

function applyTheme(choice: ThemeChoice) {
    const root = document.documentElement;
    if (choice === "system") {
        root.removeAttribute("data-theme"); // отдаём приоритет @media (prefers-color-scheme)
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.style.colorScheme = isDark ? "dark" : "light";
    } else {
        root.setAttribute("data-theme", choice);
        root.style.colorScheme = choice;
    }
}

export default function ThemeToggle() {
    const [theme, setTheme] = useState<ThemeChoice>(() => {
        const saved = localStorage.getItem(STORAGE_KEY) as ThemeChoice | null;
        return saved ?? "system";
    });

    // реагируем на смену системной темы, если выбран "system"
    const mql = useMemo(
        () => (typeof window !== "undefined"
            ? window.matchMedia("(prefers-color-scheme: dark)")
            : null),
        []
    );

    useEffect(() => {
        applyTheme(theme);
        localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    useEffect(() => {
        if (!mql) return;
        const handler = () => {
            const saved = (localStorage.getItem(STORAGE_KEY) as ThemeChoice) || "system";
            if (saved === "system") applyTheme("system");
        };
        mql.addEventListener?.("change", handler);
        return () => mql.removeEventListener?.("change", handler);
    }, [mql]);

    return (
        <div className="theme-toggle" role="group" aria-label="Theme switcher">
            <button
                type="button"
                className={`btn btn--ghost ${theme === "light" ? "is-active" : ""}`}
                onClick={() => setTheme("light")}
                title="Светлая тема"
            >
                Светлая тема
            </button>
            <button
                type="button"
                className={`btn btn--ghost ${theme === "dark" ? "is-active" : ""}`}
                onClick={() => setTheme("dark")}
                title="Тёмная тема"
            >
                Темная тема
            </button>
            <button
                type="button"
                className={`btn btn--ghost ${theme === "system" ? "is-active" : ""}`}
                onClick={() => setTheme("system")}
                title="Системная тема"
            >
                Системная тема
            </button>
        </div>
    );
}
