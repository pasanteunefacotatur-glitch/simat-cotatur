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
 * FUNCIÓN 1 (EJECUTAR UNA SOLA VEZ):
 * Crea la pestaña _BD_CRUDA, instala el reloj automático cada 12 horas
 * y ejecuta la primera sincronización de prueba con Supabase.
 */
function activarSistemaCotatur() {
  // 1. Verificar que la propiedad SUPABASE_SECRET_KEY esté registrada
  var secretKey = PropertiesService.getScriptProperties().getProperty("SUPABASE_SECRET_KEY");
  if (!secretKey) {
    throw new Error(
      "Falta agregar la propiedad SUPABASE_SECRET_KEY en Configuración del proyecto (icono de engranaje) -> Propiedades de secuencia de comandos."
    );
  }

  // 2. Preparar la pestaña _BD_CRUDA en el Google Sheet
  var ss = SpreadsheetApp.openById(SYNC_CONFIG.SPREADSHEET_ID);
  obtenerHojaCruda(ss);

  // 3. Limpiar disparadores anteriores para no duplicarlos
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }

  // 4. Crear el disparador automático cada 12 horas (Keep-Alive + Sincronización)
  ScriptApp.newTrigger("ejecutarSincronizacionIncremental")
    .timeBased()
    .everyHours(12)
    .create();

  // 5. Ejecutar primera sincronización inmediata
  ejecutarSincronizacionIncremental();
  Logger.log("[SIMAT-COTATUR] Sistema activado, hoja creada y reloj de 12h programado con éxito.");
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
      "Composición Grupo", "Rango Edad", "Temporada Código", "Respuestas Temporada",
      "Calif. Vialidad", "Calif. Seguridad", "Calif. Hospitalidad", "Calif. Servicios",
      "GPS Lat", "GPS Lng", "GPS Simulado", "Fecha Replicación"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#0f172a")
      .setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * FUNCIÓN 2 (AUTOMÁTICA CADA 12 HORAS):
 * Consulta encuestas nuevas en Supabase y las vuelca en Google Sheets.
 */
function ejecutarSincronizacionIncremental() {
  var secretKey = PropertiesService.getScriptProperties().getProperty("SUPABASE_SECRET_KEY");
  if (!secretKey) {
    Logger.log("[SIMAT] Falta configurar SUPABASE_SECRET_KEY en Propiedades del Script.");
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
      sanitizarCelda(r.composicion_grupo || "GRUPO_FAMILIAR"),
      sanitizarCelda(r.rango_edad || "30_49"),
      sanitizarCelda(r.temporada_codigo || "REGULAR"),
      sanitizarCelda(typeof r.respuestas_temporada === "object" ? JSON.stringify(r.respuestas_temporada) : (r.respuestas_temporada || "")),
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

  Logger.log("[SIMAT] Se replicaron exitosamente " + filasNuevas.length + " encuestas hacia Google Sheets.");

  // 4. Auto-Chaining aislado: Si el lote llegó al límite (500), programar ciclo temporal en 2 minutos
  if (registros.length === SYNC_CONFIG.BATCH_LIMIT) {
    purgarTriggersAutoChaining();
    ScriptApp.newTrigger("ejecutarCicloAutoChaining")
      .timeBased()
      .after(2 * 60 * 1000)
      .create();
  }
}

/**
 * Handler de auto-encadenamiento temporal para lotes masivos.
 * Se aísla del disparador horario maestro de 12 horas.
 */
function ejecutarCicloAutoChaining() {
  purgarTriggersAutoChaining();
  ejecutarSincronizacionIncremental();
}

/**
 * Purga únicamente los disparadores temporales de auto-encadenamiento,
 * protegiendo el disparador recurrente maestro de 12 horas.
 */
function purgarTriggersAutoChaining() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    var t = triggers[i];
    if (t.getHandlerFunction() === "ejecutarCicloAutoChaining") {
      ScriptApp.deleteTrigger(t);
    }
  }
}
