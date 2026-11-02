/**
 * ==============================================================================
 * PROYECTO: Sistema de Medición y Estadística Turística (Borrador Fase 1)
 * ARCHIVO: app.js
 * DESCRIPCIÓN: Controlador principal del formulario web. Coordina el montaje
 *              de módulos, resolución de punto por URL (?p=) contra Supabase,
 *              sanitización, cola de contingencia offline y envío RPC.
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
import { renderHeader } from "./components/Header.js";
import { renderStepProcedencia } from "./components/StepProcedencia.js";
import { renderStepDestinoPerfil } from "./components/StepDestinoPerfil.js";
import { renderStepCalificacion } from "./components/StepCalificacion.js";
import { renderModalRecompensa, abrirModalRecompensa } from "./components/ModalRecompensa.js";

// Estado activo del punto de control
let activePoint = PUNTOS_CONTROL_QR.PEAJE_TARIBA;

document.addEventListener("DOMContentLoaded", async () => {
    getOrCreateVisitorId();
    startSurveyTimer();

    // 1. Detectar el Punto de Control QR mediante parámetro URL (?p=CODIGO)
    const params = new URLSearchParams(window.location.search);
    const codigoPunto = (params.get("p") || "PEAJE_TARIBA").toUpperCase();

    if (PUNTOS_CONTROL_QR[codigoPunto]) {
        activePoint = PUNTOS_CONTROL_QR[codigoPunto];
    }

    // 2. Renderizar los módulos de la interfaz
    renderHeader("header-mount", activePoint.nombre);
    renderStepProcedencia("step-1-mount");
    renderStepDestinoPerfil("step-2-mount");
    renderStepCalificacion("step-3-mount");
    renderModalRecompensa("modal-mount");

    // 3. Si COTATUR agregó un punto nuevo en Supabase, sincronizar su nombre e ID en vivo
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
            // Usa el catálogo local como respaldo silencioso
        }
    }

    // 4. Eventos de sincronización automática de la cola offline
    flushPendingSurveys(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_PUBLISHABLE_KEY);
    window.addEventListener("online", () => {
        flushPendingSurveys(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_PUBLISHABLE_KEY);
    });
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            flushPendingSurveys(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_PUBLISHABLE_KEY);
        }
    });

    // 5. Vincular evento de envío
    const form = document.getElementById("form-encuesta-turistica");
    if (form) {
        form.addEventListener("submit", handleSubmitEncuesta);
    }
});

async function handleSubmitEncuesta(event) {
    event.preventDefault();

    const submitBtn = document.getElementById("btn-submit-encuesta");
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = "Procesando registro...";

        const esNacional = !document.getElementById("wrapper-origen-nacional").classList.contains("hidden");
        const estadoOrigen = esNacional ? document.getElementById("select-estado-origen").value : null;
        const rawPais = !esNacional ? document.getElementById("input-pais-origen").value : "Venezuela";
        const paisOrigen = sanitizeText(rawPais) || "Venezuela";

        const municipioDestino = document.getElementById("select-municipio-destino").value;
        const motivoBtn = document.querySelector("#group-motivo-viaje button[data-selected='true']");
        const motivoViaje = motivoBtn ? motivoBtn.getAttribute("data-motivo") : "TURISMO_RECREACION";

        const grupoTamano = Math.max(1, parseInt(document.getElementById("input-grupo-tamano").value || "1", 10));
        const diasEstadia = Math.max(0, parseInt(document.getElementById("input-dias-estadia").value || "0", 10));

        const tipoAlojamientoEl = document.getElementById("select-tipo-alojamiento");
        const tipoAlojamiento = diasEstadia === 0 ? "SIN_PERNOCTA" : (tipoAlojamientoEl ? tipoAlojamientoEl.value : "POSADA");

        const califVialidad = parseInt(document.querySelector("[data-rating-group='vialidad']").getAttribute("data-current") || "4", 10);
        const califSeguridad = parseInt(document.querySelector("[data-rating-group='seguridad']").getAttribute("data-current") || "5", 10);
        const califHospitalidad = parseInt(document.querySelector("[data-rating-group='hospitalidad']").getAttribute("data-current") || "5", 10);
        const califServicios = parseInt(document.querySelector("[data-rating-group='servicios']").getAttribute("data-current") || "4", 10);

        if (esNacional && !estadoOrigen) {
            alert("Seleccione el estado de procedencia.");
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }

        if (!esNacional && !rawPais.trim()) {
            alert("Indique el país de procedencia.");
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }

        if (!municipioDestino) {
            alert("Seleccione el municipio de destino principal.");
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }

        const payload = {
            id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : undefined,
            punto_captura_id: activePoint ? activePoint.id : null,
            visitor_client_id: getOrCreateVisitorId(),
            duracion_llenado_seg: getElapsedFillingSeconds(),
            procedencia_tipo: esNacional ? "NACIONAL" : "INTERNACIONAL",
            estado_origen: estadoOrigen,
            pais_origen: paisOrigen,
            municipio_destino: municipioDestino,
            motivo_viaje: motivoViaje,
            tipo_alojamiento: tipoAlojamiento,
            grupo_tamano: grupoTamano,
            dias_estadia: diasEstadia,
            calif_vialidad: califVialidad,
            calif_seguridad: califSeguridad,
            calif_hospitalidad: califHospitalidad,
            calif_servicios_publicos: califServicios,
            gasto_promedio_diario_usd: null
        };

        if (navigator.onLine) {
            try {
                const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/registrar_encuesta_web`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "apikey": CONFIG.SUPABASE_PUBLISHABLE_KEY,
                        "Authorization": `Bearer ${CONFIG.SUPABASE_PUBLISHABLE_KEY}`
                    },
                    body: JSON.stringify({ p_datos: payload })
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (_) {
                savePendingSurveyLocally(payload);
            }
        } else {
            savePendingSurveyLocally(payload);
        }

        abrirModalRecompensa();
    } catch (err) {
        console.error(err);
        abrirModalRecompensa();
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}
