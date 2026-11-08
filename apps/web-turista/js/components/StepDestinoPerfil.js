/**
 * ==============================================================================
 * PROYECTO: Sistema de Medición y Estadística Turística (Borrador Fase 1)
 * ARCHIVO: components/StepDestinoPerfil.js
 * DESCRIPCIÓN: Sección II - Destino dentro del estado, motivo de viaje y estadía.
 *              Integra buscador autocompletable por Municipio, Capital o Pueblo,
 *              ordenado por los destinos más utilizados del Táchira.
 * ==============================================================================
 */

import {
    CATALOGO_MUNICIPIOS_TACHIRA,
    MOTIVOS_VIAJE,
    TIPOS_ALOJAMIENTO,
    COMPOSICION_GRUPO,
    RANGOS_EDAD
} from "../config.js";
import { createAutocomplete } from "./AutocompleteInput.js";

export function renderStepDestinoPerfil(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const motivosButtons = MOTIVOS_VIAJE.map(
        m => `
            <button type="button" data-motivo="${m.codigo}"
                class="btn-option py-2 px-3 border border-gray-300 dark:border-slate-700 rounded text-xs font-medium text-gray-700 dark:text-slate-200 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 text-left transition-colors">
                ${m.etiqueta}
            </button>
        `
    ).join("");

    const composicionButtons = COMPOSICION_GRUPO.map(
        c => `
            <button type="button" data-composicion="${c.codigo}"
                class="btn-comp py-2 px-3 border border-gray-300 dark:border-slate-700 rounded text-xs font-medium text-gray-700 dark:text-slate-200 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 text-left transition-colors">
                ${c.etiqueta}
            </button>
        `
    ).join("");

    const edadButtons = RANGOS_EDAD.map(
        e => `
            <button type="button" data-edad="${e.codigo}"
                class="btn-edad py-2 px-3 border border-gray-300 dark:border-slate-700 rounded text-xs font-medium text-gray-700 dark:text-slate-200 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 text-center transition-colors">
                ${e.etiqueta}
            </button>
        `
    ).join("");

    const alojamientosOptions = TIPOS_ALOJAMIENTO.map(
        a => `<option value="${a.codigo}">${a.etiqueta}</option>`
    ).join("");

    container.innerHTML = `
        <section class="bg-white dark:bg-slate-900 rounded border border-gray-300 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div class="border-b border-gray-200 dark:border-slate-800 pb-2.5">
                <h2 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                    II. Datos del Desplazamiento y Perfil del Viajero
                </h2>
            </div>

            <!-- Buscador Autocompletable de Municipio o Capital -->
            <div>
                <label for="select-municipio-destino" class="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    Municipio o capital de destino <span class="text-red-600">*</span>
                </label>
                <div id="mount-autocomplete-municipio"></div>
                <p class="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
                    Puede buscar por municipio, por su ciudad principal o por localidad turística.
                </p>
            </div>

            <!-- ¿Con quién realiza su viaje? -->
            <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    ¿Con quién realiza su viaje? <span class="text-red-600">*</span>
                </label>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2" id="group-composicion-viaje">
                    ${composicionButtons}
                </div>
            </div>

            <!-- Rango de edad predominante -->
            <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    Rango de edad del responsable o grupo <span class="text-red-600">*</span>
                </label>
                <div class="grid grid-cols-3 gap-2" id="group-rango-edad">
                    ${edadButtons}
                </div>
            </div>

            <!-- Motivo del Viaje -->
            <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    Motivo principal del viaje <span class="text-red-600">*</span>
                </label>
                <div class="grid grid-cols-2 gap-2" id="group-motivo-viaje">
                    ${motivosButtons}
                </div>
            </div>

            <!-- Grupo y Estadía -->
            <div class="grid grid-cols-2 gap-3 pt-1">
                <div>
                    <label for="input-grupo-tamano" class="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                        Integrantes del grupo
                    </label>
                    <input type="number" id="input-grupo-tamano" min="1" max="50" value="2"
                        class="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-amber-500 outline-none" />
                </div>
                <div>
                    <label for="input-dias-estadia" class="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                        Noches de pernocta
                    </label>
                    <input type="number" id="input-dias-estadia" min="0" max="90" value="3"
                        class="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-amber-500 outline-none" />
                </div>
            </div>

            <!-- Tipo de Alojamiento (Condicional: se oculta si noches == 0) -->
            <div id="wrapper-tipo-alojamiento">
                <label for="select-tipo-alojamiento" class="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    Tipo de alojamiento previsto
                </label>
                <select id="select-tipo-alojamiento"
                    class="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none">
                    ${alojamientosOptions}
                </select>
            </div>
        </section>
    `;

    // Inicializar autocompletado de municipios
    createAutocomplete({
        mountId: "mount-autocomplete-municipio",
        inputId: "select-municipio-destino",
        placeholder: "Escriba el municipio, capital o poblado de destino...",
        items: CATALOGO_MUNICIPIOS_TACHIRA,
        getLabel: (item) => `${item.municipio} — ${item.capital}`,
        getSubLabel: (item) => `Capital: ${item.capital} • Ref: ${item.referencias}`,
        getSearchString: (item) => `${item.municipio} ${item.capital} ${item.referencias}`,
        allowCustom: false
    });

    // Helper para botones toggle seleccionables
    const setupButtonGroup = (groupId, btnSelector, dataAttr, defaultIdx = 0) => {
        const btns = container.querySelectorAll(`${groupId} ${btnSelector}`);
        btns.forEach(btn => {
            btn.addEventListener("click", () => {
                btns.forEach(b => {
                    b.classList.remove("bg-slate-900", "dark:bg-amber-500", "text-white", "dark:text-slate-950", "border-slate-900", "dark:border-amber-500", "font-bold");
                    b.classList.add("bg-gray-50", "dark:bg-slate-800", "text-gray-700", "dark:text-slate-200", "border-gray-300", "dark:border-slate-700");
                    b.removeAttribute("data-selected");
                });
                btn.classList.remove("bg-gray-50", "dark:bg-slate-800", "text-gray-700", "dark:text-slate-200", "border-gray-300", "dark:border-slate-700");
                btn.classList.add("bg-slate-900", "dark:bg-amber-500", "text-white", "dark:text-slate-950", "border-slate-900", "dark:border-amber-500", "font-bold");
                btn.setAttribute("data-selected", "true");
            });
        });
        if (btns.length > defaultIdx) {
            btns[defaultIdx].click();
        }
    };

    setupButtonGroup("#group-composicion-viaje", "button", "data-composicion", 0);
    setupButtonGroup("#group-rango-edad", "button", "data-edad", 1);
    setupButtonGroup("#group-motivo-viaje", "button", "data-motivo", 0);

    // Lógica condicional RF-02: Si noches de pernocta es 0, ocultar alojamiento
    const inputDias = document.getElementById("input-dias-estadia");
    const wrapperAlojamiento = document.getElementById("wrapper-tipo-alojamiento");
    const selectAlojamiento = document.getElementById("select-tipo-alojamiento");

    inputDias.addEventListener("input", () => {
        const dias = parseInt(inputDias.value || "0", 10);
        if (dias === 0) {
            wrapperAlojamiento.classList.add("hidden");
            selectAlojamiento.value = "SIN_PERNOCTA";
        } else {
            wrapperAlojamiento.classList.remove("hidden");
            if (selectAlojamiento.value === "SIN_PERNOCTA") {
                selectAlojamiento.value = "POSADA";
            }
        }
    });
}
