/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: components/StepProcedencia.js
 * DESCRIPCIÓN: Sección 1 - Captura rápida del origen del visitante
 *              (Nacional por Estados o Internacional por Países).
 * ==============================================================================
 */

import { ESTADOS_VENEZUELA } from "../config.js";

export function renderStepProcedencia(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Generar opciones de estados
    const estadosOptions = ESTADOS_VENEZUELA.map(
        estado => `<option value="${estado}">${estado}</option>`
    ).join("");

    container.innerHTML = `
        <div class="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 transition-all hover:shadow-md">
            <div class="flex items-center space-x-3 mb-4">
                <span class="w-7 h-7 bg-blue-100 text-blue-900 font-extrabold rounded-full flex items-center justify-center text-xs">
                    1
                </span>
                <h3 class="text-base font-bold text-slate-800">
                    ¿De dónde nos visitas?
                </h3>
            </div>

            <!-- Selector Píldora: Nacional vs Internacional -->
            <div class="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl mb-4">
                <button type="button" id="btn-origen-nacional"
                    class="py-2.5 text-xs font-bold rounded-xl transition-all shadow-sm bg-blue-900 text-white">
                    🇻🇪 Venezuela
                </button>
                <button type="button" id="btn-origen-internacional"
                    class="py-2.5 text-xs font-bold rounded-xl transition-all text-slate-600 hover:text-slate-900">
                    🌎 Internacional
                </button>
            </div>

            <!-- Contenedor dinámico según selección -->
            <div id="wrapper-origen-nacional" class="space-y-2">
                <label for="select-estado-origen" class="block text-xs font-semibold text-slate-600">
                    Estado de Procedencia:
                </label>
                <select id="select-estado-origen" 
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all">
                    <option value="" disabled selected>Selecciona tu Estado de origen...</option>
                    ${estadosOptions}
                </select>
            </div>

            <div id="wrapper-origen-internacional" class="space-y-2 hidden">
                <label for="input-pais-origen" class="block text-xs font-semibold text-slate-600">
                    País de Procedencia:
                </label>
                <input type="text" id="input-pais-origen" placeholder="Ej: Colombia, Estados Unidos, España..."
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all" />
            </div>
        </div>
    `;

    // Listeners para cambiar entre Nacional e Internacional
    const btnNacional = document.getElementById("btn-origen-nacional");
    const btnInternacional = document.getElementById("btn-origen-internacional");
    const wrapNacional = document.getElementById("wrapper-origen-nacional");
    const wrapInternacional = document.getElementById("wrapper-origen-internacional");

    btnNacional.addEventListener("click", () => {
        btnNacional.className = "py-2.5 text-xs font-bold rounded-xl transition-all shadow-sm bg-blue-900 text-white";
        btnInternacional.className = "py-2.5 text-xs font-bold rounded-xl transition-all text-slate-600 hover:text-slate-900";
        wrapNacional.classList.remove("hidden");
        wrapInternacional.classList.add("hidden");
    });

    btnInternacional.addEventListener("click", () => {
        btnInternacional.className = "py-2.5 text-xs font-bold rounded-xl transition-all shadow-sm bg-blue-900 text-white";
        btnNacional.className = "py-2.5 text-xs font-bold rounded-xl transition-all text-slate-600 hover:text-slate-900";
        wrapInternacional.classList.remove("hidden");
        wrapNacional.classList.add("hidden");
    });
}
