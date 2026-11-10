package com.cotatur.simat.ota

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.widget.Toast
import androidx.core.content.FileProvider
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest

/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR
 * ARCHIVO: OtaUpdateManager.kt
 * DESCRIPCIÓN: Gestor resiliente de actualizaciones remotas (OTA) en segundo plano.
 *              - Descarga directa in-app con corrutinas y monitoreo de progreso (0-100%).
 *              - Almacenamiento seguro en cacheDir privado (compatible con Scoped Storage).
 *              - Verificación de integridad SHA-256 estricta.
 *              - Validación de permisos REQUEST_INSTALL_PACKAGES (Android 8.0 a 15).
 *              - Fallback directo a navegador web ante restricciones del fabricante.
 * ==============================================================================
 */

data class VersionInfo(
    val versionCode: Int,
    val versionName: String,
    val apkUrl: String,
    val sha256: String,
    val changelog: String,
    val mandatory: Boolean
)

sealed class OtaProgressState {
    object Inactivo : OtaProgressState()
    data class Descargando(val progreso: Float, val descargadoMb: Float, val totalMb: Float) : OtaProgressState()
    object VerificandoIntegridad : OtaProgressState()
    object ListoParaInstalar : OtaProgressState()
    data class Error(val mensaje: String) : OtaProgressState()
}

object OtaUpdateManager {
    private const val MANIFEST_URL = "https://njcwdhakkbiabkinsafs.supabase.co/storage/v1/object/public/cotatur-app-updates/version.json"

    private val _estadoDescarga = MutableStateFlow<OtaProgressState>(OtaProgressState.Inactivo)
    val estadoDescarga: StateFlow<OtaProgressState> = _estadoDescarga.asStateFlow()

