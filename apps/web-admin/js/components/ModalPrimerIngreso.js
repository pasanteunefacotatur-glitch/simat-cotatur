/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-admin/js/components/ModalPrimerIngreso.js
 * DESCRIPCIÓN: Activación de Primer Ingreso con verificación Google JWT real
 *              vía Supabase Auth y actualización autenticada por token de sesión.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

import {
    escapeHtml,
    intercambiarGoogleIdTokenPorSupabaseJwt,
    llamarRpcSegura,
    solicitarGoogleIdTokenGIS
} from "../utils/sessionSecurity.js";

export function mostrarModalPrimerIngreso({ funcionario, sessionToken, config, onSuccess }) {
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

    const emailInput = document.getElementById("activar-email");
    if (emailInput && funcionario.email) {
        emailInput.value = funcionario.email;
    }

    const form = document.getElementById("form-primer-ingreso");
    const btnGoogle = document.getElementById("btn-activar-google");
    const statusGoogle = document.getElementById("google-sync-status");

    let vinculoGoogle = { avatar_url: funcionario.avatar_url || null, email: funcionario.email || null };

    if (btnGoogle) {
        btnGoogle.onclick = async () => {
            btnGoogle.disabled = true;
            if (statusGoogle) {
                statusGoogle.innerHTML = `<span class="text-slate-500 text-xs">⏳ Esperando autenticación oficial con Google...</span>`;
            }

            try {
                const idToken = await solicitarGoogleIdTokenGIS(config.GOOGLE_WEB_CLIENT_ID);
                const supabaseAuth = await intercambiarGoogleIdTokenPorSupabaseJwt(config, idToken);
                const resVinc = await llamarRpcSegura(
                    config,
                    "auth_vincular_correo_google_jwt",
                    { p_token: sessionToken },
                    supabaseAuth.access_token
                );
                const datosVinc = await resVinc.json().catch(() => ({}));
                if (!resVinc.ok || datosVinc.status !== "success") {
                    throw new Error(datosVinc.message || "No se pudo vincular la cuenta Google.");
                }

                if (emailInput && datosVinc.email) emailInput.value = datosVinc.email;
                if (datosVinc.nombre && inputNombre && (!inputNombre.value || inputNombre.value === "Funcionario Nuevo")) {
                    inputNombre.value = datosVinc.nombre;
                }
                vinculoGoogle = { email: datosVinc.email, avatar_url: datosVinc.avatar_url || null };

                if (statusGoogle) {
                    const safeAvatar = vinculoGoogle.avatar_url && vinculoGoogle.avatar_url.startsWith("https://")
                        ? escapeHtml(vinculoGoogle.avatar_url)
                        : null;
                    statusGoogle.innerHTML = `
                        <div class="flex items-center justify-center gap-2 text-[#198754] dark:text-emerald-400 font-bold text-xs">
                            ${safeAvatar ? `<img src="${safeAvatar}" class="w-5 h-5 rounded-full shadow-sm" alt="Avatar">` : "✓"}
                            <span>Cuenta verificada criptográficamente: ${escapeHtml(datosVinc.email)}</span>
                        </div>`;
                }
            } catch (err) {
                if (statusGoogle) {
                    statusGoogle.innerHTML = `<span class="text-amber-500 font-bold text-xs">⚠️ ${escapeHtml(err.message)}</span>`;
                }
            } finally {
                btnGoogle.disabled = false;
            }
        };
    }

    const vincularToggle = (btnId, inputId) => {
        const b = document.getElementById(btnId);
        const inp = document.getElementById(inputId);
        if (b && inp) {
            b.onclick = () => {
                const isPass = inp.type === "password";
                inp.type = isPass ? "text" : "password";
                b.textContent = isPass ? "🙈" : "👁️";
            };
        }
    };
    vincularToggle("btn-toggle-activar-clave1", "activar-nueva-clave");
    vincularToggle("btn-toggle-activar-clave2", "activar-confirmar-clave");

    form.onsubmit = async (e) => {
        e.preventDefault();
        const nuevaClave = document.getElementById("activar-nueva-clave").value.trim();
        const confirmarClave = document.getElementById("activar-confirmar-clave").value.trim();
        const nombre = inputNombre.value.trim();
        const sexo = document.getElementById("activar-sexo")?.value || "";
        const telefono = document.getElementById("activar-telefono").value.trim();
        const activarError = document.getElementById("activar-error");
        if (activarError) activarError.classList.add("hidden");

        const mostrarError = (msg) => {
            if (activarError) {
                activarError.textContent = `⚠️ ${msg}`;
                activarError.classList.remove("hidden");
            } else {
                alert(msg);
            }
        };

        if (!nombre) return mostrarError("Por favor ingrese su Nombre y Apellido.");
        if (nuevaClave.length < 8) {
            mostrarError("La nueva contraseña debe tener al menos 8 caracteres.");
            return;
        }
        if (nuevaClave !== confirmarClave) {
            mostrarError("Las contraseñas no coinciden. Por favor verifique.");
            return;
        }

        const btnSubmit = document.getElementById("btn-completar-activacion");
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.textContent = "Activando cuenta...";
        }

        try {
            const res = await llamarRpcSegura(config, "auth_primer_ingreso", {
                p_token: sessionToken,
                p_nueva_clave: nuevaClave,
                p_nombre_completo: nombre,
                p_telefono: telefono || null,
                p_sexo: sexo || null
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || "No se pudo actualizar el perfil.");

            alert("¡Cuenta de Supervisión activada exitosamente!");
            modal.classList.add("hidden");

            if (typeof onSuccess === "function") {
                onSuccess({
                    nombre,
                    email: vinculoGoogle.email || funcionario.email || null,
                    sexo,
                    avatar_url: vinculoGoogle.avatar_url
                });
            }
        } catch (err) {
            mostrarError(err.message);
        } finally {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.textContent = "Activar Cuenta e Ingresar al Panel";
            }
        }
    };
}
