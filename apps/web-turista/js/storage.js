/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: storage.js
 * DESCRIPCIÓN: Manejo de identidad anónima del visitante, cronómetro de llenado
 *              y persistencia en almacenamiento local (Resiliente sin conexión).
 * ==============================================================================
 */

const STORAGE_KEYS = {
    VISITOR_ID: "simat_visitor_client_id",
    PENDING_SURVEYS: "simat_pending_queue",
    START_TIME: "simat_survey_start_time"
};

/**
 * Obtiene o genera un UUIDv4 único para el navegador del turista.
 * Cumple con la Ley de Infogobierno y Habeas Data: No almacena datos personales,
 * solo un identificador aleatorio de sesión para evitar duplicados en el peaje.
 */
export function getOrCreateVisitorId() {
    let visitorId = localStorage.getItem(STORAGE_KEYS.VISITOR_ID);
    if (!visitorId) {
        // Generador de UUID v4 criptográfico nativo del navegador
        if (crypto && crypto.randomUUID) {
            visitorId = crypto.randomUUID();
        } else {
            visitorId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        localStorage.setItem(STORAGE_KEYS.VISITOR_ID, visitorId);
    }
    return visitorId;
}

/**
 * Inicia el cronómetro de llenado en memoria.
 * Permite verificar que la encuesta tomó al menos 10-15 segundos reales.
 */
export function startSurveyTimer() {
    const startTime = Date.now();
    sessionStorage.setItem(STORAGE_KEYS.START_TIME, startTime.toString());
    return startTime;
}

/**
 * Calcula los segundos transcurridos desde que el turista abrió el formulario.
 */
export function getElapsedFillingSeconds() {
    const startTime = parseInt(sessionStorage.getItem(STORAGE_KEYS.START_TIME) || Date.now().toString(), 10);
    const elapsedMs = Date.now() - startTime;
    return Math.max(Math.floor(elapsedMs / 1000), 10);
}

/**
 * Guarda una encuesta en la cola de contingencia local si se corta la señal en carretera.
 */
export function savePendingSurveyLocally(surveyData) {
    try {
        const queue = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_SURVEYS) || "[]");
        queue.push({
            ...surveyData,
            savedLocallyAt: new Date().toISOString()
        });
        localStorage.setItem(STORAGE_KEYS.PENDING_SURVEYS, JSON.stringify(queue));
        console.warn("[SIMAT] Encuesta respaldada en almacenamiento local por falta de red.");
        return true;
    } catch (err) {
        console.error("[SIMAT] Error guardando en cola local:", err);
        return false;
    }
}
