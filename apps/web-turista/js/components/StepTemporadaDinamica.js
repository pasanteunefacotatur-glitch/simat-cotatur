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
                const isSelected = isSingle && idx === 0 ? "data-selected='true'" : "data-selected='false'";

                return `
                    <button type="button" data-question-id="${p.id}" data-value="${op}" ${isSelected}
                        class="btn-temp-option chip-btn py-3 px-3.5 rounded-xl text-xs font-semibold text-left transition-all tap-target-btn">
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
            <div class="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/70 rounded-2xl flex items-center justify-between gap-2 shadow-sm">
                <div>
                    <span class="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block">
                        🎡 Calendario Oficial COTATUR • Temporada en Curso
                    </span>
                    <span class="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white">
                        ${asuetoActualObj.nombre || config.titulo}
                    </span>
                </div>
                <span class="text-[11px] font-bold px-3 py-1 bg-[#198754] text-white rounded-full shrink-0 shadow-sm">
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
                    Seleccione la festividad o motivo de su visita: <span class="text-red-500">*</span>
                </label>
                <select id="select-temporada-activa"
                    class="w-full bg-white dark:bg-slate-800 border-2 border-[#198754] rounded-xl px-3.5 py-3 text-sm font-bold text-gray-900 dark:text-white focus:ring-1 focus:ring-[#198754] outline-none">
                    ${opcionesDisponiblesHoy}
                </select>
            </div>
        `;
    }

    container.innerHTML = `
        <section class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm space-y-4 transition-all duration-200">
            <div class="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                <div>
                    <h2 class="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
                        <span class="text-emerald-600 dark:text-emerald-400">🎡</span>
                        <span>III. Festividad o Temporada Activa</span>
                    </h2>
                    <p class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        Preguntas específicas para el operativo turístico del momento.
                    </p>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full border border-emerald-300 dark:border-emerald-800">
                    Paso 3 de 4
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
 * Configura los eventos táctiles para preguntas de selección única o múltiple de forma reactiva.
 */
function setupQuestionInteractions(container) {
    const groups = container.querySelectorAll("[data-question-group]");
    groups.forEach(group => {
        const isSingle = group.getAttribute("data-type") === "chips_single";
        const btns = group.querySelectorAll(".btn-temp-option");

        btns.forEach(btn => {
            btn.addEventListener("click", () => {
                if (isSingle) {
                    btns.forEach(b => b.setAttribute("data-selected", "false"));
                    btn.setAttribute("data-selected", "true");
                } else {
                    const isSelected = btn.getAttribute("data-selected") === "true";
                    btn.setAttribute("data-selected", isSelected ? "false" : "true");
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
