/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-admin/js/adminApp.js
 * DESCRIPCIÓN: Controlador principal del Portal de Administración y Supervisión.
 *              Autenticación por Cédula y Contraseña, Activación de Primer Ingreso,
 *              vínculo opcional con Google para correo, temas con lista desplegable.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

import { CONFIG } from "../../web-turista/js/config.js";
import { initTheme, renderThemeDropdownHtml, bindThemeDropdown } from "../../web-turista/js/components/ThemeManager.js";
import { renderCartelQRAdmin } from "./components/CartelQRAdmin.js";
import { renderGestionPuntosAdmin } from "./components/GestionPuntosAdmin.js";
import { renderGestionPersonalAdmin } from "./components/GestionPersonalAdmin.js";

const SESSION_KEY = "simat_supervisor_session";
let activeSession = null;
let cachedPuntos = [];

document.addEventListener("DOMContentLoaded", () => {
    // 1. Inicializar tema (Predeterminado: Sistema en lista desplegable)
    initTheme();

    // 2. Comprobar sesión activa de supervisor
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
        try {
            activeSession = JSON.parse(saved);
            iniciarDashboard();
        } catch (_) {
            mostrarModalLogin();
        }
    } else {
        mostrarModalLogin();
    }

    // 3. Montar dropdown de tema en la barra superior
    const mountTheme = document.getElementById("admin-theme-btn-mount");
    if (mountTheme) {
        mountTheme.innerHTML = renderThemeDropdownHtml();
        bindThemeDropdown("select-theme-dropdown");
    }
});

/**
 * Muestra el modal de inicio de sesión por Cédula y Contraseña.
 */
function mostrarModalLogin() {
    const modal = document.getElementById("admin-auth-modal");
    if (modal) modal.classList.remove("hidden");

    const form = document.getElementById("form-admin-auth");
    const inputId = document.getElementById("input-admin-cedula");
    const inputClave = document.getElementById("input-admin-clave");
    const errorMsg = document.getElementById("admin-auth-error");

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

            // Verificar si tiene privilegios de supervisión
            if (!data.es_supervisor) {
                errorMsg.textContent = "Acceso denegado: Este usuario no tiene rango de Supervisor para ingresar al Panel Maestro.";
                errorMsg.classList.remove("hidden");
                return;
            }

            activeSession = {
                identificador,
                clave,
                funcionario: data.funcionario,
                configuracion: data.configuracion
            };

            // Si es primer ingreso (o debe cambiar clave), mostrar modal de activación
            if (data.debe_cambiar_clave) {
                modal.classList.add("hidden");
                mostrarModalPrimerIngreso(data.funcionario);
                return;
            }

            // Guardar sesión y entrar al dashboard
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
 * Modal obligatorio de activación para primer ingreso (Cédula como clave inicial).
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

    // Opción interactiva para autocompletar con Google
    if (btnGoogle) {
        btnGoogle.onclick = () => {
            const correoIngresado = prompt("Ingrese su correo de Google (Gmail institucional o personal):", funcionario.email || "");
            if (correoIngresado && correoIngresado.includes("@")) {
                document.getElementById("activar-email").value = correoIngresado.trim();
                alert("¡Correo vinculado con éxito! Servirá para el restablecimiento de su clave.");
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
            alert("Las contraseñas no coinciden. Verifique.");
            return;
        }

        if (nuevaClave.length < 4) {
            alert("La nueva contraseña debe tener al menos 4 caracteres.");
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
 * Inicializa el Panel Principal de Supervisión tras autenticación.
 */
function iniciarDashboard() {
    const dashboard = document.getElementById("admin-dashboard-root");
    if (dashboard) dashboard.classList.remove("hidden");

    // Actualizar nombre de usuario activo en cabecera
    const userBadge = document.getElementById("admin-current-user-badge");
    if (userBadge && activeSession && activeSession.funcionario) {
        userBadge.textContent = `${activeSession.funcionario.nombre_completo} (C.I: ${activeSession.funcionario.cedula})`;
    }

    // Configurar pestañas
    configurarTabs();

    const credencialSupervisor = () => (activeSession ? (activeSession.funcionario.id || activeSession.clave) : "cotatur2026");

    // Montar Pestaña: Gestión de Puntos con Mapa Interactivo
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

    // Montar Pestaña: Códigos QR y Afiches (Carta vs Solo QR)
    renderCartelQRAdmin("tab-qr-mount", cachedPuntos);

    // Montar Pestaña: Gestión de Personal (Nómina por Cédula y Ajuste Global de Punto)
    renderGestionPersonalAdmin("tab-personal-mount", CONFIG, credencialSupervisor, cachedPuntos);

    // Cerrar Sesión
    const btnLogout = document.getElementById("btn-admin-logout");
    if (btnLogout) {
        btnLogout.addEventListener("click", () => {
            sessionStorage.removeItem(SESSION_KEY);
            window.location.reload();
        });
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
