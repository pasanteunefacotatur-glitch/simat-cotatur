/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-admin/js/components/CartelQRAdmin.js
 * DESCRIPCIÓN: Módulo de generación de Códigos QR para supervisión turística:
 *              1. Generación de Afiche Completo en Hoja Carta (8.5" x 11").
 *              2. Descarga en Formato Vectorial SVG (.svg) escalable sin pérdida
 *                 de calidad (para vallas publicitarias, gigantografías y pendones).
 *              3. Descarga en PNG de Ultra Alta Resolución (2048x2048).
 *              4. Acortador de Enlaces integrado (is.gd / TinyURL / Alias) para
 *                 minimizar la densidad de la matriz QR y maximizar la legibilidad
 *                 a distancia o en movimiento desde vehículos.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function renderCartelQRAdmin(containerId, puntosList = []) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Puntos de contingencia si no se reciben de Supabase
    const puntos = puntosList.length > 0 ? puntosList : [
        { codigo: "PEAJE_TARIBA", nombre: "Peaje Vega de Táriba (Troncal 1)" },
        { codigo: "PEAJE_CAMPANA", nombre: "Peaje La Pedrera / La Campana (Troncal 5)" },
        { codigo: "TERMINAL_SC", nombre: "Terminal Central San Cristóbal" },
        { codigo: "PUENTE_ATANASIO", nombre: "Puente Atanasio Girardot (Tienditas)" },
        { codigo: "PERIBECA_PUEBLO", nombre: "Pueblo Típico de Peribeca" },
        { codigo: "CHORRO_EL_INDIO", nombre: "Parque Nacional Chorro El Indio" }
    ];

    // Mapeo de alias cortos por posición o código
    const ALIAS_MAP = {
        "PEAJE_TARIBA": "1",
        "PEAJE_CAMPANA": "2",
        "TERMINAL_SC": "3",
        "PUENTE_ATANASIO": "4",
        "PERIBECA_PUEBLO": "5",
        "CHORRO_EL_INDIO": "6"
    };

    const optionsHtml = puntos.map(p => `
        <option value="${escapeHtml(p.codigo)}">${escapeHtml(p.nombre)}</option>
    `).join("");

    container.innerHTML = `
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-6">
            
            <!-- Barra Superior de Control -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div class="flex-1">
                    <label for="admin-select-punto-qr" class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Seleccionar Punto de Control para generar material:
                    </label>
                    <select id="admin-select-punto-qr" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#198754]">
                        ${optionsHtml}
                    </select>
                </div>

                <!-- Botones de Acción Globales -->
                <div class="flex flex-wrap items-center gap-2">
                    <button type="button" id="btn-admin-print-afiche"
                        class="px-3.5 py-2.5 bg-[#198754] hover:bg-[#157347] text-white font-bold rounded-xl shadow transition-all flex items-center space-x-1.5 text-xs active:scale-95 tap-target-btn"
                        title="Imprimir cartel oficial en papel tamaño Carta">
                        <span>🖨️</span>
                        <span>Imprimir Cartel Oficial</span>
                    </button>

                    <button type="button" id="btn-admin-download-svg"
                        class="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow transition-all flex items-center space-x-1.5 text-xs active:scale-95"
                        title="Descargar archivo vectorial SVG (Escalable sin pérdida de calidad para vallas)">
                        <span>📐</span>
                        <span>Descargar SVG (Vectorial)</span>
                    </button>

                    <button type="button" id="btn-admin-download-png"
                        class="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl shadow border border-slate-700 transition-all flex items-center space-x-1.5 text-xs active:scale-95"
                        title="Descargar archivo PNG en Ultra Alta Resolución (2048x2048)">
                        <span>🖼️</span>
                        <span>Descargar PNG (2048px)</span>
                    </button>

                    <button type="button" id="btn-admin-copy-link"
                        class="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold rounded-xl border border-slate-300 dark:border-slate-700 transition-all text-xs active:scale-95"
                        title="Copiar enlace de la encuesta">
                        <span>📋</span>
                        <span id="copy-btn-text">Copiar Enlace</span>
                    </button>
                </div>
            </div>

            <!-- Panel de Optimización de Densidad y Acortador de Enlaces -->
            <div class="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 space-y-3">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div class="space-y-0.5">
                        <span class="text-xs font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                            <span>⚡</span>
                            <span>Acortador y Legibilidad del Código QR</span>
                        </span>
                        <p class="text-[11px] text-emerald-800 dark:text-emerald-400">
                            A menor longitud del enlace, <strong>los cuadros del QR son más grandes y gruesos</strong>, permitiendo escanear a mayor distancia y velocidad desde autos en movimiento.
                        </p>
                    </div>
                    <div id="qr-density-badge" class="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-extrabold border">
                        <!-- Badge dinámico de legibilidad -->
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row items-center gap-2">
                    <div class="relative flex-1 w-full">
                        <input type="text" id="input-qr-target-url"
                            class="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-[#198754]"
                            placeholder="URL codificada en el código QR" />
                    </div>

                    <button type="button" id="btn-acortar-url"
                        class="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-sm flex items-center justify-center space-x-1.5 transition-all shrink-0 active:scale-95"
                        title="Generar enlace ultracorto con servicio público para máxima legibilidad">
                        <span>⚡</span>
                        <span>Acortar con 1 Clic</span>
                    </button>

                    <button type="button" id="btn-restaurar-url-nativa"
                        class="w-full sm:w-auto px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition-colors shrink-0"
                        title="Restaurar enlace institucional corto">
                        <span>🔄</span>
                        <span>Nativo Corto</span>
                    </button>
                </div>
            </div>

            <!-- Vista Previa Dividida: Cartel y QR Aislado -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                <!-- Columna Izquierda (1 Col): Solo el QR Puro para Publicidad -->
                <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-col items-center text-center space-y-3">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Código QR Aislado (Alta Calidad)
                    </span>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400">
                        Para diseñadores publicitarios, vallas, pendones, franelas o calcomanías:
                    </p>
                    
                    <div class="qr-white-box p-3 bg-white rounded-xl shadow border border-slate-200 inline-block">
                        <img id="preview-raw-qr" src="" alt="Solo Código QR" class="w-48 h-48 object-contain" />
                    </div>

                    <div class="text-[10px] text-slate-500 break-all font-mono" id="preview-raw-url">
                        <!-- URL destino -->
                    </div>

                    <div class="w-full grid grid-cols-2 gap-2 pt-1">
                        <button type="button" id="btn-quick-download-svg"
                            class="py-2 px-2 bg-[#198754] hover:bg-[#157347] text-white rounded-lg font-bold text-[11px] transition-colors shadow-sm flex items-center justify-center gap-1">
                            <span>📐</span>
                            <span>SVG Vector</span>
                        </button>
                        <button type="button" id="btn-quick-download-png"
                            class="py-2 px-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-[11px] transition-colors shadow-sm flex items-center justify-center gap-1">
                            <span>🖼️</span>
                            <span>PNG 2048px</span>
                        </button>
                    </div>
                </div>

                <!-- Columna Derecha (2 Cols): Lámina Completa de Cartel Oficial -->
                <div class="lg:col-span-2 flex flex-col items-center">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        Vista previa del cartel oficial para impresión (Hoja Carta)
                    </span>

                    <!-- LÁMINA CARTA IMPRIMIBLE -->
                    <div id="cartel-hoja-carta" class="cartel-imprimible-root w-full max-w-[460px] bg-white text-slate-900 p-6 rounded-xl shadow-md border-2 border-slate-800 flex flex-col justify-between text-center font-['Poppins',sans-serif]">
                        
                        <!-- Cabecera Institucional con Logos Oficiales -->
                        <div class="border-b-2 border-slate-900 pb-3">
                            <div class="inline-flex items-center justify-center p-1.5 rounded-2xl bg-white border border-slate-300 shadow-sm space-x-2.5 mx-auto">
                                <img src="./assets/img/logo_cotatur.png" alt="COTATUR Logo" class="h-9 w-auto object-contain" />
                                <div class="h-6 w-[1px] bg-slate-300"></div>
                                <img src="./assets/img/logo_gobernacion.png" alt="Gobernación del Táchira" class="h-8 w-auto object-contain" />
                                <div class="h-6 w-[1px] bg-slate-300"></div>
                                <img src="./assets/img/logo_tachira.png" alt="Táchira Turismo" class="h-8 w-auto object-contain" />
                            </div>
                            <div class="text-center px-1 mt-1.5">
                                <h4 class="text-[9px] font-black tracking-widest text-slate-600 uppercase">República Bolivariana de Venezuela • Gobernación del Táchira</h4>
                                <h2 class="text-[11px] font-black text-slate-900 uppercase">Corporación Tachirense de Turismo</h2>
                                <span class="text-[8px] font-bold text-[#198754] uppercase tracking-wider">COTATUR • Táchira es Turismo</span>
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
                            <div class="qr-white-box p-2.5 bg-white border-4 border-slate-900 rounded-xl shadow inline-block">
                                <img id="cartel-full-qr-img" src="" alt="Código QR Turístico" class="w-48 h-48 object-contain" />
                            </div>
                            <div class="mt-1.5 text-center">
                                <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">O accede escribiendo:</span>
                                <div id="cartel-url-enlace" class="text-[11px] font-black text-blue-900 underline break-all mt-0.5 font-mono"></div>
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

    // Vincular elementos del DOM
    const selectPunto = document.getElementById("admin-select-punto-qr");
    const previewRawQr = document.getElementById("preview-raw-qr");
    const previewRawUrl = document.getElementById("preview-raw-url");
    const cartelFullQrImg = document.getElementById("cartel-full-qr-img");
    const cartelUrlEnlace = document.getElementById("cartel-url-enlace");
    const cartelPuntoTitulo = document.getElementById("cartel-punto-titulo");
    const inputTargetUrl = document.getElementById("input-qr-target-url");
    const qrDensityBadge = document.getElementById("qr-density-badge");

    const btnPrintAfiche = document.getElementById("btn-admin-print-afiche");
    const btnDownloadSvg1 = document.getElementById("btn-admin-download-svg");
    const btnDownloadSvg2 = document.getElementById("btn-quick-download-svg");
    const btnDownloadPng1 = document.getElementById("btn-admin-download-png");
    const btnDownloadPng2 = document.getElementById("btn-quick-download-png");
    const btnAcortar = document.getElementById("btn-acortar-url");
    const btnRestaurarNativo = document.getElementById("btn-restaurar-url-nativa");
    const btnCopyLink = document.getElementById("btn-admin-copy-link");
    const copyBtnText = document.getElementById("copy-btn-text");

    let currentUrl = "";
    let currentSvgUrl = "";
    let currentPngUrl = "";

    function generarUrlNativa(codigo) {
        const alias = ALIAS_MAP[codigo] || codigo;
        return `https://pasanteunefacotatur-glitch.github.io/simat-cotatur/?p=${encodeURIComponent(alias)}`;
    }

    function actualizarGraficosQR(urlDestino) {
        currentUrl = urlDestino;
        inputTargetUrl.value = urlDestino;

        // Formatos de alta calidad: SVG vectorial puro y PNG 2048x2048 (con margen mínimo qzone=1)
        currentSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(urlDestino)}&format=svg&qzone=1`;
        currentPngUrl = `https://api.qrserver.com/v1/create-qr-code/?size=2048x2048&data=${encodeURIComponent(urlDestino)}&format=png&qzone=1`;
        const previewUrl = `https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=${encodeURIComponent(urlDestino)}&qzone=1`;

        previewRawQr.src = previewUrl;
        cartelFullQrImg.src = previewUrl;
        previewRawUrl.textContent = urlDestino;
        cartelUrlEnlace.textContent = urlDestino.replace(/^https?:\/\//, "");

        // Actualizar indicador de legibilidad según longitud de la URL
        const len = urlDestino.length;
        if (len <= 35) {
            qrDensityBadge.className = "shrink-0 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700";
            qrDensityBadge.innerHTML = `🟢 Legibilidad Óptima (${len} car.) • Módulos grandes para escaneo a distancia`;
        } else if (len <= 65) {
            qrDensityBadge.className = "shrink-0 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-700";
            qrDensityBadge.innerHTML = `🔵 Legibilidad Buena (${len} car.) • Apta para papel y pantallas`;
        } else {
            qrDensityBadge.className = "shrink-0 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700";
            qrDensityBadge.innerHTML = `🟡 Densidad Media (${len} car.) • Se recomienda acortar`;
        }
    }

    function cambiarPunto(codigo) {
        const urlNativa = generarUrlNativa(codigo);
        actualizarGraficosQR(urlNativa);

        const pSel = puntos.find(p => p.codigo === codigo);
        cartelPuntoTitulo.textContent = pSel ? `Punto Oficial: ${pSel.nombre}` : `Punto: ${codigo}`;
    }

    async function descargarArchivoSVG() {
        try {
            const resp = await fetch(currentSvgUrl);
            const svgContent = await resp.text();
            const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
            const urlBlob = URL.createObjectURL(blob);
            const a = document.createElement("a");
            const codigo = selectPunto.value || "COTATUR";
            a.href = urlBlob;
            a.download = `QR_VECTORIAL_${codigo}_SIMAT_COTATUR.svg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(urlBlob);
        } catch (_) {
            window.open(currentSvgUrl, "_blank");
        }
    }

    async function descargarArchivoPNG() {
        try {
            const resp = await fetch(currentPngUrl);
            const blob = await resp.blob();
            const urlBlob = URL.createObjectURL(blob);
            const a = document.createElement("a");
            const codigo = selectPunto.value || "COTATUR";
            a.href = urlBlob;
            a.download = `QR_HD_2048x2048_${codigo}_SIMAT_COTATUR.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(urlBlob);
        } catch (_) {
            window.open(currentPngUrl, "_blank");
        }
    }

    async function ejecutarAcortador() {
        if (!currentUrl) return;
        btnAcortar.disabled = true;
        btnAcortar.innerHTML = `<span>⏳</span><span>Acortando...</span>`;

        try {
            // Intento 1: is.gd API (retorna JSON directo)
            const resp = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(currentUrl)}`);
            const data = await resp.json();
            if (data && data.shorturl) {
                actualizarGraficosQR(data.shorturl);
                return;
            }
            throw new Error("No se obtuvo URL de is.gd");
        } catch (_) {
            // Fallback: TinyURL API
            try {
                const resp2 = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(currentUrl)}`);
                const shortText = await resp2.text();
                if (shortText && shortText.startsWith("http")) {
                    actualizarGraficosQR(shortText.trim());
                    return;
                }
            } catch (e2) {
                alert("No se pudo conectar con el servicio acortador. Puede ingresar un enlace corto manualmente.");
            }
        } finally {
            btnAcortar.disabled = false;
            btnAcortar.innerHTML = `<span>⚡</span><span>Acortar con 1 Clic</span>`;
        }
    }

    // Event listeners
    selectPunto.addEventListener("change", (e) => cambiarPunto(e.target.value));

    inputTargetUrl.addEventListener("change", (e) => {
        const val = e.target.value.trim();
        if (val) actualizarGraficosQR(val);
    });

    btnAcortar.addEventListener("click", ejecutarAcortador);
    btnRestaurarNativo.addEventListener("click", () => cambiarPunto(selectPunto.value));

    btnDownloadSvg1.addEventListener("click", descargarArchivoSVG);
    btnDownloadSvg2.addEventListener("click", descargarArchivoSVG);
    btnDownloadPng1.addEventListener("click", descargarArchivoPNG);
    btnDownloadPng2.addEventListener("click", descargarArchivoPNG);

    btnPrintAfiche.addEventListener("click", () => window.print());

    btnCopyLink.addEventListener("click", () => {
        if (!currentUrl) return;
        navigator.clipboard.writeText(currentUrl).then(() => {
            copyBtnText.textContent = "¡Copiado!";
            setTimeout(() => { copyBtnText.textContent = "Copiar Enlace"; }, 2000);
        });
    });

    // Inicializar con el primer punto
    if (puntos.length > 0) {
        cambiarPunto(puntos[0].codigo);
    }
}
