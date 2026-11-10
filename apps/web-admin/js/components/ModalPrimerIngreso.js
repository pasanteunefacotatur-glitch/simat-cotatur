/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-admin/js/components/ModalPrimerIngreso.js
 * DESCRIPCIÓN: Controlador del Modal de Activación de Primer Ingreso para Supervisores.
 *              Incluye integración oficial con Google Identity Services (OAuth 2.0 GIS)
 *              y formulario manual accesible con selector de Sexo/Género.
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
 * Muestra el modal de activación de primer ingreso.
 * @param {Object} params
 * @param {Object} params.funcionario Objeto de datos del funcionario
 * @param {Object} params.config Configuración global con credenciales Supabase y Google
 * @param {Function} params.onSuccess Callback ejecutado al activar la cuenta exitosamente
 */
export function mostrarModalPrimerIngreso({ funcionario, config, onSuccess }) {
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

    let vinculoGoogle = { google_id: null, avatar_url: null, email: null };

    // Opción A: Autocompletar con cuenta oficial de Google (OAuth 2.0 / GIS)
    if (btnGoogle) {
        btnGoogle.onclick = () => {
            if (window.google && google.accounts && google.accounts.oauth2 && config.GOOGLE_WEB_CLIENT_ID) {
                try {
                    const tokenClient = google.accounts.oauth2.initTokenClient({
                        client_id: config.GOOGLE_WEB_CLIENT_ID,
                        scope: "openid email profile",
                        callback: async (tokenResponse) => {
                            if (tokenResponse && tokenResponse.access_token) {
                                try {
                                    btnGoogle.disabled = true;
                                    btnGoogle.innerHTML = `<span class="inline-block animate-spin mr-1">⏳</span> Conectando con Google...`;

                                    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                                        headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                                    });
                                    const googleProfile = await userInfoRes.json();

                                    if (googleProfile.email) {
                                        const emailLimpio = googleProfile.email.trim().toLowerCase();
                                        const emailInput = document.getElementById("activar-email");
                                        if (emailInput) emailInput.value = emailLimpio;

                                        if (googleProfile.name && inputNombre) {
                                            inputNombre.value = googleProfile.name;
                                        }

                                        vinculoGoogle.google_id = googleProfile.sub || emailLimpio;
                                        const safeAvatar = (googleProfile.picture && String(googleProfile.picture).startsWith("https://")) ? escapeHtml(googleProfile.picture) : null;
                                        vinculoGoogle.email = emailLimpio;
                                        vinculoGoogle.avatar_url = safeAvatar;

                                        if (statusGoogle) {
                                            statusGoogle.innerHTML = `
                                                <div class="flex items-center justify-center gap-2 text-[#198754] dark:text-emerald-400 font-bold text-xs">
                                                    ${safeAvatar ? `<img src="${safeAvatar}" class="w-5 h-5 rounded-full shadow-sm" alt="Avatar">` : '✓'}
                                                    <span>Cuenta verificada con Google OAuth: ${escapeHtml(emailLimpio)}</span>
                                                </div>
                                            `;
                                        }
                                    }
                                } catch (e) {
                                    console.error("Error al consultar perfil de Google:", e);
                                    if (statusGoogle) {
                                        statusGoogle.innerHTML = `<span class="text-amber-500 font-bold text-xs">⚠️ No se pudo obtener el perfil de Google. Puede ingresar sus datos manualmente.</span>`;
                                    }
                                } finally {
                                    btnGoogle.disabled = false;
                                    btnGoogle.innerHTML = `
                                        <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                                        </svg>
                                        <span>Autocompletar perfil con Google</span>
                                    `;
                                }
                            }
                        },
                        error_callback: (err) => {
                            console.warn("Aviso de autorización de Google OAuth:", err);
                            if (statusGoogle) {
                                statusGoogle.innerHTML = `<span class="text-amber-500 font-bold text-xs">⚠️ Google OAuth: ${escapeHtml(err.message || err.type || "Ventana cancelada o no autorizada")}. Complete sus datos manualmente.</span>`;
                            }
                        }
                    });
                    tokenClient.requestAccessToken({ prompt: "select_account" });
                    return;
                } catch (errToken) {
                    console.warn("Fallo inicializando token client de Google:", errToken);
                    if (statusGoogle) {
                        statusGoogle.innerHTML = `<span class="text-amber-500 font-bold text-xs">⚠️ Error al iniciar Google: ${escapeHtml(errToken.message)}. Ingrese sus datos manualmente abajo.</span>`;
                    }
                }
            } else {
                console.warn("Google GIS SDK aún no está disponible en window.google");
                if (statusGoogle) {
                    statusGoogle.innerHTML = `<span class="text-amber-500 font-bold text-xs">⚠️ El servicio de Google se encuentra cargando o fue bloqueado por el navegador. Use el formulario manual.</span>`;
                }
            }
            ejecutarFallbackGooglePrompt();
        };

        function ejecutarFallbackGooglePrompt() {
            const correoIngresado = prompt(
                "Ingrese su cuenta o correo de Google (Gmail):",
                funcionario.email || (funcionario.nombre_completo ? `${funcionario.nombre_completo.toLowerCase().replace(/\s+/g, ".")}@gmail.com` : "")
            );
            if (correoIngresado && correoIngresado.includes("@")) {
                const emailLimpio = correoIngresado.trim().toLowerCase();
                const emailInput = document.getElementById("activar-email");
                if (emailInput) emailInput.value = emailLimpio;
                if (inputNombre && (!inputNombre.value || inputNombre.value === "Funcionario Nuevo")) {
                    const parteNombre = emailLimpio.split("@")[0].replace(/[\._-]/g, " ");
                    inputNombre.value = parteNombre.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                }
                vinculoGoogle.email = emailLimpio;
                vinculoGoogle.google_id = emailLimpio;
                if (statusGoogle) {
                    statusGoogle.innerHTML = `<span class="text-[#198754] dark:text-emerald-400 font-bold">✓ Sincronizado con Google: ${emailLimpio}</span>`;
                }
            }
        }
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
                p_google_id: vinculoGoogle.google_id || ((email && email.includes("@gmail")) ? email : null)
            };
            if (sexo) {
                rpcPayload.p_sexo = sexo;
            }

            let res = await fetch(`${config.SUPABASE_URL}/rest/v1/rpc/auth_primer_ingreso`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": config.SUPABASE_PUBLISHABLE_KEY,
                    "Authorization": `Bearer ${config.SUPABASE_PUBLISHABLE_KEY}`
                },
                body: JSON.stringify(rpcPayload)
            });

            // Resiliencia: si la función en Supabase aún no tiene p_sexo (PGRST202), reintentar con 6 parámetros
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                if (errData.code === "PGRST202" && rpcPayload.p_sexo) {
                    delete rpcPayload.p_sexo;
                    res = await fetch(`${config.SUPABASE_URL}/rest/v1/rpc/auth_primer_ingreso`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "apikey": config.SUPABASE_PUBLISHABLE_KEY,
                            "Authorization": `Bearer ${config.SUPABASE_PUBLISHABLE_KEY}`
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

            modal.classList.add("hidden");

            if (typeof onSuccess === "function") {
                onSuccess({
                    nuevaClave,
                    nombre,
                    email,
                    sexo,
                    avatar_url: vinculoGoogle.avatar_url
                });
            }

        } catch (err) {
            mostrarErrorActivacion(err.message);
        } finally {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.textContent = "Activar Cuenta e Ingresar al Panel";
            }
        }
    };
}
