/**
 * ==============================================================================
 * PROYECTO: Sistema de Medición y Estadística Turística (Borrador Fase 1)
 * ARCHIVO: components/StepProcedencia.js
 * DESCRIPCIÓN: Sección I - Datos de procedencia del visitante.
 *              Integra autocompletado ordenado por frecuencia de uso para Países
 *              y listado priorizado de Estados de Venezuela.
 * ==============================================================================
 */

import { ESTADOS_VENEZUELA, CATALOGO_PAISES } from "../config.js";
import { createAutocomplete } from "./AutocompleteInput.js";

export function renderStepProcedencia(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const estadosOptions = ESTADOS_VENEZUELA.map(
        estado => `<option value="${estado}">${estado}</option>`
    ).join("");

    container.innerHTML = `
        <section class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm transition-all duration-200">
            <div class="border-b border-gray-100 dark:border-slate-800 pb-3 mb-4 flex items-center justify-between">
                <div>
                    <h2 class="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
                        <span class="text-emerald-600 dark:text-emerald-400">📍</span>
                        <span>I. ¿Desde dónde nos visitas?</span>
                    </h2>
                    <p class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        Tu lugar de residencia habitual nos ayuda a planificar mejores rutas y servicios.
                    </p>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full border border-emerald-300 dark:border-emerald-800">
                    Paso 1 de 4
                </span>
            </div>

            <!-- Selector de tipo de procedencia -->
            <div class="mb-4">
                <label class="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    Tipo de procedencia <span class="text-red-500">*</span>
                </label>
                <div class="grid grid-cols-2 gap-2.5">
                    <button type="button" id="btn-origen-nacional" data-selected="true"
                        class="chip-btn rounded-xl py-3 px-3 text-xs font-bold flex items-center justify-center gap-1.5 tap-target-btn">
                        <span>🇻🇪</span>
                        <span>Desde Venezuela</span>
                    </button>
                    <button type="button" id="btn-origen-internacional" data-selected="false"
                        class="chip-btn rounded-xl py-3 px-3 text-xs font-bold flex items-center justify-center gap-1.5 tap-target-btn">
                        <span>🌎</span>
                        <span>Del Extranjero</span>
                    </button>
                </div>
            </div>

            <!-- Selector de Estado de Procedencia Nacional -->
            <div id="wrapper-origen-nacional">
                <label for="select-estado-origen" class="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    Estado de residencia habitual <span class="text-red-500">*</span>
                </label>
                <select id="select-estado-origen" 
                    class="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-3 text-sm text-gray-900 dark:text-white focus:border-[#198754] focus:ring-1 focus:ring-[#198754] outline-none transition-all">
                    <option value="" disabled selected>Seleccione el estado de procedencia...</option>
                    ${estadosOptions}
                </select>
            </div>

            <!-- Buscador Autocompletable de País (Internacional) -->
            <div id="wrapper-origen-internacional" class="hidden">
                <label for="input-pais-origen" class="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    País de procedencia <span class="text-red-500">*</span>
                </label>
                <div id="mount-autocomplete-pais"></div>
                <p class="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
                    Escriba el nombre del país para autocompletar la selección.
                </p>
            </div>
        </section>
    `;

    // Inicializar autocompletado de países ordenado por mayor uso
    createAutocomplete({
        mountId: "mount-autocomplete-pais",
        inputId: "input-pais-origen",
        placeholder: "Indique el país de procedencia...",
        items: CATALOGO_PAISES,
        getLabel: (item) => item.nombre,
        getSubLabel: (item) => item.referencias ? `Ref: ${item.referencias}` : "",
        getSearchString: (item) => `${item.nombre} ${item.codigo} ${item.referencias || ""}`,
        allowCustom: true
    });

    // Control de alternancia entre Nacional e Internacional sin destruir clases
    const btnNacional = document.getElementById("btn-origen-nacional");
    const btnInternacional = document.getElementById("btn-origen-internacional");
    const wrapNacional = document.getElementById("wrapper-origen-nacional");
    const wrapInternacional = document.getElementById("wrapper-origen-internacional");

    btnNacional.addEventListener("click", () => {
        btnNacional.setAttribute("data-selected", "true");
        btnInternacional.setAttribute("data-selected", "false");
        wrapNacional.classList.remove("hidden");
        wrapInternacional.classList.add("hidden");
    });

    btnInternacional.addEventListener("click", () => {
        btnInternacional.setAttribute("data-selected", "true");
        btnNacional.setAttribute("data-selected", "false");
        wrapInternacional.classList.remove("hidden");
        wrapNacional.classList.add("hidden");
    });
}
