/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-turista/js/components/Header.js
 * DESCRIPCIÓN: Encabezado público con logos oficiales de COTATUR y Táchira es
 *              Turismo, botón interactivo de tema en la esquina superior derecha,
 *              punto de control activo e indicador pasivo por ubicación GPS
 *              para confirmar al encuestador/usuario que está en el formulario
 *              del punto correcto (o permitirle cambiar con un toque).
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

import { renderThemeButtonHtml, toggleTheme } from "./ThemeManager.js";

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function renderHeader(containerId, activePointName = "Peaje Vega de Táriba - Troncal 1") {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <header class="bg-[#1c1c1c] text-white border-b-4 border-amber-500 pt-safe shadow-md font-['Montserrat',sans-serif]">
            <div class="max-w-xl mx-auto px-4 py-3">
                
                <!-- Barra superior: Logos oficiales e Icono de Tema en la esquina superior derecha -->
                <div class="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2.5">
                    <!-- Logos oficiales COTATUR + Táchira es Turismo -->
                    <div class="flex items-center space-x-3">
                        <img src="./assets/img/logo_cotatur.png" alt="COTATUR Logo" class="h-10 w-auto object-contain drop-shadow" />
                        <div class="h-7 w-[1px] bg-white/20"></div>
                        <img src="./assets/img/logo_tachira.png" alt="Táchira Turismo Logo" class="h-8 w-auto object-contain drop-shadow" />
                    </div>

                    <!-- Botón con icono de tema en la esquina superior derecha -->
                    <div>
                        ${renderThemeButtonHtml()}
                    </div>
                </div>

                <!-- Título institucional y Punto de Control activo -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pt-1">
                    <div>
                        <p class="text-[10px] uppercase tracking-widest text-amber-400 font-bold">
                            Corporación Tachirense de Turismo
                        </p>
                        <h1 class="text-sm font-extrabold text-white leading-tight">
                            Encuesta de Perfil del Visitante
                        </h1>
                    </div>
                    <div class="inline-flex items-center bg-white/5 border border-white/15 px-2.5 py-1 rounded-md text-[11px] self-start sm:self-auto">
                        <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5 animate-pulse"></span>
                        <span class="font-medium text-slate-300 mr-1">Punto:</span>
                        <span class="font-bold text-white truncate max-w-[200px]" id="header-point-name">
                            ${escapeHtml(activePointName)}
                        </span>
                    </div>
                </div>

                <!-- Indicador Pasivo por Ubicación GPS (Verifica si está en el formulario del punto correcto) -->
                <div id="header-gps-passive-banner" class="hidden mt-2.5 pt-2 border-t border-white/10"></div>

            </div>
        </header>
    `;

    // Vincular clic al botón de tema
    const btnTheme = document.getElementById("btn-toggle-theme");
    if (btnTheme) {
        btnTheme.addEventListener("click", () => {
            toggleTheme();
        });
    }
}

/**
 * Muestra un aviso pasivo (no bloqueante) basado en el GPS del dispositivo:
 * - Si coincide con el punto del formulario actual: NO emite ningún aviso para mantener la interfaz limpia.
 * - Si el GPS detecta que está físicamente en otro punto de control activo: muestra aviso pasivo
 *   sugiriendo cambiar con un solo toque al formulario correspondiente.
 */
export function updatePassiveGpsIndicator({
    coincidePuntoActual,
    puntoCercano,
    distanciaKm,
    onSwitchPointCallback
}) {
    const banner = document.getElementById("header-gps-passive-banner");
    if (!banner) return;

    // Regla estricta: Si está en el punto correcto, mantener la barra oculta y limpia sin avisos
    if (coincidePuntoActual || !puntoCercano) {
        banner.classList.add("hidden");
        banner.innerHTML = "";
        return;
    }

    banner.classList.remove("hidden");
    const distTexto = distanciaKm < 1
        ? `${Math.round(distanciaKm * 1000)} m`
        : `${distanciaKm.toFixed(1)} km`;

    banner.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] bg-amber-500/20 border border-amber-400/40 text-amber-200 px-3 py-2 rounded-lg">
            <span class="flex items-center gap-1.5">
                <span>📡</span>
                <span><b>Aviso GPS:</b> Tu ubicación física está en <b>"${escapeHtml(puntoCercano.nombre)}"</b> (a ${distTexto}).</span>
            </span>
            <button type="button" id="btn-switch-gps-point"
                class="shrink-0 px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold rounded-md text-[10px] uppercase tracking-wider shadow transition-colors">
                Cambiar a ese punto
            </button>
        </div>
    `;

    const btnSwitch = document.getElementById("btn-switch-gps-point");
    if (btnSwitch && typeof onSwitchPointCallback === "function") {
        btnSwitch.addEventListener("click", () => {
            onSwitchPointCallback(puntoCercano);
        });
    }
}
