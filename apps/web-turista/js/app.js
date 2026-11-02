/**
 * ==============================================================================
 * PROYECTO: Sistema de Medición y Estadística Turística (Borrador Fase 1)
 * ARCHIVO: app.js
 * DESCRIPCIÓN: Controlador principal del formulario web. Coordina el montaje
 *              de módulos, validaciones y envío hacia Supabase.
 * ==============================================================================
 */

import { CONFIG } from "./config.js";
import { getOrCreateVisitorId, startSurveyTimer, getElapsedFillingSeconds, savePendingSurveyLocally } from "./storage.js";
import { renderHeader } from "./components/Header.js";
import { renderStepProcedencia } from "./components/StepProcedencia.js";
import { renderStepDestinoPerfil } from "./components/StepDestinoPerfil.js";
import { renderStepCalificacion } from "./components/StepCalificacion.js";
import { renderModalRecompensa, abrirModalRecompensa } from "./components/ModalRecompensa.js";

document.addEventListener("DOMContentLoaded", () => {
    getOrCreateVisitorId();
    startSurveyTimer();

    renderHeader("header-mount");
    renderStepProcedencia("step-1-mount");
    renderStepDestinoPerfil("step-2-mount");
    renderStepCalificacion("step-3-mount");
    renderModalRecompensa("modal-mount");

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
        const paisOrigen = !esNacional ? document.getElementById("input-pais-origen").value.trim() : "Venezuela";

        const municipioDestino = document.getElementById("select-municipio-destino").value;
        const motivoBtn = document.querySelector("#group-motivo-viaje button[data-selected='true']");
        const motivoViaje = motivoBtn ? motivoBtn.getAttribute("data-motivo") : "TURISMO_RECREACION";

        const tipoAlojamientoEl = document.getElementById("select-tipo-alojamiento");
        const tipoAlojamiento = tipoAlojamientoEl ? tipoAlojamientoEl.value : "POSADA";

        const grupoTamano = parseInt(document.getElementById("input-grupo-tamano").value || "1", 10);
        const diasEstadia = parseInt(document.getElementById("input-dias-estadia").value || "1", 10);

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

        if (!esNacional && !paisOrigen) {
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
            id: crypto.randomUUID ? crypto.randomUUID() : undefined,
            punto_captura_id: null,
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
            } catch (netErr) {
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
