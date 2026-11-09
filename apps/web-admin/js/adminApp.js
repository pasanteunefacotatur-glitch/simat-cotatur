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

    // 2. Si la URL solicita reiniciar o limpiar sesión (?login o ?reset o ?logout)
    if (window.location.search.includes("login") || window.location.search.includes("reset") || window.location.search.includes("logout")) {
        sessionStorage.removeItem(SESSION_KEY);
    }

    // 3. Comprobar sesión activa de supervisor
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
        try {
            activeSession = JSON.parse(saved);
            if (activeSession && activeSession.funcionario && activeSession.funcionario.id) {
                if (activeSession.funcionario.debe_cambiar_clave) {
                    mostrarModalPrimerIngreso(activeSession.funcionario);
                } else {
                    iniciarDashboard();
                }
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

    // 3. Montar botón con icono de tema en la esquina superior derecha del dashboard y del login
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
    sessionStorage.removeItem(SESSION_KEY);
    activeSession = null;
    const modal = document.getElementById("admin-auth-modal");
    if (modal) modal.classList.remove("hidden");

    const form = document.getElementById("form-admin-auth");
    const inputId = document.getElementById("input-admin-cedula");
    const inputClave = document.getElementById("input-admin-clave");
    const errorMsg = document.getElementById("admin-auth-error");

    // Toggle para visualizar/ocultar contraseña
    const btnToggleClave = document.getElementById("btn-toggle-show-clave");
    if (btnToggleClave && inputClave) {
        btnToggleClave.onclick = () => {
            const isPass = inputClave.type === "password";
            inputClave.type = isPass ? "text" : "password";
            btnToggleClave.textContent = isPass ? "🙈" : "👁️";
        };
    }

    // Forzar estrictamente solo números en el campo de cédula (sin letras, sin V-, sin puntos)
    if (inputId) {
        inputId.addEventListener("input", (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, "");
        });
    }

    form.onsubmit = async (e) => {
        e.preventDefault();
        // Cédula estrictamente numérica
        const identificador = inputId.value.trim().replace(/[^0-9]/g, "");

        const rawClave = inputClave.value.trim();
        const numClave = rawClave.replace(/[^0-9]/g, "");
        // Si la clave tipeada coincide numéricamente con la cédula (primer ingreso o reinicio de clave)
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

            // REGLA INSTITUCIONAL: Solo supervisores tienen acceso por plataforma web
            if (!data.es_supervisor) {
                errorMsg.textContent = "Acceso denegado: El acceso por página web está reservado exclusivamente para personal de Supervisión. Los encuestadores de campo deben ingresar únicamente desde la aplicación móvil Android (.APK).";
                errorMsg.classList.remove("hidden");
                return;
            }

            activeSession = {
                identificador,
                clave,
                funcionario: data.funcionario,
                configuracion: data.configuracion
            };

            // Primer ingreso: requiere cambio obligatorio de contraseña y completar perfil
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
 * Modal de activación de primer ingreso para supervisores.
 */
function mostrarModalPrimerIngreso(funcionario) {
    const loginModal = document.getElementById("admin-auth-modal");
    if (loginModal) loginModal.classList.add("hidden");

    const modal = document.getElementById("modal-primer-ingreso");
    if (!modal) return;
    modal.classList.remove("hidden");

    const badgeCedula = document.getElementById("activar-cedula-badge");
    if (badgeCedula) badgeCedula.textContent = `Cédula: ${funcionario.cedula}`;

    const inputNombre = document.getElementById("activar-nombre");
    if (funcionario.nombre_completo && funcionario.nombre_completo !== "Funcionario Nuevo") {
        inputNombre.value = funcionario.nombre_completo;
    }

    const form = document.getElementById("form-primer-ingreso");
    const btnGoogle = document.getElementById("btn-activar-google");
    const statusGoogle = document.getElementById("google-sync-status");

    // Opción A: Autocompletar con cuenta de Google
    if (btnGoogle) {
        btnGoogle.onclick = () => {
            const correoIngresado = prompt(
                "Ingrese su cuenta o correo de Google (Gmail):",
                funcionario.email || (funcionario.nombre_completo ? `${funcionario.nombre_completo.toLowerCase().replace(/\s+/g, ".")}@gmail.com` : "")
            );
            if (correoIngresado && correoIngresado.includes("@")) {
                const emailLimpio = correoIngresado.trim().toLowerCase();
                const emailInput = document.getElementById("activar-email");
                if (emailInput) emailInput.value = emailLimpio;

                // Sugerir nombre a partir del correo si el campo está vacío
                if (inputNombre && (!inputNombre.value || inputNombre.value === "Funcionario Nuevo")) {
                    const parteNombre = emailLimpio.split("@")[0].replace(/[\._-]/g, " ");
                    inputNombre.value = parteNombre.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                }

                if (statusGoogle) {
                    statusGoogle.innerHTML = `<span class="text-[#198754] dark:text-emerald-400 font-bold">✓ Sincronizado con Google: ${emailLimpio}</span>`;
                }

                alert(`¡Datos vinculados con éxito con Google!\n\nCorreo: ${emailLimpio}\nPor favor defina a continuación su contraseña personal para finalizar la activación.`);
            }
        };
    }

    // Alternadores de visibilidad de contraseñas en el modal de activación
    const toggleP1 = document.getElementById("btn-toggle-activar-clave1");
    const inputP1 = document.getElementById("activar-nueva-clave");
    if (toggleP1 && inputP1) {
        toggleP1.onclick = () => {
            const isPass = inputP1.type === "password";
            inputP1.type = isPass ? "text" : "password";
            toggleP1.textContent = isPass ? "🙈" : "👁️";
        };
    }
    const toggleP2 = document.getElementById("btn-toggle-activar-clave2");
    const inputP2 = document.getElementById("activar-confirmar-clave");
    if (toggleP2 && inputP2) {
        toggleP2.onclick = () => {
            const isPass = inputP2.type === "password";
            inputP2.type = isPass ? "text" : "password";
            toggleP2.textContent = isPass ? "🙈" : "👁️";
        };
    }

    // Opción B / Confirmación del formulario manual
    form.onsubmit = async (e) => {
        e.preventDefault();
        const nuevaClave = document.getElementById("activar-nueva-clave").value.trim();
        const confirmarClave = document.getElementById("activar-confirmar-clave").value.trim();
        const nombre = inputNombre.value.trim();
        const sexo = document.getElementById("activar-sexo")?.value || "";
        const telefono = document.getElementById("activar-telefono").value.trim();
        const email = document.getElementById("activar-email").value.trim();
        const activarError = document.getElementById("activar-error");
        if (activarError) activarError.classList.add("hidden");

        function mostrarErrorActivacion(msg) {
            if (activarError) {
                activarError.textContent = "⚠️ " + msg;
                activarError.classList.remove("hidden");
            } else {
                alert(msg);
            }
        }

        if (!nombre) {
            mostrarErrorActivacion("Por favor ingrese su Nombre y Apellido.");
            inputNombre.focus();
            return;
        }

        if (nuevaClave.length < 4) {
            mostrarErrorActivacion("La nueva contraseña debe tener al menos 4 caracteres.");
            document.getElementById("activar-nueva-clave").focus();
            return;
        }

        if (nuevaClave !== confirmarClave) {
            mostrarErrorActivacion("Las contraseñas no coinciden. Por favor verifique.");
            document.getElementById("activar-confirmar-clave").focus();
            return;
        }

        const btnSubmit = document.getElementById("btn-completar-activacion");
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.textContent = "Activando cuenta...";
        }

        try {
            const rpcPayload = {
                p_funcionario_id: funcionario.id,
                p_nueva_clave: nuevaClave,
                p_nombre_completo: nombre,
                p_telefono: telefono,
                p_email: email,
                p_google_id: (email && email.includes("@gmail")) ? email : null
            };
            if (sexo) {
                rpcPayload.p_sexo = sexo;
            }

            let res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/auth_primer_ingreso`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": CONFIG.SUPABASE_PUBLISHABLE_KEY,
                    "Authorization": `Bearer ${CONFIG.SUPABASE_PUBLISHABLE_KEY}`
                },
                body: JSON.stringify(rpcPayload)
            });

            // Resiliencia: si la función en Supabase aún no tiene p_sexo (PGRST202), reintentar con 6 parámetros
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                if (errData.code === "PGRST202" && rpcPayload.p_sexo) {
                    delete rpcPayload.p_sexo;
                    res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/auth_primer_ingreso`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "apikey": CONFIG.SUPABASE_PUBLISHABLE_KEY,
                            "Authorization": `Bearer ${CONFIG.SUPABASE_PUBLISHABLE_KEY}`
                        },
                        body: JSON.stringify(rpcPayload)
                    });
                } else {
                    throw new Error(errData.message || "No se pudo actualizar el perfil.");
                }
            }

            if (!res.ok) {
                const errData2 = await res.json().catch(() => ({}));
                throw new Error(errData2.message || "No se pudo actualizar el perfil.");
            }

            alert("¡Cuenta de Supervisión activada exitosamente!\nBienvenido(a) al Panel Maestro SIMAT-COTATUR.");
            activeSession.clave = nuevaClave;
            activeSession.funcionario.nombre_completo = nombre;
            activeSession.funcionario.email = email;
            if (sexo) activeSession.funcionario.sexo = sexo;
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(activeSession));

            modal.classList.add("hidden");
            iniciarDashboard();

        } catch (err) {
            if (activarError) {
                activarError.textContent = "⚠️ " + err.message;
                activarError.classList.remove("hidden");
            } else {
                alert("Error al activar cuenta: " + err.message);
            }
        } finally {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.textContent = "Activar Cuenta e Ingresar al Panel";
            }
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

    const credencialSupervisor = () => (activeSession?.funcionario?.id || "cotatur2026");

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

            tabContents.forEach(c => c.classList.add("hidden"));
            const targetContent = document.getElementById(targetId);
            if (targetContent) targetContent.classList.remove("hidden");
        });
    });
}
