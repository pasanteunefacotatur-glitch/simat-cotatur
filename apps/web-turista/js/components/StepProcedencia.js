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
        <section class="bg-white rounded border border-gray-300 p-5 shadow-sm">
            <div class="border-b border-gray-200 pb-2.5 mb-4">
                <h2 class="text-sm font-bold text-gray-900 uppercase tracking-wide">
                    I. Lugar de Procedencia
                </h2>
            </div>

            <!-- Selector de tipo de procedencia -->
            <div class="mb-4">
                <label class="block text-xs font-semibold text-gray-700 mb-2">
                    Tipo de procedencia <span class="text-red-600">*</span>
                </label>
                <div class="grid grid-cols-2 gap-2">
                    <button type="button" id="btn-origen-nacional"
                        class="py-2 px-3 text-xs font-semibold rounded border border-slate-800 bg-slate-800 text-white transition-colors">
                        Nacional (Venezuela)
                    </button>
                    <button type="button" id="btn-origen-internacional"
                        class="py-2 px-3 text-xs font-semibold rounded border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors">
                        Internacional (Otro país)
                    </button>
                </div>
            </div>

            <!-- Selector de Estado (Nacional - Ordenado por los más frecuentes) -->
            <div id="wrapper-origen-nacional">
                <label for="select-estado-origen" class="block text-xs font-semibold text-gray-700 mb-1.5">
                    Estado de residencia habitual <span class="text-red-600">*</span>
                </label>
                <select id="select-estado-origen" 
                    class="w-full bg-white border border-gray-300 rounded px-3 py-2.5 text-sm text-gray-900 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none">
                    <option value="" disabled selected>Seleccione un estado (ordenados por frecuencia)...</option>
                    ${estadosOptions}
                </select>
            </div>

            <!-- Buscador Autocompletable de País (Internacional) -->
            <div id="wrapper-origen-internacional" class="hidden">
                <label for="input-pais-origen" class="block text-xs font-semibold text-gray-700 mb-1.5">
                    País de residencia habitual <span class="text-red-600">*</span>
                </label>
                <div id="mount-autocomplete-pais"></div>
                <p class="text-[11px] text-gray-500 mt-1">
                    Escriba el país o ciudad para autocompletar, o elija entre los más frecuentes.
                </p>
            </div>
        </section>
    `;

    // Inicializar autocompletado de países ordenado por mayor uso
    createAutocomplete({
        mountId: "mount-autocomplete-pais",
        inputId: "input-pais-origen",
        placeholder: "Escriba o seleccione el país (ej. Colombia, España)...",
        items: CATALOGO_PAISES,
        getLabel: (item) => item.nombre,
        getSubLabel: (item) => item.referencias ? `Ref: ${item.referencias}` : "",
        getSearchString: (item) => `${item.nombre} ${item.codigo} ${item.referencias || ""}`,
        allowCustom: true
    });

    // Control de alternancia entre Nacional e Internacional
    const btnNacional = document.getElementById("btn-origen-nacional");
    const btnInternacional = document.getElementById("btn-origen-internacional");
    const wrapNacional = document.getElementById("wrapper-origen-nacional");
    const wrapInternacional = document.getElementById("wrapper-origen-internacional");

    btnNacional.addEventListener("click", () => {
        btnNacional.className = "py-2 px-3 text-xs font-semibold rounded border border-slate-800 bg-slate-800 text-white transition-colors";
        btnInternacional.className = "py-2 px-3 text-xs font-semibold rounded border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors";
        wrapNacional.classList.remove("hidden");
        wrapInternacional.classList.add("hidden");
    });

    btnInternacional.addEventListener("click", () => {
        btnInternacional.className = "py-2 px-3 text-xs font-semibold rounded border border-slate-800 bg-slate-800 text-white transition-colors";
        btnNacional.className = "py-2 px-3 text-xs font-semibold rounded border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors";
        wrapInternacional.classList.remove("hidden");
        wrapNacional.classList.add("hidden");
    });
}
