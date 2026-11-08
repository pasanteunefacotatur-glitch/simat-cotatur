/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-admin/js/adminApp.js
 * DESCRIPCIÓN: Controlador principal del Portal de Administración y Supervisión.
 *              Flujo optimizado de pestañas: Puntos y Equipos -> QR -> Personal -> Mi Perfil.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

import { CONFIG } from "../../web-turista/js/config.js";
import { initTheme, renderThemeButtonHtml, toggleTheme } from "../../web-turista/js/components/ThemeManager.js";
import { renderCartelQRAdmin } from "./components/CartelQRAdmin.js";
import { renderGestionPuntosAdmin } from "./components/GestionPuntosAdmin.js";
import { renderGestionPersonalAdmin } from "./components/GestionPersonalAdmin.js";
import { renderMiPerfilAdmin } from "./components/MiPerfilAdmin.js";
import { renderRuedaPrensaAdmin } from "./components/RuedaPrensaAdmin.js";
import { renderCalendarioAsuetosAdmin } from "./components/CalendarioAsuetosAdmin.js";

const SESSION_KEY = "simat_supervisor_session";
let activeSession = null;
let cachedPuntos = [];

function initAdminApp() {
    // 1. Inicializar tema (Detecta ajuste del dispositivo por defecto)
    initTheme();

    // 2. Comprobar sesión activa de supervisor
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
        try {
            activeSession = JSON.parse(saved);
            if (activeSession && activeSession.funcionario && activeSession.funcionario.id) {
                iniciarDashboard();
            } else {
                sessionStorage.removeItem(SESSION_KEY);
                mostrarModalLogin();
            }
        } catch (_) {
            sessionStorage.removeItem(SESSION_KEY);
            mostrarModalLogin();
        }
    } else {
        mostrarModalLogin();
    }

    // 3. Montar botón con icono de tema en la esquina superior derecha
    const mountTheme = document.getElementById("admin-theme-btn-mount");
    if (mountTheme) {
        mountTheme.innerHTML = renderThemeButtonHtml();
        const btn = document.getElementById("btn-toggle-theme");
        if (btn) btn.addEventListener("click", () => toggleTheme());
    }
}

// Inicialización universal segura (ejecuta de inmediato si el DOM ya está listo)
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAdminApp);
} else {
    initAdminApp();
}

/**
 * Modal de inicio de sesión por Cédula y Contraseña.
 */
function mostrarModalLogin() {
    const modal = document.getElementById("admin-auth-modal");
    if (modal) modal.classList.remove("hidden");

    const form = document.getElementById("form-admin-auth");
    const inputId = document.getElementById("input-admin-cedula");
    const inputClave = document.getElementById("input-admin-clave");
    const errorMsg = document.getElementById("admin-auth-error");

    // Fijar valores por defecto institucionales: Cédula 31061007 y clave cotatur2026
    if (inputId && (!inputId.value || inputId.value === "00000000")) {
        inputId.value = "31061007";
    }
    if (inputClave && !inputClave.value) {
        inputClave.value = "cotatur2026";
    }

    form.onsubmit = async (e) => {
        e.preventDefault();
        const identificador = inputId.value.trim();
        const clave = inputClave.value.trim();
        errorMsg.classList.add("hidden");

        const btnSubmit = form.querySelector('button[type="submit"]');
        btnSubmit.disabled = true;
        btnSubmit.textContent = "Verificando...";

        try {
            const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/auth_login_funcionario`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": CONFIG.SUPABASE_PUBLISHABLE_KEY,
                    "Authorization": `Bearer ${CONFIG.SUPABASE_PUBLISHABLE_KEY}`
                },
                body: JSON.stringify({ p_identificador: identificador, p_clave: clave })
            });

            const data = await res.json();

            if (!res.ok || data.status !== "success") {
                errorMsg.textContent = data.message || "Credenciales incorrectas. Verifique e intente de nuevo.";
                errorMsg.classList.remove("hidden");
                return;
            }

            if (!data.es_supervisor) {
                errorMsg.textContent = "Acceso denegado: Se requiere rango de Supervisor para ingresar al Panel Maestro.";
                errorMsg.classList.remove("hidden");
                return;
            }

            activeSession = {
                identificador,
                clave,
                funcionario: data.funcionario,
                configuracion: data.configuracion
            };

            // Primer ingreso
            if (data.debe_cambiar_clave) {
                modal.classList.add("hidden");
                mostrarModalPrimerIngreso(data.funcionario);
                return;
            }

            sessionStorage.setItem(SESSION_KEY, JSON.stringify(activeSession));
            modal.classList.add("hidden");
            iniciarDashboard();

        } catch (err) {
            errorMsg.textContent = "Error de conexión con la base de datos de COTATUR.";
            errorMsg.classList.remove("hidden");
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Ingresar al Panel";
        }
    };
}

/**
 * Modal de activación de primer ingreso.
 */
function mostrarModalPrimerIngreso(funcionario) {
    const modal = document.getElementById("modal-primer-ingreso");
    if (!modal) return;
    modal.classList.remove("hidden");

    document.getElementById("activar-cedula-badge").textContent = `Cédula: ${funcionario.cedula}`;
    const inputNombre = document.getElementById("activar-nombre");
    if (funcionario.nombre_completo && funcionario.nombre_completo !== "Funcionario Nuevo") {
        inputNombre.value = funcionario.nombre_completo;
    }

    const form = document.getElementById("form-primer-ingreso");
    const btnGoogle = document.getElementById("btn-activar-google");

    if (btnGoogle) {
        btnGoogle.onclick = () => {
            const correoIngresado = prompt("Ingrese su correo de Google (Gmail):", funcionario.email || "");
            if (correoIngresado && correoIngresado.includes("@")) {
                document.getElementById("activar-email").value = correoIngresado.trim();
                alert("¡Correo vinculado con éxito!");
            }
        };
    }

    form.onsubmit = async (e) => {
        e.preventDefault();
        const nuevaClave = document.getElementById("activar-nueva-clave").value.trim();
        const confirmarClave = document.getElementById("activar-confirmar-clave").value.trim();
        const nombre = inputNombre.value.trim();
        const telefono = document.getElementById("activar-telefono").value.trim();
        const email = document.getElementById("activar-email").value.trim();

        if (nuevaClave !== confirmarClave) {
            alert("Las contraseñas no coinciden.");
            return;
        }

        try {
            const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/auth_primer_ingreso`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": CONFIG.SUPABASE_PUBLISHABLE_KEY,
                    "Authorization": `Bearer ${CONFIG.SUPABASE_PUBLISHABLE_KEY}`
                },
                body: JSON.stringify({
                    p_funcionario_id: funcionario.id,
                    p_nueva_clave: nuevaClave,
                    p_nombre_completo: nombre,
                    p_telefono: telefono,
                    p_email: email,
                    p_google_id: null
                })
            });

            if (!res.ok) throw new Error("No se pudo actualizar el perfil.");

            alert("¡Cuenta activada exitosamente!");
            activeSession.clave = nuevaClave;
            activeSession.funcionario.nombre_completo = nombre;
            activeSession.funcionario.email = email;
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(activeSession));

            modal.classList.add("hidden");
            iniciarDashboard();

        } catch (err) {
            alert("Error al activar cuenta: " + err.message);
        }
    };
}

