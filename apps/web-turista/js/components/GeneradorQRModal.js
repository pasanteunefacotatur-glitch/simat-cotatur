/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: components/GeneradorQRModal.js
 * DESCRIPCIÓN: Generador e impresor de carteles con Código QR en formato Hoja Carta
 *              (8.5" x 11" / Letter), con logos oficiales de COTATUR y Táchira.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

import { PUNTOS_CONTROL_QR } from "../config.js";

export function renderGeneradorQRModal(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const puntosOptions = Object.entries(PUNTOS_CONTROL_QR).map(([codigo, info]) => {
        return `<option value="${codigo}">${info.nombre}</option>`;
    }).join("");

    container.innerHTML = `
        <div id="modal-qr-overlay" class="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 opacity-0 pointer-events-none transition-opacity duration-200">
            <div class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
                
                <!-- Encabezado de la ventana modal -->
                <div class="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-700">
                    <div class="flex items-center space-x-2">
                        <span class="text-amber-400 font-bold">🖨️</span>
                        <h3 class="text-sm font-bold tracking-tight">Generador de Cartel QR Imprimible (Hoja Carta)</h3>
                    </div>
                    <button type="button" id="btn-cerrar-qr-modal" class="text-slate-400 hover:text-white text-lg font-bold px-2">
                        ✕
                    </button>
                </div>

                <!-- Barra de control y selección de punto -->
                <div class="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div class="flex-1 min-w-[220px]">
                        <label for="select-punto-impresion" class="block font-semibold text-slate-700 mb-1">
                            Seleccionar Punto de Control para el Cartel:
                        </label>
                        <select id="select-punto-impresion" class="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-800 outline-none focus:border-slate-800">
                            ${puntosOptions}
                        </select>
                    </div>
                    <div class="flex items-center space-x-2 pt-3 sm:pt-0">
                        <button type="button" id="btn-imprimir-carta"
                            class="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow transition-all flex items-center space-x-1.5 active:scale-95">
                            <span>🖨️</span>
                            <span>Imprimir Cartel (Carta)</span>
                        </button>
                    </div>
                </div>

                <!-- Vista previa del Cartel en Hoja Carta -->
                <div class="p-4 overflow-y-auto flex-1 bg-slate-200 flex justify-center">
                    
                    <!-- LÁMINA CARTA IMPRIMIBLE -->
                    <div id="cartel-hoja-carta" class="w-full max-w-[500px] bg-white p-6 rounded-xl shadow-lg border border-slate-300 flex flex-col justify-between text-center font-sans">
                        
                        <!-- Cabecera Institucional con Logos Oficiales -->
                        <div class="border-b-2 border-slate-900 pb-3">
                            <div class="flex items-center justify-between px-2">
                                <img src="./assets/img/logo_cotatur.png" alt="COTATUR Logo" class="h-12 w-auto object-contain" />
                                <div class="text-center px-1">
                                    <h4 class="text-[10px] font-black tracking-widest text-slate-600 uppercase">República Bolivariana de Venezuela</h4>
                                    <h2 class="text-xs font-black text-slate-900 uppercase">Corporación Tachirense de Turismo</h2>
                                    <span class="text-[9px] font-bold text-amber-600 uppercase tracking-wider">COTATUR • Táchira es Turismo</span>
                                </div>
                                <img src="./assets/img/logo_tachira.png" alt="Táchira Logo" class="h-12 w-auto object-contain" />
                            </div>
                        </div>

                        <!-- Titular de Bienvenida al Turista -->
                        <div class="my-3 space-y-1">
                            <span class="inline-block px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase tracking-wide border border-amber-300">
                                Encuesta Oficial de Satisfacción y Perfil
                            </span>
                            <h1 class="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                                ¡BIENVENIDO AL TÁCHIRA!
                            </h1>
                            <p class="text-xs text-slate-600 font-medium">
                                Tu opinión nos ayuda a fortalecer los servicios turísticos de nuestro estado.
                            </p>
                        </div>

                        <!-- Código QR Central de Alta Densidad Óptica -->
                        <div class="my-2 flex flex-col items-center justify-center">
                            <div class="p-3 bg-white border-4 border-slate-900 rounded-2xl shadow-md inline-block">
                                <img id="cartel-qr-img" src="" alt="Código QR Turístico" class="w-48 h-48 sm:w-56 sm:h-56 object-contain" />
                            </div>
                            <div class="mt-2 text-center">
                                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">O accede directamente escribiendo:</span>
                                <div id="cartel-url-texto" class="text-xs font-black text-blue-900 underline break-all mt-0.5"></div>
                            </div>
                        </div>

                        <!-- Pasos de Escaneo -->
                        <div class="my-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5 grid grid-cols-3 gap-1 text-center text-[10px]">
                            <div class="space-y-0.5">
                                <div class="font-black text-slate-800 text-xs">1. Enfoca</div>
                                <div class="text-slate-500">Abre la cámara de tu teléfono móvil</div>
                            </div>
                            <div class="space-y-0.5 border-x border-slate-200">
                                <div class="font-black text-slate-800 text-xs">2. Califica</div>
                                <div class="text-slate-500">Llena la encuesta en 1 minuto</div>
                            </div>
                            <div class="space-y-0.5">
                                <div class="font-black text-slate-800 text-xs">3. Recibe</div>
                                <div class="text-slate-500">Descarga tu Guía de Rutas y Emergencias</div>
                            </div>
                        </div>

                        <!-- Punto de Control e Incentivo -->
                        <div class="mt-2 pt-2 border-t border-slate-200 flex flex-col items-center space-y-1">
                            <div class="text-xs font-black text-slate-900" id="cartel-punto-nombre">
                                Peaje Vega de Táriba (Troncal 1)
                            </div>
                            <div class="text-[9px] text-slate-500 leading-tight">
                                Av. España cruce con Av. Carabobo, Edif. COTATUR. San Cristóbal, Edo. Táchira.<br/>
                                Teléfono: 0424-7388849 • cotatur@tachiraesturismo.com
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    `;

    // Lógica interactiva
    const overlay = document.getElementById("modal-qr-overlay");
    const btnCerrar = document.getElementById("btn-cerrar-qr-modal");
    const selectPunto = document.getElementById("select-punto-impresion");
    const qrImg = document.getElementById("cartel-qr-img");
    const urlTexto = document.getElementById("cartel-url-texto");
    const puntoNombre = document.getElementById("cartel-punto-nombre");
    const btnImprimir = document.getElementById("btn-imprimir-carta");

    function actualizarCartel(codigoPunto) {
        const baseUrl = "https://pasanteunefacotatur-glitch.github.io/simat-cotatur/";
        const targetUrl = `${baseUrl}?p=${encodeURIComponent(codigoPunto)}`;
        const info = PUNTOS_CONTROL_QR[codigoPunto] || { nombre: "Punto de Control Turístico" };

        puntoNombre.textContent = `Punto Oficial: ${info.nombre}`;
        urlTexto.textContent = targetUrl.replace("https://", "");
        
        // Generar QR de 600x600 px nítido para impresión
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(targetUrl)}&margin=1`;
    }

    selectPunto.addEventListener("change", (e) => {
        actualizarCartel(e.target.value);
    });

    btnCerrar.addEventListener("click", () => {
        overlay.classList.add("opacity-0", "pointer-events-none");
    });

    btnImprimir.addEventListener("click", () => {
        window.print();
    });

    // Iniciar con el primer punto
    actualizarCartel(selectPunto.value);
}

export function abrirGeneradorQR() {
    const overlay = document.getElementById("modal-qr-overlay");
    if (!overlay) return;
    overlay.classList.remove("opacity-0", "pointer-events-none");
}
