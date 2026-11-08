/**
 * ==============================================================================
 * PROYECTO: Sistema de Medición y Estadística Turística (Borrador Fase 1)
 * ARCHIVO: storage.js
 * DESCRIPCIÓN: Gestión de identificador anónimo, cronómetro de captura,
 *              sanitización de texto y cola de sincronización offline.
 * ==============================================================================
 */

const STORAGE_KEYS = {
    VISITOR_ID: "simat_visitor_client_id",
    PENDING_SURVEYS: "simat_pending_queue",
    START_TIME: "simat_survey_start_time"
};

/**
 * Obtiene o genera un identificador UUIDv4 anónimo en el navegador.
 * No recopila datos personales; sirve únicamente para control estadístico.
 */
export function getOrCreateVisitorId() {
    let visitorId = localStorage.getItem(STORAGE_KEYS.VISITOR_ID);
    if (!visitorId) {
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
            visitorId = crypto.randomUUID();
        } else {
            visitorId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
                const r = (Math.random() * 16) | 0;
                const v = c === "x" ? r : (r & 0x3) | 0x8;
                return v.toString(16);
            });
        }
        localStorage.setItem(STORAGE_KEYS.VISITOR_ID, visitorId);
    }
    return visitorId;
}

/**
 * Inicia el registro de tiempo de llenado de la encuesta.
 * Si forceReset es false y ya existe un cronómetro en curso en la sesión,
 * conserva el instante original para que validaciones fallidas o recargas
 * accidentales no reinicien el conteo a pocos segundos.
 */
export function startSurveyTimer(forceReset = false) {
    const existing = sessionStorage.getItem(STORAGE_KEYS.START_TIME);
    if (!forceReset && existing) {
        return parseInt(existing, 10);
    }
    const startTime = Date.now();
    sessionStorage.setItem(STORAGE_KEYS.START_TIME, startTime.toString());
    return startTime;
}

/**
 * Calcula los segundos reales invertidos en completar el formulario.
 * Garantiza un mínimo técnico de 10 segundos para cumplir la restricción SQL.
 */
export function getElapsedFillingSeconds() {
    const startTime = parseInt(sessionStorage.getItem(STORAGE_KEYS.START_TIME) || Date.now().toString(), 10);
    const elapsedMs = Date.now() - startTime;
    return Math.max(Math.floor(elapsedMs / 1000), 10);
}

/**
 * Sanitiza entradas de texto libre contra inyección HTML/XSS e inyección de
 * fórmulas en hojas de cálculo (CSV/Excel Injection: =, +, -, @).
 */
export function sanitizeText(input) {
    if (!input || typeof input !== "string") return "";
    let cleaned = input
        .replace(/[<>]/g, "") // Elimina etiquetas HTML
        .trim();
    // Si inicia con caracteres ejecutables de Excel/Sheets, los neutraliza
    if (/^[=+\-@\t\r]/.test(cleaned)) {
        cleaned = "'" + cleaned;
    }
    return cleaned.slice(0, 80);
}

/**
 * Almacena una encuesta en la cola local cuando no hay conexión disponible.
 */
export function savePendingSurveyLocally(surveyData) {
    try {
        const queue = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_SURVEYS) || "[]");
        queue.push({
            ...surveyData,
            savedLocallyAt: new Date().toISOString()
        });
        localStorage.setItem(STORAGE_KEYS.PENDING_SURVEYS, JSON.stringify(queue));
        return true;
    } catch (err) {
        console.error("[SIMAT] Error al guardar en cola local:", err);
        return false;
    }
}

/**
 * Intenta enviar a Supabase las encuestas pendientes almacenadas sin conexión.
 * Se ejecuta al recuperar red ('online') o al volver a la pestaña ('visibilitychange').
 */
export async function flushPendingSurveys(supabaseUrl, publishableKey) {
    if (!navigator.onLine) return;
    try {
        const rawQueue = localStorage.getItem(STORAGE_KEYS.PENDING_SURVEYS);
        if (!rawQueue) return;

        const queue = JSON.parse(rawQueue);
        if (!Array.isArray(queue) || queue.length === 0) return;

        const remaining = [];
        for (const item of queue) {
            const { savedLocallyAt, ...payload } = item;
            try {
                const res = await fetch(`${supabaseUrl}/rest/v1/rpc/registrar_encuesta_web`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "apikey": publishableKey,
                        "Authorization": `Bearer ${publishableKey}`
                    },
                    body: JSON.stringify({ p_datos: payload })
                });
                if (!res.ok) remaining.push(item);
            } catch (_) {
                remaining.push(item);
            }
        }
        localStorage.setItem(STORAGE_KEYS.PENDING_SURVEYS, JSON.stringify(remaining));
    } catch (err) {
        console.error("[SIMAT] Error sincronizando cola local:", err);
    }
}
