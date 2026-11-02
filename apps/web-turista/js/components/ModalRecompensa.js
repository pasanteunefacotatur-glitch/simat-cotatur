/**
 * ==============================================================================
 * PROYECTO: Sistema de Medición y Estadística Turística (Borrador Fase 1)
 * ARCHIVO: components/ModalRecompensa.js
 * DESCRIPCIÓN: Comprobante de registro completado y descarga de material informativo.
 * ==============================================================================
 */

export function renderModalRecompensa(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div id="modal-recompensa-overlay" class="fixed inset-0 z-50 bg-gray-900/75 flex items-center justify-center p-4 transition-opacity duration-200 opacity-0 pointer-events-none">
            <div class="bg-white w-full max-w-md rounded border border-gray-300 shadow-xl overflow-hidden">
                
                <!-- Encabezado de confirmación -->
                <div class="bg-slate-900 text-white px-5 py-4 border-b border-slate-700">
                    <p class="text-[11px] uppercase tracking-wider text-slate-300 font-semibold">
                        Registro Completado
                    </p>
                    <h3 class="text-base font-bold mt-0.5">
                        Encuesta procesada correctamente
                    </h3>
                </div>

                <!-- Cuerpo informativo y descargas -->
                <div class="p-5 space-y-4 text-xs text-gray-700">
                    <p>
                        Sus respuestas han sido registradas de forma anónima en el sistema estadístico de COTATUR. Como material de apoyo para su recorrido, tiene a disposición los siguientes recursos:
                    </p>

                    <!-- Recurso 1: Guía de Rutas -->
                    <div class="p-3.5 rounded border border-gray-300 bg-gray-50">
                        <h4 class="font-bold text-gray-900 text-xs">
                            Guía de Rutas Turísticas y Alojamientos
                        </h4>
                        <p class="text-gray-600 mt-1 text-[11px]">
                            Documento informativo con circuitos principales (Ruta de la Montaña, Chorro El Indio, Peribeca y Páramo El Zumbador).
                        </p>
                        <button type="button" id="btn-descarga-mapa"
                            class="mt-2.5 inline-block px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded text-xs transition-colors">
                            Descargar Guía en PDF
                        </button>
                    </div>

                    <!-- Recurso 2: Contactos de Asistencia Vial -->
                    <div class="p-3.5 rounded border border-gray-300 bg-gray-50">
                        <h4 class="font-bold text-gray-900 text-xs">
                            Directorio de Asistencia Vial y Emergencias
                        </h4>
                        <ul class="mt-1.5 space-y-1 text-[11px] text-gray-700">
                            <li>• Protección Civil Regional: <b>0800-8224472</b></li>
                            <li>• Sistema Integrado de Emergencias: <b>911</b></li>
                            <li>• Asistencia en Peajes: <b>Canal Vial Troncal 1 / Troncal 5</b></li>
                        </ul>
                    </div>
                </div>

                <!-- Pie del cuadro de diálogo -->
                <div class="px-5 py-3 bg-gray-100 border-t border-gray-200 flex justify-end">
                    <button type="button" id="btn-cerrar-modal-recompensa"
                        class="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold text-xs rounded transition-colors">
                        Cerrar y finalizar
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

    btnDescarga.addEventListener("click", () => {
        alert("Descarga iniciada: Guia_Rutas_Turisticas_COTATUR.pdf");
    });
}

export function abrirModalRecompensa() {
    const overlay = document.getElementById("modal-recompensa-overlay");
    if (!overlay) return;
    overlay.classList.remove("opacity-0", "pointer-events-none");
    overlay.classList.add("opacity-100", "pointer-events-auto");
}
