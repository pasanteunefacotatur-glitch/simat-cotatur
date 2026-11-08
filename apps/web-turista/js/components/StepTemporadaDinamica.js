/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-turista/js/components/StepTemporadaDinamica.js
 * DESCRIPCIÓN: Sección dinámica de preguntas específicas por Temporada/Evento.
 *              Detecta automáticamente el asueto activo (o permite selección)
 *              y despliega preguntas condicionales táctiles (FISS, Carnavales,
 *              Semana Santa, Santo Cristo, Consolación, Vacaciones, Fin de Año).
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

import { TEMPORADAS_CONFIG } from "../config.js";

let currentTemporadaCodigo = "REGULAR";
const respuestasState = {};

/**
 * Renderiza el bloque de preguntas específicas de la temporada activa.
 */
export function renderStepTemporadaDinamica(containerId, temporadaCodigo = "REGULAR", onTemporadaChange = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    currentTemporadaCodigo = TEMPORADAS_CONFIG[temporadaCodigo] ? temporadaCodigo : "REGULAR";
    const config = TEMPORADAS_CONFIG[currentTemporadaCodigo] || TEMPORADAS_CONFIG.REGULAR;

    // Opciones del selector de temporada/asueto
    const temporadaOptions = Object.keys(TEMPORADAS_CONFIG).map(key => {
        const t = TEMPORADAS_CONFIG[key];
        const isSelected = key === currentTemporadaCodigo ? "selected" : "";
        return `<option value="${t.codigo}" ${isSelected}>${t.badge || t.titulo}</option>`;
    }).join("");

    // Generar markup de preguntas específicas
    let preguntasMarkup = "";
    if (config.preguntas && config.preguntas.length > 0) {
        preguntasMarkup = config.preguntas.map(p => {
            const opcionesBtns = p.opciones.map((op, idx) => {
                const isSingle = p.tipo === "chips_single";
                const isSelected = isSingle && idx === 0 ? "data-selected='true'" : "";
                const activeClasses = isSingle && idx === 0
                    ? "bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 border-slate-900 dark:border-amber-500 font-bold"
                    : "bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-200 border-gray-300 dark:border-slate-700 font-medium";

                return `
                    <button type="button" data-question-id="${p.id}" data-value="${op}" ${isSelected}
                        class="btn-temp-option py-2 px-3 border rounded text-xs text-left transition-colors ${activeClasses}">
                        ${op}
                    </button>
                `;
            }).join("");

            return `
                <div class="space-y-1.5 pt-1">
                    <label class="block text-xs font-semibold text-gray-700 dark:text-slate-300">
                        ${p.label}
                    </label>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2" data-question-group="${p.id}" data-type="${p.tipo}">
                        ${opcionesBtns}
                    </div>
                </div>
            `;
        }).join("");
    } else {
        preguntasMarkup = `
            <div class="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg text-xs text-amber-800 dark:text-amber-300">
                <span>📍 Temporada Regular de Afluencia Turística en el Estado Táchira.</span>
            </div>
        `;
    }

    container.innerHTML = `
        <section class="bg-white dark:bg-slate-900 rounded border border-gray-300 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div class="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2.5">
                <div>
                    <h2 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                        III. Operativo / Temporada Activa
                    </h2>
                    <p class="text-[11px] text-gray-500 dark:text-slate-400">
                        Preguntas específicas para el balance estadístico oficial de COTATUR.
                    </p>
                </div>
                <span class="text-xs font-extrabold px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-400 border border-amber-300 dark:border-amber-800 rounded-full">
                    ${config.badge || "Turismo"}
                </span>
            </div>

            <!-- Selector de Evento / Temporada -->
            <div>
                <label for="select-temporada-activa" class="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    Temporada o fiesta activa en el Táchira
                </label>
                <select id="select-temporada-activa"
                    class="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-amber-500 outline-none">
                    ${temporadaOptions}
                </select>
            </div>

            <!-- Contenedor de preguntas condicionales de la temporada -->
            <div id="preguntas-temporada-mount" class="space-y-3">
                ${preguntasMarkup}
            </div>
        </section>
    `;

    // Manejar clics en los botones de opciones
    setupQuestionInteractions(container);

    // Escuchar cambio de temporada
    const selectTemp = container.querySelector("#select-temporada-activa");
    if (selectTemp) {
        selectTemp.addEventListener("change", (e) => {
            const nuevaTemp = e.target.value;
            renderStepTemporadaDinamica(containerId, nuevaTemp, onTemporadaChange);
            if (typeof onTemporadaChange === "function") {
                onTemporadaChange(nuevaTemp);
            }
        });
    }
}

