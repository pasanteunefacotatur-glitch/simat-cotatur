/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-turista/js/components/Header.js
 * DESCRIPCIÓN: Encabezado público para turistas con logos oficiales de COTATUR
 *              y Táchira es Turismo (tachiraesturismo.com.ve), lista desplegable
 *              de temas (Predeterminado: Sistema) y punto de control activo.
 *              Excluye controles administrativos para blindar la vista del visitante.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

import { renderThemeDropdownHtml, bindThemeDropdown } from "./ThemeManager.js";

export function renderHeader(containerId, activePointName = "Peaje Vega de Táriba - Troncal 1") {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <header class="bg-[#1c1c1c] text-white border-b-4 border-amber-500 pt-safe shadow-md font-['Montserrat',sans-serif]">
            <div class="max-w-xl mx-auto px-4 py-3">
                
                <!-- Barra superior: Logos oficiales y Lista Desplegable de Temas -->
                <div class="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2.5">
                    <!-- Logos oficiales COTATUR + Táchira es Turismo -->
                    <div class="flex items-center space-x-3">
                        <img src="./assets/img/logo_cotatur.png" alt="COTATUR Logo" class="h-10 w-auto object-contain drop-shadow" />
                        <div class="h-7 w-[1px] bg-white/20"></div>
                        <img src="./assets/img/logo_tachira.png" alt="Táchira Turismo Logo" class="h-8 w-auto object-contain drop-shadow" />
                    </div>

                    <!-- Lista desplegable de temas (Predeterminado: Sistema) -->
                    <div class="flex items-center space-x-2">
                        ${renderThemeDropdownHtml()}
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
                            ${activePointName}
                        </span>
                    </div>
                </div>

            </div>
        </header>
    `;

    // Enlazar evento al dropdown
    bindThemeDropdown("select-theme-dropdown");
}
