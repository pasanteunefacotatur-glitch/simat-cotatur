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
        <div class="py-2.5 border-b border-gray-200 last:border-b-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span class="text-xs font-medium text-gray-800">${c.label}</span>
            <div class="flex space-x-1" data-rating-group="${c.id}" data-current="${c.default}">
                ${[1, 2, 3, 4, 5].map(num => `
                    <button type="button" data-val="${num}" 
                        class="rating-btn w-9 h-8 rounded border text-xs font-semibold transition-colors ${
                            num === c.default
                                ? "bg-slate-800 text-white border-slate-800"
                                : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                        }">
                        ${num}
                    </button>
                `).join("")}
            </div>
        </div>
    `).join("");

    container.innerHTML = `
        <section class="bg-white dark:bg-slate-900 rounded border border-gray-300 dark:border-slate-800 p-5 shadow-sm space-y-3">
            <div class="border-b border-gray-200 dark:border-slate-800 pb-2.5">
                <h2 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                    IV. Evaluación de Servicios
                </h2>
                <p class="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                    Indique su valoración del 1 al 5, donde 5 representa la mejor experiencia.
                </p>
            </div>

            <div class="divide-y divide-gray-200 dark:divide-slate-800">
                ${criteriosHTML}
            </div>
        </section>
    `;

    // Interacción de los botones numéricos (1 al 5)
    container.querySelectorAll("[data-rating-group]").forEach(group => {
        const buttons = group.querySelectorAll(".rating-btn");
        buttons.forEach(btn => {
            btn.addEventListener("click", () => {
                const val = parseInt(btn.getAttribute("data-val"), 10);
                group.setAttribute("data-current", val);
                buttons.forEach(b => {
                    const bVal = parseInt(b.getAttribute("data-val"), 10);
                    if (bVal === val) {
                        b.className = "rating-btn w-9 h-8 rounded border text-xs font-semibold transition-colors bg-slate-800 text-white border-slate-800";
                    } else {
                        b.className = "rating-btn w-9 h-8 rounded border text-xs font-semibold transition-colors bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100";
                    }
                });
            });
        });
    });
}
