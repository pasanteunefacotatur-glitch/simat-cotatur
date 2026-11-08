/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-turista/js/components/StepTemporadaDinamica.js
 * DESCRIPCIÓN: Sección dinámica de preguntas específicas por Temporada/Evento
 *              estrictamente vinculada al Calendario Oficial de Asuetos:
 *              - 0 asuetos activos hoy: Se fija REGULAR automáticamente y se oculta
 *                el bloque de selección para evitar errores humanos.
 *              - 1 asueto activo hoy: Se fija automáticamente ese asueto (sin selector
 *                de otros asuetos) y se despliegan sus preguntas específicas.
 *              - 2 o más asuetos coinciden hoy: Se muestra el selector ÚNICAMENTE
 *                con esos asuetos disponibles hoy para que seleccione uno.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

import { TEMPORADAS_CONFIG } from "../config.js";

let currentTemporadaCodigo = "REGULAR";
let cachedAsuetosHoy = [];

/**
 * Renderiza el bloque de temporada en base a la lista de asuetos activos en la fecha de hoy.
 * @param {string} containerId - ID del contenedor DOM
 * @param {Array} asuetosActivosHoy - Lista de eventos activos hoy desde el calendario [{ codigo, nombre, tipo_cuestionario, prioridad }]
 * @param {string|null} selectedTipoCodigo - Código de cuestionario seleccionado (opcional)
 */
export function renderStepTemporadaDinamica(containerId, asuetosActivosHoy = [], selectedTipoCodigo = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    cachedAsuetosHoy = Array.isArray(asuetosActivosHoy) ? asuetosActivosHoy : [];

    // CASO 1: 0 asuetos activos hoy en el calendario -> Fijar REGULAR y no mostrar selector
    if (cachedAsuetosHoy.length === 0) {
        currentTemporadaCodigo = "REGULAR";
        container.innerHTML = "";
        container.classList.add("hidden");
        return;
    }

    container.classList.remove("hidden");

    // Determinar cuál asueto de los disponibles hoy está activo
    const primerAsueto = cachedAsuetosHoy[0];
    const codigoElegido = selectedTipoCodigo && TEMPORADAS_CONFIG[selectedTipoCodigo]
        ? selectedTipoCodigo
        : (TEMPORADAS_CONFIG[primerAsueto.tipo_cuestionario] ? primerAsueto.tipo_cuestionario : "EVENTO_ESPECIAL");

    currentTemporadaCodigo = codigoElegido;
    const config = TEMPORADAS_CONFIG[currentTemporadaCodigo] || TEMPORADAS_CONFIG.EVENTO_ESPECIAL;
    const asuetoActualObj = cachedAsuetosHoy.find(a => a.tipo_cuestionario === currentTemporadaCodigo) || primerAsueto;

    // Generar preguntas específicas del asueto activo
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
    }

    // CASO 2: Exactamente 1 asueto activo hoy -> Se fija automáticamente sin selector desplegable
    // CASO 3: 2 o más asuetos activos hoy -> Mostrar selector SOLO con los asuetos disponibles hoy
    let cabeceraAsuetoHtml = "";
    if (cachedAsuetosHoy.length === 1) {
        cabeceraAsuetoHtml = `
            <div class="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/70 rounded-xl flex items-center justify-between gap-2">
                <div>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                        Calendario Oficial COTATUR • Temporada Activa
                    </span>
                    <span class="text-xs font-extrabold text-gray-900 dark:text-white">
                        📅 ${asuetoActualObj.nombre || config.titulo}
                    </span>
                </div>
                <span class="text-[11px] font-bold px-2.5 py-1 bg-amber-500 text-slate-950 rounded-full shrink-0">
                    Activo Hoy
                </span>
            </div>
        `;
    } else {
        const opcionesDisponiblesHoy = cachedAsuetosHoy.map(a => {
            const isSel = a.tipo_cuestionario === currentTemporadaCodigo ? "selected" : "";
            return `<option value="${a.tipo_cuestionario}" ${isSel}>📅 ${a.nombre}</option>`;
        }).join("");

        cabeceraAsuetoHtml = `
            <div>
                <label for="select-temporada-activa" class="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    Seleccione el evento o festividad correspondiente a su visita: <span class="text-red-500">*</span>
                </label>
                <select id="select-temporada-activa"
                    class="w-full bg-white dark:bg-slate-800 border-2 border-amber-500 rounded-lg px-3 py-2 text-sm font-bold text-gray-900 dark:text-white focus:border-amber-500 outline-none">
                    ${opcionesDisponiblesHoy}
                </select>
            </div>
        `;
    }

    container.innerHTML = `
        <section class="bg-white dark:bg-slate-900 rounded border border-gray-300 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div class="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2.5">
                <div>
                    <h2 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                        III. Evento o Temporada Activa
                    </h2>
                    <p class="text-[11px] text-gray-500 dark:text-slate-400">
                        Formulario ajustado automáticamente según la fecha del Calendario Oficial de COTATUR.
                    </p>
                </div>
                <span class="text-xs font-extrabold px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-400 border border-amber-300 dark:border-amber-800 rounded-full">
                    ${config.badge || "Operativo"}
                </span>
            </div>

            ${cabeceraAsuetoHtml}

            <!-- Contenedor de preguntas condicionales de la temporada -->
            <div id="preguntas-temporada-mount" class="space-y-3">
                ${preguntasMarkup}
            </div>
        </section>
    `;

    setupQuestionInteractions(container);

    // Si hay 2 o más asuetos hoy, permitir alternar únicamente entre ellos
    const selectTemp = container.querySelector("#select-temporada-activa");
    if (selectTemp) {
        selectTemp.addEventListener("change", (e) => {
            renderStepTemporadaDinamica(containerId, cachedAsuetosHoy, e.target.value);
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
    if (!container || cachedAsuetosHoy.length === 0) return {};

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
 * Retorna el código de temporada actualmente seleccionado según el calendario.
 */
export function getTemporadaCodigoActual(containerId = "step-temporada-mount") {
    if (cachedAsuetosHoy.length === 0) return "REGULAR";
    const select = document.querySelector(`#${containerId} #select-temporada-activa`);
    return select ? select.value : currentTemporadaCodigo;
}
