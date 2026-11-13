import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("RuedaPrensaAdmin no inventa metricas demo falsas cuando no hay datos", () => {
    const src = read("apps/web-admin/js/components/RuedaPrensaAdmin.js");
    assert.equal(src.includes("12840"), false, "No debe mostrar 12840 visitantes falsos");
    assert.equal(src.includes("3210"), false, "No debe mostrar 3210 encuestas falsas");
    assert.equal(src.includes("getMockOrInitialData"), false, "No debe tener mock data estatica");
    assert.equal(src.includes("Norte de Santander y Bogotá"), false, "No debe mostrar ranking ficticio");
    assert.ok(src.includes("total_personas_estimadas ?? 0") || src.includes("total_personas_estimadas || 0"));
});

test("Web Admin expone descarga y copia de enlace de APK oficial", () => {
    const apkModulePath = path.join(root, "apps/web-admin/js/components/ApkDownloadCardAdmin.js");
    assert.equal(fs.existsSync(apkModulePath), true, "Debe existir ApkDownloadCardAdmin.js");
    const src = fs.readFileSync(apkModulePath, "utf8");
    assert.ok(src.includes("cotatur-app-updates/version.json"));
    assert.ok(src.includes("navigator.clipboard"));
    const adminHtml = read("admin.html");
    assert.ok(adminHtml.includes("apk-download") || adminHtml.includes("tab-apk-download-mount"));
});

test("CartelQRAdmin aisla controles con no-print para impresion limpia", () => {
    const src = read("apps/web-admin/js/components/CartelQRAdmin.js");
    assert.ok(src.includes("no-print"), "Los controles y la columna QR aislada deben llevar .no-print");
    const styles = read("apps/web-turista/css/styles.css");
    assert.ok(styles.includes("#cartel-hoja-carta"), "styles.css debe estilizar impresion de #cartel-hoja-carta");
});

test("Web Admin y Web Turista cumplen limite de modularidad (<500 lineas)", () => {
    const dirs = ["apps/web-admin/js", "apps/web-turista/js", "apps/web-turista/css"];
    for (const d of dirs) {
        const walk = (p) => {
            for (const entry of fs.readdirSync(p, { withFileTypes: true })) {
                const full = path.join(p, entry.name);
                if (entry.isDirectory()) walk(full);
                else if (/\.(js|css)$/.test(entry.name)) {
                    const lines = fs.readFileSync(full, "utf8").split("\n").length;
                    assert.ok(lines < 500, `${full} excede 500 lineas (${lines})`);
                }
            }
        };
        walk(path.join(root, d));
    }
});
