/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-admin/js/components/GestionPuntosAdmin.js
 * DESCRIPCIÓN: Módulo interactivo de administración de Puntos de Control Turístico.
 *              Permite crear nuevos puntos fijando su ubicación en el mapa
 *              de forma visual e interactiva sin tener que escribir coordenadas manuales.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

import { initMapPicker, PRESETS_TACHIRA } from "./MapPicker.js";

export function renderGestionPuntosAdmin(containerId, supabaseConfig, getAdminPinCallback, onPuntosUpdatedCallback) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="space-y-6">
            
            <!-- Barra superior: Título y Botón para desplegar creación interactiva -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <span>📍</span>
                        <span>Puntos de Control Turístico Registrados</span>
                    </h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400">
                        Peajes, terminales y sitios de afluencia donde se aplican encuestas SIMAT.
                    </p>
                </div>
                <button type="button" id="btn-toggle-nuevo-punto"
                    class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all flex items-center space-x-1.5 active:scale-95">
                    <span>➕</span>
                    <span id="label-toggle-nuevo-punto">Nuevo Punto con Mapa</span>
                </button>
            </div>

            <!-- Panel de Creación con Mapa Interactivo (Oculto por defecto) -->
            <div id="seccion-crear-punto-mapa" class="hidden bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-amber-500/40 shadow-lg space-y-4">
                <div class="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
                    <div>
                        <h4 class="text-sm font-extrabold text-slate-900 dark:text-white">
                            📍 Registro Interactivo de Nuevo Punto de Control
                        </h4>
                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            Arrastra el pin en el mapa o haz clic en los accesos rápidos para fijar la ubicación sin teclear números.
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
                        <input type="text" id="nuevo-punto-nombre" placeholder="Ej: Peaje La Restauradora"
                            class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500" />
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Tipo de Punto <span class="text-red-500">*</span>
                        </label>
                        <select id="nuevo-punto-tipo" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none">
                            <option value="PEAJE">PEAJE (Vial)</option>
                            <option value="TERMINAL">TERMINAL (Terrestre / Aéreo)</option>
                            <option value="FRONTERA">FRONTERA (Puente Internacional)</option>
                            <option value="ATRACCION">ATRACCIÓN / SITIO TURÍSTICO</option>
                            <option value="EVENTO">EVENTO ESPECIAL / FERIA</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Municipio del Táchira <span class="text-red-500">*</span>
                        </label>
                        <input type="text" id="nuevo-punto-municipio" placeholder="Ej: Cárdenas, San Cristóbal..."
                            class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500" />
                    </div>
                </div>

                <!-- Accesos Rápidos de Ubicación en el Táchira -->
                <div class="space-y-1.5">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Atajos rápidos (Haz clic para mover el mapa al lugar):
                    </span>
                    <div class="flex flex-wrap gap-1.5" id="presets-mapa-container">
                        ${PRESETS_TACHIRA.map((p, idx) => `
                            <button type="button" data-idx="${idx}"
                                class="preset-map-btn px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-slate-800 dark:text-slate-200 text-[11px] font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
                                📍 ${p.nombre}
                            </button>
                        `).join("")}
                    </div>
                </div>

                <!-- Contenedor del Mapa Interactivo -->
                <div class="space-y-2">
                    <div class="flex items-center justify-between text-xs">
                        <span class="font-bold text-slate-700 dark:text-slate-300">
                            Fijar ubicación exacta (Mueve el pin o haz clic en el mapa):
                        </span>
                        <div id="map-coords-status" class="flex items-center text-[11px] text-emerald-600 dark:text-emerald-400">
                            <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
                            <span>Ubicación lista en el mapa</span>
                        </div>
                    </div>
                    
                    <div id="leaflet-picker-map" class="w-full h-72 rounded-xl border-2 border-slate-300 dark:border-slate-700 overflow-hidden shadow-inner z-0"></div>
                </div>

                <!-- Botón de Guardado -->
                <div class="pt-2 flex justify-end gap-2">
                    <button type="button" id="btn-guardar-punto-mapa"
                        class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow transition-all text-xs flex items-center space-x-1.5 active:scale-95">
                        <span>💾</span>
                        <span>Guardar Punto en Base de Datos</span>
                    </button>
                </div>
            </div>

            <!-- Tabla de Puntos Existentes -->
            <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Listado de Puntos Operativos
                    </span>
                    <button type="button" id="btn-recargar-puntos" class="text-xs text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1">
                        <span>🔄</span>
                        <span>Actualizar</span>
                    </button>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                        <thead class="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th class="p-3">Código</th>
                                <th class="p-3">Nombre Oficial</th>
                                <th class="p-3">Tipo</th>
                                <th class="p-3">Municipio</th>
                                <th class="p-3 text-center">Estado</th>
                                <th class="p-3 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody id="tabla-puntos-body" class="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                            <tr>
                                <td colspan="6" class="p-6 text-center text-slate-400">Cargando puntos de control...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    `;

    let mapController = null;
    let selectedCoords = { lat: 7.8228, lng: -72.2272 };

    const seccionCrear = document.getElementById("seccion-crear-punto-mapa");
    const btnToggle = document.getElementById("btn-toggle-nuevo-punto");
    const btnCancelar = document.getElementById("btn-cancelar-crear-punto");
    const btnGuardar = document.getElementById("btn-guardar-punto-mapa");
    const btnRecargar = document.getElementById("btn-recargar-puntos");
    const tablaBody = document.getElementById("tabla-puntos-body");

    // Desplegar/Ocultar creación interactiva
    btnToggle.addEventListener("click", () => {
        const isHidden = seccionCrear.classList.contains("hidden");
        if (isHidden) {
            seccionCrear.classList.remove("hidden");
            document.getElementById("label-toggle-nuevo-punto").textContent = "Ocultar Formulario";
            if (!mapController) {
                mapController = initMapPicker("leaflet-picker-map", (coords) => {
                    selectedCoords = coords;
                });
            }
        } else {
            seccionCrear.classList.add("hidden");
            document.getElementById("label-toggle-nuevo-punto").textContent = "Nuevo Punto con Mapa";
        }
    });

    btnCancelar.addEventListener("click", () => {
        seccionCrear.classList.add("hidden");
        document.getElementById("label-toggle-nuevo-punto").textContent = "Nuevo Punto con Mapa";
    });

    // Enlazar Presets
    document.querySelectorAll(".preset-map-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const idx = parseInt(e.currentTarget.getAttribute("data-idx"), 10);
            const p = PRESETS_TACHIRA[idx];
            if (p && mapController) {
                mapController.setPreset(p.lat, p.lng);
                selectedCoords = { lat: p.lat, lng: p.lng };
                const inputNombre = document.getElementById("nuevo-punto-nombre");
                const inputMuni = document.getElementById("nuevo-punto-municipio");
                if (!inputNombre.value) inputNombre.value = p.nombre;
                if (!inputMuni.value) inputMuni.value = p.municipio;
            }
        });
    });

    // Cargar Puntos desde Supabase
    async function cargarPuntos() {
        tablaBody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400">Consultando puntos...</td></tr>`;
        try {
            const pin = getAdminPinCallback();
            const res = await fetch(`${supabaseConfig.SUPABASE_URL}/rest/v1/rpc/admin_gestionar_punto`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": supabaseConfig.SUPABASE_PUBLISHABLE_KEY,
                    "Authorization": `Bearer ${supabaseConfig.SUPABASE_PUBLISHABLE_KEY}`
                },
                body: JSON.stringify({ p_pin: pin, p_accion: "LISTAR", p_datos: {} })
            });

            if (!res.ok) throw new Error("Error al consultar puntos.");
            const puntos = await res.json();

            if (!Array.isArray(puntos) || puntos.length === 0) {
                tablaBody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400">No hay puntos registrados.</td></tr>`;
                return;
            }

            tablaBody.innerHTML = puntos.map(p => `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td class="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">${p.codigo}</td>
                    <td class="p-3 font-semibold text-slate-900 dark:text-white">${p.nombre}</td>
                    <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800">${p.tipo}</span></td>
                    <td class="p-3">${p.municipio}</td>
                    <td class="p-3 text-center">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${p.activo ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'}">
                            ${p.activo ? '🟢 Activo' : '🔴 Inactivo'}
                        </span>
                    </td>
                    <td class="p-3 text-right">
                        <button type="button" data-id="${p.id}" class="btn-toggle-punto text-xs font-bold ${p.activo ? 'text-red-600 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-700'}">
                            ${p.activo ? 'Desactivar' : 'Reactivar'}
                        </button>
                    </td>
                </tr>
            `).join("");

            // Notificar al generador de QR con los puntos actualizados
            if (typeof onPuntosUpdatedCallback === "function") {
                onPuntosUpdatedCallback(puntos);
            }

            // Enlazar botones de alternar
            document.querySelectorAll(".btn-toggle-punto").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    const id = e.currentTarget.getAttribute("data-id");
                    await alternarEstadoPunto(id);
                });
            });

        } catch (err) {
            tablaBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-500">Error: ${err.message}</td></tr>`;
        }
    }

    // Alternar estado activo de punto
    async function alternarEstadoPunto(id) {
        try {
            const pin = getAdminPinCallback();
            const res = await fetch(`${supabaseConfig.SUPABASE_URL}/rest/v1/rpc/admin_gestionar_punto`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": supabaseConfig.SUPABASE_PUBLISHABLE_KEY,
                    "Authorization": `Bearer ${supabaseConfig.SUPABASE_PUBLISHABLE_KEY}`
                },
                body: JSON.stringify({ p_pin: pin, p_accion: "TOGGLE_ACTIVO", p_datos: { id } })
            });
            if (res.ok) cargarPuntos();
        } catch (_) {}
    }

    // Guardar nuevo punto
    btnGuardar.addEventListener("click", async () => {
        const nombre = document.getElementById("nuevo-punto-nombre").value.trim();
        const tipo = document.getElementById("nuevo-punto-tipo").value;
        const municipio = document.getElementById("nuevo-punto-municipio").value.trim();

        if (!nombre || !municipio) {
            alert("Por favor indique el nombre y el municipio del punto de control.");
            return;
        }

        btnGuardar.disabled = true;
        btnGuardar.innerHTML = "Guardando...";

        try {
            const pin = getAdminPinCallback();
            const res = await fetch(`${supabaseConfig.SUPABASE_URL}/rest/v1/rpc/admin_gestionar_punto`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": supabaseConfig.SUPABASE_PUBLISHABLE_KEY,
                    "Authorization": `Bearer ${supabaseConfig.SUPABASE_PUBLISHABLE_KEY}`
                },
                body: JSON.stringify({
                    p_pin: pin,
                    p_accion: "CREAR",
                    p_datos: {
                        nombre,
                        tipo,
                        municipio,
                        latitud: selectedCoords.lat,
                        longitud: selectedCoords.lng,
                        activo: true
                    }
                })
            });

            const resp = await res.json();
            if (!res.ok) throw new Error(resp.message || "Error al registrar punto");

            alert("¡Punto de control registrado exitosamente con coordenadas fijadas en el mapa!");
            document.getElementById("nuevo-punto-nombre").value = "";
            document.getElementById("nuevo-punto-municipio").value = "";
            seccionCrear.classList.add("hidden");
            document.getElementById("label-toggle-nuevo-punto").textContent = "Nuevo Punto con Mapa";
            cargarPuntos();
        } catch (e) {
            alert("Error: " + e.message);
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = `<span>💾</span><span>Guardar Punto en Base de Datos</span>`;
        }
    });

    btnRecargar.addEventListener("click", cargarPuntos);
    cargarPuntos();
}
