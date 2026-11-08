/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-turista/js/app.js
 * DESCRIPCIÓN: Controlador principal de la encuesta pública para turistas.
 *              Coordina montaje de módulos, resolución de punto por URL (?p=),
 *              soporte de temas (Claro/Oscuro/AMOLED), validación estricta de
 *              campos DOM, sanitización anti-XSS/CSV y cola offline resiliente.
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
import {
    renderStepTemporadaDinamica,
    getRespuestasTemporada,
    getTemporadaCodigoActual
} from "./components/StepTemporadaDinamica.js";
import { renderStepCalificacion } from "./components/StepCalificacion.js";
import { renderModalRecompensa, abrirModalRecompensa } from "./components/ModalRecompensa.js";

// Estado activo del punto de control y temporada
let activePoint = PUNTOS_CONTROL_QR.PEAJE_TARIBA;
let activeSeasonCode = "REGULAR";

/**
 * Inicialización inmediata y resiliente de la encuesta turística.
 */
function initApp() {
    // 1. Inicializar tema (Claro / Oscuro LCD / AMOLED según dispositivo)
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

    // 4. Renderizar componentes públicos de la encuesta INMEDIATAMENTE
    renderHeader("header-mount", activePoint.nombre);
    renderStepProcedencia("step-1-mount");
    renderStepDestinoPerfil("step-2-mount");
    renderStepTemporadaDinamica("step-temporada-mount", activeSeasonCode);
    renderStepCalificacion("step-3-mount");
    renderModalRecompensa("modal-mount");

    // 5. Enlazar envío de encuesta
    const form = document.getElementById("form-encuesta-turistica");
    if (form) {
        form.addEventListener("submit", handleSubmitEncuesta);
    }

    // 6. Sincronización en vivo del punto y temporada en segundo plano
    if (navigator.onLine) {
        syncLiveConfig(codigoPunto);
    }

    // 7. Cola offline y sincronización automática
    flushPendingSurveys(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_PUBLISHABLE_KEY);
    window.addEventListener("online", () => {
        flushPendingSurveys(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_PUBLISHABLE_KEY);
    });
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            flushPendingSurveys(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_PUBLISHABLE_KEY);
        }
    });
}

/**
 * Sincroniza nombre del punto y temporada activa sin bloquear el renderizado inicial.
 */
