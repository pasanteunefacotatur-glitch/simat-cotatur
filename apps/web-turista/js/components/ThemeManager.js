/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-turista/js/components/ThemeManager.js
 * DESCRIPCIÓN: Gestor de temas con lista desplegable y detección automática
 *              del dispositivo como opción predeterminada:
 *              1. Automático (Sistema) 🖥️ -> Sigue el ajuste del teléfono/PC.
 *              2. Claro ☀️ -> Para uso bajo luz solar en peajes.
 *              3. Oscuro LCD 🌙 -> Paleta nocturna antirreflejo.
 *              4. Oscuro AMOLED ⬛ -> Negro absoluto (#000000) para ahorro de batería.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

const STORAGE_KEY = "simat_cotatur_theme_mode";

// Temas disponibles
export const THEME_OPTIONS = [
    { id: "auto", label: "🖥️ Sistema (Auto)", barColor: "#1c1c1c" },
    { id: "light", label: "☀️ Modo Claro", barColor: "#f1f5f9" },
    { id: "dark", label: "🌙 Oscuro (LCD)", barColor: "#0f172a" },
    { id: "amoled", label: "⬛ Oscuro (AMOLED)", barColor: "#000000" }
];

/**
 * Retorna la preferencia guardada o 'auto' por defecto.
 */
export function getSavedThemePreference() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return ["auto", "light", "dark", "amoled"].includes(saved) ? saved : "auto";
}

/**
 * Resuelve el tema efectivo ('light', 'dark', 'amoled') según la preferencia.
 */
export function resolveEffectiveTheme(preference) {
    if (preference === "auto") {
        if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
            return "dark";
        }
        return "light";
    }
    return preference;
}

/**
 * Aplica el tema en el DOM y actualiza el color de la barra del navegador móvil.
 */
export function applyTheme(preference) {
    const effective = resolveEffectiveTheme(preference);

    document.documentElement.setAttribute("data-theme", effective);
    if (document.body) {
        document.body.setAttribute("data-theme", effective);
    }
    localStorage.setItem(STORAGE_KEY, preference);

    // Ajustar color de la barra del navegador (Android / Safari)
    const activeMeta = THEME_OPTIONS.find(t => t.id === preference) || THEME_OPTIONS[0];
    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
        metaTheme = document.createElement("meta");
        metaTheme.name = "theme-color";
        document.head.appendChild(metaTheme);
    }
    metaTheme.content = activeMeta.barColor;

    // Sincronizar el valor en cualquier select de tema presente en pantalla
    const selects = document.querySelectorAll(".simat-theme-dropdown");
    selects.forEach(sel => {
        if (sel.value !== preference) {
            sel.value = preference;
        }
    });
}

/**
 * Inicializa el tema al cargar la página.
 */
export function initTheme() {
    const pref = getSavedThemePreference();
    applyTheme(pref);

    // Escuchar cambios del sistema en tiempo real si está en modo automático
    if (window.matchMedia) {
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
            if (getSavedThemePreference() === "auto") {
                applyTheme("auto");
            }
        });
    }
}

/**
 * Genera el HTML de la lista desplegable de temas institucionales.
 */
export function renderThemeDropdownHtml() {
    const currentPref = getSavedThemePreference();

    const optionsHtml = THEME_OPTIONS.map(opt => `
        <option value="${opt.id}" ${opt.id === currentPref ? 'selected' : ''}>
            ${opt.label}
        </option>
    `).join("");

    return `
        <div class="inline-flex items-center text-xs no-print">
            <select id="select-theme-dropdown"
                class="simat-theme-dropdown bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 rounded-lg px-2 py-1 text-[11px] font-medium outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer transition-colors"
                title="Seleccionar tema visual">
                ${optionsHtml}
            </select>
        </div>
    `;
}

/**
 * Vincula el evento de cambio a cualquier dropdown de tema existente.
 */
export function bindThemeDropdown(selectElementId = "select-theme-dropdown") {
    const el = document.getElementById(selectElementId);
    if (el) {
        el.addEventListener("change", (e) => {
            applyTheme(e.target.value);
        });
    }
}
