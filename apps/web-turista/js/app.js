/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-turista/js/app.js
 * DESCRIPCIÓN: Controlador principal de la encuesta pública para turistas y campo.
 *              Coordina montaje de módulos, resolución de punto por URL (?p=),
 *              verificación pasiva por GPS del punto de encuesta correcto,
 *              vinculación estricta del asueto con el Calendario Oficial (0, 1 o N),
 *              validación DOM, sanitización anti-XSS/CSV y cola offline resiliente.
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
import { renderHeader, updatePassiveGpsIndicator } from "./components/Header.js";
import { renderStepProcedencia } from "./components/StepProcedencia.js";
import { renderStepDestinoPerfil } from "./components/StepDestinoPerfil.js";
import {
    renderStepTemporadaDinamica,
    getRespuestasTemporada,
    getTemporadaCodigoActual
} from "./components/StepTemporadaDinamica.js";
import { renderStepCalificacion } from "./components/StepCalificacion.js";
import { renderModalRecompensa, abrirModalRecompensa } from "./components/ModalRecompensa.js";

// Estado activo del punto de control y lista de puntos disponibles
let activePoint = PUNTOS_CONTROL_QR.PEAJE_TARIBA;
let catalogPointsLive = Object.values(PUNTOS_CONTROL_QR);

/**
 * Calcula distancia geodésica en km entre dos coordenadas (Fórmula de Haversine).
 */
function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calcula los asuetos astronómicos y fijos locales del año actual como respaldo
 * inmediato mientras responde Supabase.
 */
function obtenerAsuetosActivosHoyLocal() {
    const hoyStr = new Date().toISOString().split("T")[0];
    const anio = new Date().getFullYear();

    // Cálculo de Pascua Meeus/Jones/Butcher
    const a = anio % 19;
    const b = Math.floor(anio / 100);
    const c = anio % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31);
    const dia = ((h + l - 7 * m + 114) % 31) + 1;
    const pascua = new Date(Date.UTC(anio, mes - 1, dia));
    const fmt = (dt) => dt.toISOString().split("T")[0];

    const carnavalesInicio = fmt(new Date(pascua.getTime() - 51 * 86400000));
    const carnavalesFin = fmt(new Date(pascua.getTime() - 47 * 86400000));
    const semanaSantaInicio = fmt(new Date(pascua.getTime() - 9 * 86400000));
    const semanaSantaFin = fmt(pascua);

    const calendarioLocal = [
        { codigo: `FISS_${anio}`, nombre: `Feria Internacional de San Sebastián ${anio}`, tipo_cuestionario: "FISS", fecha_inicio: `${anio}-01-10`, fecha_fin: `${anio}-02-01`, prioridad: 5, activo: true },
        { codigo: `CARNAVALES_${anio}`, nombre: `Carnavales Turísticos del Táchira ${anio}`, tipo_cuestionario: "CARNAVALES", fecha_inicio: carnavalesInicio, fecha_fin: carnavalesFin, prioridad: 5, activo: true },
        { codigo: `SEMANA_SANTA_${anio}`, nombre: `Semana Santa Mayor ${anio}`, tipo_cuestionario: "SEMANA_SANTA", fecha_inicio: semanaSantaInicio, fecha_fin: semanaSantaFin, prioridad: 5, activo: true },
        { codigo: `VACACIONES_${anio}`, nombre: `Vacaciones Escolares ${anio}`, tipo_cuestionario: "VACACIONES_ESCOLARES", fecha_inicio: `${anio}-07-15`, fecha_fin: `${anio}-09-15`, prioridad: 2, activo: true },
        { codigo: `SANTO_CRISTO_${anio}`, nombre: `Peregrinación del Santo Cristo de La Grita ${anio}`, tipo_cuestionario: "SANTO_CRISTO", fecha_inicio: `${anio}-08-01`, fecha_fin: `${anio}-08-10`, prioridad: 10, activo: true },
        { codigo: `CONSOLACION_${anio}`, nombre: `Virgen de la Consolación de Táriba ${anio}`, tipo_cuestionario: "CONSOLACION_TARIBA", fecha_inicio: `${anio}-08-12`, fecha_fin: `${anio}-08-18`, prioridad: 10, activo: true },
        { codigo: `FERIAS_MUN_${anio}`, nombre: `Ferias Tradicionales Municipales ${anio}`, tipo_cuestionario: "FERIAS_MUNICIPALES", fecha_inicio: `${anio}-09-01`, fecha_fin: `${anio}-09-30`, prioridad: 3, activo: true },
        { codigo: `FIN_DE_ANO_${anio}`, nombre: `Temporada Decembrina y Año Nuevo ${anio}`, tipo_cuestionario: "FIN_DE_ANO", fecha_inicio: `${anio}-12-01`, fecha_fin: `${anio + 1}-01-07`, prioridad: 5, activo: true }
    ];

    return calendarioLocal
        .filter(ev => ev.activo && hoyStr >= ev.fecha_inicio && hoyStr <= ev.fecha_fin)
        .sort((x, y) => y.prioridad - x.prioridad);
}