async function syncLiveConfig(codigoPunto) {
    try {
        // Sincronizar punto
        const resPunto = await fetch(
            `${CONFIG.SUPABASE_URL}/rest/v1/puntos_captura?select=id,codigo,nombre&codigo=eq.${encodeURIComponent(codigoPunto)}&activo=eq.true`,
            {
                headers: {
                    "apikey": CONFIG.SUPABASE_PUBLISHABLE_KEY,
                    "Authorization": `Bearer ${CONFIG.SUPABASE_PUBLISHABLE_KEY}`
                }
            }
        );
        if (resPunto.ok) {
            const rows = await resPunto.json();
            if (Array.isArray(rows) && rows.length > 0) {
                activePoint = { id: rows[0].id, nombre: rows[0].nombre };
                const headerPointEl = document.getElementById("header-point-name");
                if (headerPointEl) headerPointEl.textContent = activePoint.nombre;
            }
        }

        // Sincronizar temporada activa oficial
        const resTemp = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/obtener_temporada_activa`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": CONFIG.SUPABASE_PUBLISHABLE_KEY,
                "Authorization": `Bearer ${CONFIG.SUPABASE_PUBLISHABLE_KEY}`
            }
        });
        if (resTemp.ok) {
            const dataTemp = await resTemp.json();
            if (dataTemp && dataTemp.temporada_codigo) {
                activeSeasonCode = dataTemp.temporada_codigo;
                renderStepTemporadaDinamica("step-temporada-mount", activeSeasonCode);
            }
        }
    } catch (_) {
        // Usa el catálogo local como respaldo resiliente
    }
}

// Inicialización universal segura (si el DOM ya cargó, ejecuta de inmediato)
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}

/**
 * Extrae, valida, sanitiza y transmite los datos reales de la encuesta turística.
 */
async function handleSubmitEncuesta(event) {
    event.preventDefault();

    const submitBtn = document.getElementById("btn-submit-encuesta");
    const originalText = submitBtn ? submitBtn.textContent : "Registrar encuesta y descargar guía";

    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Procesando registro seguro...";
        }

        // 1. Lectura de Procedencia (Nacional vs Internacional)
        const wrapNacional = document.getElementById("wrapper-origen-nacional");
        const esNacional = wrapNacional && !wrapNacional.classList.contains("hidden");
        const estadoEl = document.getElementById("select-estado-origen");
        const paisEl = document.getElementById("input-pais-origen");

        const estadoOrigen = esNacional && estadoEl ? sanitizeText(estadoEl.value) : null;
        const rawPais = !esNacional && paisEl ? paisEl.value : "Venezuela";
        const paisOrigen = sanitizeText(rawPais) || "Venezuela";

        // 2. Lectura de Destino, Motivo, Grupo y Estadía
        const muniEl = document.getElementById("select-municipio-destino");
        const rawMunicipio = muniEl ? sanitizeText(muniEl.value) : "";
        // Truncar a 50 caracteres para respetar VARCHAR(50) en PostgreSQL
        const municipioDestino = rawMunicipio.slice(0, 50);

        const motivoBtn = document.querySelector("#group-motivo-viaje button[data-selected='true']");
        const motivoViaje = motivoBtn ? motivoBtn.getAttribute("data-motivo") : "TURISMO_RECREACION";

        // Tipología del visitante (¿Con quién viaja? y Rango de Edad)
        const compBtn = document.querySelector("#group-composicion-viaje button[data-selected='true']");
        const composicionGrupo = compBtn ? compBtn.getAttribute("data-composicion") : "GRUPO_FAMILIAR";

        const edadBtn = document.querySelector("#group-rango-edad button[data-selected='true']");
        const rangoEdad = edadBtn ? edadBtn.getAttribute("data-edad") : "30_49";

        // Operativo / Temporada y Respuestas Específicas
        const temporadaCodigo = getTemporadaCodigoActual("step-temporada-mount");
        const respuestasTemporada = getRespuestasTemporada("step-temporada-mount");

        const grupoEl = document.getElementById("input-grupo-tamano");
        const diasEl = document.getElementById("input-dias-estadia");
        const grupoTamano = Math.min(50, Math.max(1, parseInt(grupoEl ? grupoEl.value : "1", 10) || 1));
        const diasEstadia = Math.min(90, Math.max(0, parseInt(diasEl ? diasEl.value : "0", 10) || 0));

        const tipoAlojamientoEl = document.getElementById("select-tipo-alojamiento");
        const tipoAlojamiento = diasEstadia === 0
            ? "SIN_PERNOCTA"
            : (tipoAlojamientoEl ? tipoAlojamientoEl.value : "POSADA");

        // 3. Lectura de Calificaciones de Servicios (Escala 1 a 5)
        const getRating = (group) => {
            const el = document.querySelector(`[data-rating-group='${group}']`);
            const val = parseInt(el ? el.getAttribute("data-current") : "5", 10);
            return Math.min(5, Math.max(1, val || 5));
        };

        const califVialidad = getRating("vialidad");
        const califSeguridad = getRating("seguridad");
        const califHospitalidad = getRating("hospitalidad");
        const califServicios = getRating("servicios");

        // 4. Validaciones obligatorias de integridad
        // NOTA: Si falta algún dato obligatorio, se detiene el envío SIN reiniciar
        // el cronómetro (startSurveyTimer no se invoca aquí) para que el tiempo total
        // refleje fielmente toda la sesión de llenado hasta su finalización real.
        if (esNacional && !estadoOrigen) {
            alert("Por favor seleccione su estado de residencia habitual.");
            return;
        }

        if (!esNacional && !rawPais.trim()) {
            alert("Por favor indique su país de residencia habitual.");
            return;
        }

        if (!municipioDestino) {
            alert("Por favor seleccione el municipio o capital de destino en el Táchira.");
            return;
        }

        // 5. Construcción del payload normalizado
        const surveyPayload = {
            id: typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
                    const r = (Math.random() * 16) | 0;
                    const v = c === "x" ? r : (r & 0x3) | 0x8;
                    return v.toString(16);
                }),
            punto_captura_id: activePoint && activePoint.id ? activePoint.id : PUNTOS_CONTROL_QR.PEAJE_TARIBA.id,
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
            composicion_grupo: composicionGrupo,
            rango_edad: rangoEdad,
            temporada_codigo: temporadaCodigo,
            respuestas_temporada: respuestasTemporada,
            calif_vialidad: califVialidad,
            calif_seguridad: califSeguridad,
            calif_hospitalidad: califHospitalidad,
            calif_servicios_publicos: califServicios,
            gasto_promedio_diario_usd: null
        };

        // 6. Envío a Supabase con respaldo automático en cola local offline
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

        // 7. Reiniciar cronómetro (forceReset = true) ÚNICAMENTE tras finalizar y guardar con éxito
        startSurveyTimer(true);
        if (muniEl) {
            muniEl.value = "";
            muniEl.removeAttribute("data-valid-selection");
        }
        if (paisEl) {
            paisEl.value = "";
            paisEl.removeAttribute("data-valid-selection");
        }
        abrirModalRecompensa();

    } catch (err) {
        console.error("[SIMAT] Error procesando encuesta:", err);
        abrirModalRecompensa();
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
}
