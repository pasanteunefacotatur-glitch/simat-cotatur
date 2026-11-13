/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-admin/js/adminApp.js
 * DESCRIPCIÓN: Controlador principal del Portal de Administración y Supervisión.
 *              Valida sesión criptográfica contra el servidor al iniciar.
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
import { renderApkDownloadCardAdmin } from "./components/ApkDownloadCardAdmin.js";
import { mostrarModalPrimerIngreso } from "./components/ModalPrimerIngreso.js";
import { isSessionPayloadUsable, llamarRpcSegura } from "./utils/sessionSecurity.js";

const SESSION_KEY = "simat_supervisor_session";
let activeSession = null;
let cachedPuntos = [];

async function initAdminApp() {
    initTheme();
    montarBotonesTema();

    if (window.location.search.includes("login") || window.location.search.includes("reset") || window.location.search.includes("logout")) {
        sessionStorage.removeItem(SESSION_KEY);
    }

    const saved = sessionStorage.getItem(SESSION_KEY);
    if (!saved) {
        mostrarModalLogin();
        return;
    }

    try {
        const parsed = JSON.parse(saved);
        if (!isSessionPayloadUsable(parsed)) {
            sessionStorage.removeItem(SESSION_KEY);
            mostrarModalLogin();
            return;
        }

        const res = await llamarRpcSegura(CONFIG, "auth_validar_sesion", { p_token: parsed.token });
        const data = await res.json().catch(() => null);

        if (!res.ok || !isSessionPayloadUsable(data) || !data.es_supervisor) {
            sessionStorage.removeItem(SESSION_KEY);
            mostrarModalLogin();
            return;
        }

        activeSession = {
            token: data.token,
            es_supervisor: data.es_supervisor,
            funcionario: data.funcionario,
            configuracion: data.configuracion
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(activeSession));

        if (data.debe_cambiar_clave) {
            abrirFlujoPrimerIngreso();
        } else {
            iniciarDashboard();
        }
    } catch (_) {
        sessionStorage.removeItem(SESSION_KEY);
        mostrarModalLogin();
    }
}

function montarBotonesTema() {
    const mountTheme = document.getElementById("admin-theme-btn-mount");
    if (mountTheme) {
        mountTheme.innerHTML = renderThemeButtonHtml();
        const btn = document.getElementById("btn-toggle-theme");
        if (btn) btn.addEventListener("click", () => toggleTheme());
    }
    const mountLoginTheme = document.getElementById("login-theme-btn-mount");
    if (mountLoginTheme) {
        mountLoginTheme.innerHTML = renderThemeButtonHtml();
        const btnLogin = mountLoginTheme.querySelector("button");
        if (btnLogin) {
            btnLogin.id = "btn-toggle-theme-login";
            btnLogin.addEventListener("click", () => toggleTheme());
        }
    }
}

function abrirFlujoPrimerIngreso() {
    mostrarModalPrimerIngreso({
        funcionario: activeSession.funcionario,
        sessionToken: activeSession.token,
        config: CONFIG,
        onSuccess: (datosAct) => {
            activeSession.funcionario.nombre_completo = datosAct.nombre;
            if (datosAct.email) activeSession.funcionario.email = datosAct.email;
            if (datosAct.sexo) activeSession.funcionario.sexo = datosAct.sexo;
            if (datosAct.avatar_url) activeSession.funcionario.avatar_url = datosAct.avatar_url;
            activeSession.funcionario.debe_cambiar_clave = false;
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(activeSession));
            iniciarDashboard();
        }
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAdminApp);
} else {
    initAdminApp();
}

