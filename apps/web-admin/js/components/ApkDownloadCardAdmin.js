/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-admin/js/components/ApkDownloadCardAdmin.js
 * DESCRIPCIÓN: Tarjeta oficial para que el Supervisor descargue o copie el enlace
 *              directo de distribución del APK móvil Android de COTATUR desde
 *              Supabase Storage (cotatur-app-updates/version.json).
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

const OTA_MANIFEST_URL =
    "https://njcwdhakkbiabkinsafs.supabase.co/storage/v1/object/public/cotatur-app-updates/version.json";
const DEFAULT_APK_URL =
    "https://njcwdhakkbiabkinsafs.supabase.co/storage/v1/object/public/cotatur-app-updates/simat-cotatur-latest.apk";

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export async function renderApkDownloadCardAdmin(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let versionName = "0.8.0";
    let apkUrl = DEFAULT_APK_URL;
    let sha256 = "";
    let manifestOk = false;

    try {
        const res = await fetch(`${OTA_MANIFEST_URL}?t=${Date.now()}`, { cache: "no-store" });
        if (res.ok) {
            const manifest = await res.json();
            if (manifest && (manifest.apkUrl || manifest.latestApkUrl)) {
                versionName = String(manifest.versionName || versionName);
                apkUrl = String(manifest.apkUrl || manifest.latestApkUrl);
                sha256 = String(manifest.sha256 || "");
                manifestOk = true;
            }
        }
    } catch (_) {
        // Mantiene ruta oficial por defecto si no hay manifiesto remoto aún
    }

    const shortHash = sha256 ? `${sha256.slice(0, 16)}...` : "Pendiente de publicación OTA";

    container.innerHTML = `
        <div class="bg-gradient-to-r from-[#198754]/10 via-emerald-500/5 to-transparent dark:from-emerald-950/40 p-5 rounded-2xl border border-[#198754]/30 shadow-sm space-y-3 no-print">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="space-y-1 min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#198754]/15 text-[#146c43] dark:text-emerald-300 border border-[#198754]/30">
                            Aplicación Móvil Android (APK)
                        </span>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            v${escapeHtml(versionName)} ${manifestOk ? "• En línea" : "• Canal Oficial"}
                        </span>
                    </div>
                    <h3 class="text-sm font-black text-slate-900 dark:text-white">
                        Descarga Directa para Teléfonos de Encuestadores COTATUR
                    </h3>
                    <p class="text-xs text-slate-600 dark:text-slate-400">
                        Comparte o descarga el instalador oficial (<code class="font-mono">com.cotatur.simat</code>). SHA-256: <span class="font-mono font-semibold">${escapeHtml(shortHash)}</span>
                    </p>
                </div>

                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                    <a id="btn-download-official-apk" href="${escapeHtml(apkUrl)}" download="simat-cotatur-v${escapeHtml(versionName)}.apk"
                        target="_blank" rel="noopener noreferrer"
                        class="px-4 py-2.5 bg-[#198754] hover:bg-[#157347] text-white font-extrabold rounded-xl text-xs shadow flex items-center justify-center gap-1.5 transition-all tap-target-btn">
                        <span>📲</span>
                        <span>Descargar APK (v${escapeHtml(versionName)})</span>
                    </a>
                    <button type="button" id="btn-copy-official-apk-url"
                        class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs shadow border border-slate-700 flex items-center justify-center gap-1.5 transition-all tap-target-btn">
                        <span>📋</span>
                        <span id="label-copy-apk-url">Copiar Enlace APK</span>
                    </button>
                </div>
            </div>

            <div class="bg-white/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 flex items-center gap-2">
                <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">URL:</span>
                <input type="text" readonly id="input-official-apk-url" value="${escapeHtml(apkUrl)}"
                    class="w-full bg-transparent text-[11px] font-mono text-slate-800 dark:text-slate-200 outline-none select-all" />
            </div>
        </div>
    `;

    const btnCopy = container.querySelector("#btn-copy-official-apk-url");
    const labelCopy = container.querySelector("#label-copy-apk-url");
    const inputUrl = container.querySelector("#input-official-apk-url");
    if (btnCopy && labelCopy) {
        btnCopy.addEventListener("click", async () => {
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(apkUrl);
                } else if (inputUrl) {
                    inputUrl.select();
                    document.execCommand("copy");
                }
                labelCopy.textContent = "✅ ¡Enlace Copiado!";
                setTimeout(() => {
                    labelCopy.textContent = "Copiar Enlace APK";
                }, 2200);
            } catch (_) {
                if (inputUrl) inputUrl.select();
            }
        });
    }
}
