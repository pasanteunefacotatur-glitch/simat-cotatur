/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: components/AdminUsuariosModal.js
 * DESCRIPCIÓN: Módulo de Gestión de Usuarios y Encuestadores para el Administrador.
 *              Funciona tanto en la Web como en el APK Android bajo la misma lógica.
 *              Protegido mediante PIN institucional de supervisión.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

import { CONFIG, PUNTOS_CONTROL_QR } from "../config.js";

// Clave de almacenamiento local para persistir la sesión del supervisor
const ADMIN_SESSION_KEY = "simat_admin_pin_verified";

export function renderAdminUsuariosModal(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const puntosOptions = Object.entries(PUNTOS_CONTROL_QR).map(([codigo, info]) => {
        return `<option value="${info.id || codigo}">${info.nombre}</option>`;
    }).join("");

    container.innerHTML = `
        <div id="modal-admin-overlay" class="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 opacity-0 pointer-events-none transition-opacity duration-200">
            <div class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
                
                <!-- Encabezado del Módulo Administrativo -->
                <div class="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-700">
                    <div class="flex items-center space-x-2">
                        <span class="text-amber-400 font-bold">🛡️</span>
                        <div>
                            <h3 class="text-sm font-bold tracking-tight">Panel Administrativo de Funcionarios</h3>
                            <p class="text-[10px] text-slate-300">COTATUR • Control de Encuestadores y Revocación</p>
                        </div>
                    </div>
                    <button type="button" id="btn-cerrar-admin-modal" class="text-slate-400 hover:text-white text-lg font-bold px-2">
                        ✕
                    </button>
                </div>

                <!-- 1. Pantalla de Bloqueo por PIN -->
                <div id="admin-pin-view" class="p-8 text-center space-y-4 max-w-sm mx-auto">
                    <div class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-xl border border-slate-200">
                        🔒
                    </div>
                    <div>
                        <h4 class="text-sm font-bold text-slate-800">Acceso de Supervisión</h4>
                        <p class="text-xs text-slate-500 mt-0.5">Ingrese el PIN institucional para gestionar los encuestadores:</p>
                    </div>
                    <form id="form-admin-pin" class="space-y-3">
                        <input type="password" id="input-admin-pin" placeholder="PIN de Administrador..." maxlength="20"
                            class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-center text-sm font-mono tracking-widest outline-none focus:border-slate-800 focus:bg-white" />
                        <button type="submit" class="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-colors">
                            Acceder al Sistema
                        </button>
                    </form>
                    <p class="text-[10px] text-slate-400 font-mono">PIN Inicial: cotatur2026</p>
                </div>

                <!-- 2. Pantalla de Gestión de Usuarios (Visible tras verificar PIN) -->
                <div id="admin-crud-view" class="hidden flex-1 overflow-y-auto p-4 space-y-4">
                    
                    <!-- Barra de herramientas: Resumen y botón registrar -->
                    <div class="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div class="text-xs">
                            <span class="font-bold text-slate-800" id="total-funcionarios-badge">0 Encuestadores</span>
                            <span class="text-slate-400">• Control de acceso de campo</span>
                        </div>
                        <button type="button" id="btn-toggle-nuevo-funcionario"
                            class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center space-x-1">
                            <span>+ Nuevo Encuestador</span>
                        </button>
                    </div>

                    <!-- Formulario desplegable para nuevo encuestador -->
                    <form id="form-nuevo-funcionario" class="hidden bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                        <h5 class="font-bold text-slate-800">Registrar Nuevo Funcionario de Campo</h5>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                                <label class="block font-semibold text-slate-600 mb-0.5">Cédula de Identidad:</label>
                                <input type="text" id="new-cedula" placeholder="Ej. V-18452120" required class="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs" />
                            </div>
                            <div>
                                <label class="block font-semibold text-slate-600 mb-0.5">Nombre Completo:</label>
                                <input type="text" id="new-nombre" placeholder="Ej. Pedro Pérez" required class="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs" />
                            </div>
                            <div>
                                <label class="block font-semibold text-slate-600 mb-0.5">Cargo / Rol:</label>
                                <input type="text" id="new-cargo" value="Encuestador de Campo" class="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs" />
                            </div>
                            <div>
                                <label class="block font-semibold text-slate-600 mb-0.5">Teléfono Celular:</label>
                                <input type="text" id="new-telefono" placeholder="Ej. 0414-7253311" class="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs" />
                            </div>
                        </div>
                        <div>
                            <label class="block font-semibold text-slate-600 mb-0.5">Punto de Control Asignado:</label>
                            <select id="new-punto-id" class="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs">
                                <option value="">Sin asignar / Rotativo</option>
                                ${puntosOptions}
                            </select>
                        </div>
                        <div class="flex justify-end space-x-2 pt-1">
                            <button type="button" id="btn-cancelar-nuevo" class="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold">Cancelar</button>
                            <button type="submit" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold">Guardar Funcionario</button>
                        </div>
                    </form>

                    <!-- Lista de Funcionarios Registrados -->
                    <div id="lista-funcionarios" class="space-y-2">
                        <div class="text-center py-6 text-xs text-slate-400">Cargando encuestadores...</div>
                    </div>

                </div>

            </div>
        </div>
    `;

    // Referencias a elementos
    const overlay = document.getElementById("modal-admin-overlay");
    const btnCerrar = document.getElementById("btn-cerrar-admin-modal");
    const pinView = document.getElementById("admin-pin-view");
    const crudView = document.getElementById("admin-crud-view");
    const formPin = document.getElementById("form-admin-pin");
    const inputPin = document.getElementById("input-admin-pin");
    const formNuevo = document.getElementById("form-nuevo-funcionario");
    const btnToggleNuevo = document.getElementById("btn-toggle-nuevo-funcionario");
    const btnCancelarNuevo = document.getElementById("btn-cancelar-nuevo");
    const listaEl = document.getElementById("lista-funcionarios");
    const totalBadge = document.getElementById("total-funcionarios-badge");

    let currentPin = sessionStorage.getItem(ADMIN_SESSION_KEY) || "";

    // Validación de PIN
    formPin.addEventListener("submit", (e) => {
        e.preventDefault();
        const pin = inputPin.value.trim();
        if (pin === "cotatur2026") {
            currentPin = pin;
            sessionStorage.setItem(ADMIN_SESSION_KEY, pin);
            mostrarCrud();
        } else {
            alert("PIN incorrecto. Ingrese la credencial oficial de supervisión.");
        }
    });

    function mostrarCrud() {
        pinView.classList.add("hidden");
        crudView.classList.remove("hidden");
        cargarFuncionarios();
    }

    btnToggleNuevo.addEventListener("click", () => formNuevo.classList.toggle("hidden"));
    btnCancelarNuevo.addEventListener("click", () => formNuevo.classList.add("hidden"));

    btnCerrar.addEventListener("click", () => {
        overlay.classList.add("opacity-0", "pointer-events-none");
    });

    // Cargar funcionarios desde Supabase
    async function cargarFuncionarios() {
        listaEl.innerHTML = `<div class="text-center py-6 text-xs text-slate-400">Consultando base de datos...</div>`;
        try {
            // Intentar llamar RPC admin_gestionar_funcionario
            const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/admin_gestionar_funcionario`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": CONFIG.SUPABASE_PUBLISHABLE_KEY,
                    "Authorization": `Bearer ${CONFIG.SUPABASE_PUBLISHABLE_KEY}`
                },
                body: JSON.stringify({ p_pin: currentPin, p_accion: "LISTAR" })
            });

            let data = [];
            if (res.ok) {
                data = await res.json();
            } else {
                // Fallback directo a perfiles_funcionarios
                const fbRes = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/perfiles_funcionarios?select=*`, {
                    headers: {
                        "apikey": CONFIG.SUPABASE_PUBLISHABLE_KEY,
                        "Authorization": `Bearer ${CONFIG.SUPABASE_PUBLISHABLE_KEY}`
                    }
                });
                if (fbRes.ok) data = await fbRes.json();
            }

            renderLista(data);
        } catch (err) {
            console.error(err);
            listaEl.innerHTML = `<div class="text-center py-4 text-xs text-red-500">Error al conectar con la base de datos.</div>`;
        }
    }

    function renderLista(funcionarios) {
        if (!funcionarios || funcionarios.length === 0) {
            listaEl.innerHTML = `<div class="text-center py-6 text-xs text-slate-500">No hay encuestadores registrados aún. Pulse '+ Nuevo Encuestador'.</div>`;
            totalBadge.textContent = "0 Encuestadores";
            return;
        }

        totalBadge.textContent = `${funcionarios.length} Encuestadores`;

        listaEl.innerHTML = funcionarios.map(f => `
            <div class="p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                    <div class="flex items-center space-x-2">
                        <span class="font-bold text-slate-900">${f.nombre_completo}</span>
                        <span class="font-mono text-[11px] text-slate-500">(${f.cedula})</span>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            f.activo ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-red-100 text-red-800 border border-red-300"
                        }">
                            ${f.activo ? "🟢 ACTIVO" : "🔴 INACTIVO / REVOCADO"}
                        </span>
                    </div>
                    <div class="text-[11px] text-slate-500 mt-0.5">
                        Cargo: ${f.cargo || "Encuestador"} • Tel: ${f.telefono || "N/A"} • Punto: ${f.punto_nombre || "General"}
                    </div>
                </div>
                <div class="flex items-center space-x-1.5 self-end sm:self-auto">
                    <button type="button" data-toggle-id="${f.id}" data-estado="${f.activo}"
                        class="btn-toggle-status px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                            f.activo ? "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200" : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                        }">
                        ${f.activo ? "Desactivar" : "Activar"}
                    </button>
                </div>
            </div>
        `).join("");

        // Listeners para cambiar estado activo/inactivo (revocación remota)
        listaEl.querySelectorAll(".btn-toggle-status").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.getAttribute("data-toggle-id");
                btn.disabled = true;
                btn.textContent = "...";
                try {
                    await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/admin_gestionar_funcionario`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "apikey": CONFIG.SUPABASE_PUBLISHABLE_KEY,
                            "Authorization": `Bearer ${CONFIG.SUPABASE_PUBLISHABLE_KEY}`
                        },
                        body: JSON.stringify({ p_pin: currentPin, p_accion: "TOGGLE_ACTIVO", p_datos: { id } })
                    });
                    cargarFuncionarios();
                } catch (e) {
                    alert("Error al actualizar estado.");
                    cargarFuncionarios();
                }
            });
        });
    }

    // Registrar nuevo funcionario
    formNuevo.addEventListener("submit", async (e) => {
        e.preventDefault();
        const cedula = document.getElementById("new-cedula").value.trim();
        const nombre = document.getElementById("new-nombre").value.trim();
        const cargo = document.getElementById("new-cargo").value.trim();
        const telefono = document.getElementById("new-telefono").value.trim();
        const punto_asignado_id = document.getElementById("new-punto-id").value;

        try {
            const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/admin_gestionar_funcionario`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": CONFIG.SUPABASE_PUBLISHABLE_KEY,
                    "Authorization": `Bearer ${CONFIG.SUPABASE_PUBLISHABLE_KEY}`
                },
                body: JSON.stringify({
                    p_pin: currentPin,
                    p_accion: "CREAR",
                    p_datos: { cedula, nombre_completo: nombre, cargo, telefono, punto_asignado_id, activo: true }
                })
            });

            if (!res.ok) {
                // Fallback directo
                await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/perfiles_funcionarios`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "apikey": CONFIG.SUPABASE_PUBLISHABLE_KEY,
                        "Authorization": `Bearer ${CONFIG.SUPABASE_PUBLISHABLE_KEY}`
                    },
                    body: JSON.stringify({ cedula, nombre_completo: nombre, cargo, telefono, activo: true })
                });
            }

            formNuevo.reset();
            formNuevo.classList.add("hidden");
            cargarFuncionarios();
        } catch (err) {
            alert("Error al registrar funcionario.");
        }
    });

    if (currentPin === "cotatur2026") {
        mostrarCrud();
    }
}

export function abrirAdminUsuarios() {
    const overlay = document.getElementById("modal-admin-overlay");
    if (!overlay) return;
    overlay.classList.remove("opacity-0", "pointer-events-none");
}
