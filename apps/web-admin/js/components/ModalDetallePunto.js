/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-admin/js/components/ModalDetallePunto.js
 * DESCRIPCIÓN: Ficha detallada interactiva de un Punto de Control Turístico:
 *              1. Muestra información oficial y coordenadas del punto.
 *              2. Integra el selector de 2 columnas (Izquierda: Personal Asignado /
 *                 Derecha: Personal Sin Asignar) con sincronización multipunto.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

import {
    renderSelectorPersonalDobleColumna,
    obtenerMapaAsignacionesMultiples,
    guardarAsignacionesPuntoEnServidor
} from "./SelectorPersonalDobleColumna.js";

/**
 * Devuelve el HTML estructural del modal de detalle de punto.
 */
export function getModalDetallePuntoHtml() {
    return `
        <div id="modal-detalle-punto" class="hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <div class="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
                
                <!-- Cabecera de Ficha -->
                <div class="bg-[#1c1c1c] text-white p-4 border-b-2 border-[#198754] flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <span class="text-lg">📍</span>
                        <div>
                            <h3 class="text-sm font-extrabold" id="detalle-punto-titulo">Ficha del Punto</h3>
                            <p class="text-[10px] text-amber-400 font-mono" id="detalle-punto-codigo">CODIGO</p>
                        </div>
                    </div>
                    <button type="button" id="btn-cerrar-detalle-punto" class="text-slate-400 hover:text-white font-bold text-lg px-2">✕</button>
                </div>

                <!-- Cuerpo de Ficha -->
                <div class="p-5 overflow-y-auto space-y-5 text-xs">
                    
                    <!-- Metadatos Básicos -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                        <div>
                            <span class="text-[10px] text-slate-400 uppercase font-bold block">Municipio:</span>
                            <span class="font-bold text-slate-900 dark:text-white" id="detalle-punto-municipio">---</span>
                        </div>
                        <div>
                            <span class="text-[10px] text-slate-400 uppercase font-bold block">Tipo:</span>
                            <span class="font-bold text-slate-900 dark:text-white" id="detalle-punto-tipo">---</span>
                        </div>
                        <div>
                            <span class="text-[10px] text-slate-400 uppercase font-bold block">Coordenadas:</span>
                            <span class="font-bold text-slate-900 dark:text-white font-mono text-[11px]" id="detalle-punto-coords">---</span>
                        </div>
                        <div>
                            <span class="text-[10px] text-slate-400 uppercase font-bold block">Estado:</span>
                            <span class="font-bold text-emerald-600 dark:text-emerald-400" id="detalle-punto-estado">Activo</span>
                        </div>
                    </div>

                    <!-- Sección de Asignación de Personal en 2 Columnas -->
                    <div class="space-y-3">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                            <div>
                                <h4 class="font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                    <span>👥</span>
                                    <span>Asignación de Personal de Campo</span>
                                </h4>
                                <p class="text-[11px] text-slate-500 dark:text-slate-400">
                                    Un mismo funcionario puede estar asignado simultáneamente a varios puntos de encuesta activos.
                                </p>
                            </div>
                            <span class="text-[11px] font-bold text-emerald-500" id="detalle-sync-status">
                                Sincronización inmediata
                            </span>
                        </div>

                        <!-- Montaje de las 2 Columnas -->
                        <div id="modal-detalle-selector-2col-mount">
                            <div class="text-center p-4 text-slate-400">Cargando personal...</div>
                        </div>
                    </div>

                </div>

                <!-- Pie de Ficha -->
                <div class="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                    <button type="button" id="btn-cerrar-detalle-footer"
                        class="px-5 py-2 bg-[#198754] hover:bg-[#157347] text-white font-bold rounded-xl text-xs shadow transition-colors tap-target-btn">
                        Cerrar Ficha
                    </button>
                </div>

            </div>
        </div>
    `;
}

/**
 * Inicializa los controladores del modal de detalle de punto.
 */