/**
 * Configura los eventos táctiles para preguntas de selección única o múltiple.
 */
function setupQuestionInteractions(container) {
    const groups = container.querySelectorAll("[data-question-group]");
    groups.forEach(group => {
        const isSingle = group.getAttribute("data-type") === "chips_single";
        const btns = group.querySelectorAll(".btn-temp-option");

        btns.forEach(btn => {
            btn.addEventListener("click", () => {
                if (isSingle) {
                    btns.forEach(b => {
                        b.classList.remove("bg-slate-900", "dark:bg-amber-500", "text-white", "dark:text-slate-950", "border-slate-900", "dark:border-amber-500", "font-bold");
                        b.classList.add("bg-gray-50", "dark:bg-slate-800", "text-gray-700", "dark:text-slate-200", "border-gray-300", "dark:border-slate-700", "font-medium");
                        b.removeAttribute("data-selected");
                    });
                    btn.classList.remove("bg-gray-50", "dark:bg-slate-800", "text-gray-700", "dark:text-slate-200", "border-gray-300", "dark:border-slate-700", "font-medium");
                    btn.classList.add("bg-slate-900", "dark:bg-amber-500", "text-white", "dark:text-slate-950", "border-slate-900", "dark:border-amber-500", "font-bold");
                    btn.setAttribute("data-selected", "true");
                } else {
                    // Multi-select toggle
                    const isSelected = btn.getAttribute("data-selected") === "true";
                    if (isSelected) {
                        btn.removeAttribute("data-selected");
                        btn.classList.remove("bg-slate-900", "dark:bg-amber-500", "text-white", "dark:text-slate-950", "border-slate-900", "dark:border-amber-500", "font-bold");
                        btn.classList.add("bg-gray-50", "dark:bg-slate-800", "text-gray-700", "dark:text-slate-200", "border-gray-300", "dark:border-slate-700", "font-medium");
                    } else {
                        btn.setAttribute("data-selected", "true");
                        btn.classList.remove("bg-gray-50", "dark:bg-slate-800", "text-gray-700", "dark:text-slate-200", "border-gray-300", "dark:border-slate-700", "font-medium");
                        btn.classList.add("bg-slate-900", "dark:bg-amber-500", "text-white", "dark:text-slate-950", "border-slate-900", "dark:border-amber-500", "font-bold");
                    }
                }
            });
        });
    });
}

/**
 * Obtiene las respuestas seleccionadas para la temporada actual.
 */
export function getRespuestasTemporada(containerId = "step-temporada-mount") {
    const container = document.getElementById(containerId);
    if (!container) return {};

    const respuestas = {};
    const groups = container.querySelectorAll("[data-question-group]");

    groups.forEach(group => {
        const qId = group.getAttribute("data-question-group");
        const isSingle = group.getAttribute("data-type") === "chips_single";
        const selected = group.querySelectorAll("[data-selected='true']");

        if (isSingle) {
            respuestas[qId] = selected.length > 0 ? selected[0].getAttribute("data-value") : null;
        } else {
            respuestas[qId] = Array.from(selected).map(s => s.getAttribute("data-value"));
        }
    });

    return respuestas;
}

/**
 * Retorna el código de temporada actualmente seleccionado.
 */
export function getTemporadaCodigoActual(containerId = "step-temporada-mount") {
    const select = document.querySelector(`#${containerId} #select-temporada-activa`);
    return select ? select.value : currentTemporadaCodigo;
}
