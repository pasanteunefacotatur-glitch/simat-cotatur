/**
 * ==============================================================================
 * PROYECTO: Sistema de Medición y Estadística Turística (Borrador Fase 1)
 * ARCHIVO: components/Header.js
 * DESCRIPCIÓN: Encabezado formal e institucional del formulario de captura.
 * ==============================================================================
 */

export function renderHeader(containerId, activePointName = "Peaje Vega de Táriba - Troncal 1") {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <header class="bg-slate-900 text-white border-b-4 border-slate-700 pt-safe">
            <div class="max-w-xl mx-auto px-4 py-4">
                <div class="flex items-center justify-between border-b border-slate-700 pb-3 mb-3">
                    <div>
                        <p class="text-[11px] uppercase tracking-wider text-slate-300 font-semibold">
                            Corporación Tachirense de Turismo (COTATUR)
                        </p>
                        <h1 class="text-base font-bold text-white mt-0.5">
                            Encuesta de Perfil del Visitante
                        </h1>
                    </div>
                    <span class="text-[11px] bg-slate-800 text-slate-200 px-2.5 py-1 rounded border border-slate-600 font-mono">
                        BORRADOR v0.1
                    </span>
                </div>

                <div class="bg-slate-800/70 rounded px-3 py-2.5 border border-slate-700 text-xs">
                    <div class="flex flex-wrap items-center justify-between gap-1">
                        <span class="text-slate-400 font-medium">Punto de control asignado:</span>
                        <span class="font-semibold text-white" id="header-point-name">${activePointName}</span>
                    </div>
                </div>
            </div>
        </header>
    `;
}
