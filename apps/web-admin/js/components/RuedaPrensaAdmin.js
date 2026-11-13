/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-admin/js/components/RuedaPrensaAdmin.js
 * DESCRIPCIÓN: Dashboard ejecutivo con los 5 bloques gráficos oficiales para
 *              las ruedas de prensa del Gobernador del Estado Táchira y balances
 *              institucionales de COTATUR.
 *              Incluye:
 *              1. Métricas clave ejecutivas (Afluencia, Pernocta, Origen, Satisfacción).
 *              2. Diapositiva Ejecutiva 16:9 para proyectores y pantallas LED.
 *              3. Exportación e impresión en hoja o lámina de presentación.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

import { CONFIG } from "../../../web-turista/js/config.js";

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function renderRuedaPrensaAdmin(containerId, authUser) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let filtroTemporada = "TODAS";
    let errorBannerMsg = "";
    let data = crearEstadoVacio();

    async function fetchData() {
        errorBannerMsg = "";
        container.innerHTML = `
            <div class="p-12 text-center text-slate-600 dark:text-slate-400">
                <div class="inline-block animate-spin text-3xl mb-3">⚙️</div>
                <p class="text-sm font-semibold">Consultando indicadores reales en Supabase...</p>
            </div>
        `;

        if (!navigator.onLine) {
            errorBannerMsg = "Sin conexión a internet. Conéctese a la red para consultar los datos reales.";
            data = crearEstadoVacio();
            renderView();
            return;
        }

        if (!authUser || !authUser.token) {
            errorBannerMsg = "Sesión sin token válido para consultar estadísticas.";
            data = crearEstadoVacio();
            renderView();
            return;
        }

        try {
            const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/admin_obtener_metricas_gobernador`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": CONFIG.SUPABASE_PUBLISHABLE_KEY,
                    "Authorization": `Bearer ${CONFIG.SUPABASE_PUBLISHABLE_KEY}`
                },
                body: JSON.stringify({ p_token: authUser.token, p_temporada: filtroTemporada })
            });

            if (res.ok) {
                const resJson = await res.json();
                if (resJson && resJson.ok) {
                    data = resJson;
                } else {
                    errorBannerMsg = resJson?.message || "Respuesta inesperada del servidor de métricas.";
                    data = crearEstadoVacio();
                }
            } else {
                errorBannerMsg = res.status === 401
                    ? "Sesión expirada. Cierre sesión y vuelva a ingresar."
                    : `No se pudieron cargar las métricas (HTTP ${res.status}).`;
                data = crearEstadoVacio();
            }
        } catch (_) {
            errorBannerMsg = "No fue posible conectar con Supabase Cloud para leer las métricas.";
            data = crearEstadoVacio();
        }
        renderView();
    }

    function renderView() {
        const r = data.resumen || {};
        const totalVisitantes = Number(r.total_personas_estimadas ?? 0);
        const totalEncuestas = Number(r.total_encuestas ?? 0);
        const pernoctaPromedio = Number(r.promedio_pernocta_dias ?? 0);
        const pctInternacional = Number(r.pct_internacionales ?? 0);
        const sat = data.satisfaccion || {};
        const satGeneral = Number(sat.promedio_general ?? sat.general ?? 0);

        const origenes = Array.isArray(data.top_origenes) ? data.top_origenes : [];
        const totalVisitasOrigen = origenes.reduce((acc, o) => acc + Number(o.visitas ?? o.encuestas ?? 0), 0);
        const origenesHTML = origenes.length === 0
            ? `<p class="text-xs text-slate-600 dark:text-slate-400 py-4 text-center">Sin encuestas registradas para calcular orígenes.</p>`
            : origenes.map(o => {
                const count = Number(o.visitas ?? o.encuestas ?? 0);
                const pct = o.pct != null ? Number(o.pct) : Math.round((count / (totalVisitasOrigen || 1)) * 100);
                return `
                    <div class="space-y-1">
                        <div class="flex justify-between text-xs font-semibold">
                            <span class="text-slate-700 dark:text-slate-200">${escapeHtml(o.origen)}</span>
                            <span class="text-amber-600 dark:text-amber-400 font-extrabold">${pct}% <span class="text-[10px] text-slate-500 dark:text-slate-400 font-normal">(${count} reg.)</span></span>
                        </div>
                        <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                            <div class="bg-gradient-to-r from-amber-500 to-amber-400 h-2.5 rounded-full" style="width: ${Math.min(100, Math.max(4, pct))}%"></div>
                        </div>
                    </div>
                `;
            }).join("");

        const composicionRaw = Array.isArray(data.tipologia?.composicion) ? data.tipologia.composicion : [];
        const totalComposicion = composicionRaw.reduce((acc, t) => acc + Number(t.cantidad ?? 0), 0);
        const tipologiasHTML = composicionRaw.length === 0
            ? `<p class="text-xs text-slate-600 dark:text-slate-400 py-4 text-center">Sin datos de composición de grupo todavía.</p>`
            : composicionRaw.map(t => {
                const pct = Math.round((Number(t.cantidad ?? 0) / (totalComposicion || 1)) * 100);
                return `
                    <div class="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                        <span class="text-slate-700 dark:text-slate-300 font-medium">${escapeHtml(t.tipo || "Sin clasificar")}</span>
                        <span class="font-extrabold text-slate-900 dark:text-white">${pct}% <span class="text-[10px] text-slate-500 font-normal">(${Number(t.cantidad ?? 0)})</span></span>
                    </div>
                `;
            }).join("");

        const ocupacion = Array.isArray(data.ocupacion_hotelera) ? data.ocupacion_hotelera : [];
        const ocupacionHTML = ocupacion.length === 0
            ? `<p class="text-xs text-slate-600 dark:text-slate-400 py-4 text-center">Sin censos de prestadores (PST) registrados aún.</p>`
            : ocupacion.map(oc => {
                const pctOcup = Number(oc.pct_ocupacion ?? oc.pct ?? 0);
                return `
                    <div class="space-y-1">
                        <div class="flex justify-between text-xs font-semibold">
                            <span class="text-slate-700 dark:text-slate-200">${escapeHtml(oc.municipio)}</span>
                            <span class="text-emerald-600 dark:text-emerald-400 font-extrabold">${pctOcup}% Ocupación</span>
                        </div>
                        <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                            <div class="bg-emerald-500 h-2.5 rounded-full" style="width: ${Math.min(100, Math.max(0, pctOcup))}%"></div>
                        </div>
                    </div>
                `;
            }).join("");

        const satHTML = [
            { label: "Hospitalidad", score: Number(sat.hospitalidad ?? 0), icon: "🤝" },
            { label: "Seguridad", score: Number(sat.seguridad ?? 0), icon: "🛡️" },
            { label: "Vialidad", score: Number(sat.vialidad ?? 0), icon: "🛣️" },
            { label: "Servicios", score: Number(sat.servicios_publicos ?? sat.servicios ?? 0), icon: "⚡" }
        ].map(s => `
            <div class="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <span class="text-lg block">${s.icon}</span>
                <span class="text-[10px] text-slate-600 dark:text-slate-400 block">${s.label}</span>
                <span class="text-base font-black text-amber-600 dark:text-amber-400">${s.score.toFixed(1)} <span class="text-[10px] text-slate-500 dark:text-slate-400">/ 5★</span></span>
            </div>
        `).join("");

        const statusNotice = errorBannerMsg
            ? `<div class="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-700 dark:text-red-300 no-print">${escapeHtml(errorBannerMsg)}</div>`
            : (totalEncuestas === 0
                ? `<div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-800 dark:text-amber-300 no-print">ℹ️ Sin encuestas registradas en este filtro todavía. Los contadores reflejan datos reales en tiempo real.</div>`
                : "");

        container.innerHTML = `
            <div class="space-y-6" id="reporte-rueda-prensa-print">
                ${statusNotice}
                <!-- Barra Superior -->
                <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
                    <div>
                        <div class="flex items-center space-x-2">
                            <span class="text-2xl">📊</span>
                            <h3 class="text-base font-extrabold text-slate-900 dark:text-white">
                                Indicadores de Gestión Turística (KPI Gobernación)
                            </h3>
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                                OFICIAL COTATUR
                            </span>
                        </div>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Tablero gerencial oficial para el Despacho del Gobernador y balances institucionales de afluencia, pernocta y ocupación.
                        </p>
                    </div>

                    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                        <select id="select-filtro-temporada-prensa"
                            class="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-[#198754]">
                            <option value="TODAS" ${filtroTemporada === "TODAS" ? "selected" : ""}>Toda la Temporada</option>
                            <option value="FISS" ${filtroTemporada === "FISS" ? "selected" : ""}>Feria Internacional de San Sebastián</option>
                            <option value="CARNAVALES" ${filtroTemporada === "CARNAVALES" ? "selected" : ""}>Carnavales Turísticos</option>
                            <option value="SEMANA_SANTA" ${filtroTemporada === "SEMANA_SANTA" ? "selected" : ""}>Semana Santa</option>
                            <option value="SANTO_CRISTO" ${filtroTemporada === "SANTO_CRISTO" ? "selected" : ""}>Santo Cristo de La Grita</option>
                            <option value="CONSOLACION_TARIBA" ${filtroTemporada === "CONSOLACION_TARIBA" ? "selected" : ""}>Consolación de Táriba</option>
                            <option value="VACACIONES_ESCOLARES" ${filtroTemporada === "VACACIONES_ESCOLARES" ? "selected" : ""}>Vacaciones Escolares</option>
                            <option value="FIN_DE_ANO" ${filtroTemporada === "FIN_DE_ANO" ? "selected" : ""}>Temporada Decembrina y Año Nuevo</option>
                        </select>

                        <div class="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex">
                            <!-- Botón Diapositiva 16:9 -->
                            <button type="button" id="btn-abrir-diapositiva-16-9"
                                class="w-full sm:w-auto justify-center px-3 py-2 bg-[#198754] hover:bg-[#157347] text-white font-extrabold rounded-xl text-xs flex items-center space-x-1.5 shadow transition-all active:scale-95 tap-target-btn">
                                <span>🖥️</span>
                                <span class="hidden sm:inline">Modo Presentación 16:9</span>
                                <span class="sm:hidden">Presentación</span>
                            </button>

                            <button type="button" id="btn-print-prensa"
                                class="w-full sm:w-auto justify-center px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1 shadow transition-colors tap-target-btn">
                                <span>📄</span>
                                <span class="hidden sm:inline">Imprimir Informe</span>
                                <span class="sm:hidden">Imprimir</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 4 NÚMEROS GIGANTES EJECUTIVOS (KPIs) -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div class="bg-gradient-to-br from-[#198754] to-[#146c43] rounded-2xl p-3.5 sm:p-4 text-white shadow-md">
                        <span class="text-[9px] sm:text-[10px] font-black uppercase tracking-wider block opacity-90 text-emerald-100 truncate">Visitantes Estimados</span>
                        <div class="text-xl sm:text-2xl font-black mt-1 leading-none truncate">${totalVisitantes.toLocaleString()}</div>
                        <span class="text-[8px] sm:text-[9px] font-semibold mt-1 block opacity-80 text-emerald-100 truncate">${totalEncuestas.toLocaleString()} grupos censados</span>
                    </div>

                    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm">
                        <span class="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block truncate">Pernocta Promedio</span>
                        <div class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 leading-none truncate">${pernoctaPromedio} <span class="text-xs font-medium">días</span></div>
                        <span class="text-[8px] sm:text-[9px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1 block truncate">${totalEncuestas > 0 ? "Media de estadía registrada" : "Sin registros"}</span>
                    </div>

                    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm">
                        <span class="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block truncate">Flujo Internacional</span>
                        <div class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 leading-none truncate">${pctInternacional}%</div>
                        <span class="text-[8px] sm:text-[9px] text-slate-600 dark:text-slate-400 font-semibold mt-1 block truncate">Visitantes del exterior</span>
                    </div>

                    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm">
                        <span class="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block truncate">Satisfacción Global</span>
                        <div class="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 leading-none truncate">${satGeneral.toFixed(1)} <span class="text-xs text-slate-500 dark:text-slate-400">/ 5★</span></div>
                        <span class="text-[8px] sm:text-[9px] text-slate-600 dark:text-slate-400 font-semibold mt-1 block truncate">Índice promedio real</span>
                    </div>
                </div>

                <!-- 4 GRÁFICAS EJECUTIVAS -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                            <h4 class="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">1. Afluencia por Origen</h4>
                            <span class="text-[11px] font-bold text-amber-500">Ranking Oficial</span>
                        </div>
                        <div class="space-y-2.5">${origenesHTML}</div>
                    </div>

                    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                            <h4 class="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">2. Tipología del Visitante</h4>
                            <span class="text-[11px] font-bold text-blue-500">Composición</span>
                        </div>
                        <div class="space-y-2">${tipologiasHTML}</div>
                        <div class="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400">
                            Distribución porcentual calculada en base a los registros reales del período.
                        </div>
                    </div>

                    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                            <h4 class="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">3. Ocupación Hotelera</h4>
                            <span class="text-[11px] font-bold text-emerald-500">Oferta Turística</span>
                        </div>
                        <div class="space-y-2.5">${ocupacionHTML}</div>
                    </div>

                    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                            <h4 class="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">4. Percepción de Servicios</h4>
                            <span class="text-[11px] font-bold text-amber-500">1 a 5 Estrellas</span>
                        </div>
                        <div class="grid grid-cols-2 gap-2">${satHTML}</div>
                    </div>
                </div>

                <!-- MODAL DE DIAPOSITIVA EJECUTIVA 16:9 PARA PANTALLAS LED -->
                <div id="modal-diapositiva-16-9" class="hidden fixed inset-0 z-50 bg-black/95 backdrop-blur-md p-2 sm:p-6 flex flex-col items-center justify-center">
                    <div class="w-full max-w-6xl flex items-center justify-between pb-3 text-white">
                        <span class="text-xs font-extrabold uppercase tracking-widest text-amber-400">
                            Lámina Oficial de Indicadores de Gestión • Relación de Aspecto 16:9
                        </span>
                        <div class="flex items-center gap-2">
                            <button type="button" id="btn-slide-fullscreen" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold border border-slate-700">
                                ⛶ Pantalla Completa
                            </button>
                            <button type="button" id="btn-slide-print" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold">
                                🖨️ Imprimir Lámina
                            </button>
                            <button type="button" id="btn-slide-close" class="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-bold">
                                ✕ Cerrar Presentación
                            </button>
                        </div>
                    </div>

                    <!-- CONTENEDOR EXACTO 16:9 Adaptativo Móvil/Escritorio -->
                    <div id="diapositiva-16-9-root" class="w-full max-w-6xl aspect-auto md:aspect-[16/9] max-h-[90dvh] overflow-y-auto md:overflow-hidden bg-[#0c1017] text-white rounded-2xl p-4 sm:p-6 border-2 border-[#198754]/70 shadow-2xl flex flex-col justify-between">
                        <!-- Cabecera Institucional 16:9 con Tríada Oficial -->
                        <div class="flex flex-wrap items-center justify-between border-b border-white/15 pb-3 gap-2">
                            <div class="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                                <div class="inline-flex items-center p-1 sm:p-1.5 rounded-xl bg-white/95 border border-white/20 shadow-sm space-x-1.5 sm:space-x-2 shrink-0">
                                    <img src="./assets/img/logo_cotatur.png" alt="COTATUR" class="h-6 sm:h-8 w-auto object-contain" />
                                    <div class="h-4 sm:h-5 w-[1px] bg-slate-300"></div>
                                    <img src="./assets/img/logo_gobernacion.png" alt="Gobernación" class="h-5 sm:h-7 w-auto object-contain" />
                                    <div class="h-4 sm:h-5 w-[1px] bg-slate-300"></div>
                                    <img src="./assets/img/logo_tachira.png" alt="Táchira" class="h-5 sm:h-7 w-auto object-contain" />
                                </div>
                                <div class="min-w-0 flex-1">
                                    <h2 class="text-xs sm:text-sm font-black tracking-wide uppercase text-amber-400 truncate">Gobernación del Estado Táchira • COTATUR</h2>
                                    <p class="text-[10px] sm:text-[11px] text-slate-300 font-semibold truncate">Indicadores de Gestión Turística • ${filtroTemporada}</p>
                                </div>
                            </div>
                            <div class="text-right font-mono text-[10px] sm:text-xs text-slate-400 shrink-0">
                                <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                                SIMAT-COTATUR • v0.8.0
                            </div>
                        </div>

                        <!-- 4 Métricas Clave 16:9 -->
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 my-3">
                            <div class="bg-[#198754] text-white p-2.5 sm:p-3 rounded-xl shadow min-w-0">
                                <span class="text-[9px] sm:text-[10px] font-black uppercase tracking-wider block text-emerald-100 truncate">Visitantes Estimados</span>
                                <div class="text-xl sm:text-3xl font-black leading-none mt-1 truncate">${totalVisitantes.toLocaleString()}</div>
                                <span class="text-[8px] sm:text-[9px] font-bold block mt-1 text-emerald-100 truncate">${totalEncuestas.toLocaleString()} grupos censados</span>
                            </div>
                            <div class="bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-xl min-w-0">
                                <span class="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider block truncate">Pernocta Media</span>
                                <div class="text-xl sm:text-3xl font-black text-white leading-none mt-1 truncate">${pernoctaPromedio} <span class="text-xs sm:text-sm font-normal text-slate-400">días</span></div>
                                <span class="text-[8px] sm:text-[9px] text-emerald-400 block mt-1 truncate">Alta retención turística</span>
                            </div>
                            <div class="bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-xl min-w-0">
                                <span class="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider block truncate">Turismo Internacional</span>
                                <div class="text-xl sm:text-3xl font-black text-amber-400 leading-none mt-1 truncate">${pctInternacional}%</div>
                                <span class="text-[8px] sm:text-[9px] text-slate-400 block mt-1 truncate">Principal origen: Colombia</span>
                            </div>
                            <div class="bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-xl min-w-0">
                                <span class="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider block truncate">Satisfacción Global</span>
                                <div class="text-xl sm:text-3xl font-black text-amber-500 leading-none mt-1 truncate">${satGeneral.toFixed(1)} <span class="text-xs sm:text-sm font-normal text-slate-400">/ 5★</span></div>
                                <span class="text-[8px] sm:text-[9px] text-slate-400 block mt-1 truncate">Valoración de servicios</span>
                            </div>
                        </div>

                        <!-- 3 Columnas de Análisis 16:9 -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 flex-1 items-start text-xs">
                            <div class="bg-white/5 p-3 rounded-xl border border-white/10 flex flex-col justify-between">
                                <span class="text-[11px] font-extrabold text-amber-400 uppercase block mb-1">Top Orígenes</span>
                                <div class="space-y-1.5 flex-1">${origenesHTML}</div>
                            </div>
                            <div class="bg-white/5 p-3 rounded-xl border border-white/10 flex flex-col justify-between">
                                <span class="text-[11px] font-extrabold text-blue-400 uppercase block mb-1">Composición Grupal</span>
                                <div class="space-y-1 flex-1">${tipologiasHTML}</div>
                            </div>
                            <div class="bg-white/5 p-3 rounded-xl border border-white/10 flex flex-col justify-between">
                                <span class="text-[11px] font-extrabold text-emerald-400 uppercase block mb-1">Ocupación y Calidad</span>
                                <div class="space-y-1 flex-1">${ocupacionHTML}</div>
                            </div>
                        </div>

                        <!-- Pie 16:9 -->
                        <div class="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                            <span>Fuente: Corporación Tachirense de Turismo (COTATUR) • Sistema Integrado de Medición y Analítica Turística</span>
                            <span>Corte: ${new Date().toLocaleDateString("es-VE")}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Eventos
        const selectFiltro = container.querySelector("#select-filtro-temporada-prensa");
        if (selectFiltro) {
            selectFiltro.addEventListener("change", (e) => {
                filtroTemporada = e.target.value;
                fetchData();
            });
        }

        const btnPrint = container.querySelector("#btn-print-prensa");
        if (btnPrint) {
            btnPrint.addEventListener("click", () => window.print());
        }

        // Controlador Diapositiva 16:9
        const modalSlide = container.querySelector("#modal-diapositiva-16-9");
        const btnOpenSlide = container.querySelector("#btn-abrir-diapositiva-16-9");
        const btnCloseSlide = container.querySelector("#btn-slide-close");
        const btnFullscreen = container.querySelector("#btn-slide-fullscreen");
        const btnPrintSlide = container.querySelector("#btn-slide-print");
        const slideRoot = container.querySelector("#diapositiva-16-9-root");

        if (btnOpenSlide && modalSlide) {
            btnOpenSlide.addEventListener("click", () => modalSlide.classList.remove("hidden"));
        }
        if (btnCloseSlide && modalSlide) {
            btnCloseSlide.addEventListener("click", () => modalSlide.classList.add("hidden"));
        }
        if (btnFullscreen && slideRoot) {
            btnFullscreen.addEventListener("click", () => {
                if (!document.fullscreenElement) {
                    slideRoot.requestFullscreen().catch(() => {});
                } else {
                    document.exitFullscreen().catch(() => {});
                }
            });
        }
        if (btnPrintSlide) {
            btnPrintSlide.addEventListener("click", () => window.print());
        }
    }

    function crearEstadoVacio() {
        return {
            resumen: {
                total_encuestas: 0,
                total_personas_estimadas: 0,
                promedio_pernocta_dias: 0,
                pct_internacionales: 0,
                gasto_promedio_usd: 0
            },
            top_origenes: [],
            tipologia: { composicion: [], edades: [] },
            ocupacion_hotelera: [],
            satisfaccion: {
                promedio_general: 0,
                hospitalidad: 0,
                seguridad: 0,
                vialidad: 0,
                servicios_publicos: 0
            }
        };
    }

    fetchData();
}
