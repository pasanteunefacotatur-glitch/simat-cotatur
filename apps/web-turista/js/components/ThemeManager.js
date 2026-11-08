/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-turista/js/components/ThemeManager.js
 * DESCRIPCIÓN: Gestor tri-estado de temas para dispositivos móviles y escritorio:
 *              1. Claro (Light) ☀️ -> Máxima legibilidad a plena luz del sol.
 *              2. Oscuro LCD (Dark) 🌙 -> Menor fatiga visual para turnos nocturnos.
 *              3. Oscuro AMOLED (Pure Black) ⬛ -> Apaga 100% de píxeles OLED/AMOLED,
 *                 ahorrando hasta 60% de batería en campo.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

const STORAGE_KEY = "simat_cotatur_theme";
const THEMES = ["light", "dark", "amoled"];

const THEME_LABELS = {
    light: { label: "Claro", icon: "☀️", barColor: "#f1f5f9" },
    dark: { label: "Oscuro", icon: "🌙", barColor: "#0f172a" },
    amoled: { label: "AMOLED", icon: "⬛", barColor: "#000000" }
};

/**
 * Obtiene el tema actual o detecta la preferencia del sistema operativo.
 */
export function getCurrentTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && THEMES.includes(saved)) {
        return saved;
    }
    // Detección automática de preferencia del dispositivo
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
    }
    return "light";
}

/**
 * Aplica el tema en el DOM y actualiza la barra del navegador móvil.
 */
export function applyTheme(theme) {
    if (!THEMES.includes(theme)) theme = "light";

    document.documentElement.setAttribute("data-theme", theme);
    if (document.body) {
        document.body.setAttribute("data-theme", theme);
    }
    localStorage.setItem(STORAGE_KEY, theme);

    // Ajustar color de la barra del navegador móvil (Android / iOS Safari)
    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
        metaTheme = document.createElement("meta");
        metaTheme.name = "theme-color";
        document.head.appendChild(metaTheme);
    }
    metaTheme.content = THEME_LABELS[theme].barColor;

    // Actualizar indicador en el botón si existe
    actualizarBotonTema(theme);
}

/**
 * Alterna secuencialmente entre Claro -> Oscuro (LCD) -> AMOLED -> Claro.
 */
export function toggleTheme() {
    const current = getCurrentTheme();
    const nextIndex = (THEMES.indexOf(current) + 1) % THEMES.length;
    const nextTheme = THEMES[nextIndex];
    applyTheme(nextTheme);
    return nextTheme;
}

/**
 * Inicializa el tema al cargar la página.
 */
export function initTheme() {
    const current = getCurrentTheme();
    applyTheme(current);

    // Escuchar cambios de preferencia del sistema si el usuario no ha forzado un tema manual
    if (window.matchMedia) {
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
            if (!localStorage.getItem(STORAGE_KEY)) {
                applyTheme(e.matches ? "dark" : "light");
            }
        });
    }
}

/**
 * Genera el HTML del botón de cambio de tema institucional.
 */
export function renderThemeButtonHtml() {
    const current = getCurrentTheme();
    const info = THEME_LABELS[current];

    return `
        <button type="button" id="btn-toggle-theme"
            class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 transition-all flex items-center space-x-1 shadow-sm active:scale-95 no-print"
            title="Cambiar tema: Claro (☀️), Oscuro LCD (🌙), AMOLED Puro (⬛)">
            <span id="theme-btn-icon">${info.icon}</span>
            <span id="theme-btn-label" class="hidden sm:inline">${info.label}</span>
        </button>
    `;
}

function actualizarBotonTema(theme) {
    const iconEl = document.getElementById("theme-btn-icon");
    const labelEl = document.getElementById("theme-btn-label");
    if (iconEl && labelEl && THEME_LABELS[theme]) {
        iconEl.textContent = THEME_LABELS[theme].icon;
        labelEl.textContent = THEME_LABELS[theme].label;
    }
}
