import { useState, useEffect } from "react";

/**
 * Hook para gerenciar o tema claro/escuro da aplicação.
 * Persiste a preferência no localStorage e aplica a classe ao <body>.
 */
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("escala-theme");
    if (saved) return saved;
    // Respeita a preferência do sistema do usuário como padrão
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("escala-theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return { theme, setTheme, toggleTheme };
}