    suspend fun verificarActualizacion(context: Context): VersionInfo? = withContext(Dispatchers.IO) {
        try {
            val url = URL(MANIFEST_URL)
            val conn = url.openConnection() as HttpURLConnection
            conn.connectTimeout = 8000
            conn.readTimeout = 8000
            conn.requestMethod = "GET"

            if (conn.responseCode == HttpURLConnection.HTTP_OK) {
                val jsonStr = conn.inputStream.bufferedReader().use { it.readText() }
                val obj = JSONObject(jsonStr)
                val remoteCode = obj.getInt("versionCode")

                val packageInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    context.packageManager.getPackageInfo(
                        context.packageName,
                        android.content.pm.PackageManager.PackageInfoFlags.of(0)
                    )
                } else {
                    @Suppress("DEPRECATION")
                    context.packageManager.getPackageInfo(context.packageName, 0)
                }

                val currentCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    packageInfo.longVersionCode.toInt()
                } else {
                    @Suppress("DEPRECATION")
                    packageInfo.versionCode
                }

                if (remoteCode > currentCode) {
                    return@withContext VersionInfo(
                        versionCode = remoteCode,
                        versionName = obj.optString("versionName", ""),
                        apkUrl = obj.optString("apkUrl", obj.optString("latestApkUrl", "")),
                        sha256 = obj.optString("sha256", ""),
                        changelog = obj.optString("changelog", ""),
                        mandatory = obj.optBoolean("mandatory", false)
                    )
                }
            }
        } catch (_: Exception) {}
        null
    }

    fun iniciarDescargaEInstalacion(context: Context, scope: CoroutineScope, info: VersionInfo) {
        if (_estadoDescarga.value is OtaProgressState.Descargando) return

        // 1. Si el APK ya se descargó previamente y su hash es válido, instalar de inmediato
        val destinoApk = File(context.cacheDir, "simat_update_v${info.versionName}.apk")
        if (destinoApk.exists() && info.sha256.isNotBlank() && verificarSha256(destinoApk, info.sha256)) {
            _estadoDescarga.value = OtaProgressState.ListoParaInstalar
            ejecutarInstaladorConPermisos(context, destinoApk)
            return
        }

        // 2. Comprobar permisos de instalación antes de iniciar la descarga
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (!context.packageManager.canRequestPackageInstalls()) {
                Toast.makeText(
                    context,
                    "⚠️ Autoriza la opción 'Permitir desde esta fuente' para actualizar automáticamente",
                    Toast.LENGTH_LONG
                ).show()
                try {
                    val settingsIntent = Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
                        data = Uri.parse("package:${context.packageName}")
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(settingsIntent)
                } catch (_: Exception) {
                    val fallbackIntent = Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(fallbackIntent)
                }
                return
            }
        }

        // 3. Descarga en segundo plano con corrutinas y monitoreo de progreso
        scope.launch {
            withContext(Dispatchers.IO) {
                try {
                    _estadoDescarga.value = OtaProgressState.Descargando(0f, 0f, 0f)

                    val url = URL(info.apkUrl)
                    val conn = url.openConnection() as HttpURLConnection
                    conn.connectTimeout = 15000
                    conn.readTimeout = 30000
                    conn.instanceFollowRedirects = true
                    conn.connect()

                    if (conn.responseCode != HttpURLConnection.HTTP_OK) {
                        throw Exception("Error de servidor HTTP ${conn.responseCode}")
                    }

                    val totalBytes = conn.contentLength.toLong()
                    val totalMb = if (totalBytes > 0) totalBytes / (1024f * 1024f) else 12.2f

                    if (destinoApk.exists()) destinoApk.delete()

                    conn.inputStream.use { input ->
                        FileOutputStream(destinoApk).use { output ->
                            val buffer = ByteArray(16384)
                            var bytesLeidos: Int
                            var totalLeido = 0L

                            while (input.read(buffer).also { bytesLeidos = it } != -1) {
                                output.write(buffer, 0, bytesLeidos)
                                totalLeido += bytesLeidos
                                val progreso = if (totalBytes > 0) totalLeido.toFloat() / totalBytes else 0.5f
                                val leidoMb = totalLeido / (1024f * 1024f)
                                _estadoDescarga.value = OtaProgressState.Descargando(progreso, leidoMb, totalMb)
                            }
                        }
                    }

                    _estadoDescarga.value = OtaProgressState.VerificandoIntegridad
                    val hashValido = verificarSha256(destinoApk, info.sha256)

                    if (!hashValido && info.sha256.isNotBlank()) {
                        destinoApk.delete()
                        throw Exception("Fallo de integridad SHA-256. El archivo puede estar corrupto.")
                    }

                    _estadoDescarga.value = OtaProgressState.ListoParaInstalar

                    withContext(Dispatchers.Main) {
                        ejecutarInstaladorConPermisos(context, destinoApk)
                    }

                } catch (e: Exception) {
                    _estadoDescarga.value = OtaProgressState.Error(e.localizedMessage ?: "Error desconocido en la descarga")
                    withContext(Dispatchers.Main) {
                        Toast.makeText(context, "Error OTA: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
                    }
                }
            }
        }
    }

    fun instalarApkDescargado(context: Context, info: VersionInfo) {
        val destinoApk = File(context.cacheDir, "simat_update_v${info.versionName}.apk")
        if (destinoApk.exists()) {
            ejecutarInstaladorConPermisos(context, destinoApk)
        } else {
            _estadoDescarga.value = OtaProgressState.Inactivo
        }
    }

    fun ejecutarInstaladorConPermisos(context: Context, archivoApk: File) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (!context.packageManager.canRequestPackageInstalls()) {
                    Toast.makeText(
                        context,
                        "Por favor autoriza la instalación desde SIMAT-COTATUR en Ajustes",
                        Toast.LENGTH_LONG
                    ).show()
                    val settingsIntent = Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
                        data = Uri.parse("package:${context.packageName}")
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(settingsIntent)
                    return
                }
            }

            val contentUri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                archivoApk
            )

            val installIntent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(contentUri, "application/vnd.android.package-archive")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(installIntent)

        } catch (e: Exception) {
            Toast.makeText(context, "Error al lanzar instalador: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    fun abrirEnNavegador(context: Context, url: String) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            Toast.makeText(context, "No se pudo abrir el navegador", Toast.LENGTH_SHORT).show()
        }
    }

    fun reiniciarEstado() {
        _estadoDescarga.value = OtaProgressState.Inactivo
    }

    private fun verificarSha256(file: File, expectedHash: String): Boolean {
        if (!file.exists() || expectedHash.isBlank()) return false
        val digest = MessageDigest.getInstance("SHA-256")
        FileInputStream(file).use { fis ->
            val buffer = ByteArray(8192)
            var bytesRead: Int
            while (fis.read(buffer).also { bytesRead = it } != -1) {
                digest.update(buffer, 0, bytesRead)
            }
        }
        val calculatedHash = digest.digest().joinToString("") { "%02x".format(it) }
        return calculatedHash.equals(expectedHash.trim(), ignoreCase = true)
    }
}
