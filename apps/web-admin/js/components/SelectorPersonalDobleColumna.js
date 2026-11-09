/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-admin/js/components/SelectorPersonalDobleColumna.js
 * DESCRIPCIÓN: Componente reutilizable de asignación de personal en 2 columnas:
 *              - Columna Izquierda: Personal Asignado al Punto.
 *              - Columna Derecha: Personal Sin Asignar a este Punto.
 *              Soporta que un mismo funcionario tenga varios puntos de encuesta
 *              activos simultáneamente (relación muchos-a-muchos sincronizada
 *              entre calendario_asuetos_eventos / configuracion_global y Supabase).
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

const CONFIG_CODIGO_MULTI = "SYS_ASIGNACIONES_MULTIPUNTO";
const LOCAL_MULTI_KEY = "simat_asignaciones_multipunto_v1";

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
 * Obtiene el mapa de asignaciones múltiples { [puntoId]: [funcId1, funcId2, ...] }
 * sincronizado en vivo con Supabase.
 */
export async function obtenerMapaAsignacionesMultiples(supabaseConfig) {
    let mapaLocal = {};
    try {
        mapaLocal = JSON.parse(localStorage.getItem(LOCAL_MULTI_KEY) || "{}");
    } catch (_) {
        mapaLocal = {};
    }

    if (!navigator.onLine) return mapaLocal;

    try {
        const res = await fetch(
            `${supabaseConfig.SUPABASE_URL}/rest/v1/calendario_asuetos_eventos?select=descripcion&codigo=eq.${CONFIG_CODIGO_MULTI}`,
            {
                headers: {
                    "apikey": supabaseConfig.SUPABASE_PUBLISHABLE_KEY,
                    "Authorization": `Bearer ${supabaseConfig.SUPABASE_PUBLISHABLE_KEY}`
                }
            }
        );
        if (res.ok) {
            const rows = await res.json();
            if (Array.isArray(rows) && rows.length > 0 && rows[0].descripcion) {
                const parsed = JSON.parse(rows[0].descripcion);
                if (parsed && typeof parsed === "object") {
                    localStorage.setItem(LOCAL_MULTI_KEY, JSON.stringify(parsed));
                    return parsed;
                }
            }
        }
    } catch (_) {}

    return mapaLocal;
}

/**
 * Guarda el mapa de asignaciones múltiples en Supabase y sincroniza el punto primario.
 */
export async function guardarAsignacionesPuntoEnServidor(
    supabaseConfig,
    credencial,
    puntoId,
    funcionariosIds = []
) {
    const idsUnicos = Array.from(new Set(funcionariosIds.filter(Boolean)));
    const mapa = await obtenerMapaAsignacionesMultiples(supabaseConfig);
    mapa[puntoId] = idsUnicos;

    try {
        localStorage.setItem(LOCAL_MULTI_KEY, JSON.stringify(mapa));
    } catch (_) {}

    // 1. Persistir mapa JSON multipunto en Supabase vía RPC admin_gestionar_calendario
    try {
        await fetch(`${supabaseConfig.SUPABASE_URL}/rest/v1/rpc/admin_gestionar_calendario`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": supabaseConfig.SUPABASE_PUBLISHABLE_KEY,
                "Authorization": `Bearer ${supabaseConfig.SUPABASE_PUBLISHABLE_KEY}`
            },
            body: JSON.stringify({
                p_accion: "GUARDAR",
                p_credencial: credencial || "",
                p_datos: {
                    codigo: CONFIG_CODIGO_MULTI,
                    nombre: "Registro Interno de Asignaciones Multipunto",
                    tipo_cuestionario: "SISTEMA_CONFIG",
                    fecha_inicio: "2000-01-01",
                    fecha_fin: "2000-01-01",
                    prioridad: 0,
                    activo: false,
                    descripcion: JSON.stringify(mapa)
                }
            })
        });
    } catch (_) {}

    // 2. Sincronizar columna punto_asignado_id en perfiles_funcionarios para cada asignado
    for (const fid of idsUnicos) {
        try {
            await fetch(`${supabaseConfig.SUPABASE_URL}/rest/v1/rpc/admin_asignar_funcionario_punto`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": supabaseConfig.SUPABASE_PUBLISHABLE_KEY,
                    "Authorization": `Bearer ${supabaseConfig.SUPABASE_PUBLISHABLE_KEY}`
                },
                body: JSON.stringify({
                    p_credencial: credencial || "",
                    p_funcionario_id: fid,
                    p_punto_id: puntoId
                })
            });
        } catch (_) {}
    }

    return mapa;
}

/**
 * Devuelve todos los nombres de puntos activos que tiene asignados un funcionario.
 */
export function obtenerNombresPuntosDeFuncionario(func, todosLosPuntos = [], mapaMulti = {}) {
    const puntosAsignadosIds = new Set();

    if (func.punto_asignado_id) {
        puntosAsignadosIds.add(func.punto_asignado_id);
    }

    Object.keys(mapaMulti || {}).forEach(pid => {
        const arr = mapaMulti[pid];
        if (Array.isArray(arr) && arr.includes(func.id)) {
            puntosAsignadosIds.add(pid);
        }
    });

    const nombres = [];
    puntosAsignadosIds.forEach(pid => {
        const pObj = todosLosPuntos.find(p => p.id === pid);
        if (pObj && pObj.nombre) {
            nombres.push(pObj.nombre);
        }
    });

    if (nombres.length === 0 && func.punto_nombre && func.punto_nombre !== "Sin asignar") {
        nombres.push(func.punto_nombre);
    }

    return nombres;
}

