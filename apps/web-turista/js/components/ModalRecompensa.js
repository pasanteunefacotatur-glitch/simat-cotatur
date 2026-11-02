/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: components/ModalRecompensa.js
 * DESCRIPCIÓN: Modal de Recompensa Instantánea al Turista tras completar la encuesta.
 *              Entrega el Mapa Oficial de Rutas y Directorio de Emergencias Viales.
 * ==============================================================================
 */

export function renderModalRecompensa(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div id="modal-recompensa-overlay" class="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-300 opacity-0 pointer-events-none">
            <div class="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col transform transition-transform duration-300 translate-y-full sm:translate-y-0">
                
                <!-- Encabezado conmemorativo institucional -->
                <div class="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 text-center relative">
                    <div class="w-16 h-16 bg-amber-400 text-blue-950 font-black rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-lg border-2 border-amber-300 mb-3 animate-bounce">
                        🎁
                    </div>
                    <span class="inline-block px-3 py-1 bg-amber-400/20 text-amber-300 text-xs font-bold rounded-full mb-1">
                        Recompensa Oficial COTATUR
                    </span>
                    <h3 class="text-xl font-black tracking-tight">¡Gracias por visitar el Táchira!</h3>
                    <p class="text-xs text-blue-200 mt-1">
                        Tu opinión fortalece el desarrollo turístico de nuestro estado. Aquí tienes tu obsequio digital:
                    </p>
                </div>

                <!-- Contenido descargable de alto valor -->
                <div class="p-6 overflow-y-auto space-y-4">
                    
                    <!-- Tarjeta 1: Mapa Oficial de Rutas Turísticas -->
                    <div class="p-4 rounded-2xl border border-amber-200 bg-amber-50/60 flex items-start space-x-3 shadow-sm">
                        <div class="p-3 bg-amber-400 text-blue-950 rounded-xl text-2xl font-bold">
                            🗺️
                        </div>
                        <div class="flex-1">
                            <h4 class="text-sm font-extrabold text-slate-800">Mapa Oficial de Rutas y Posadas</h4>
                            <p class="text-xs text-slate-600 mt-0.5">
                                Conoce las paradas de la Ruta de la Montaña, Chorro El Indio, Peribeca Colonial y Páramo El Zumbador.
                            </p>
                            <a href="#descargar-mapa" id="btn-descarga-mapa"
                                class="mt-3 inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-extrabold text-blue-950 bg-amber-400 hover:bg-amber-300 shadow transition-all active:scale-95">
                                <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                                </svg>
                                Descargar Guía PDF (Gratis)
                            </a>
                        </div>
                    </div>

                    <!-- Tarjeta 2: Directorio de Emergencias Viales -->
                    <div class="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-start space-x-3">
                        <div class="p-3 bg-red-100 text-red-600 rounded-xl text-2xl font-bold">
                            🚨
                        </div>
                        <div class="flex-1">
                            <h4 class="text-sm font-extrabold text-slate-800">Directorio de Asistencia Vial</h4>
                            <p class="text-xs text-slate-600 mt-0.5">
                                Asistencia en carretera gratuita y teléfonos de emergencia durante tu viaje por el estado:
                            </p>
                            <div class="mt-2 text-xs space-y-1 font-semibold text-slate-700">
                                <p>• Protección Civil Táchira: <span class="text-blue-900 font-bold">0800-8224472</span></p>
                                <p>• Servicio Grúa de Peajes: <span class="text-blue-900 font-bold">Canal 9 Radio / Peaje Táriba</span></p>
                                <p>• Emergencias Policía Turística: <span class="text-blue-900 font-bold">VEN 911</span></p>
                            </div>
                        </div>
                    </div>

                </div>

                <!-- Botón de Cierre -->
                <div class="p-4 bg-slate-50 border-t border-slate-100 text-center">
                    <button type="button" id="btn-cerrar-modal-recompensa"
                        class="w-full py-3 bg-blue-900 hover:bg-blue-950 text-white font-extrabold text-sm rounded-xl shadow-md transition-all active:scale-98">
                        ¡Entendido y Buen Viaje!
                    </button>
                </div>

            </div>
        </div>
    `;

    const overlay = document.getElementById("modal-recompensa-overlay");
    const btnCerrar = document.getElementById("btn-cerrar-modal-recompensa");
    const btnDescarga = document.getElementById("btn-descarga-mapa");

    btnCerrar.addEventListener("click", () => {
        overlay.classList.add("opacity-0", "pointer-events-none");
        overlay.classList.remove("opacity-100", "pointer-events-auto");
    });

    btnDescarga.addEventListener("click", (e) => {
        e.preventDefault();
        alert("¡Descargando Guía Turística Oficial de Rutas y Posadas del Estado Táchira (COTATUR 2026)!");
    });
}

/**
 * Muestra el modal de recompensa en pantalla con transición suave.
 */
export function abrirModalRecompensa() {
    const overlay = document.getElementById("modal-recompensa-overlay");
    if (!overlay) return;
    overlay.classList.remove("opacity-0", "pointer-events-none");
    overlay.classList.add("opacity-100", "pointer-events-auto");
}
