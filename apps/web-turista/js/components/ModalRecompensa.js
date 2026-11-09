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
        <div id="modal-recompensa-overlay" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300 opacity-0 pointer-events-none overflow-y-auto">
            <div id="modal-recompensa-card" class="bg-white dark:bg-slate-900 w-full max-w-lg max-h-[90vh] rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl overflow-y-auto flex flex-col transform scale-95 transition-all duration-300 my-auto">
                
                <!-- Encabezado Institucional Cálido -->
                <div class="bg-gradient-to-r from-[#1c1c1c] via-[#198754] to-[#1c1c1c] text-white px-6 py-5 border-b border-amber-400/30">
                    <div class="flex items-center justify-between">
                        <span class="text-[11px] font-extrabold uppercase tracking-widest text-[#ffc107]">
                            ¡Muchas Gracias por tu Visita!
                        </span>
                        <span class="text-xs px-2.5 py-0.5 bg-white/20 rounded-full font-bold">
                            Táchira es Turismo
                        </span>
                    </div>
                    <h3 class="text-base sm:text-lg font-extrabold mt-1 leading-snug">
                        ¡Bienvenido a la Tierra de la Cordialidad!
                    </h3>
                    <p class="text-xs text-emerald-100/90 mt-0.5">
                        Tu opinión contribuye a elevar la calidad turística de nuestro estado.
                    </p>
                </div>

                <!-- Cuerpo informativo y descargas -->
                <div class="p-6 space-y-4 text-xs text-gray-700 dark:text-slate-300">
                    <p class="leading-relaxed">
                        Tus respuestas han sido procesadas de forma anónima y segura por COTATUR. Para enriquecer tu recorrido por nuestros 29 municipios, ponemos a tu disposición los siguientes recursos oficiales:
                    </p>

                    <!-- Recurso 1: Guía y Portal de Rutas Turísticas -->
                    <div class="p-4 rounded-2xl border border-emerald-300/60 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/20">
                        <div class="flex items-start justify-between gap-2">
                            <div>
                                <h4 class="font-extrabold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                                    <span>🗺️</span>
                                    <span>Guía Oficial de Rutas y Alojamientos</span>
                                </h4>
                                <p class="text-gray-600 dark:text-slate-400 mt-1 text-[11px] leading-relaxed">
                                    Conoce los circuitos de la Ruta del Páramo, Ruta del Café, Peribeca, San Pedro del Río, Chorro El Indio y posadas certificadas.
                                </p>
                            </div>
                        </div>
                        <a href="https://tachiraesturismo.com.ve/otros/Rutas_Turisticas.html" target="_blank" rel="noopener noreferrer"
                            class="mt-3 inline-flex items-center gap-2 px-4 py-2.5 bg-[#198754] hover:bg-[#157347] text-white font-bold rounded-xl text-xs shadow-md tap-target-btn">
                            <span>Explorar Rutas en tachiraesturismo.com.ve</span>
                            <span>↗</span>
                        </a>
                    </div>

                    <!-- Recurso 2: Contactos de Asistencia Vial y Hospitalidad -->
                    <div class="p-4 rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-800/50">
                        <h4 class="font-bold text-gray-900 dark:text-white text-xs flex items-center gap-1.5">
                            <span>📞</span>
                            <span>Directorio de Asistencia al Viajero y Emergencias</span>
                        </h4>
                        <ul class="mt-2 space-y-1.5 text-[11px] text-gray-700 dark:text-slate-300">
                            <li class="flex items-center justify-between">
                                <span>• COTATUR (Atención al Turista):</span>
                                <a href="tel:04247388849" class="font-bold text-[#198754] dark:text-emerald-400 hover:underline">0424-7388849</a>
                            </li>
                            <li class="flex items-center justify-between">
                                <span>• Protección Civil Táchira:</span>
                                <a href="tel:08008224472" class="font-bold text-[#198754] dark:text-emerald-400 hover:underline">0800-8224472</a>
                            </li>
                            <li class="flex items-center justify-between">
                                <span>• Emergencias Nacionales:</span>
                                <a href="tel:911" class="font-bold text-[#198754] dark:text-emerald-400 hover:underline">911</a>
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- Pie del cuadro de diálogo -->
                <div class="px-6 py-4 bg-gray-50 dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 flex justify-end">
                    <button type="button" id="btn-cerrar-modal-recompensa"
                        class="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-800 dark:text-white font-bold text-xs rounded-xl shadow-sm tap-target-btn">
                        Continuar mi viaje
                    </button>
                </div>

            </div>
        </div>
    `;

    const overlay = document.getElementById("modal-recompensa-overlay");
    const card = document.getElementById("modal-recompensa-card");
    const btnCerrar = document.getElementById("btn-cerrar-modal-recompensa");

    btnCerrar.addEventListener("click", () => {
        if (card) {
            card.classList.add("scale-95");
            card.classList.remove("scale-100");
        }
        overlay.classList.add("opacity-0", "pointer-events-none");
        overlay.classList.remove("opacity-100", "pointer-events-auto");
    });
}

export function abrirModalRecompensa() {
    const overlay = document.getElementById("modal-recompensa-overlay");
    const card = document.getElementById("modal-recompensa-card");
    if (!overlay) return;

    overlay.classList.remove("opacity-0", "pointer-events-none");
    overlay.classList.add("opacity-100", "pointer-events-auto");

    if (card) {
        // Micro-animación elástica de entrada (Emil Kowalski curve)
        setTimeout(() => {
            card.classList.remove("scale-95");
            card.classList.add("scale-100");
        }, 20);
    }

    if (navigator.vibrate) {
        try { navigator.vibrate([15, 30, 15]); } catch (_) {}
    }
}
