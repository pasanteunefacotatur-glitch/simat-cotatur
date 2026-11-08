/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-admin/js/components/ModalDetallePunto.js
 * DESCRIPCIÓN: Ficha detallada interactiva de un Punto de Control Turístico:
 *              1. Muestra información oficial y coordenadas del punto.
 *              2. Lista los funcionarios participantes asignados al punto.
 *              3. Permite asignar o desasignar funcionarios con un clic.
 *              4. Incluye sanitización HTML contra inyecciones DOM XSS.
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

/**
 * Devuelve el HTML estructural del modal de detalle de punto.
 */
export function getModalDetallePuntoHtml() {
    return `
        <div id="modal-detalle-punto" class="hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <div class="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
                
                <!-- Cabecera de Ficha -->
                <div class="bg-[#1c1c1c] text-white p-4 border-b-2 border-amber-500 flex items-center justify-between">
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

                    <!-- Sección de Funcionarios Participantes Asignados -->
                    <div class="space-y-3">
                        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                            <h4 class="font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                <span>👥</span>
                                <span>Funcionarios Participantes en este Punto</span>
                            </h4>
                            <span class="text-[11px] font-bold text-amber-500" id="detalle-participantes-count">0 funcionarios</span>
                        </div>

                        <!-- Asignar nuevo funcionario a este punto con un clic -->
                        <div class="bg-amber-500/10 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div class="text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
                                ➕ Asignar funcionario existente a este punto:
                            </div>
                            <div class="flex items-center gap-2">
                                <select id="select-asignar-funcionario" class="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white outline-none">
                                    <option value="">Seleccione un funcionario...</option>
                                </select>
                                <button type="button" id="btn-confirmar-asignacion" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors">
                                    Asignar
                                </button>
                            </div>
                        </div>

                        <!-- Listado de Funcionarios de este Punto -->
                        <div id="lista-participantes-container" class="space-y-2">
                            <div class="text-center p-4 text-slate-400">Sin participantes asignados.</div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    `;
}

/**
 * Inicializa los controladores del modal de detalle de punto.
 */
export function initModalDetallePuntoController(supabaseConfig, getAdminCredencialCallback) {
    let activePuntoIdModal = null;
    const modalDetalle = document.getElementById("modal-detalle-punto");
    const btnCerrarDetalle = document.getElementById("btn-cerrar-detalle-punto");
    const selectAsignar = document.getElementById("select-asignar-funcionario");
    const btnAsignar = document.getElementById("btn-confirmar-asignacion");

    if (btnCerrarDetalle && modalDetalle) {
        btnCerrarDetalle.addEventListener("click", () => modalDetalle.classList.add("hidden"));
    }

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
                return await res.json();
            }
        } catch (_) {}
        return [];
    }

    async function abrirDetallePunto(puntoId) {
        activePuntoIdModal = puntoId;
        if (modalDetalle) modalDetalle.classList.remove("hidden");

        const todosLosFuncionarios = await precargarFuncionarios();
        if (selectAsignar) {
            selectAsignar.innerHTML = `<option value="">Seleccione un funcionario...</option>` +
                todosLosFuncionarios.map(f => `
                    <option value="${escapeHtml(f.id)}">${escapeHtml(f.nombre_completo)} (${escapeHtml(f.cedula)}) - Actual: ${escapeHtml(f.punto_nombre || 'Sin asignar')}</option>
                `).join("");
        }

        try {
            const res = await fetch(`${supabaseConfig.SUPABASE_URL}/rest/v1/rpc/admin_obtener_punto_detalle`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": supabaseConfig.SUPABASE_PUBLISHABLE_KEY,
                    "Authorization": `Bearer ${supabaseConfig.SUPABASE_PUBLISHABLE_KEY}`
                },
                body: JSON.stringify({ p_punto_id: puntoId })
            });

            if (!res.ok) throw new Error("Error al obtener detalle.");
            const data = await res.json();
            const p = data.punto;
            const participantes = data.participantes || [];

            document.getElementById("detalle-punto-titulo").textContent = p.nombre;
            document.getElementById("detalle-punto-codigo").textContent = `CÓDIGO OFICIAL: ${p.codigo}`;
            document.getElementById("detalle-punto-municipio").textContent = p.municipio;
            document.getElementById("detalle-punto-tipo").textContent = p.tipo;
            document.getElementById("detalle-punto-coords").textContent = `${p.latitud_referencia || '7.8228'}, ${p.longitud_referencia || '-72.2272'}`;
            document.getElementById("detalle-punto-estado").textContent = p.activo ? '🟢 Activo' : '🔴 Inactivo';
            document.getElementById("detalle-participantes-count").textContent = `${participantes.length} funcionario(s)`;

            const listaContainer = document.getElementById("lista-participantes-container");
            if (participantes.length === 0) {
                listaContainer.innerHTML = `<div class="text-center p-4 text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">No hay encuestadores asignados a este punto actualmente.</div>`;
            } else {
                listaContainer.innerHTML = participantes.map(f => `
                    <div class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                        <div>
                            <div class="font-bold text-slate-900 dark:text-white">${escapeHtml(f.nombre_completo)}</div>
                            <div class="text-[10px] text-slate-400 font-mono">C.I: ${escapeHtml(f.cedula)} • Tel: ${escapeHtml(f.telefono || 'Sin teléfono')}</div>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${f.activo ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'}">
                                ${f.activo ? '🟢 Activo' : '🔴 Inactivo'}
                            </span>
                            <button type="button" data-funcid="${escapeHtml(f.id)}" class="btn-desasignar-func text-[11px] font-bold text-red-600 hover:underline">
                                Quitar
                            </button>
                        </div>
                    </div>
                `).join("");

                document.querySelectorAll(".btn-desasignar-func").forEach(btn => {
                    btn.addEventListener("click", async (e) => {
                        const fid = e.currentTarget.getAttribute("data-funcid");
                        const cred = getAdminCredencialCallback();
                        await fetch(`${supabaseConfig.SUPABASE_URL}/rest/v1/rpc/admin_asignar_funcionario_punto`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "apikey": supabaseConfig.SUPABASE_PUBLISHABLE_KEY,
                                "Authorization": `Bearer ${supabaseConfig.SUPABASE_PUBLISHABLE_KEY}`
                            },
                            body: JSON.stringify({ p_credencial: cred, p_funcionario_id: fid, p_punto_id: null })
                        });
                        abrirDetallePunto(puntoId);
                    });
                });
            }
        } catch (err) {
            alert("Error al cargar ficha: " + err.message);
        }
    }

    if (btnAsignar) {
        btnAsignar.addEventListener("click", async () => {
            const funcId = selectAsignar ? selectAsignar.value : "";
            if (!funcId || !activePuntoIdModal) {
                alert("Seleccione un funcionario para asignarlo.");
                return;
            }

            try {
                const cred = getAdminCredencialCallback();
                const res = await fetch(`${supabaseConfig.SUPABASE_URL}/rest/v1/rpc/admin_asignar_funcionario_punto`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "apikey": supabaseConfig.SUPABASE_PUBLISHABLE_KEY,
                        "Authorization": `Bearer ${supabaseConfig.SUPABASE_PUBLISHABLE_KEY}`
                    },
                    body: JSON.stringify({ p_credencial: cred, p_funcionario_id: funcId, p_punto_id: activePuntoIdModal })
                });
                if (res.ok) {
                    abrirDetallePunto(activePuntoIdModal);
                }
            } catch (_) {}
        });
    }

    return { abrirDetallePunto };
}