/**
 * Inicialización inmediata y resiliente de la encuesta turística.
 */
function initApp() {
    // 1. Inicializar tema (Claro / Oscuro LCD / AMOLED según dispositivo)
    initTheme();

    // 2. Iniciar métricas de sesión anónima y cronómetro
    getOrCreateVisitorId();
    startSurveyTimer();

    // 3. Detectar Punto de Control QR mediante parámetro URL (?p=CODIGO o alias numérico corto)
    const params = new URLSearchParams(window.location.search);
    const rawP = (params.get("p") || "PEAJE_TARIBA").trim().toUpperCase();
    
    // Mapeo de alias ultracortos para minimizar densidad y maximizar legibilidad del QR
    const ALIASES_CORTOS = {
        "1": "PEAJE_TARIBA",
        "TARIBA": "PEAJE_TARIBA",
        "2": "PEAJE_CAMPANA",
        "CAMPANA": "PEAJE_CAMPANA",
        "3": "TERMINAL_SC",
        "TERMINAL": "TERMINAL_SC",
        "4": "PUENTE_ATANASIO",
        "ATANASIO": "PUENTE_ATANASIO",
        "5": "PERIBECA_PUEBLO",
        "PERIBECA": "PERIBECA_PUEBLO",
        "6": "CHORRO_EL_INDIO",
        "CHORRO": "CHORRO_EL_INDIO"
    };

    const codigoPunto = ALIASES_CORTOS[rawP] || rawP;

    if (PUNTOS_CONTROL_QR[codigoPunto]) {
        activePoint = PUNTOS_CONTROL_QR[codigoPunto];
    }

    // 4. Renderizar componentes públicos de la encuesta INMEDIATAMENTE
    const asuetosHoyInicial = obtenerAsuetosActivosHoyLocal();
    renderHeader("header-mount", activePoint.nombre);
    renderStepProcedencia("step-1-mount");
    renderStepDestinoPerfil("step-2-mount");
    renderStepTemporadaDinamica("step-temporada-mount", asuetosHoyInicial);
    renderStepCalificacion("step-3-mount");
    renderModalRecompensa("modal-mount");

    // 5. Enlazar envío de encuesta
    const form = document.getElementById("form-encuesta-turistica");
    if (form) {
        form.addEventListener("submit", handleSubmitEncuesta);
    }

    // 6. Sincronización en vivo de puntos, calendario de asuetos y verificación pasiva GPS
    if (navigator.onLine) {
        syncLiveConfigAndGps(codigoPunto);
    } else {
        verificarUbicacionGpsPasiva();
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
 * Sincroniza puntos activos y eventos del calendario que coincidan con la fecha de hoy.
 */
async function syncLiveConfigAndGps(codigoPunto) {
    try {
        const hoyStr = new Date().toISOString().split("T")[0];

        const [resPuntos, resCal] = await Promise.all([
            fetch(
                `${CONFIG.SUPABASE_URL}/rest/v1/puntos_captura?select=id,codigo,nombre,latitud_referencia,longitud_referencia&activo=eq.true`,
                {
                    headers: {
                        "apikey": CONFIG.SUPABASE_PUBLISHABLE_KEY,
                        "Authorization": `Bearer ${CONFIG.SUPABASE_PUBLISHABLE_KEY}`
                    }
                }
            ),
            fetch(
                `${CONFIG.SUPABASE_URL}/rest/v1/calendario_asuetos_eventos?select=codigo,nombre,tipo_cuestionario,fecha_inicio,fecha_fin,prioridad,activo&activo=eq.true&fecha_inicio=lte.${hoyStr}&fecha_fin=gte.${hoyStr}&order=prioridad.desc`,
                {
                    headers: {
                        "apikey": CONFIG.SUPABASE_PUBLISHABLE_KEY,
                        "Authorization": `Bearer ${CONFIG.SUPABASE_PUBLISHABLE_KEY}`
                    }
                }
            )
        ]);

        // 1. Actualizar catálogo de puntos con coordenadas reales
        if (resPuntos.ok) {
            const rowsPuntos = await resPuntos.json();
            if (Array.isArray(rowsPuntos) && rowsPuntos.length > 0) {
                catalogPointsLive = rowsPuntos.map(r => ({
                    id: r.id,
                    codigo: r.codigo,
                    nombre: r.nombre,
                    lat: Number(r.latitud_referencia || 7.7669),
                    lng: Number(r.longitud_referencia || -72.2250)
                }));

                const match = catalogPointsLive.find(p => p.codigo === codigoPunto);
                if (match) {
                    activePoint = match;
                    const headerPointEl = document.getElementById("header-point-name");
                    if (headerPointEl) headerPointEl.textContent = activePoint.nombre;
                }
            }
        }

        // 2. Actualizar asuetos vigentes hoy desde el calendario oficial de Supabase
        if (resCal.ok) {
            const rowsCal = await resCal.json();
            const validosHoy = (Array.isArray(rowsCal) ? rowsCal : []).filter(
                ev => ev.codigo !== "SYS_ASIGNACIONES_MULTIPUNTO" && ev.tipo_cuestionario !== "SISTEMA_CONFIG"
            );
            renderStepTemporadaDinamica("step-temporada-mount", validosHoy);
        }
    } catch (_) {
        // Mantiene respaldo local si no hay red
    } finally {
        verificarUbicacionGpsPasiva();
    }
}

/**
 * Verifica de forma pasiva mediante GPS si el funcionario/usuario se encuentra
 * físicamente en el punto de encuesta seleccionado o cerca de otro punto activo.
 */
function verificarUbicacionGpsPasiva() {
    if (!("geolocation" in navigator)) return;

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const userLat = pos.coords.latitude;
            const userLng = pos.coords.longitude;

            if (!Array.isArray(catalogPointsLive) || catalogPointsLive.length === 0) return;

            let puntoMasCercano = null;
            let minDist = Infinity;

            for (const p of catalogPointsLive) {
                if (typeof p.lat === "number" && typeof p.lng === "number") {
                    const dist = calcularDistanciaKm(userLat, userLng, p.lat, p.lng);
                    if (dist < minDist) {
                        minDist = dist;
                        puntoMasCercano = p;
                    }
                }
            }

            // 1. Calcular distancia al punto que tiene actualmente cargado el formulario
            let distPuntoActual = Infinity;
            if (typeof activePoint.lat === "number" && typeof activePoint.lng === "number") {
                distPuntoActual = calcularDistanciaKm(userLat, userLng, activePoint.lat, activePoint.lng);
            }

            // Radio de tolerancia operativa (1.5 km): Si está dentro de 1.5 km del pin,
            // se confirma que está en el punto y NO se muestra ningún aviso (pantalla limpia).
            if (distPuntoActual <= 1.5) {
                updatePassiveGpsIndicator({ coincidePuntoActual: true });
                return;
            }

            // 2. Si está lejos del punto actual (> 2 km), buscar si se encuentra físicamente en otro punto registrado
            let otroPuntoCercano = null;
            let minDistOtro = Infinity;

            for (const p of catalogPointsLive) {
                if (p.id !== activePoint.id && p.codigo !== activePoint.codigo && typeof p.lat === "number" && typeof p.lng === "number") {
                    const dist = calcularDistanciaKm(userLat, userLng, p.lat, p.lng);
                    if (dist < minDistOtro) {
                        minDistOtro = dist;
                        otroPuntoCercano = p;
                    }
                }
            }

            // Solo mostrar aviso pasivo si está dentro del radio de acción (<= 1.5 km) de OTRO punto
            if (otroPuntoCercano && minDistOtro <= 1.5) {
                updatePassiveGpsIndicator({
                    coincidePuntoActual: false,
                    puntoCercano: otroPuntoCercano,
                    distanciaKm: minDistOtro,
                    onSwitchPointCallback: (nuevoPunto) => {
                        activePoint = nuevoPunto;
                        const headerPointEl = document.getElementById("header-point-name");
                        if (headerPointEl) headerPointEl.textContent = activePoint.nombre;

                        if (window.history && window.history.replaceState && nuevoPunto.codigo) {
                            const newUrl = `${window.location.pathname}?p=${encodeURIComponent(nuevoPunto.codigo)}`;
                            window.history.replaceState({ path: newUrl }, "", newUrl);
                        }

                        // Al cambiar al nuevo punto, queda en el formulario correcto y se oculta el aviso
                        updatePassiveGpsIndicator({ coincidePuntoActual: true });
                    }
                });
            } else {
                updatePassiveGpsIndicator({ coincidePuntoActual: true });
            }
        },
        () => {
            // Silencioso: Es una ayuda pasiva, no bloquea el llenado si el GPS está apagado
        },
        { enableHighAccuracy: false, timeout: 7000, maximumAge: 60000 }
    );
}

// Inicialización universal segura
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
    const originalMarkup = submitBtn ? submitBtn.innerHTML : "";

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
        const municipioDestino = rawMunicipio.slice(0, 50);

        const motivoBtn = document.querySelector("#group-motivo-viaje button[data-selected='true']");
        const motivoViaje = motivoBtn ? motivoBtn.getAttribute("data-motivo") : "TURISMO_RECREACION";

        const compBtn = document.querySelector("#group-composicion-viaje button[data-selected='true']");
        const composicionGrupo = compBtn ? compBtn.getAttribute("data-composicion") : "GRUPO_FAMILIAR";

        const edadBtn = document.querySelector("#group-rango-edad button[data-selected='true']");
        const rangoEdad = edadBtn ? edadBtn.getAttribute("data-edad") : "30_49";

        // Operativo / Temporada vinculada estrictamente al calendario
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

        // 4. Validaciones obligatorias de integridad (SIN reiniciar el cronómetro si olvida procedencia o destino)
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
            if (originalMarkup) submitBtn.innerHTML = originalMarkup;
        }
    }
}
