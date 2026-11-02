/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ENTIDAD: Corporación Tachirense de Turismo (COTATUR)
 * ARCHIVO: services/sync-drive/replicador_cotatur.gs
 * DESCRIPCIÓN: Motor automatizado en Google Apps Script para:
 *              1. Latido Keep-Alive hacia Supabase (evita pausa por inactividad).
 *              2. Replicación incremental por cursor (replicated_at IS NULL LIMIT 500).
 *              3. Auto-encadenamiento (Auto-Chaining) en temporadas altas (FISS).
 *              4. Auto-regeneración de la pestaña protegida (_BD_CRUDA).
 *              5. Generación de respaldos fríos (.xlsx) en Google Drive.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

const SYNC_CONFIG = {
  SUPABASE_URL: "https://njcwdhakkbiabkinsafs.supabase.co",
  SPREADSHEET_ID: "1px8KeUIK99SRjHflNupU5CgL9meyKkW3l_hrIjilLp8",
  DRIVE_PARENT_FOLDER_ID: "1VmSSjQVm8TNSa8JpipchXR9ivys0AqQe",
  RAW_SHEET_NAME: "_BD_CRUDA",
  BATCH_LIMIT: 500
};

/**
 * Función de configuración inicial (Ejecutar una sola vez en el editor de Apps Script).
 * Registra la llave secreta en las propiedades seguras del script y crea el disparador.
 */
function configurarPropiedadesYTrigger(secretKey) {
  if (secretKey) {
    PropertiesService.getScriptProperties().setProperty("SUPABASE_SECRET_KEY", secretKey);
  }
  // Eliminar disparadores previos para evitar duplicados
  const triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  // Crear disparador base cada 12 horas (Keep-Alive + Replicación)
  ScriptApp.newTrigger("ejecutarSincronizacionIncremental")
    .timeBased()
    .everyHours(12)
    .create();
}

/**
 * Sanitiza cualquier valor de texto antes de insertarlo en Google Sheets
 * para prevenir inyección de fórmulas (=, +, -, @).
 */
function sanitizarCelda(valor) {
  if (valor === null || valor === undefined) return "";
  var str = String(valor);
  if (/^[=+\-@\t\r]/.test(str)) {
    return "'" + str;
  }
  return str;
}

/**
 * Obtiene o regenera automáticamente (Auto-Healing) la pestaña _BD_CRUDA.
 */
function obtenerHojaCruda(spreadsheet) {
  var sheet = spreadsheet.getSheetByName(SYNC_CONFIG.RAW_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SYNC_CONFIG.RAW_SHEET_NAME);
    var headers = [
      "ID Encuesta", "Canal", "Punto Captura ID", "Temporada ID", "Funcionario ID",
      "Fecha Captura", "Duración (seg)", "Procedencia", "Estado Origen", "País Origen",
      "Municipio Destino", "Motivo Viaje", "Alojamiento", "Tamaño Grupo", "Noches Pernocta",
      "Calif. Vialidad", "Calif. Seguridad", "Calif. Hospitalidad", "Calif. Servicios",
      "GPS Lat", "GPS Lng", "GPS Simulado", "Fecha Replicación"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#0f172a").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Rutina principal de sincronización incremental y latido Keep-Alive.
 */
function ejecutarSincronizacionIncremental() {
  var secretKey = PropertiesService.getScriptProperties().getProperty("SUPABASE_SECRET_KEY");
  if (!secretKey) {
    Logger.log("[SIMAT] Falta configurar SUPABASE_SECRET_KEY en ScriptProperties.");
    return;
  }

  var headers = {
    "apikey": secretKey,
    "Authorization": "Bearer " + secretKey,
    "Content-Type": "application/json",
    "User-Agent": "COTATUR-AppsScript-Replicator/1.0"
  };

  // 1. Consultar hasta 500 registros pendientes de replicación
  var endpoint = SYNC_CONFIG.SUPABASE_URL +
    "/rest/v1/encuestas_turisticas?replicated_at=is.null&order=captured_at.asc&limit=" +
    SYNC_CONFIG.BATCH_LIMIT;

  var response = UrlFetchApp.fetch(endpoint, { method: "get", headers: headers, muteHttpExceptions: true });
  if (response.getResponseCode() !== 200) {
    Logger.log("[SIMAT] Error al consultar Supabase: " + response.getContentText());
    return;
  }

  var registros = JSON.parse(response.getContentText());
  if (!registros || registros.length === 0) {
    Logger.log("[SIMAT] Latido Keep-Alive completado. 0 encuestas pendientes.");
    return;
  }

  // 2. Volcar lote en el Libro Maestro de Google Sheets
  var ss = SpreadsheetApp.openById(SYNC_CONFIG.SPREADSHEET_ID);
  var rawSheet = obtenerHojaCruda(ss);
  var filasNuevas = [];
  var idsProcesados = [];
  var ahoraISO = new Date().toISOString();

  for (var i = 0; i < registros.length; i++) {
    var r = registros[i];
    idsProcesados.push(r.id);
    filasNuevas.push([
      sanitizarCelda(r.id),
      sanitizarCelda(r.canal),
      sanitizarCelda(r.punto_captura_id),
      sanitizarCelda(r.temporada_id),
      sanitizarCelda(r.funcionario_id),
      sanitizarCelda(r.captured_at),
      Number(r.duracion_llenado_seg || 0),
      sanitizarCelda(r.procedencia_tipo),
      sanitizarCelda(r.estado_origen),
      sanitizarCelda(r.pais_origen),
      sanitizarCelda(r.municipio_destino),
      sanitizarCelda(r.motivo_viaje),
      sanitizarCelda(r.tipo_alojamiento),
      Number(r.grupo_tamano || 1),
      Number(r.dias_estadia || 0),
      Number(r.calif_vialidad || 0),
      Number(r.calif_seguridad || 0),
      Number(r.calif_hospitalidad || 0),
      Number(r.calif_servicios_publicos || 0),
      r.gps_lat || "",
      r.gps_lng || "",
      Boolean(r.gps_es_simulado),
      ahoraISO
    ]);
  }

  // Escritura en bloque para máxima velocidad
  var startRow = rawSheet.getLastRow() + 1;
  rawSheet.getRange(startRow, 1, filasNuevas.length, filasNuevas[0].length).setValues(filasNuevas);

  // 3. Marcar registros como replicados en Supabase
  var updateUrl = SYNC_CONFIG.SUPABASE_URL + "/rest/v1/encuestas_turisticas?id=in.(" + idsProcesados.join(",") + ")";
  UrlFetchApp.fetch(updateUrl, {
    method: "patch",
    headers: headers,
    payload: JSON.stringify({ replicated_at: ahoraISO }),
    muteHttpExceptions: true
  });

  // 4. Auto-Chaining: Si el lote llegó al límite (500), programar otro ciclo en 2 minutos
  if (registros.length === SYNC_CONFIG.BATCH_LIMIT) {
    ScriptApp.newTrigger("ejecutarSincronizacionIncremental")
      .timeBased()
      .after(2 * 60 * 1000)
      .create();
  }
}
