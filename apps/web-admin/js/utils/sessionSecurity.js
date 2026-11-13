/**
 * @file sessionSecurity.js
 * @description Utilidades compartidas de seguridad para el Panel de Supervisión SIMAT:
 *              - Sanitización XSS (escapeHtml)
 *              - Construcción segura de cabeceras y validación de sesión servidor
 *              - Intercambio de Google ID Token (GIS) por JWT real de Supabase Auth
 */

const ESCAPE_MAP = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
    "/": "&#x2F;"
};

export function escapeHtml(valor) {
    if (valor === null || valor === undefined) return "";
    return String(valor).replace(/[&<>"'/]/g, ch => ESCAPE_MAP[ch]);
}

export function sanitizeAndBuildAuthHeaders(publishableKey, userJwt = null) {
    const bearer = userJwt && String(userJwt).trim() !== ""
        ? String(userJwt).trim()
        : String(publishableKey || "").trim();
    return {
        "Content-Type": "application/json",
        "apikey": String(publishableKey || "").trim(),
        "Authorization": `Bearer ${bearer}`
    };
}

export function isSessionPayloadUsable(payload) {
    if (!payload || typeof payload !== "object") return false;
    if (typeof payload.token !== "string" || payload.token.trim().length === 0) return false;
    const func = payload.funcionario;
    if (!func || !func.id) return false;
    if (func.id === "00000000-0000-0000-0000-000000000000") return false;
    return true;
}

export async function llamarRpcSegura(supabaseConfig, rpcName, body = {}, userJwt = null) {
    return fetch(`${supabaseConfig.SUPABASE_URL}/rest/v1/rpc/${rpcName}`, {
        method: "POST",
        headers: sanitizeAndBuildAuthHeaders(supabaseConfig.SUPABASE_PUBLISHABLE_KEY, userJwt),
        body: JSON.stringify(body)
    });
}

export async function intercambiarGoogleIdTokenPorSupabaseJwt(supabaseConfig, idToken) {
    const res = await fetch(`${supabaseConfig.SUPABASE_URL}/auth/v1/token?grant_type=id_token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "apikey": supabaseConfig.SUPABASE_PUBLISHABLE_KEY
        },
        body: JSON.stringify({
            provider: "google",
            id_token: idToken
        })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) {
        throw new Error(data.error_description || data.msg || "No se pudo verificar el token de Google en el servidor.");
    }
    return data;
}

export function solicitarGoogleIdTokenGIS(clientId, containerId = null) {
    return new Promise((resolve, reject) => {
        if (!window.google || !google.accounts || !google.accounts.id || !clientId) {
            reject(new Error("Google Identity Services no está disponible o falta Client ID."));
            return;
        }

        let resolved = false;
        google.accounts.id.initialize({
            client_id: clientId,
            use_fedcm_for_prompt: true,
            callback: (response) => {
                if (resolved) return;
                resolved = true;
                if (response && response.credential) {
                    resolve(response.credential);
                } else {
                    reject(new Error("Google no devolvió un ID Token firmado."));
                }
            }
        });

        if (containerId) {
            const mount = document.getElementById(containerId);
            if (mount) {
                mount.innerHTML = "";
                google.accounts.id.renderButton(mount, {
                    theme: "outline",
                    size: "large",
                    width: 280,
                    text: "continue_with"
                });
            }
        }

        google.accounts.id.prompt((notification) => {
            if (resolved) return;
            const notDisplayed = notification.isNotDisplayed && notification.isNotDisplayed();
            const skipped = notification.isSkippedMoment && notification.isSkippedMoment();
            if ((notDisplayed || skipped) && !containerId) {
                resolved = true;
                reject(new Error("Seleccione su cuenta usando el botón oficial de Google."));
            }
        });
    });
}