function mostrarModalLogin() {
    sessionStorage.removeItem(SESSION_KEY);
    activeSession = null;
    const modal = document.getElementById("admin-auth-modal");
    if (modal) modal.classList.remove("hidden");

    const form = document.getElementById("form-admin-auth");
    const inputId = document.getElementById("input-admin-cedula");
    const inputClave = document.getElementById("input-admin-clave");
    const errorMsg = document.getElementById("admin-auth-error");

    const btnToggleClave = document.getElementById("btn-toggle-show-clave");
    if (btnToggleClave && inputClave) {
        btnToggleClave.onclick = () => {
            const isPass = inputClave.type === "password";
            inputClave.type = isPass ? "text" : "password";
            btnToggleClave.textContent = isPass ? "🙈" : "👁️";
        };
    }

    if (inputId) {
        inputId.addEventListener("input", (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, "");
        });
    }

    form.onsubmit = async (e) => {
        e.preventDefault();
        const identificador = inputId.value.trim().replace(/[^0-9]/g, "");
        const rawClave = inputClave.value.trim();
        const numClave = rawClave.replace(/[^0-9]/g, "");
        const clave = (numClave && numClave === identificador) ? identificador : rawClave;

        errorMsg.classList.add("hidden");

        if (!identificador) {
            errorMsg.textContent = "Por favor ingrese su número de cédula (solo números).";
            errorMsg.classList.remove("hidden");
            return;
        }
        if (!clave) {
            errorMsg.textContent = "Por favor ingrese su contraseña.";
            errorMsg.classList.remove("hidden");
            return;
        }

        const btnSubmit = form.querySelector('button[type="submit"]');
        btnSubmit.disabled = true;
        btnSubmit.textContent = "Verificando...";

        try {
            const res = await llamarRpcSegura(CONFIG, "auth_login_funcionario", {
                p_identificador: identificador,
                p_clave: clave,
                p_canal: "WEB"
            });
            const data = await res.json();

            if (!res.ok || data.status !== "success" || !isSessionPayloadUsable(data)) {
                errorMsg.textContent = data.message || "Credenciales incorrectas. Verifique e intente de nuevo.";
                errorMsg.classList.remove("hidden");
                return;
            }

            if (!data.es_supervisor) {
                errorMsg.textContent = "Acceso denegado: El acceso web es exclusivo para Supervisores.";
                errorMsg.classList.remove("hidden");
                return;
            }

            activeSession = {
                token: data.token,
                es_supervisor: data.es_supervisor,
                funcionario: data.funcionario,
                configuracion: data.configuracion
            };
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(activeSession));
            modal.classList.add("hidden");

            if (data.debe_cambiar_clave) {
                abrirFlujoPrimerIngreso();
                return;
            }

            iniciarDashboard();
        } catch (_) {
            errorMsg.textContent = "Error de conexión con la base de datos de COTATUR.";
            errorMsg.classList.remove("hidden");
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Ingresar al Panel";
        }
    };
}

function iniciarDashboard() {
    const authModal = document.getElementById("admin-auth-modal");
    if (authModal) authModal.classList.add("hidden");

    const dashboard = document.getElementById("admin-dashboard-root");
    if (dashboard) dashboard.classList.remove("hidden");

    actualizarBadgeUsuario();
    configurarTabs();

    const obtenerTokenSesion = () => (activeSession?.token || "");
    const authContext = { ...(activeSession?.funcionario || {}), token: obtenerTokenSesion() };

    renderRuedaPrensaAdmin("tab-prensa-mount", authContext);
    renderCalendarioAsuetosAdmin("tab-calendario-mount", authContext);

    renderGestionPuntosAdmin(
        "tab-puntos-mount",
        CONFIG,
        obtenerTokenSesion,
        (puntos) => {
            cachedPuntos = puntos;
            renderCartelQRAdmin("tab-qr-mount", cachedPuntos);
            renderGestionPersonalAdmin("tab-personal-mount", CONFIG, obtenerTokenSesion, cachedPuntos);
        }
    );

    renderCartelQRAdmin("tab-qr-mount", cachedPuntos);
    renderApkDownloadCardAdmin("tab-apk-download-mount");
    renderGestionPersonalAdmin("tab-personal-mount", CONFIG, obtenerTokenSesion, cachedPuntos);

    const btnApkJump = document.getElementById("btn-header-apk-jump");
    if (btnApkJump) {
        btnApkJump.addEventListener("click", () => {
            const tabPersonalBtn = document.querySelector(".admin-tab-btn[data-target='tab-personal']");
            if (tabPersonalBtn) tabPersonalBtn.click();
            const mount = document.getElementById("tab-apk-download-mount");
            if (mount) mount.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }

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

    const btnLogout = document.getElementById("btn-admin-logout");
    if (btnLogout) {
        btnLogout.addEventListener("click", async () => {
            try {
                if (activeSession?.token) {
                    await llamarRpcSegura(CONFIG, "auth_cerrar_sesion", { p_token: activeSession.token });
                }
            } catch (_) {}
            sessionStorage.removeItem(SESSION_KEY);
            window.location.href = window.location.pathname + "?login=1";
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
                b.classList.remove("border-[#198754]", "text-[#198754]", "dark:text-emerald-400", "font-extrabold");
                b.classList.add("border-transparent", "text-slate-400");
            });
            btn.classList.add("border-[#198754]", "text-[#198754]", "dark:text-emerald-400", "font-extrabold");
            btn.classList.remove("border-transparent", "text-slate-400");
            try {
                btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
            } catch (_) {}
            tabContents.forEach(c => c.classList.add("hidden"));
            const targetContent = document.getElementById(targetId);
            if (targetContent) targetContent.classList.remove("hidden");
        });
    });
}
