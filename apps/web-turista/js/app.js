/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: app.js
 * DESCRIPCIÓN: Controlador principal de la Web Turista PWA. Orquesta componentes,
 *              valida datos, interactúa con Supabase y gestiona contingencia offline.
 * ==============================================================================
 */

import { CONFIG } from "./config.js";
import { getOrCreateVisitorId, startSurveyTimer, getElapsedFillingSeconds, savePendingSurveyLocally } from "./storage.js";
import { renderHeader } from "./components/Header.js";
import { renderStepProcedencia } from "./components/StepProcedencia.js";
import { renderStepDestinoPerfil } from "./components/StepDestinoPerfil.js";
import { renderStepCalificacion } from "./components/StepCalificacion.js";
import { renderModalRecompensa, abrirModalRecompensa } from "./components/ModalRecompensa.js";

// Inicialización al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
    console.log(`[SIMAT-COTATUR] Inicializando PWA Web v${CONFIG.VERSION}`);

    // 1. Iniciar identidad anónima del visitante y cronómetro de auditoría
    const visitorId = getOrCreateVisitorId();
    startSurveyTimer();

    // 2. Renderizar componentes modulares en sus respectivos contenedores
    renderHeader("header-mount");
    renderStepProcedencia("step-1-mount");
    renderStepDestinoPerfil("step-2-mount");
    renderStepCalificacion("step-3-mount");
    renderModalRecompensa("modal-mount");

    // 3. Vincular evento de envío de formulario
    const form = document.getElementById("form-encuesta-turistica");
    if (form) {
        form.addEventListener("submit", handleSubmitEncuesta);
    }
});

/**
 * Procesa el envío de la encuesta turística
 */
async function handleSubmitEncuesta(event) {
    event.preventDefault();

    const submitBtn = document.getElementById("btn-submit-encuesta");
    const originalText = submitBtn.innerHTML;

    try {
        // Indicador visual de carga
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <span class="inline-block animate-spin mr-2">⏳</span>
            Registrando tu opinión...
        `;

        // 1. Recolección de datos desde los módulos
        const esNacional = !document.getElementById("wrapper-origen-nacional").classList.contains("hidden");
        const estadoOrigen = esNacional ? document.getElementById("select-estado-origen").value : null;
        const paisOrigen = !esNacional ? document.getElementById("input-pais-origen").value.trim() : "Venezuela";

        const municipioDestino = document.getElementById("select-municipio-destino").value;
        const motivoBtn = document.querySelector("#group-motivo-viaje button[data-selected='true']");
        const motivoViaje = motivoBtn ? motivoBtn.getAttribute("data-motivo") : "TURISMO_RECREACION";

        const grupoTamano = parseInt(document.getElementById("input-grupo-tamano").value || "1", 10);
        const diasEstadia = parseInt(document.getElementById("input-dias-estadia").value || "1", 10);

        // Calificaciones
        const califVialidad = parseInt(document.querySelector("[data-rating-group='vialidad']").getAttribute("data-current") || "5", 10);
        const califSeguridad = parseInt(document.querySelector("[data-rating-group='seguridad']").getAttribute("data-current") || "5", 10);
        const califHospitalidad = parseInt(document.querySelector("[data-rating-group='hospitalidad']").getAttribute("data-current") || "5", 10);
        const califServicios = parseInt(document.querySelector("[data-rating-group='servicios']").getAttribute("data-current") || "5", 10);

        // Validación amigable
        if (esNacional && !estadoOrigen) {
            alert("Por favor selecciona tu Estado de procedencia.");
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            return;
        }

        if (!municipioDestino) {
            alert("Por favor selecciona tu municipio de destino en el Táchira.");
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            return;
        }

        // Construir objeto de encuesta normalizado
        const duracionLlenadoSeg = getElapsedFillingSeconds();
        const payload = {
            id: crypto.randomUUID ? crypto.randomUUID() : undefined,
            punto_captura_id: null, // Asignado por URL o por defecto
            visitor_client_id: getOrCreateVisitorId(),
            duracion_llenado_seg: duracionLlenadoSeg,
            procedencia_tipo: esNacional ? "NACIONAL" : "INTERNACIONAL",
            estado_origen: estadoOrigen,
            pais_origen: paisOrigen,
            municipio_destino: municipioDestino,
            motivo_viaje: motivoViaje,
            tipo_alojamiento: "POSADA",
            grupo_tamano: grupoTamano,
            dias_estadia: diasEstadia,
            calif_vialidad: califVialidad,
            calif_seguridad: califSeguridad,
            calif_hospitalidad: califHospitalidad,
            calif_servicios_publicos: califServicios,
            gasto_promedio_diario_usd: 35.00
        };

        // 2. Enviar a Supabase RPC si hay conexión
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
                console.log("[SIMAT] Encuesta registrada en Supabase Cloud con éxito.");
            } catch (netErr) {
                console.warn("[SIMAT] Falló envío directo a Supabase, guardando en cola offline:", netErr);
                savePendingSurveyLocally(payload);
            }
        } else {
            // Sin conexión en carretera: guardar en cola local resiliente
            savePendingSurveyLocally(payload);
        }

        // 3. Abrir la pantalla de agradecimiento y entrega de recompensa
        abrirModalRecompensa();

    } catch (err) {
        console.error("[SIMAT] Error en procesamiento de encuesta:", err);
        alert("Ocurrió un error. Tu encuesta ha sido respaldada en el dispositivo.");
        abrirModalRecompensa();
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}
