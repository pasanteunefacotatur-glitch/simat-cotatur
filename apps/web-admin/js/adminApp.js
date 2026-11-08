/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-admin/js/adminApp.js
 * DESCRIPCIÓN: Controlador principal del Portal de Administración y Supervisión.
 *              Coordina autenticación por PIN, pestañas de trabajo, generador QR,
 *              mapa interactivo de puntos, gestión de personal y sincronizador.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

import { CONFIG } from "../../web-turista/js/config.js";
import { initTheme, renderThemeButtonHtml, toggleTheme } from "../../web-turista/js/components/ThemeManager.js";
import { renderCartelQRAdmin } from "./components/CartelQRAdmin.js";
import { renderGestionPuntosAdmin } from "./components/GestionPuntosAdmin.js";

const PIN_STORAGE_KEY = "simat_admin_pin_session";
let activeAdminPin = "";
let cachedPuntos = [];

document.addEventListener("DOMContentLoaded", () => {
    // 1. Inicializar tema (Claro / Oscuro LCD / AMOLED)
    initTheme();

    // 2. Comprobar sesión de PIN existente
    const savedPin = sessionStorage.getItem(PIN_STORAGE_KEY);
    if (savedPin) {
        activeAdminPin = savedPin;
        iniciarPanelAdmin();
    } else {
        mostrarModalPin();
    }

    // 3. Vincular botón de tema en cabecera
    const mountThemeBtn = document.getElementById("admin-theme-btn-mount");
    if (mountThemeBtn) {
        mountThemeBtn.innerHTML = renderThemeButtonHtml();
        const btn = document.getElementById("btn-toggle-theme");
        if (btn) btn.addEventListener("click", () => toggleTheme());
    }
});

/**
 * Muestra el diálogo de acceso protegido por PIN.
 */
