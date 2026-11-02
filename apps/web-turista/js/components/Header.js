/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: components/Header.js
 * DESCRIPCIÓN: Encabezado institucional con identidad gráfica oficial del Táchira
 *              y selector/identificador del Punto de Captura QR.
 * ==============================================================================
 */

export function renderHeader(containerId, activePointName = "Peaje Vega de Táriba (Troncal 1)") {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <header class="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white shadow-lg pb-6 pt-safe">
            <!-- Barra superior institucional -->
            <div class="max-w-xl mx-auto px-4 pt-4 flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center font-black text-blue-950 text-xl shadow-md border border-amber-300">
                        C
                    </div>
                    <div>
                        <h1 class="text-xs uppercase tracking-widest text-amber-400 font-bold">Gobernación del Táchira</h1>
                        <p class="text-sm font-extrabold tracking-tight">COTATUR • Turismo</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <span class="w-1.5 h-1.5 mr-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                        FISS 2026
                    </span>
                </div>
            </div>

            <!-- Identificador del Punto de Control QR -->
            <div class="max-w-xl mx-auto px-4 mt-5">
                <div class="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 shadow-inner">
                    <div class="flex items-start space-x-3">
                        <div class="p-2 bg-amber-500/20 rounded-xl text-amber-300 mt-0.5">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                        </div>
                        <div>
                            <span class="text-xs font-medium text-blue-200 uppercase tracking-wider">Punto de Verificación QR</span>
                            <h2 class="text-base font-bold text-white leading-snug" id="header-point-name">
                                ${activePointName}
                            </h2>
                            <p class="text-xs text-blue-100/80 mt-0.5">
                                Califica tu experiencia en 1 minuto y recibe el <b>Mapa Oficial y Guía de Rutas del Táchira</b>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    `;
}
