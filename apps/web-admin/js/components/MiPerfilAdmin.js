/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-admin/js/components/MiPerfilAdmin.js
 * DESCRIPCIÓN: Módulo de gestión del perfil personal para supervisores.
 *              Sanitiza salidas HTML contra XSS y autentica cambios con p_token.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

import { escapeHtml, llamarRpcSegura } from "../utils/sessionSecurity.js";

export function renderMiPerfilAdmin(containerId, supabaseConfig, getActiveSessionCallback, onProfileUpdatedCallback) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const session = getActiveSessionCallback();
    const func = (session && session.funcionario) ? session.funcionario : {};
    const token = session?.token || "";
    const inicial = escapeHtml((func.nombre_completo || "U")[0].toUpperCase());

    container.innerHTML = `
        <div class="max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div class="flex items-center space-x-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div class="w-14 h-14 bg-gradient-to-tr from-[#198754] to-[#ffc107] text-white font-black text-xl rounded-2xl flex items-center justify-center shadow-md">
                    ${inicial}
                </div>
                <div>
                    <h3 class="text-base font-extrabold text-slate-900 dark:text-white" id="perfil-view-nombre">
                        ${escapeHtml(func.nombre_completo || "Funcionario COTATUR")}
                    </h3>
                    <div class="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        <span class="font-mono font-bold text-amber-600 dark:text-amber-400">C.I: ${escapeHtml(func.cedula || "---")}</span>
                        <span>•</span>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            ${escapeHtml(func.rol || "SUPERVISOR")}
                        </span>
                    </div>
                </div>
            </div>

            <form id="form-mi-perfil" class="space-y-5">
                <div class="space-y-3">
                    <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        1. Información de Contacto
                    </h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div class="sm:col-span-2">
                            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Nombre y Apellido: <span class="text-red-500">*</span>
                            </label>
                            <input type="text" id="perfil-input-nombre" required value="${escapeHtml(func.nombre_completo || "")}"
                                class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500" />
                        </div>

                        <div>
                            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Teléfono Móvil:
                            </label>
                            <input type="text" id="perfil-input-telefono" value="${escapeHtml(func.telefono || "")}" placeholder="Ej: 0414-1234567"
                                class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500" />
                        </div>

                        <div>
                            <div class="flex items-center justify-between mb-1">
                                <label class="block font-semibold text-slate-700 dark:text-slate-300">
                                    Correo Google (Recuperación y Acceso):
                                </label>
                                <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                    🔒 Verificado por Google
                                </span>
                            </div>
                            <input type="email" id="perfil-input-email" value="${escapeHtml(func.email || "")}" readonly disabled
                                class="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-500 dark:text-slate-400 cursor-not-allowed outline-none select-none" />
                        </div>
                    </div>
                </div>

                <div class="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <div class="flex items-center justify-between">
                        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            2. Seguridad y Contraseña
                        </h4>
                        <span class="text-[10px] text-slate-400">Dejar en blanco si no desea cambiarla</span>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Contraseña Actual:</label>
                            <input type="password" id="perfil-input-clave-actual" placeholder="Clave actual"
                                class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white outline-none" />
                        </div>
                        <div>
                            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nueva Contraseña:</label>
                            <input type="password" id="perfil-input-nueva-clave" placeholder="Mínimo 8 caracteres"
                                class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white outline-none" />
                        </div>
                        <div>
                            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirmar Nueva Contraseña:</label>
                            <input type="password" id="perfil-input-confirmar-clave" placeholder="Repita la clave"
                                class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white outline-none" />
                        </div>
                    </div>
                </div>

                <div class="pt-3 flex justify-end">
                    <button type="submit" id="btn-guardar-perfil"
                        class="px-6 py-2.5 bg-[#198754] hover:bg-[#157347] text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 flex items-center space-x-1.5 tap-target-btn">
                        <span>💾</span>
                        <span>Guardar Cambios</span>
                    </button>
                </div>
            </form>
        </div>
    `;

    const form = document.getElementById("form-mi-perfil");
    const btnGuardar = document.getElementById("btn-guardar-perfil");

    form.onsubmit = async (e) => {
        e.preventDefault();
        const nombre = document.getElementById("perfil-input-nombre").value.trim();
        const telefono = document.getElementById("perfil-input-telefono").value.trim();
        const claveActual = document.getElementById("perfil-input-clave-actual").value.trim();
        const nuevaClave = document.getElementById("perfil-input-nueva-clave").value.trim();
        const confirmarClave = document.getElementById("perfil-input-confirmar-clave").value.trim();

        if (nuevaClave || claveActual) {
            if (!claveActual) return alert("Debe ingresar su contraseña actual para confirmar el cambio.");
            if (nuevaClave !== confirmarClave) return alert("La nueva contraseña y su confirmación no coinciden.");
            if (nuevaClave.length < 8) return alert("La nueva contraseña debe tener al menos 8 caracteres.");
        }

        btnGuardar.disabled = true;
        btnGuardar.textContent = "Guardando...";

        try {
            const res = await llamarRpcSegura(supabaseConfig, "auth_actualizar_mi_perfil", {
                p_token: token,
                p_nombre: nombre,
                p_telefono: telefono || null,
                p_clave_actual: claveActual || null,
                p_nueva_clave: nuevaClave || null
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || "Error al actualizar perfil");

            alert("¡Perfil actualizado con éxito!");
            document.getElementById("perfil-input-clave-actual").value = "";
            document.getElementById("perfil-input-nueva-clave").value = "";
            document.getElementById("perfil-input-confirmar-clave").value = "";

            const titleEl = document.getElementById("perfil-view-nombre");
            if (titleEl) titleEl.textContent = nombre;

            if (typeof onProfileUpdatedCallback === "function") {
                onProfileUpdatedCallback({ ...func, nombre_completo: nombre, telefono });
            }
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = `<span>💾</span><span>Guardar Cambios</span>`;
        }
    };
}
