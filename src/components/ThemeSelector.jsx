import { useTheme } from "../hooks/useTheme";

const THEMES = [
  {
    id: "light",
    label: "Claro",
    previewClass: "theme-preview-light",
    icon: "☀️",
  },
  {
    id: "dark",
    label: "Escuro",
    previewClass: "theme-preview-dark",
    icon: "🌙",
  },
  {
    id: "system",
    label: "Sistema",
    previewClass: "theme-preview-system",
    icon: "💻",
  },
];

function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const handleSelect = (id) => {
    if (id === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setTheme(prefersDark ? "dark" : "light");
      // Salva "system" para identificar a opção visualmente
      localStorage.setItem("escala-theme-pref", "system");
    } else {
      localStorage.setItem("escala-theme-pref", id);
      setTheme(id);
    }
  };

  // Determina qual botão está "selecionado" na UI
  const storedPref =
    localStorage.getItem("escala-theme-pref") ||
    localStorage.getItem("escala-theme") ||
    "light";

  return (
    <section className="theme-section" aria-labelledby="theme-section-title">
      <div className="theme-section-header">
        <h2 className="theme-section-title" id="theme-section-title">
          Aparência
        </h2>
        <p className="theme-section-desc">
          Escolha como o sistema será exibido para você. A preferência é salva
          automaticamente.
        </p>
      </div>

      <div className="theme-options" role="radiogroup" aria-label="Selecionar tema">
        {THEMES.map(({ id, label, previewClass, icon }) => {
          const isSelected = storedPref === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`theme-option${isSelected ? " selected" : ""}`}
              onClick={() => handleSelect(id)}
              id={`theme-option-${id}`}
            >
              <div className="theme-option-preview">
                <div className={previewClass} aria-hidden="true" />
              </div>
              <span className="theme-option-label">
                {isSelected && (
                  <span className="theme-option-check" aria-hidden="true">
                    ✓
                  </span>
                )}
                {icon} {label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default ThemeSelector;