export function initModalDetallePuntoController(
    supabaseConfig,
    getAdminCredencialCallback,
    getPuntosListCallback = () => [],
    onAssignedChangedCallback = null
) {
    let activePuntoIdModal = null;
    const modalDetalle = document.getElementById("modal-detalle-punto");
    const btnCerrarDetalle = document.getElementById("btn-cerrar-detalle-punto");
    const btnCerrarFooter = document.getElementById("btn-cerrar-detalle-footer");

    const cerrarModal = () => {
        if (modalDetalle) modalDetalle.classList.add("hidden");
    };

    if (btnCerrarDetalle) btnCerrarDetalle.addEventListener("click", cerrarModal);
    if (btnCerrarFooter) btnCerrarFooter.addEventListener("click", cerrarModal);

    async function precargarFuncionarios() {
        try {
            const cred = getAdminCredencialCallback();
            const res = await fetch(`${supabaseConfig.SUPABASE_URL}/rest/v1/rpc/admin_gestionar_funcionarios_v2`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": supabaseConfig.SUPABASE_PUBLISHABLE_KEY,
                    "Authorization": `Bearer ${supabaseConfig.SUPABASE_PUBLISHABLE_KEY}`
                },
                body: JSON.stringify({ p_credencial: cred, p_accion: "LISTAR", p_datos: {} })
            });
            if (res.ok) {
                const list = await res.json();
                return Array.isArray(list) ? list : [];
            }
        } catch (_) {}
        return [];
    }

    async function abrirDetallePunto(puntoId) {
        activePuntoIdModal = puntoId;
        if (modalDetalle) modalDetalle.classList.remove("hidden");

        try {
            const [todosLosFuncionarios, mapaMulti, resDetalle] = await Promise.all([
                precargarFuncionarios(),
                obtenerMapaAsignacionesMultiples(supabaseConfig),
                fetch(`${supabaseConfig.SUPABASE_URL}/rest/v1/rpc/admin_obtener_punto_detalle`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "apikey": supabaseConfig.SUPABASE_PUBLISHABLE_KEY,
                        "Authorization": `Bearer ${supabaseConfig.SUPABASE_PUBLISHABLE_KEY}`
                    },
                    body: JSON.stringify({ p_punto_id: puntoId })
                })
            ]);

            if (!resDetalle.ok) throw new Error("Error al obtener detalle del punto.");
            const data = await resDetalle.json();
            const p = data.punto;
            const participantesPrimarios = (data.participantes || []).map(f => f.id);
            const participantesMulti = Array.isArray(mapaMulti[puntoId]) ? mapaMulti[puntoId] : [];

            // Combinar funcionarios asignados por vía primaria o multipunto
            const asignadosInicialesIds = Array.from(new Set([...participantesPrimarios, ...participantesMulti]));

            document.getElementById("detalle-punto-titulo").textContent = p.nombre;
            document.getElementById("detalle-punto-codigo").textContent = `CÓDIGO OFICIAL: ${p.codigo}`;
            document.getElementById("detalle-punto-municipio").textContent = p.municipio;
            document.getElementById("detalle-punto-tipo").textContent = p.tipo;
            document.getElementById("detalle-punto-coords").textContent = `${p.latitud_referencia || "7.7669"}, ${p.longitud_referencia || "-72.2250"}`;
            document.getElementById("detalle-punto-estado").textContent = p.activo ? "🟢 Activo" : "🔴 Inactivo";

            const statusEl = document.getElementById("detalle-sync-status");

            renderSelectorPersonalDobleColumna({
                containerId: "modal-detalle-selector-2col-mount",
                todosLosFuncionarios,
                asignadosInicialesIds,
                mapaMulti,
                todosLosPuntos: getPuntosListCallback(),
                onChangeCallback: async (nuevosIdsAsignados) => {
                    if (statusEl) statusEl.textContent = "⏳ Guardando cambios...";
                    const cred = getAdminCredencialCallback();

                    // Detectar si algún funcionario que tenía este punto como primario fue quitado
                    const quitados = participantesPrimarios.filter(id => !nuevosIdsAsignados.includes(id));
                    for (const qId of quitados) {
                        try {
                            await fetch(`${supabaseConfig.SUPABASE_URL}/rest/v1/rpc/admin_asignar_funcionario_punto`, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "apikey": supabaseConfig.SUPABASE_PUBLISHABLE_KEY,
                                    "Authorization": `Bearer ${supabaseConfig.SUPABASE_PUBLISHABLE_KEY}`
                                },
                                body: JSON.stringify({
                                    p_credencial: cred,
                                    p_funcionario_id: qId,
                                    p_punto_id: null
                                })
                            });
                        } catch (_) {}
                    }

                    await guardarAsignacionesPuntoEnServidor(
                        supabaseConfig,
                        cred,
                        activePuntoIdModal,
                        nuevosIdsAsignados
                    );

                    if (statusEl) statusEl.textContent = "✅ Equipo sincronizado en Supabase";
                    if (typeof onAssignedChangedCallback === "function") {
                        onAssignedChangedCallback();
                    }
                }
            });

        } catch (err) {
            alert("Error al cargar ficha: " + err.message);
        }
    }

    return { abrirDetallePunto };
}
