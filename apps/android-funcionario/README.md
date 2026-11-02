# Aplicativo Móvil Operativo (`apps/android-funcionario`)

Directorio base para el proyecto Android (`.APK`) de encuestadores de campo (Fase 2):
- Operación 100% offline sobre SQLite/Room.
- Modo Ráfaga (*Guardar y Siguiente*) y Bandeja de Salida Visual (*Outbox Badge*).
- Medición de tiempo con reloj monotónico (`SystemClock.elapsedRealtime()`) y verificación de reinicios (`BOOT_COUNT`).
- Caché GPS de bajo consumo (ventana de 15 minutos / 150 m) y detección silenciosa de ubicaciones simuladas (`isFromMockProvider`).
- Sincronización en segundo plano mediante `WorkManager` hacia el RPC `sincronizar_lote_apk` y actualización OTA desde el bucket `cotatur-app-updates`.
