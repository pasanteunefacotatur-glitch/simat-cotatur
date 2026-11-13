import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel) {
    return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

test("SQL 05 y 11 no contienen PIN maestro ni reset masivo de contraseñas a cotatur2026", () => {
    const sql05 = read("database/05_autenticacion_funcionarios_completa.sql");
    assert.equal(/v_pin_maestro/i.test(sql05), false, "05 aún contiene v_pin_maestro");
    assert.equal(/cotatur2026/i.test(sql05), false, "05 aún contiene cotatur2026");

    const sql11Path = path.join(ROOT, "database/11_seguridad_auth_jwt_y_hardening.sql");
    assert.equal(fs.existsSync(sql11Path), true, "Falta database/11_seguridad_auth_jwt_y_hardening.sql");
    const sql11 = fs.readFileSync(sql11Path, "utf8");
    assert.equal(/CREATE TABLE IF NOT EXISTS public\.sesiones_activas/i.test(sql11), true);
    assert.equal(/CREATE TABLE IF NOT EXISTS public\.auditoria_seguridad/i.test(sql11), true);
    assert.equal(/CREATE TABLE IF NOT EXISTS public\.intentos_login/i.test(sql11), true);
    assert.equal(/auth\.uid\(\)/i.test(sql11), true, "11 debe validar auth.uid() en RPCs Google JWT");
    assert.equal(/REVOKE (ALL|SELECT) ON (TABLE )?public\.perfiles_funcionarios FROM anon/i.test(sql11), true);

    for (const rel of [
        "database/11_seguridad_auth_jwt_y_hardening.sql",
        "database/11b_seguridad_auth_google_jwt.sql",
        "database/12_seguridad_rpcs_protegidos.sql",
        "database/12b_seguridad_operacion_y_sincronizacion.sql",
        "database/13_fix_pgcrypto_search_path.sql"
    ]) {
        const sql = read(rel);
        assert.equal(/\bSET\s+search_path\s*=\s*public\s*(?:;|AS|\r?\n)/i.test(sql), false, `${rel} debe incluir extensions en search_path para pgcrypto`);
    }
});

test("Android AuthRepository, GoogleAuthHelper, SessionManager y Manifest eliminan backdoors y cifran sesión", () => {
    const authRepo = read("apps/android-funcionario/app/src/main/kotlin/com/cotatur/simat/ui/auth/AuthRepository.kt");
    assert.equal(/clave\s*==\s*"2026"|clave\s*==\s*cedula/.test(authRepo), false, "AuthRepository tiene backdoor offline");

    const googleHelper = read("apps/android-funcionario/app/src/main/kotlin/com/cotatur/simat/ui/auth/GoogleAuthHelper.kt");
    assert.equal(/DialogoCuentaGoogleManual/.test(googleHelper), false, "GoogleAuthHelper aún permite email manual");
    assert.equal(/verificarFallbackNominaGoogle/.test(googleHelper), false, "GoogleAuthHelper aún lista nómina como fallback");
    assert.equal(/CredentialManager|id_token|grant_type=id_token/.test(googleHelper), true, "GoogleAuthHelper debe validar id_token real");

    const sessionMgr = read("apps/android-funcionario/app/src/main/kotlin/com/cotatur/simat/data/local/SessionManager.kt");
    assert.equal(/PBKDF2WithHmacSHA256/.test(sessionMgr), true, "SessionManager debe usar PBKDF2 con salt");
    assert.equal(/AES\/GCM\/NoPadding/.test(sessionMgr), true, "SessionManager debe cifrar datos con AndroidKeyStore AES-GCM");

    const manifest = read("apps/android-funcionario/app/src/main/AndroidManifest.xml");
    assert.equal(/android:allowBackup="false"/.test(manifest), true, "AndroidManifest debe deshabilitar allowBackup");
});

test("Web Admin no guarda clave en sessionStorage, valida sesión en servidor y blinda correo Google", async () => {
    const adminHtml = read("admin.html");
    assert.match(adminHtml, /id="activar-email"[^>]*readonly/i, "#activar-email debe ser readonly");

    const adminApp = read("apps/web-admin/js/adminApp.js");
    assert.equal(/cotatur2026/.test(adminApp), false, "adminApp.js aún contiene fallback cotatur2026");
    assert.equal(/activeSession\.clave\s*=/.test(adminApp), false, "adminApp.js aún guarda clave en texto claro");
    assert.match(adminApp, /auth_validar_sesion/, "adminApp.js debe validar token en servidor al iniciar");

    const modalPrimer = read("apps/web-admin/js/components/ModalPrimerIngreso.js");
    assert.equal(/ejecutarFallbackGooglePrompt/.test(modalPrimer), false, "ModalPrimerIngreso aún usa prompt() manual");

    const { sanitizeAndBuildAuthHeaders, isSessionPayloadUsable } = await import(
        "../apps/web-admin/js/utils/sessionSecurity.js"
    );
    assert.equal(isSessionPayloadUsable({ funcionario: { id: "00000000-0000-0000-0000-000000000000" } }), false);
    assert.equal(isSessionPayloadUsable({ token: "abc", funcionario: { id: "1" } }), true);
    const headers = sanitizeAndBuildAuthHeaders("pk_test", "jwt_123");
    assert.equal(headers.Authorization, "Bearer jwt_123");
});

test("Todos los componentes web-admin usan p_token y escapeHtml (sin p_credencial/p_pin ni XSS en MiPerfilAdmin)", () => {
    const files = [
        "apps/web-admin/js/components/GestionPersonalAdmin.js",
        "apps/web-admin/js/components/GestionPuntosAdmin.js",
        "apps/web-admin/js/components/CalendarioAsuetosAdmin.js",
        "apps/web-admin/js/components/RuedaPrensaAdmin.js",
        "apps/web-admin/js/components/ModalDetallePunto.js",
        "apps/web-admin/js/components/SelectorPersonalDobleColumna.js",
        "apps/web-admin/js/components/ModalPrimerIngreso.js",
        "apps/web-admin/js/components/MiPerfilAdmin.js"
    ];
    for (const f of files) {
        const content = read(f);
        assert.equal(/\bp_credencial\b|\bp_pin\b/.test(content), false, `${f} aún envía p_credencial o p_pin`);
        assert.equal(/cotatur2026/.test(content), false, `${f} aún tiene fallback cotatur2026`);
    }
    const perfil = read("apps/web-admin/js/components/MiPerfilAdmin.js");
    assert.match(perfil, /escapeHtml/, "MiPerfilAdmin debe sanitizar interpolaciones HTML con escapeHtml");
});