/**
 * Renderiza el selector interactivo de 2 columnas:
 * - Izquierda: Personal Asignado
 * - Derecha: Personal Sin Asignar
 */
export function renderSelectorPersonalDobleColumna({
    containerId,
    todosLosFuncionarios = [],
    asignadosInicialesIds = [],
    mapaMulti = {},
    todosLosPuntos = [],
    onChangeCallback = null
}) {
    const container = document.getElementById(containerId);
    if (!container) return { getSelectedIds: () => [] };

    const setAsignados = new Set(asignadosInicialesIds.filter(Boolean));

    function render() {
        const asignadosList = todosLosFuncionarios.filter(f => setAsignados.has(f.id));
        const sinAsignarList = todosLosFuncionarios.filter(f => !setAsignados.has(f.id));

        const htmlAsignados = asignadosList.length === 0
            ? `<div class="p-4 text-center text-[11px] text-slate-400 italic">
                   Ningún funcionario asignado aún.<br/>Haz clic en un funcionario de la columna derecha para asignarlo.
               </div>`
            : asignadosList.map(f => {
                const otrosPuntos = obtenerNombresPuntosDeFuncionario(f, todosLosPuntos, mapaMulti);
                return `
                    <div class="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/70 rounded-xl flex items-center justify-between gap-2 transition-all">
                        <div class="min-w-0">
                            <div class="text-xs font-bold text-slate-900 dark:text-white truncate">
                                ${escapeHtml(f.nombre_completo)}
                            </div>
                            <div class="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                C.I: ${escapeHtml(f.cedula)} • ${escapeHtml(f.rol || "ENCUESTADOR")}
                            </div>
                            ${otrosPuntos.length > 1 ? `
                                <div class="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                                    📍 Activo en ${otrosPuntos.length} puntos
                                </div>
                            ` : ""}
                        </div>
                        <button type="button" data-remove-id="${escapeHtml(f.id)}"
                            class="btn-col-quitar shrink-0 px-2.5 py-1 bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 border border-red-500/30 rounded-lg text-[11px] font-bold transition-colors"
                            title="Quitar de este punto y pasar a disponibles">
                            Quitar
                        </button>
                    </div>
                `;
            }).join("");

        const htmlSinAsignar = sinAsignarList.length === 0
            ? `<div class="p-4 text-center text-[11px] text-slate-400 italic">
                   Todos los funcionarios registrados están asignados a este punto.
               </div>`
            : sinAsignarList.map(f => {
                const puntosActivos = obtenerNombresPuntosDeFuncionario(f, todosLosPuntos, mapaMulti);
                const badgeOtros = puntosActivos.length > 0
                    ? `<div class="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 truncate" title="${escapeHtml(puntosActivos.join(", "))}">
                           📌 También en: ${escapeHtml(puntosActivos.join(", "))}
                       </div>`
                    : `<div class="text-[10px] text-slate-400 mt-0.5">Disponible sin otros puntos</div>`;

                return `
                    <div class="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-2 hover:border-amber-500/50 transition-all">
                        <button type="button" data-add-id="${escapeHtml(f.id)}"
                            class="btn-col-agregar shrink-0 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[11px] font-bold shadow-sm transition-colors"
                            title="Asignar a este punto">
                            Asignar
                        </button>
                        <div class="min-w-0 flex-1 text-right sm:text-left">
                            <div class="text-xs font-bold text-slate-900 dark:text-white truncate">
                                ${escapeHtml(f.nombre_completo)}
                            </div>
                            <div class="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                C.I: ${escapeHtml(f.cedula)} • ${escapeHtml(f.rol || "ENCUESTADOR")}
                            </div>
                            ${badgeOtros}
                        </div>
                    </div>
                `;
            }).join("");

        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- COLUMNA IZQUIERDA: PERSONAL ASIGNADO -->
                <div class="bg-slate-50 dark:bg-slate-800/50 border-2 border-emerald-500/40 rounded-2xl p-3.5 flex flex-col space-y-2.5">
                    <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                        <div class="flex items-center space-x-1.5">
                            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            <h5 class="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                                Personal Asignado al Punto
                            </h5>
                        </div>
                        <span class="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                            ${asignadosList.length} asignados
                        </span>
                    </div>
                    <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
                        ${htmlAsignados}
                    </div>
                </div>

                <!-- COLUMNA DERECHA: PERSONAL DISPONIBLE -->
                <div class="bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-2xl p-3.5 flex flex-col space-y-2.5">
                    <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                        <div class="flex items-center space-x-1.5">
                            <span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                            <h5 class="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                                Personal Disponible
                            </h5>
                        </div>
                        <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            ${sinAsignarList.length} disponibles
                        </span>
                    </div>
                    <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
                        ${htmlSinAsignar}
                    </div>
                </div>
            </div>
        `;

        // Eventos para quitar (pasar de izquierda a derecha)
        container.querySelectorAll(".btn-col-quitar").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-remove-id");
                setAsignados.delete(id);
                render();
                if (typeof onChangeCallback === "function") {
                    onChangeCallback(Array.from(setAsignados));
                }
            });
        });

        // Eventos para asignar (pasar de derecha a izquierda)
        container.querySelectorAll(".btn-col-agregar").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-add-id");
                setAsignados.add(id);
                render();
                if (typeof onChangeCallback === "function") {
                    onChangeCallback(Array.from(setAsignados));
                }
            });
        });
    }

    render();

    return {
        getSelectedIds: () => Array.from(setAsignados),
        setSelectedIds: (newIds) => {
            setAsignados.clear();
            (newIds || []).forEach(id => setAsignados.add(id));
            render();
        }
    };
}