/**
 * Inicializa el Panel Principal de Supervisión.
 */
function iniciarDashboard() {
    const dashboard = document.getElementById("admin-dashboard-root");
    if (dashboard) dashboard.classList.remove("hidden");

    actualizarBadgeUsuario();
    configurarTabs();

    const credencialSupervisor = () => (activeSession ? (activeSession.funcionario?.id || activeSession.funcionario?.cedula || activeSession.clave) : "cotatur2026");

    // 1. Rueda de Prensa del Gobernador (Pestaña Principal Ejecutiva)
    renderRuedaPrensaAdmin("tab-prensa-mount", activeSession?.funcionario);

    // 2. Calendario de Asuetos y Programación de Fiestas Turísticas
    renderCalendarioAsuetosAdmin("tab-calendario-mount", activeSession?.funcionario);

    // 3. Puntos de Control y Equipos Asignados
    renderGestionPuntosAdmin(
        "tab-puntos-mount",
        CONFIG,
        credencialSupervisor,
        (puntos) => {
            cachedPuntos = puntos;
            renderCartelQRAdmin("tab-qr-mount", cachedPuntos);
            renderGestionPersonalAdmin("tab-personal-mount", CONFIG, credencialSupervisor, cachedPuntos);
        }
    );

    // 4. Generador de Códigos QR y Afiches
    renderCartelQRAdmin("tab-qr-mount", cachedPuntos);

    // 5. Nómina de Personal y Ajuste Global de Punto
    renderGestionPersonalAdmin("tab-personal-mount", CONFIG, credencialSupervisor, cachedPuntos);

    // 6. Mi Perfil
    renderMiPerfilAdmin(
        "tab-perfil-mount",
        CONFIG,
        () => activeSession,
        (perfilActualizado) => {
            activeSession.funcionario = perfilActualizado;
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(activeSession));
            actualizarBadgeUsuario();
        }
    );

    // Botón Salir
    const btnLogout = document.getElementById("btn-admin-logout");
    if (btnLogout) {
        btnLogout.addEventListener("click", () => {
            sessionStorage.removeItem(SESSION_KEY);
            window.location.reload();
        });
    }
}

function actualizarBadgeUsuario() {
    const userBadge = document.getElementById("admin-current-user-badge");
    if (userBadge && activeSession && activeSession.funcionario) {
        userBadge.textContent = `${activeSession.funcionario.nombre_completo} • Cédula: ${activeSession.funcionario.cedula}`;
    }
}

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