function mostrarModalPin() {
    const modal = document.getElementById("admin-auth-modal");
    if (modal) modal.classList.remove("hidden");

    const form = document.getElementById("form-admin-auth");
    const inputPin = document.getElementById("input-admin-pin");
    const errorMsg = document.getElementById("admin-auth-error");

    form.onsubmit = async (e) => {
        e.preventDefault();
        const pin = inputPin.value.trim();
        errorMsg.classList.add("hidden");

        // Validar PIN contra Supabase RPC
        try {
            const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/admin_gestionar_funcionario`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": CONFIG.SUPABASE_PUBLISHABLE_KEY,
                    "Authorization": `Bearer ${CONFIG.SUPABASE_PUBLISHABLE_KEY}`
                },
                body: JSON.stringify({ p_pin: pin, p_accion: "LISTAR", p_datos: {} })
            });

            if (res.ok) {
                activeAdminPin = pin;
                sessionStorage.setItem(PIN_STORAGE_KEY, pin);
                modal.classList.add("hidden");
                iniciarPanelAdmin();
            } else {
                errorMsg.classList.remove("hidden");
            }
        } catch (_) {
            errorMsg.classList.remove("hidden");
        }
    };
}

/**
 * Inicializa los módulos de administración tras autenticación exitosa.
 */
function iniciarPanelAdmin() {
    const dashboard = document.getElementById("admin-dashboard-root");
    if (dashboard) dashboard.classList.remove("hidden");

    // Configurar pestañas de navegación
    configurarTabs();

    // Cargar Módulo de Puntos con Mapa Interactivo
    renderGestionPuntosAdmin(
        "tab-puntos-mount",
        CONFIG,
        () => activeAdminPin,
        (puntosActualizados) => {
            cachedPuntos = puntosActualizados;
            renderCartelQRAdmin("tab-qr-mount", cachedPuntos);
        }
    );

    // Cargar Módulo de Códigos QR y Afiches
    renderCartelQRAdmin("tab-qr-mount", cachedPuntos);

    // Cargar Módulo de Funcionarios
    cargarModuloFuncionarios();

    // Botón de Cerrar Sesión
    const btnLogout = document.getElementById("btn-admin-logout");
    if (btnLogout) {
        btnLogout.addEventListener("click", () => {
            sessionStorage.removeItem(PIN_STORAGE_KEY);
            window.location.reload();
        });
    }
}

/**
 * Manejo de navegación por pestañas en el panel.
 */
function configurarTabs() {
    const tabButtons = document.querySelectorAll(".admin-tab-btn");
    const tabContents = document.querySelectorAll(".admin-tab-content");

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.getAttribute("data-target");

            tabButtons.forEach(b => {
                b.classList.remove("border-amber-500", "text-amber-500", "font-bold");
                b.classList.add("border-transparent", "text-slate-500");
            });

            btn.classList.add("border-amber-500", "text-amber-500", "font-bold");
            btn.classList.remove("border-transparent", "text-slate-500");

            tabContents.forEach(c => c.classList.add("hidden"));
            const targetContent = document.getElementById(targetId);
            if (targetContent) targetContent.classList.remove("hidden");
        });
    });
}

/**
 * Carga y gestiona el personal encuestador (Revocación remota instantánea).
 */
async function cargarModuloFuncionarios() {
    const tbody = document.getElementById("tabla-funcionarios-body");
    const formCrear = document.getElementById("form-crear-funcionario");
    if (!tbody) return;

    async function refrescarLista() {
        tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-400">Consultando funcionarios...</td></tr>`;
        try {
            const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/admin_gestionar_funcionario`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": CONFIG.SUPABASE_PUBLISHABLE_KEY,
                    "Authorization": `Bearer ${CONFIG.SUPABASE_PUBLISHABLE_KEY}`
                },
                body: JSON.stringify({ p_pin: activeAdminPin, p_accion: "LISTAR", p_datos: {} })
            });

            if (!res.ok) throw new Error("Error en consulta");
            const funcionarios = await res.json();

            if (!Array.isArray(funcionarios) || funcionarios.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-400">No hay funcionarios registrados.</td></tr>`;
                return;
            }

            tbody.innerHTML = funcionarios.map(f => `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td class="p-3 font-semibold text-slate-900 dark:text-white">${f.nombre_completo}</td>
                    <td class="p-3 font-mono text-slate-600 dark:text-slate-400">${f.cedula}</td>
                    <td class="p-3">${f.cargo}</td>
                    <td class="p-3 text-center">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${f.activo ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'}">
                            ${f.activo ? '🟢 Activo' : '🔴 Revocado'}
                        </span>
                    </td>
                    <td class="p-3 text-right">
                        <button type="button" data-id="${f.id}" class="btn-toggle-funcionario text-xs font-bold ${f.activo ? 'text-red-600 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-700'}">
                            ${f.activo ? 'Revocar Acceso' : 'Reactivar'}
                        </button>
                    </td>
                </tr>
            `).join("");

            document.querySelectorAll(".btn-toggle-funcionario").forEach(b => {
                b.addEventListener("click", async (e) => {
                    const id = e.currentTarget.getAttribute("data-id");
                    await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/admin_gestionar_funcionario`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "apikey": CONFIG.SUPABASE_PUBLISHABLE_KEY,
                            "Authorization": `Bearer ${CONFIG.SUPABASE_PUBLISHABLE_KEY}`
                        },
                        body: JSON.stringify({ p_pin: activeAdminPin, p_accion: "TOGGLE_ACTIVO", p_datos: { id } })
                    });
                    refrescarLista();
                });
            });

        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500">${err.message}</td></tr>`;
        }
    }

    if (formCrear) {
        formCrear.onsubmit = async (e) => {
            e.preventDefault();
            const data = {
                cedula: document.getElementById("func-cedula").value.trim(),
                nombre_completo: document.getElementById("func-nombre").value.trim(),
                cargo: document.getElementById("func-cargo").value.trim(),
                telefono: document.getElementById("func-telefono").value.trim(),
                activo: true
            };

            const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/admin_gestionar_funcionario`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": CONFIG.SUPABASE_PUBLISHABLE_KEY,
                    "Authorization": `Bearer ${CONFIG.SUPABASE_PUBLISHABLE_KEY}`
                },
                body: JSON.stringify({ p_pin: activeAdminPin, p_accion: "CREAR", p_datos: data })
            });

            if (res.ok) {
                alert("Funcionario registrado exitosamente.");
                formCrear.reset();
                refrescarLista();
            } else {
                alert("Error al registrar funcionario.");
            }
        };
    }

    const btnRefrescar = document.getElementById("btn-refrescar-funcionarios");
    if (btnRefrescar) btnRefrescar.addEventListener("click", refrescarLista);

    refrescarLista();
}
