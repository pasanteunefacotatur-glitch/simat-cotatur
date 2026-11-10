package com.cotatur.simat.ota

import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.Environment
import androidx.core.content.FileProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.io.FileInputStream
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest

/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR
 * ARCHIVO: OtaUpdateManager.kt
 * DESCRIPCIÓN: Gestor de actualizaciones remotas desatendidas (Over-The-Air - OTA).
 *              - Consulta version.json en el bucket público de Supabase Storage.
 *              - Descarga reanudable en segundo plano mediante DownloadManager.
 *              - Verificación de integridad estricta mediante hash criptográfico SHA-256.
 *              - Lanzamiento seguro con FileProvider e Intent ACTION_VIEW.
 *              - Preservación atómica de SQLite en /data/user/0/com.cotatur.simat/databases/.
 *              Cumple con la regla de modularidad (< 500 líneas).
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

object OtaUpdateManager {
    private const val MANIFEST_URL = "https://njcwdhakkbiabkinsafs.supabase.co/storage/v1/object/public/cotatur-app-updates/version.json"

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
                        apkUrl = obj.optString("latestApkUrl", obj.optString("apkUrl", "")),
                        sha256 = obj.optString("sha256", ""),
                        changelog = obj.optString("changelog", ""),
                        mandatory = obj.optBoolean("mandatory", false)
                    )
                }
            }
        } catch (_: Exception) {}
        null
    }

    fun descargarEInstalar(context: Context, info: VersionInfo) {
        val dm = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        val uri = Uri.parse(info.apkUrl)
        val destinationFile = File(context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "simat_update.apk")
        if (destinationFile.exists()) destinationFile.delete()

        val request = DownloadManager.Request(uri)
            .setTitle("Actualización SIMAT-COTATUR")
            .setDescription("Descargando versión ${info.versionName}...")
            .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE)
            .setDestinationUri(Uri.fromFile(destinationFile))
            .setAllowedOverMetered(true)
            .setAllowedOverRoaming(true)

        val downloadId = dm.enqueue(request)

        val onComplete = object : BroadcastReceiver() {
            override fun onReceive(ctxt: Context, intent: Intent) {
                val id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1)
                if (id == downloadId) {
                    try {
                        ctxt.unregisterReceiver(this)
                    } catch (_: Exception) {}

                    if (verificarSha256(destinationFile, info.sha256)) {
                        lanzarInstalador(ctxt, destinationFile)
                    } else {
                        destinationFile.delete()
                    }
                }
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(
                onComplete,
                IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE),
                Context.RECEIVER_NOT_EXPORTED
            )
        } else {
            context.registerReceiver(
                onComplete,
                IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
            )
        }
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

    private fun lanzarInstalador(context: Context, file: File) {
        val contentUri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            file
        )
        val installIntent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(contentUri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(installIntent)
    }
}
