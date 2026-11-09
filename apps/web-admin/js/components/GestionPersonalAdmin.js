/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-admin/js/components/GestionPersonalAdmin.js
 * DESCRIPCIÓN: Módulo de administración de funcionarios y encuestadores:
 *              1. Creación ágil únicamente con Cédula (clave = cédula inicial).
 *              2. Restablecimiento de contraseña por el supervisor.
 *              3. Desactivación remota instantánea y eliminación.
 *              4. Opción global para permitir o restringir la selección de punto.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

import {
    obtenerMapaAsignacionesMultiples,
    obtenerNombresPuntosDeFuncionario
} from "./SelectorPersonalDobleColumna.js";

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function renderGestionPersonalAdmin(containerId, supabaseConfig, getAdminCredencialCallback, puntosList = []) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const puntosOptions = puntosList.map(p => `
        <option value="${escapeHtml(p.id)}">${escapeHtml(p.nombre)}</option>
    `).join("");

    container.innerHTML = `
        <div class="space-y-6">

            <!-- 1. AJUSTE GLOBAL: SELECCIÓN DE PUNTO POR ENCUESTADORES -->
            <div class="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/30 p-5 rounded-2xl border border-amber-500/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="space-y-1">
                    <span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                        Ajuste Operativo General
                    </span>
                    <h3 class="text-sm font-black text-slate-900 dark:text-white">
                        ¿Permitir a los encuestadores seleccionar el Punto de Captura?
                    </h3>
                    <p class="text-xs text-slate-600 dark:text-slate-400 max-w-2xl">
                        En la modalidad estándar recomendada, cada encuestador atiende únicamente el punto que le ha sido asignado. Al habilitar esta opción, el encuestador podrá alternar entre los puntos registrados.
                    </p>
                </div>

                <div class="flex items-center space-x-3 self-start sm:self-auto">
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="toggle-permitir-seleccion-punto" class="sr-only peer">
                        <div class="w-12 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#198754]"></div>
                    </label>
                    <span id="label-estado-switch-punto" class="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Bloqueado
                    </span>
                </div>
            </div>

            <!-- 2. FORMULARIO DE ALTA RÁPIDA: SOLO CÉDULA -->
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <div class="border-b border-slate-200 dark:border-slate-800 pb-2">
                    <h3 class="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <span>➕</span>
                        <span>Registrar Nuevo Funcionario</span>
                    </h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400">
                        La contraseña inicial será automáticamente el número de cédula. El funcionario deberá cambiarla en su primer ingreso.
                    </p>
                </div>

                <form id="form-crear-funcionario-cedula" class="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div>
                        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Cédula de Identidad <span class="text-red-500">*</span>
                        </label>
                        <input type="text" id="nuevo-func-cedula" required inputmode="numeric" pattern="[0-9]*" maxlength="10" placeholder="Ej: 18452120 (solo números)"
                            class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-mono outline-none focus:ring-1 focus:ring-[#198754] focus:border-[#198754]" />
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Rol Institucional
                        </label>
                        <select id="nuevo-func-rol" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none">
                            <option value="ENCUESTADOR">Encuestador de Campo</option>
                            <option value="SUPERVISOR">Supervisor de Operativo</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Punto Asignado
                        </label>
                        <select id="nuevo-func-punto" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none">
                            <option value="">Sin punto exclusivo asignado</option>
                            ${puntosOptions}
                        </select>
                    </div>

                    <div>
                        <button type="submit" id="btn-guardar-nuevo-func"
                            class="w-full py-2.5 px-4 bg-[#198754] hover:bg-[#157347] text-white font-bold rounded-xl text-xs shadow transition-all active:scale-95 tap-target-btn">
                            Registrar Funcionario
                        </button>
                    </div>
                </form>
            </div>

            <!-- 3. TABLA DE PERSONAL -->
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Nómina de Funcionarios Registrados
                    </span>
                    <button type="button" id="btn-refrescar-nomina" class="text-xs text-[#198754] hover:text-[#157347] dark:text-emerald-400 font-bold flex items-center gap-1">
                        <span>🔄</span>
                        <span>Actualizar</span>
                    </button>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                        <thead class="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th class="p-3">Cédula</th>
                                <th class="p-3">Nombre / Estado</th>
                                <th class="p-3">Rol</th>
                                <th class="p-3">Punto Asignado</th>
                                <th class="p-3 text-center">Estado</th>
                                <th class="p-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="tabla-nomina-body" class="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                            <tr>
                                <td colspan="6" class="p-6 text-center text-slate-400">Consultando funcionarios...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    `;

    const switchPunto = document.getElementById("toggle-permitir-seleccion-punto");
    const labelSwitch = document.getElementById("label-estado-switch-punto");
    const formCrear = document.getElementById("form-crear-funcionario-cedula");
    const btnRefrescar = document.getElementById("btn-refrescar-nomina");
    const tablaBody = document.getElementById("tabla-nomina-body");

    // 1. Cargar configuración global del punto
    async function cargarConfiguracionGlobal() {
        try {
            const cred = getAdminCredencialCallback();
            const res = await fetch(`${supabaseConfig.SUPABASE_URL}/rest/v1/rpc/admin_gestionar_funcionarios_v2`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": supabaseConfig.SUPABASE_PUBLISHABLE_KEY,
                    "Authorization": `Bearer ${supabaseConfig.SUPABASE_PUBLISHABLE_KEY}`
                },
                body: JSON.stringify({ p_credencial: cred, p_accion: "CONFIG_GET", p_datos: {} })
            });
            if (res.ok) {
                const cfg = await res.json();
                const permitido = Boolean(cfg.permitir_seleccion_punto_encuestador);
                switchPunto.checked = permitido;
                labelSwitch.textContent = permitido ? "🟢 Libre Selección" : "🔒 Asignación Fija";
            }
        } catch (_) {}
    }

    switchPunto.addEventListener("change", async (e) => {
        const permitido = e.target.checked;
        labelSwitch.textContent = permitido ? "🟢 Libre Selección" : "🔒 Asignación Fija";

        try {
            const cred = getAdminCredencialCallback();
            await fetch(`${supabaseConfig.SUPABASE_URL}/rest/v1/rpc/admin_gestionar_funcionarios_v2`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": supabaseConfig.SUPABASE_PUBLISHABLE_KEY,
                    "Authorization": `Bearer ${supabaseConfig.SUPABASE_PUBLISHABLE_KEY}`
                },
                body: JSON.stringify({
                    p_credencial: cred,
                    p_accion: "CONFIG_SET",
                    p_datos: { permitir_seleccion_punto_encuestador: permitido }
                })
            });
        } catch (err) {
            alert("Error al actualizar ajuste global.");
        }
    });

    // 2. Cargar nómina de funcionarios
    async function cargarNomina() {
        tablaBody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400">Cargando personal...</td></tr>`;

        try {
            const cred = getAdminCredencialCallback();
            const [res, mapaMulti] = await Promise.all([
                fetch(`${supabaseConfig.SUPABASE_URL}/rest/v1/rpc/admin_gestionar_funcionarios_v2`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "apikey": supabaseConfig.SUPABASE_PUBLISHABLE_KEY,
                        "Authorization": `Bearer ${supabaseConfig.SUPABASE_PUBLISHABLE_KEY}`
                    },
                    body: JSON.stringify({ p_credencial: cred, p_accion: "LISTAR", p_datos: {} })
                }),
                obtenerMapaAsignacionesMultiples(supabaseConfig)
            ]);

            if (!res.ok) throw new Error("No se pudo cargar la nómina.");
            const lista = await res.json();

            if (!Array.isArray(lista) || lista.length === 0) {
                tablaBody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400">No hay funcionarios registrados.</td></tr>`;
                return;
            }

            tablaBody.innerHTML = lista.map(f => {
                const puntosActivos = obtenerNombresPuntosDeFuncionario(f, puntosList, mapaMulti);
                const puntosDisplay = puntosActivos.length > 0
                    ? puntosActivos.map(n => `<span class="inline-block px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-bold mr-1 mb-1">📍 ${escapeHtml(n)}</span>`).join("")
                    : `<span class="text-slate-400 text-[11px]">Sin asignar</span>`;

                return `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td class="p-3 font-mono font-bold text-slate-900 dark:text-white">${escapeHtml(f.cedula)}</td>
                    <td class="p-3">
                        <div class="font-semibold text-slate-900 dark:text-white">${escapeHtml(f.nombre_completo)}</div>
                        <div class="text-[10px] text-slate-400">
                            ${f.debe_cambiar_clave ? '⚠️ Pendiente de primer ingreso' : escapeHtml(f.email || 'Activo')}
                        </div>
                    </td>
                    <td class="p-3">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${f.rol === 'SUPERVISOR' ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'}">
                            ${escapeHtml(f.rol)}
                        </span>
                    </td>
                    <td class="p-3">${puntosDisplay}</td>
                    <td class="p-3 text-center">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${f.activo ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'}">
                            ${f.activo ? '🟢 Activo' : '🔴 Inactivo'}
                        </span>
                    </td>
                    <td class="p-3 text-right space-x-2">
                        <button type="button" data-id="${escapeHtml(f.id)}" data-action="toggle"
                            class="btn-action-func text-xs font-bold ${f.activo ? 'text-amber-600 dark:text-amber-400 hover:text-amber-700' : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700'}"
                            title="${f.activo ? 'Desactivar usuario' : 'Activar usuario'}">
                            ${f.activo ? 'Desactivar' : 'Reactivar'}
                        </button>

                        <button type="button" data-id="${escapeHtml(f.id)}" data-action="reset" data-cedula="${escapeHtml(f.cedula)}"
                            class="btn-action-func text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                            title="Restablece la clave al número de cédula">
                            Restablecer Clave
                        </button>

                        <button type="button" data-id="${escapeHtml(f.id)}" data-action="delete"
                            class="btn-action-func text-xs font-bold text-red-600 dark:text-red-400 hover:underline"
                            title="Eliminar usuario definitivamente">
                            Eliminar
                        </button>
                    </td>
                </tr>
            `;
            }).join("");

            // Enlazar botones de acción
            document.querySelectorAll(".btn-action-func").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    const id = e.currentTarget.getAttribute("data-id");
                    const action = e.currentTarget.getAttribute("data-action");
                    const cred = getAdminCredencialCallback();

                    if (action === "toggle") {
                        await fetch(`${supabaseConfig.SUPABASE_URL}/rest/v1/rpc/admin_gestionar_funcionarios_v2`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "apikey": supabaseConfig.SUPABASE_PUBLISHABLE_KEY,
                                "Authorization": `Bearer ${supabaseConfig.SUPABASE_PUBLISHABLE_KEY}`
                            },
                            body: JSON.stringify({ p_credencial: cred, p_accion: "TOGGLE_ACTIVO", p_datos: { id } })
                        });
                        cargarNomina();
                    } else if (action === "reset") {
                        const ced = e.currentTarget.getAttribute("data-cedula");
                        if (confirm(`¿Restablecer la contraseña de este funcionario a su número de cédula (${ced})?`)) {
                            const r = await fetch(`${supabaseConfig.SUPABASE_URL}/rest/v1/rpc/admin_gestionar_funcionarios_v2`, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "apikey": supabaseConfig.SUPABASE_PUBLISHABLE_KEY,
                                    "Authorization": `Bearer ${supabaseConfig.SUPABASE_PUBLISHABLE_KEY}`
                                },
                                body: JSON.stringify({ p_credencial: cred, p_accion: "RESET_PASSWORD", p_datos: { id } })
                            });
                            const data = await r.json();
                            alert(data.mensaje || "Contraseña restablecida");
                            cargarNomina();
                        }
                    } else if (action === "delete") {
                        if (confirm("¿Está seguro de eliminar este funcionario del sistema?")) {
                            await fetch(`${supabaseConfig.SUPABASE_URL}/rest/v1/rpc/admin_gestionar_funcionarios_v2`, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "apikey": supabaseConfig.SUPABASE_PUBLISHABLE_KEY,
                                    "Authorization": `Bearer ${supabaseConfig.SUPABASE_PUBLISHABLE_KEY}`
                                },
                                body: JSON.stringify({ p_credencial: cred, p_accion: "ELIMINAR", p_datos: { id } })
                            });
                            cargarNomina();
                        }
                    }
                });
            });

        } catch (err) {
            tablaBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-500">${err.message}</td></tr>`;
        }
    }

    const inputNuevoCed = document.getElementById("nuevo-func-cedula");
    if (inputNuevoCed) {
        inputNuevoCed.addEventListener("input", (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, "");
        });
    }

    // 3. Crear funcionario
    formCrear.onsubmit = async (e) => {
        e.preventDefault();
        const cedula = document.getElementById("nuevo-func-cedula").value.trim().replace(/[^0-9]/g, "");
        const rol = document.getElementById("nuevo-func-rol").value;
        const puntoId = document.getElementById("nuevo-func-punto").value;

        if (!cedula) return;

        const btn = document.getElementById("btn-guardar-nuevo-func");
        btn.disabled = true;
        btn.innerHTML = "Guardando...";

        try {
            const cred = getAdminCredencialCallback();
            const res = await fetch(`${supabaseConfig.SUPABASE_URL}/rest/v1/rpc/admin_gestionar_funcionarios_v2`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": supabaseConfig.SUPABASE_PUBLISHABLE_KEY,
                    "Authorization": `Bearer ${supabaseConfig.SUPABASE_PUBLISHABLE_KEY}`
                },
                body: JSON.stringify({
                    p_credencial: cred,
                    p_accion: "CREAR",
                    p_datos: { cedula, rol, punto_asignado_id: puntoId }
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Error al registrar funcionario");

            alert(`¡Funcionario registrado con éxito!\nCédula: ${cedula}\nContraseña temporal inicial: ${cedula}`);
            formCrear.reset();
            cargarNomina();
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = "Guardar Funcionario";
        }
    };

    btnRefrescar.addEventListener("click", cargarNomina);

    cargarConfiguracionGlobal();
    cargarNomina();
}
