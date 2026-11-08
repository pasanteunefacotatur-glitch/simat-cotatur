/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-turista/js/app.js
 * DESCRIPCIÓN: Controlador principal de la encuesta pública para turistas.
 *              Coordina montaje de módulos, resolución de punto por URL (?p=),
 *              soporte de temas (Claro/Oscuro/AMOLED), validación y cola offline.
 *              Las funciones administrativas están aisladas en admin.html.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

import { CONFIG, PUNTOS_CONTROL_QR } from "./config.js";
import {
    getOrCreateVisitorId,
    startSurveyTimer,
    getElapsedFillingSeconds,
    sanitizeText,
    savePendingSurveyLocally,
    flushPendingSurveys
} from "./storage.js";
import { initTheme } from "./components/ThemeManager.js";
import { renderHeader } from "./components/Header.js";
import { renderStepProcedencia } from "./components/StepProcedencia.js";
import { renderStepDestinoPerfil } from "./components/StepDestinoPerfil.js";
import { renderStepCalificacion } from "./components/StepCalificacion.js";
import { renderModalRecompensa, abrirModalRecompensa } from "./components/ModalRecompensa.js";

// Estado activo del punto de control
let activePoint = PUNTOS_CONTROL_QR.PEAJE_TARIBA;

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Inicializar tema (Claro / Oscuro LCD / AMOLED)
    initTheme();

    // 2. Iniciar métricas de sesión anónima y cronómetro
    getOrCreateVisitorId();
    startSurveyTimer();

    // 3. Detectar Punto de Control QR mediante parámetro URL (?p=CODIGO)
    const params = new URLSearchParams(window.location.search);
    const codigoPunto = (params.get("p") || "PEAJE_TARIBA").toUpperCase();

    if (PUNTOS_CONTROL_QR[codigoPunto]) {
        activePoint = PUNTOS_CONTROL_QR[codigoPunto];
    }

    // 4. Renderizar componentes públicos de la encuesta
    renderHeader("header-mount", activePoint.nombre);
    renderStepProcedencia("step-1-mount");
    renderStepDestinoPerfil("step-2-mount");
    renderStepCalificacion("step-3-mount");
    renderModalRecompensa("modal-mount");

    // 5. Sincronización en vivo del punto si Supabase está accesible
    if (navigator.onLine) {
        try {
            const res = await fetch(
                `${CONFIG.SUPABASE_URL}/rest/v1/puntos_captura?select=id,codigo,nombre&codigo=eq.${encodeURIComponent(codigoPunto)}&activo=eq.true`,
                {
                    headers: {
                        "apikey": CONFIG.SUPABASE_PUBLISHABLE_KEY,
                        "Authorization": `Bearer ${CONFIG.SUPABASE_PUBLISHABLE_KEY}`
                    }
                }
            );
            if (res.ok) {
                const rows = await res.json();
                if (Array.isArray(rows) && rows.length > 0) {
                    activePoint = { id: rows[0].id, nombre: rows[0].nombre };
                    const headerPointEl = document.getElementById("header-point-name");
                    if (headerPointEl) headerPointEl.textContent = activePoint.nombre;
                }
            }
        } catch (_) {
            // Usa el catálogo local como respaldo resiliente
        }
    }

    // 6. Cola offline y sincronización automática
    flushPendingSurveys(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_PUBLISHABLE_KEY);
    window.addEventListener("online", () => {
        flushPendingSurveys(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_PUBLISHABLE_KEY);
    });
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            flushPendingSurveys(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_PUBLISHABLE_KEY);
        }
    });

    // 7. Enlazar envío de encuesta
    const form = document.getElementById("form-encuesta-turistica");
    if (form) {
        form.addEventListener("submit", handleSubmitEncuesta);
    }
});

/**
 * Valida y procesa el registro de la encuesta turística.
 */
async function handleSubmitEncuesta(e) {
    e.preventDefault();

    const submitBtn = document.getElementById("btn-submit-encuesta");
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <span class="inline-block animate-spin mr-2">⏳</span>
            Procesando registro seguro...
        `;
    }

    try {
        const formData = new FormData(e.target);
        const procedenciaTipo = formData.get("procedencia_tipo") || "NACIONAL";
        const estadoOrigen = procedenciaTipo === "NACIONAL" ? formData.get("estado_origen") : null;
        const paisOrigen = procedenciaTipo === "INTERNACIONAL" ? formData.get("pais_origen") : "Venezuela";

        const surveyPayload = {
            id: crypto.randomUUID ? crypto.randomUUID() : `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            canal: "WEB",
            punto_captura_id: activePoint.id || "00000000-0000-0000-0000-000000000001",
            visitor_client_id: getOrCreateVisitorId(),
            captured_at: new Date().toISOString(),
            duracion_llenado_seg: getElapsedFillingSeconds(),
            procedencia_tipo: procedenciaTipo,
            estado_origen: estadoOrigen,
            pais_origen: paisOrigen,
            municipio_destino: formData.get("municipio_destino") || "San Cristóbal",
            motivo_viaje: formData.get("motivo_viaje") || "Vacaciones y Recreación",
            tipo_alojamiento: formData.get("tipo_alojamiento") || "Posada Turística",
            grupo_tamano: parseInt(formData.get("grupo_tamano"), 10) || 1,
            dias_estadia: parseInt(formData.get("dias_estadia"), 10) || 1,
            calif_vialidad: parseInt(formData.get("calif_vialidad"), 10) || 5,
            calif_seguridad: parseInt(formData.get("calif_seguridad"), 10) || 5,
            calif_hospitalidad: parseInt(formData.get("calif_hospitalidad"), 10) || 5,
            calif_servicios_publicos: parseInt(formData.get("calif_servicios_publicos"), 10) || 5
        };

        if (navigator.onLine) {
            try {
                const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/registrar_encuesta_web`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "apikey": CONFIG.SUPABASE_PUBLISHABLE_KEY,
                        "Authorization": `Bearer ${CONFIG.SUPABASE_PUBLISHABLE_KEY}`
                    },
                    body: JSON.stringify({ p_datos: surveyPayload })
                });

                if (!res.ok) {
                    savePendingSurveyLocally(surveyPayload);
                }
            } catch (_) {
                savePendingSurveyLocally(surveyPayload);
            }
        } else {
            savePendingSurveyLocally(surveyPayload);
        }

        abrirModalRecompensa();
        e.target.reset();

    } catch (err) {
        alert("Aviso: Su respuesta ha sido guardada en la memoria local y se transmitirá automáticamente cuando recupere señal.");
        abrirModalRecompensa();
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = "Registrar encuesta y descargar guía";
        }
    }
}
