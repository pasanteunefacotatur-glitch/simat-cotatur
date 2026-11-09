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
            <button type="button" data-motivo="${m.codigo}" data-selected="false"
                class="chip-btn py-3 px-3.5 rounded-xl text-xs font-semibold text-left transition-all tap-target-btn flex items-center gap-2">
                <span>📍</span>
                <span>${m.etiqueta}</span>
            </button>
        `
    ).join("");

    const composicionButtons = COMPOSICION_GRUPO.map(
        c => `
            <button type="button" data-composicion="${c.codigo}" data-selected="false"
                class="chip-btn py-3 px-3.5 rounded-xl text-xs font-semibold text-left transition-all tap-target-btn flex items-center gap-2">
                <span>👥</span>
                <span>${c.etiqueta}</span>
            </button>
        `
    ).join("");

    const edadButtons = RANGOS_EDAD.map(
        e => `
            <button type="button" data-edad="${e.codigo}" data-selected="false"
                class="chip-btn py-3 px-3 rounded-xl text-xs font-semibold text-center transition-all tap-target-btn">
                ${e.etiqueta}
            </button>
        `
    ).join("");

    const alojamientosOptions = TIPOS_ALOJAMIENTO.map(
        a => `<option value="${a.codigo}">${a.etiqueta}</option>`
    ).join("");

    container.innerHTML = `
        <section class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm space-y-4.5 transition-all duration-200">
            <div class="border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                <div>
                    <h2 class="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
                        <span class="text-emerald-600 dark:text-emerald-400">🗺️</span>
                        <span>II. Tu estadía en nuestra tierra</span>
                    </h2>
                    <p class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        Indícanos tu destino y características de tu viaje en el Táchira.
                    </p>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full border border-emerald-300 dark:border-emerald-800">
                    Paso 2 de 4
                </span>
            </div>

            <!-- Buscador Autocompletable de Municipio o Capital -->
            <div>
                <label for="select-municipio-destino" class="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    ¿Cuál es tu municipio, capital o pueblo de destino? <span class="text-red-500">*</span>
                </label>
                <div id="mount-autocomplete-municipio"></div>
                <p class="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
                    Puedes escribir el municipio, la capital (ej: San Cristóbal) o atractivo turístico (ej: Peribeca).
                </p>
            </div>

            <!-- ¿Con quién viajas? -->
            <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    ¿Quiénes te acompañan en este viaje? <span class="text-red-500">*</span>
                </label>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2" id="group-composicion-viaje">
                    ${composicionButtons}
                </div>
            </div>

            <!-- Rango de edad predominante -->
            <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    Rango de edad predominante <span class="text-red-500">*</span>
                </label>
                <div class="grid grid-cols-3 gap-2" id="group-rango-edad">
                    ${edadButtons}
                </div>
            </div>

            <!-- Motivo del Viaje -->
            <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    ¿Cuál es el motivo principal de tu visita? <span class="text-red-500">*</span>
                </label>
                <div class="grid grid-cols-2 gap-2" id="group-motivo-viaje">
                    ${motivosButtons}
                </div>
            </div>

            <!-- Steppers táctiles ergonómicos para Grupo y Estadía (>= 44px) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                    <label class="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                        Integrantes del grupo
                    </label>
                    <div class="flex items-center space-x-2">
                        <button type="button" id="btn-dec-grupo" class="w-12 h-11 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 font-extrabold text-lg text-gray-700 dark:text-white tap-target-btn flex items-center justify-center">−</button>
                        <input type="number" id="input-grupo-tamano" min="1" max="50" value="2" readonly
                            class="flex-1 h-11 text-center font-extrabold text-base bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white outline-none" />
                        <button type="button" id="btn-inc-grupo" class="w-12 h-11 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 font-extrabold text-lg text-gray-700 dark:text-white tap-target-btn flex items-center justify-center">+</button>
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                        Noches de estadía previstas
                    </label>
                    <div class="flex items-center space-x-2">
                        <button type="button" id="btn-dec-dias" class="w-12 h-11 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 font-extrabold text-lg text-gray-700 dark:text-white tap-target-btn flex items-center justify-center">−</button>
                        <input type="number" id="input-dias-estadia" min="0" max="90" value="3" readonly
                            class="flex-1 h-11 text-center font-extrabold text-base bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white outline-none" />
                        <button type="button" id="btn-inc-dias" class="w-12 h-11 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 font-extrabold text-lg text-gray-700 dark:text-white tap-target-btn flex items-center justify-center">+</button>
                    </div>
                </div>
            </div>

            <!-- Tipo de Alojamiento (Condicional: se oculta si noches == 0) -->
            <div id="wrapper-tipo-alojamiento">
                <label for="select-tipo-alojamiento" class="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    ¿Dónde planeas alojarte?
                </label>
                <select id="select-tipo-alojamiento"
                    class="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-3 text-sm text-gray-900 dark:text-white focus:border-[#198754] focus:ring-1 focus:ring-[#198754] outline-none transition-all">
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

    // Helper para botones toggle seleccionables completamente reactivos a temas
    const setupButtonGroup = (groupId, btnSelector, dataAttr, defaultIdx = 0) => {
        const btns = container.querySelectorAll(`${groupId} ${btnSelector}`);
        btns.forEach(btn => {
            btn.addEventListener("click", () => {
                btns.forEach(b => b.setAttribute("data-selected", "false"));
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

    // Controles Steppers Táctiles (Integrantes y Días)
    const setupStepper = (btnDecId, btnIncId, inputId, minVal, maxVal, onChange) => {
        const btnDec = document.getElementById(btnDecId);
        const btnInc = document.getElementById(btnIncId);
        const input = document.getElementById(inputId);
        if (!btnDec || !btnInc || !input) return;

        btnDec.addEventListener("click", () => {
            let val = parseInt(input.value || "0", 10);
            if (val > minVal) {
                input.value = val - 1;
                input.dispatchEvent(new Event("input"));
                if (typeof onChange === "function") onChange(val - 1);
            }
        });

        btnInc.addEventListener("click", () => {
            let val = parseInt(input.value || "0", 10);
            if (val < maxVal) {
                input.value = val + 1;
                input.dispatchEvent(new Event("input"));
                if (typeof onChange === "function") onChange(val + 1);
            }
        });
    };

    const inputDias = document.getElementById("input-dias-estadia");
    const wrapperAlojamiento = document.getElementById("wrapper-tipo-alojamiento");
    const selectAlojamiento = document.getElementById("select-tipo-alojamiento");

    const actualizarAlojamiento = (dias) => {
        if (dias === 0) {
            wrapperAlojamiento.classList.add("hidden");
            selectAlojamiento.value = "SIN_PERNOCTA";
        } else {
            wrapperAlojamiento.classList.remove("hidden");
            if (selectAlojamiento.value === "SIN_PERNOCTA") {
                selectAlojamiento.value = "POSADA";
            }
        }
    };

    setupStepper("btn-dec-grupo", "btn-inc-grupo", "input-grupo-tamano", 1, 50);
    setupStepper("btn-dec-dias", "btn-inc-dias", "input-dias-estadia", 0, 90, actualizarAlojamiento);

    inputDias.addEventListener("input", () => {
        const dias = parseInt(inputDias.value || "0", 10);
        actualizarAlojamiento(dias);
    });
}
