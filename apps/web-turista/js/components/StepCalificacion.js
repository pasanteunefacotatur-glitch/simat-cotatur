/**
 * ==============================================================================
 * PROYECTO: Sistema de Medición y Estadística Turística (Borrador Fase 1)
 * ARCHIVO: components/StepCalificacion.js
 * DESCRIPCIÓN: Sección III - Evaluación numérica de servicios (Escala 1 al 5).
 *              Consume CRITERIOS_EVALUACION desde config.js.
 * ==============================================================================
 */

import { CRITERIOS_EVALUACION } from "../config.js";

export function renderStepCalificacion(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const criteriosHTML = CRITERIOS_EVALUACION.map(c => `
        <div class="py-3 border-b border-gray-100 dark:border-slate-800 last:border-b-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
                <span class="text-xs sm:text-sm font-bold text-gray-800 dark:text-slate-200">${c.label}</span>
                <span class="text-[10px] text-slate-600 dark:text-slate-400 block">Escala: 1 (Deficiente) a 5 (Excelente)</span>
            </div>
            <div class="flex items-center justify-between w-full sm:w-auto gap-1 sm:gap-1.5" data-rating-group="${c.id}" data-current="${c.default}">
                ${[1, 2, 3, 4, 5].map(num => `
                    <button type="button" data-val="${num}" data-selected="${num === c.default ? 'true' : 'false'}"
                        class="rating-pill-btn flex-1 sm:flex-initial rounded-xl text-xs font-bold transition-all flex items-center justify-center">
                        ${num === 5 ? '★ 5' : num}
                    </button>
                `).join("")}
            </div>
        </div>
    `).join("");

    container.innerHTML = `
        <section class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm space-y-3.5 transition-all duration-200">
            <div class="border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                <div>
                    <h2 class="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
                        <span class="text-emerald-600 dark:text-emerald-400">⭐</span>
                        <span>IV. Tu valoración de la experiencia</span>
                    </h2>
                    <p class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        Califica de 1 a 5 cómo percibes la vialidad, seguridad y hospitalidad andina.
                    </p>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full border border-emerald-300 dark:border-emerald-800">
                    Paso 4 de 4
                </span>
            </div>

            <div class="divide-y divide-gray-100 dark:divide-slate-800">
                ${criteriosHTML}
            </div>
        </section>
    `;

    // Interacción táctil completamente reactiva a temas (sin sobreescritura destructiva de className)
    container.querySelectorAll("[data-rating-group]").forEach(group => {
        const buttons = group.querySelectorAll(".rating-pill-btn");
        buttons.forEach(btn => {
            btn.addEventListener("click", () => {
                const val = parseInt(btn.getAttribute("data-val"), 10);
                group.setAttribute("data-current", val);
                buttons.forEach(b => {
                    const bVal = parseInt(b.getAttribute("data-val"), 10);
                    b.setAttribute("data-selected", bVal === val ? "true" : "false");
                });
            });
        });
    });
}
