/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-turista/js/components/ThemeManager.js
 * DESCRIPCIÓN: Gestor de temas mediante botón interactivo con icono en la esquina
 *              superior derecha. Inicia en base al ajuste del dispositivo (Auto)
 *              y permite alternar con un toque entre Claro, Oscuro LCD y AMOLED.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

const STORAGE_KEY = "simat_cotatur_theme";
const THEMES = ["light", "dark", "amoled"];

const THEME_INFO = {
    light: { icon: "☀️", label: "Claro", barColor: "#f1f5f9" },
    dark: { icon: "🌙", label: "Oscuro", barColor: "#0f172a" },
    amoled: { icon: "⬛", label: "AMOLED", barColor: "#000000" }
};

/**
 * Obtiene el tema actual. Si no hay guardado, usa la configuración del dispositivo.
 */
export function getCurrentTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && THEMES.includes(saved)) {
        return saved;
    }
    // Detección automática por defecto de la configuración del teléfono / PC
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
    }
    return "light";
}

/**
 * Aplica el tema en el DOM y actualiza la barra del navegador.
 */
export function applyTheme(theme) {
    if (!THEMES.includes(theme)) theme = "light";

    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark" || theme === "amoled");
    if (document.body) {
        document.body.setAttribute("data-theme", theme);
    }
    localStorage.setItem(STORAGE_KEY, theme);

    // Color de barra móvil
    const info = THEME_INFO[theme] || THEME_INFO.light;
    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
        metaTheme = document.createElement("meta");
        metaTheme.name = "theme-color";
        document.head.appendChild(metaTheme);
    }
    metaTheme.content = info.barColor;

    actualizarIconoBoton(theme);
}

/**
 * Alterna secuencialmente entre Claro -> Oscuro LCD -> AMOLED -> Claro.
 */
export function toggleTheme() {
    const current = getCurrentTheme();
    const nextIdx = (THEMES.indexOf(current) + 1) % THEMES.length;
    const nextTheme = THEMES[nextIdx];
    applyTheme(nextTheme);
    return nextTheme;
}

/**
 * Inicializa el tema al cargar.
 */
export function initTheme() {
    const current = getCurrentTheme();
    applyTheme(current);

    if (window.matchMedia) {
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
            if (!localStorage.getItem(STORAGE_KEY)) {
                applyTheme(e.matches ? "dark" : "light");
            }
        });
    }
}

/**
 * Genera el HTML del botón con icono en la esquina superior derecha.
 */
export function renderThemeButtonHtml() {
    const current = getCurrentTheme();
    const info = THEME_INFO[current] || THEME_INFO.light;

    return `
        <button type="button" id="btn-toggle-theme"
            class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 transition-all flex items-center space-x-1 shadow-sm active:scale-95 no-print"
            title="Cambiar tema: Claro (☀️), Oscuro LCD (🌙), AMOLED Puro (⬛)">
            <span id="theme-icon">${info.icon}</span>
            <span id="theme-label" class="hidden sm:inline">${info.label}</span>
        </button>
    `;
}

function actualizarIconoBoton(theme) {
    const iconEl = document.getElementById("theme-icon");
    const labelEl = document.getElementById("theme-label");
    const info = THEME_INFO[theme];
    if (iconEl && info) {
        iconEl.textContent = info.icon;
        if (labelEl) labelEl.textContent = info.label;
    }
}
