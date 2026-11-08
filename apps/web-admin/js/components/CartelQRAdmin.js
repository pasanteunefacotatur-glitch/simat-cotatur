/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-admin/js/components/CartelQRAdmin.js
 * DESCRIPCIÓN: Módulo de generación de Códigos QR para supervisión turística:
 *              1. Generación de Afiche Completo en Hoja Carta (8.5" x 11").
 *              2. Descarga de "Solo el Código QR" en PNG Alta Resolución (1024x1024)
 *                 para enviar a imprentas y diseñadores publicitarios sin textos.
 *              3. Copia de enlace directo para difusión digital.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

export function renderCartelQRAdmin(containerId, puntosList = []) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Si la lista de puntos está vacía, usar puntos de contingencia
    const puntos = puntosList.length > 0 ? puntosList : [
        { codigo: "PEAJE_TARIBA", nombre: "Peaje Vega de Táriba (Troncal 1)" },
        { codigo: "PEAJE_CAMPANA", nombre: "Peaje La Pedrera / La Campana (Troncal 5)" },
        { codigo: "TERMINAL_SC", nombre: "Terminal Central San Cristóbal" },
        { codigo: "PUENTE_ATANASIO", nombre: "Puente Atanasio Girardot (Tienditas)" },
        { codigo: "PERIBECA_PUEBLO", nombre: "Pueblo Típico de Peribeca" },
        { codigo: "CHORRO_EL_INDIO", nombre: "Parque Nacional Chorro El Indio" }
    ];

    const optionsHtml = puntos.map(p => `
        <option value="${p.codigo}">${p.nombre}</option>
    `).join("");

    container.innerHTML = `
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-6">
            
            <!-- Barra Superior de Control -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div class="flex-1">
                    <label for="admin-select-punto-qr" class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Seleccionar Punto de Control para generar material:
                    </label>
                    <select id="admin-select-punto-qr" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500">
                        ${optionsHtml}
                    </select>
                </div>

                <!-- Botones de Acción: Afiche Completo vs Solo el QR para Diseñador -->
                <div class="flex flex-wrap items-center gap-2">
                    <button type="button" id="btn-admin-print-afiche"
                        class="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow transition-all flex items-center space-x-1.5 text-xs active:scale-95"
                        title="Imprimir cartel completo oficial en papel tamaño Carta">
                        <span>🖨️</span>
                        <span>Imprimir Afiche Carta</span>
                    </button>

                    <button type="button" id="btn-admin-download-qr-only"
                        class="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl shadow border border-slate-700 transition-all flex items-center space-x-1.5 text-xs active:scale-95"
                        title="Descargar únicamente el archivo PNG del QR en alta resolución para imprentas o publicidad">
                        <span>📥</span>
                        <span>Descargar Solo QR (Publicidad)</span>
                    </button>

                    <button type="button" id="btn-admin-copy-link"
                        class="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold rounded-xl border border-slate-300 dark:border-slate-700 transition-all text-xs active:scale-95"
                        title="Copiar enlace de encuesta para compartir por WhatsApp o redes">
                        <span>📋</span>
                        <span id="copy-btn-text">Copiar Link</span>
                    </button>
                </div>
            </div>

            <!-- Vista Previa Dividida: Cartel Carta y QR Aislado -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                <!-- Columna Izquierda (1 Col): Solo el QR Puro para Publicidad -->
                <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-col items-center text-center space-y-3">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Código QR Puro (Para Diseñadores)
                    </span>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400">
                        Este código QR aislado es el que se envía a la empresa de publicidad para insertar en vallas, pendones o calcomanías:
                    </p>
                    
                    <div class="p-3 bg-white rounded-xl shadow border border-slate-200 inline-block">
                        <img id="preview-raw-qr" src="" alt="Solo Código QR" class="w-44 h-44 object-contain" />
                    </div>

                    <div class="text-[10px] text-slate-500 break-all font-mono" id="preview-raw-url">
                        <!-- URL destino -->
                    </div>

                    <button type="button" id="btn-quick-download-raw"
                        class="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 border border-amber-500/40 rounded-lg font-bold text-xs transition-colors">
                        Descargar PNG (1024x1024 px)
                    </button>
                </div>

                <!-- Columna Derecha (2 Cols): Lámina Completa de Afiche Carta -->
                <div class="lg:col-span-2 flex flex-col items-center">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        Vista Previa del Afiche Listo para Imprimir (Hoja Carta)
                    </span>

                    <!-- LÁMINA CARTA IMPRIMIBLE -->
                    <div id="cartel-hoja-carta" class="cartel-imprimible-root w-full max-w-[460px] bg-white text-slate-900 p-6 rounded-xl shadow-md border-2 border-slate-800 flex flex-col justify-between text-center font-['Poppins',sans-serif]">
                        
                        <!-- Cabecera Institucional con Logos Oficiales -->
                        <div class="border-b-2 border-slate-900 pb-3">
                            <div class="flex items-center justify-between px-1">
                                <img src="./assets/img/logo_cotatur.png" alt="COTATUR Logo" class="h-11 w-auto object-contain" />
                                <div class="text-center px-1">
                                    <h4 class="text-[9px] font-black tracking-widest text-slate-600 uppercase">República Bolivariana de Venezuela</h4>
                                    <h2 class="text-[11px] font-black text-slate-900 uppercase">Corporación Tachirense de Turismo</h2>
                                    <span class="text-[8px] font-bold text-amber-600 uppercase tracking-wider">COTATUR • Táchira es Turismo</span>
                                </div>
                                <img src="./assets/img/logo_tachira.png" alt="Táchira Logo" class="h-11 w-auto object-contain" />
                            </div>
                        </div>

                        <!-- Titular de Bienvenida -->
                        <div class="my-2.5 space-y-0.5">
                            <span class="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[9px] font-extrabold uppercase tracking-wide border border-amber-300">
                                Encuesta Oficial de Satisfacción y Perfil
                            </span>
                            <h1 class="text-lg font-black text-slate-900 leading-tight">
                                ¡BIENVENIDO AL TÁCHIRA!
                            </h1>
                            <p class="text-[11px] text-slate-600 font-medium">
                                Tu opinión fortalece la calidad turística de nuestro estado.
                            </p>
                        </div>

                        <!-- Código QR Central -->
                        <div class="my-1.5 flex flex-col items-center justify-center">
                            <div class="p-2.5 bg-white border-4 border-slate-900 rounded-xl shadow inline-block">
                                <img id="cartel-full-qr-img" src="" alt="Código QR Turístico" class="w-44 h-44 object-contain" />
                            </div>
                            <div class="mt-1.5 text-center">
                                <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">O accede escribiendo:</span>
                                <div id="cartel-url-enlace" class="text-[11px] font-black text-blue-900 underline break-all mt-0.5"></div>
                            </div>
                        </div>

                        <!-- Pasos de Escaneo -->
                        <div class="my-2 bg-slate-50 border border-slate-200 rounded-lg p-2 grid grid-cols-3 gap-1 text-center text-[9px]">
                            <div>
                                <div class="font-black text-slate-800 text-[10px]">1. Enfoca</div>
                                <div class="text-slate-500">Con tu cámara</div>
                            </div>
                            <div class="border-x border-slate-200">
                                <div class="font-black text-slate-800 text-[10px]">2. Califica</div>
                                <div class="text-slate-500">En 1 minuto</div>
                            </div>
                            <div>
                                <div class="font-black text-slate-800 text-[10px]">3. Recibe</div>
                                <div class="text-slate-500">Guía de Rutas</div>
                            </div>
                        </div>

                        <!-- Pie del Cartel -->
                        <div class="mt-1 pt-2 border-t border-slate-200 flex flex-col items-center space-y-0.5">
                            <div class="text-[11px] font-black text-slate-900" id="cartel-punto-titulo">
                                Punto Oficial
                            </div>
                            <div class="text-[8px] text-slate-500 leading-tight">
                                Av. España cruce con Av. Carabobo, Edif. COTATUR. San Cristóbal, Edo. Táchira.<br/>
                                Tel: 0424-7388849 • cotatur@tachiraesturismo.com
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    `;

    // Vincular lógica
    const selectPunto = document.getElementById("admin-select-punto-qr");
    const previewRawQr = document.getElementById("preview-raw-qr");
    const previewRawUrl = document.getElementById("preview-raw-url");
    const cartelFullQrImg = document.getElementById("cartel-full-qr-img");
    const cartelUrlEnlace = document.getElementById("cartel-url-enlace");
    const cartelPuntoTitulo = document.getElementById("cartel-punto-titulo");

    const btnPrintAfiche = document.getElementById("btn-admin-print-afiche");
    const btnDownloadRaw1 = document.getElementById("btn-admin-download-qr-only");
    const btnDownloadRaw2 = document.getElementById("btn-quick-download-raw");
    const btnCopyLink = document.getElementById("btn-admin-copy-link");
    const copyBtnText = document.getElementById("copy-btn-text");

    let currentTargetUrl = "";
    let currentRawQrUrl = "";

    function actualizarVistas(codigo) {
        const baseUrl = "https://pasanteunefacotatur-glitch.github.io/simat-cotatur/";
        currentTargetUrl = `${baseUrl}?p=${encodeURIComponent(codigo)}`;
        
        // QR Server API en 1024x1024 para imprenta profesional
        currentRawQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1024x1024&data=${encodeURIComponent(currentTargetUrl)}&margin=1`;
        const previewUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(currentTargetUrl)}&margin=1`;

        previewRawQr.src = previewUrl;
        cartelFullQrImg.src = previewUrl;
        previewRawUrl.textContent = currentTargetUrl;
        cartelUrlEnlace.textContent = currentTargetUrl.replace("https://", "");

        const pSel = puntos.find(p => p.codigo === codigo);
        cartelPuntoTitulo.textContent = pSel ? `Punto Oficial: ${pSel.nombre}` : `Punto: ${codigo}`;
    }

    async function descargarSoloQR() {
        try {
            const resp = await fetch(currentRawQrUrl);
            const blob = await resp.blob();
            const urlBlob = URL.createObjectURL(blob);
            const a = document.createElement("a");
            const codigo = selectPunto.value || "COTATUR";
            a.href = urlBlob;
            a.download = `QR_SOLO_PUBLICIDAD_${codigo}_SIMAT_COTATUR.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(urlBlob);
        } catch (_) {
            window.open(currentRawQrUrl, "_blank");
        }
    }

    selectPunto.addEventListener("change", (e) => actualizarVistas(e.target.value));
    btnPrintAfiche.addEventListener("click", () => window.print());
    btnDownloadRaw1.addEventListener("click", descargarSoloQR);
    btnDownloadRaw2.addEventListener("click", descargarSoloQR);

    btnCopyLink.addEventListener("click", () => {
        navigator.clipboard.writeText(currentTargetUrl).then(() => {
            copyBtnText.textContent = "¡Copiado!";
            setTimeout(() => { copyBtnText.textContent = "Copiar Link"; }, 2000);
        });
    });

    if (puntos.length > 0) {
        actualizarVistas(puntos[0].codigo);
    }
}
