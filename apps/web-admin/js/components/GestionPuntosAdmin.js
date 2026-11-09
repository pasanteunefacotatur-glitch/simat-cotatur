/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-admin/js/components/GestionPuntosAdmin.js
 * DESCRIPCIÓN: Módulo interactivo de Puntos de Control y Equipos de Campo:
 *              1. Creación visual de puntos mediante mapa (sin puntos rápidos).
 *              2. Autodetección de municipio y validación del Estado Táchira.
 *              3. Asignación de personal en 2 columnas (Asignados vs Sin Asignar)
 *                 directamente al crear el punto y en su ficha detallada.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

import { initMapPicker } from "./MapPicker.js";
import { getModalDetallePuntoHtml, initModalDetallePuntoController } from "./ModalDetallePunto.js";
import {
    renderSelectorPersonalDobleColumna,
    obtenerMapaAsignacionesMultiples,
    guardarAsignacionesPuntoEnServidor
} from "./SelectorPersonalDobleColumna.js";

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function renderGestionPuntosAdmin(containerId, supabaseConfig, getAdminPinCallback, onPuntosUpdatedCallback) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const obtenerPin = () => (typeof getAdminPinCallback === "function" ? getAdminPinCallback() : "") || "";

    container.innerHTML = `
        <div class="space-y-6">
            
            <!-- Barra superior: Título y Botón para desplegar creación interactiva -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <span>📍</span>
                        <span>Puntos de Control Turístico y Equipos Asignados</span>
                    </h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400">
                        Seleccione un punto de control para consultar sus detalles y gestionar las asignaciones del personal de campo.
                    </p>
                </div>
                <button type="button" id="btn-toggle-nuevo-punto"
                    class="px-4 py-2 bg-[#198754] hover:bg-[#157347] text-white font-bold text-xs rounded-xl shadow transition-all flex items-center space-x-1.5 active:scale-95 tap-target-btn">
                    <span>➕</span>
                    <span id="label-toggle-nuevo-punto">Registrar Punto de Control</span>
                </button>
            </div>

            <!-- Panel de Creación con Mapa Interactivo y Asignación de Personal (Oculto por defecto) -->
            <div id="seccion-crear-punto-mapa" class="hidden bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-[#198754]/40 shadow-lg space-y-5">
                <div class="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
                    <div>
                        <h4 class="text-sm font-extrabold text-slate-900 dark:text-white">
                            📍 Registro de Punto de Control Turístico
                        </h4>
                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            Ubique el marcador en el mapa dentro del Estado Táchira para detectar el municipio y asigne los encuestadores correspondientes.
                        </p>
                    </div>
                    <button type="button" id="btn-cancelar-crear-punto" class="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold">
                        ✕ Cancelar
                    </button>
                </div>

                <!-- Formulario de Metadatos -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Nombre del Punto Oficial <span class="text-red-500">*</span>
                        </label>
                        <input type="text" id="nuevo-punto-nombre" placeholder="Ej: Peaje Vega de Táriba"
                            class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-[#198754] focus:border-[#198754]" />
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Tipo de Punto <span class="text-red-500">*</span>
                        </label>
                        <select id="nuevo-punto-tipo" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none">
                            <option value="PEAJE">Peaje Vial</option>
                            <option value="TERMINAL">Terminal Terrestre o Aeropuerto</option>
                            <option value="FRONTERA">Paso Fronterizo o Puente Internacional</option>
                            <option value="ATRACCION">Sitio o Atractivo Turístico</option>
                            <option value="EVENTO">Feria o Evento Especial</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Municipio del Estado Táchira <span class="text-red-500">*</span>
                        </label>
                        <input type="text" id="nuevo-punto-municipio" readonly placeholder="Mueve el pin en el mapa..."
                            class="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs font-bold text-slate-900 dark:text-white outline-none" />
                    </div>
                </div>

                <!-- Contenedor del Mapa Interactivo (Sin Puntos Rápidos) -->
                <div class="space-y-2">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <span class="font-bold text-slate-700 dark:text-slate-300">
                            1. Ubicación geográfica en el mapa del Estado Táchira:
                        </span>
                        <div id="map-coords-status" class="flex items-center text-[11px] text-emerald-600 dark:text-emerald-400">
                            <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
                            <span>Verificando territorio tachirense...</span>
                        </div>
                    </div>
                    <div id="leaflet-picker-map" class="w-full h-72 rounded-xl border-2 border-slate-300 dark:border-slate-700 overflow-hidden shadow-inner z-0"></div>
                </div>

                <!-- Selector de Personal en 2 Columnas al Crear Punto -->
                <div class="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div>
                        <span class="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                            2. Asignación de personal encuestador a este punto:
                        </span>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400">
                            Los funcionarios pueden tener varios puntos de encuesta activos simultáneamente.
                        </p>
                    </div>
                    <div id="crear-punto-selector-personal-mount"></div>
                </div>

                <!-- Botón de Guardado -->
                <div class="pt-2 flex justify-end gap-2">
                    <button type="button" id="btn-guardar-punto-mapa"
                        class="px-5 py-2.5 bg-[#198754] hover:bg-[#157347] text-white font-bold rounded-xl shadow transition-all text-xs flex items-center space-x-1.5 active:scale-95 tap-target-btn">
                        <span>💾</span>
                        <span>Guardar Registro</span>
                    </button>
                </div>
            </div>

            <!-- Tabla de Puntos con Acción de Ver Detalle y Funcionarios -->
            <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Puntos de Control Operativos
                    </span>
                    <button type="button" id="btn-recargar-puntos" class="text-xs text-[#198754] hover:text-[#157347] dark:text-emerald-400 font-bold flex items-center gap-1">
                        <span>🔄</span>
                        <span>Actualizar</span>
                    </button>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                        <thead class="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th class="p-3">Código</th>
                                <th class="p-3">Nombre del Punto</th>
                                <th class="p-3">Tipo</th>
                                <th class="p-3">Municipio</th>
                                <th class="p-3 text-center">Estado</th>
                                <th class="p-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="tabla-puntos-body" class="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                            <tr>
                                <td colspan="6" class="p-6 text-center text-slate-400">Cargando puntos...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            ${getModalDetallePuntoHtml()}

        </div>
    `;

    let mapController = null;
    let currentMapState = { lat: 7.7669, lng: -72.2250, municipio: "San Cristóbal", esValidoTachira: true, motivoInvalido: "" };
    let selectorCrearController = null;
    let cachedPuntosList = [];

    const seccionCrear = document.getElementById("seccion-crear-punto-mapa");
    const btnToggle = document.getElementById("btn-toggle-nuevo-punto");
    const btnCancelar = document.getElementById("btn-cancelar-crear-punto");
    const btnGuardar = document.getElementById("btn-guardar-punto-mapa");
    const btnRecargar = document.getElementById("btn-recargar-puntos");
    const tablaBody = document.getElementById("tabla-puntos-body");

    const { abrirDetallePunto } = initModalDetallePuntoController(
        supabaseConfig,
        getAdminPinCallback,
        () => cachedPuntosList,
        () => cargarPuntos()
    );

    async function inicializarSelectorPersonalCreacion() {
        try {
            const cred = getAdminPinCallback();
            const [resFunc, mapaMulti] = await Promise.all([
                fetch(`${supabaseConfig.SUPABASE_URL}/rest/v1/rpc/admin_gestionar_funcionarios_v2`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "apikey": supabaseConfig.SUPABASE_PUBLISHABLE_KEY,
                        "Authorization": `Bearer ${supabaseConfig.SUPABASE_PUBLISHABLE_KEY}`
                    },
                    body: JSON.stringify({ p_credencial: cred, p_accion: "LISTAR", p_datos: {} })
                }),
                obtenerMapaAsignacionesMultiples(supabaseConfig)
            ]);

            const todosLosFuncionarios = resFunc.ok ? await resFunc.json() : [];
            selectorCrearController = renderSelectorPersonalDobleColumna({
                containerId: "crear-punto-selector-personal-mount",
                todosLosFuncionarios: Array.isArray(todosLosFuncionarios) ? todosLosFuncionarios : [],
                asignadosInicialesIds: [],
                mapaMulti,
                todosLosPuntos: cachedPuntosList
            });
        } catch (_) {}
    }

    // Desplegar creación interactiva
    btnToggle.addEventListener("click", () => {
        const isHidden = seccionCrear.classList.contains("hidden");
        if (isHidden) {
            seccionCrear.classList.remove("hidden");
            document.getElementById("label-toggle-nuevo-punto").textContent = "Ocultar Formulario";
            if (!mapController) {
                mapController = initMapPicker("leaflet-picker-map", (state) => {
                    currentMapState = state;
                });
            }
            inicializarSelectorPersonalCreacion();
        } else {
            seccionCrear.classList.add("hidden");
            document.getElementById("label-toggle-nuevo-punto").textContent = "Nuevo Punto con Mapa";
        }
    });

    btnCancelar.addEventListener("click", () => {
        seccionCrear.classList.add("hidden");
        document.getElementById("label-toggle-nuevo-punto").textContent = "Nuevo Punto con Mapa";
    });

    // Cargar Puntos desde Supabase
    async function cargarPuntos() {
        tablaBody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400">Consultando puntos...</td></tr>`;
        try {
            const res = await fetch(`${supabaseConfig.SUPABASE_URL}/rest/v1/rpc/admin_gestionar_punto`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": supabaseConfig.SUPABASE_PUBLISHABLE_KEY,
                    "Authorization": `Bearer ${supabaseConfig.SUPABASE_PUBLISHABLE_KEY}`
                },
                body: JSON.stringify({ p_pin: obtenerPin(), p_accion: "LISTAR", p_datos: {} })
            });

            if (!res.ok) throw new Error("Error al consultar puntos.");
            const puntos = await res.json();
            cachedPuntosList = Array.isArray(puntos) ? puntos : [];

            if (cachedPuntosList.length === 0) {
                tablaBody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400">No hay puntos registrados.</td></tr>`;
                return;
            }

            tablaBody.innerHTML = cachedPuntosList.map(p => `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer row-punto-click" data-id="${escapeHtml(p.id)}">
                    <td class="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">${escapeHtml(p.codigo)}</td>
                    <td class="p-3">
                        <div class="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 hover:text-amber-500 transition-colors">
                            <span>📍 ${escapeHtml(p.nombre)}</span>
                            <span class="text-[10px] text-amber-500 font-semibold">(Gestionar equipo ↗)</span>
                        </div>
                    </td>
                    <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800">${escapeHtml(p.tipo)}</span></td>
                    <td class="p-3">${escapeHtml(p.municipio)}</td>
                    <td class="p-3 text-center">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${p.activo ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'}">
                            ${p.activo ? '🟢 Activo' : '🔴 Inactivo'}
                        </span>
                    </td>
                    <td class="p-3 text-right space-x-2">
                        <button type="button" data-id="${escapeHtml(p.id)}" class="btn-abrir-ficha text-xs font-bold text-amber-600 hover:underline">
                            Equipo / Ficha
                        </button>
                        <button type="button" data-id="${escapeHtml(p.id)}" class="btn-toggle-punto text-xs font-bold ${p.activo ? 'text-red-600 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-700'}">
                            ${p.activo ? 'Desactivar' : 'Reactivar'}
                        </button>
                    </td>
                </tr>
            `).join("");

            if (typeof onPuntosUpdatedCallback === "function") {
                onPuntosUpdatedCallback(cachedPuntosList);
            }

            document.querySelectorAll(".row-punto-click td:nth-child(2)").forEach(td => {
                td.addEventListener("click", (e) => {
                    const id = e.currentTarget.closest("tr").getAttribute("data-id");
                    abrirDetallePunto(id);
                });
            });

            document.querySelectorAll(".btn-abrir-ficha").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const id = e.currentTarget.getAttribute("data-id");
                    abrirDetallePunto(id);
                });
            });

            document.querySelectorAll(".btn-toggle-punto").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    const id = e.currentTarget.getAttribute("data-id");
                    await fetch(`${supabaseConfig.SUPABASE_URL}/rest/v1/rpc/admin_gestionar_punto`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "apikey": supabaseConfig.SUPABASE_PUBLISHABLE_KEY,
                            "Authorization": `Bearer ${supabaseConfig.SUPABASE_PUBLISHABLE_KEY}`
                        },
                        body: JSON.stringify({ p_pin: obtenerPin(), p_accion: "TOGGLE_ACTIVO", p_datos: { id } })
                    });
                    cargarPuntos();
                });
            });

        } catch (err) {
            tablaBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-500">Error: ${escapeHtml(err.message)}</td></tr>`;
        }
    }

    // Guardar nuevo punto validando que esté dentro del Estado Táchira y asignando personal
    btnGuardar.addEventListener("click", async () => {
        const nombre = document.getElementById("nuevo-punto-nombre").value.trim();
        const tipo = document.getElementById("nuevo-punto-tipo").value;
        const municipio = document.getElementById("nuevo-punto-municipio").value.trim();

        if (!currentMapState.esValidoTachira) {
            alert(`⚠️ Ubicación no permitida:\n${currentMapState.motivoInvalido || "El pin debe estar ubicado dentro de los límites del Estado Táchira."}`);
            return;
        }

        if (!nombre || !municipio) {
            alert("Por favor indique el nombre oficial del punto y verifique que el pin esté dentro del Estado Táchira.");
            return;
        }

        btnGuardar.disabled = true;
        btnGuardar.innerHTML = "Guardando punto y equipo...";

        try {
            const res = await fetch(`${supabaseConfig.SUPABASE_URL}/rest/v1/rpc/admin_gestionar_punto`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": supabaseConfig.SUPABASE_PUBLISHABLE_KEY,
                    "Authorization": `Bearer ${supabaseConfig.SUPABASE_PUBLISHABLE_KEY}`
                },
                body: JSON.stringify({
                    p_pin: obtenerPin(),
                    p_accion: "CREAR",
                    p_datos: {
                        nombre,
                        tipo,
                        municipio,
                        latitud: currentMapState.lat,
                        longitud: currentMapState.lng,
                        activo: true
                    }
                })
            });

            const resp = await res.json();
            if (!res.ok) throw new Error(resp.message || "Error al registrar punto");

            // Si se seleccionaron funcionarios en la columna izquierda, asignarlos al nuevo punto
            const asignadosIds = selectorCrearController ? selectorCrearController.getSelectedIds() : [];
            if (resp.id && asignadosIds.length > 0) {
                const cred = getAdminPinCallback();
                await guardarAsignacionesPuntoEnServidor(supabaseConfig, cred, resp.id, asignadosIds);
            }

            alert(`¡Punto "${nombre}" (${municipio}) registrado con éxito con ${asignadosIds.length} funcionario(s) asignado(s)!`);
            document.getElementById("nuevo-punto-nombre").value = "";
            seccionCrear.classList.add("hidden");
            document.getElementById("label-toggle-nuevo-punto").textContent = "Nuevo Punto con Mapa";
            cargarPuntos();
        } catch (e) {
            alert("Error: " + e.message);
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = `<span>💾</span><span>Guardar Punto y Asignar Personal</span>`;
        }
    });

    btnRecargar.addEventListener("click", cargarPuntos);
    cargarPuntos();
}
