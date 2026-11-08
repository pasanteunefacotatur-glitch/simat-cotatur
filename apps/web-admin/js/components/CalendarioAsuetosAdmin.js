/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-admin/js/components/CalendarioAsuetosAdmin.js
 * DESCRIPCIÓN: Módulo de Calendario Turístico, Programación de Asuetos y Eventos.
 *              Calcula automáticamente fechas móviles (Carnavales y Semana Santa)
 *              mediante el algoritmo astronómico de Pascua y permite programar
 *              nuevos operativos feriales y decretos turísticos.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

import { CONFIG, TEMPORADAS_CONFIG } from "../../../web-turista/js/config.js";

/**
 * Algoritmo astronómico Meeus/Jones/Butcher para calcular Domingo de Pascua
 */
export function calcularPascua(anio) {
    const a = anio % 19;
    const b = Math.floor(anio / 100);
    const c = anio % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31); // 3 = Marzo, 4 = Abril
    const dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(anio, mes - 1, dia));
}

/**
 * Calcula rangos exactos de asuetos móviles y fijos para un año determinado
 */
export function obtenerAsuetosPorAnio(anio) {
    const pascua = calcularPascua(anio);

    // Carnavales: Lunes y Martes de Carnaval (48 y 47 días antes de Pascua)
    // El operativo turístico inicia desde el viernes previo (51 días antes)
    const carnavalesInicio = new Date(pascua.getTime() - (51 * 24 * 60 * 60 * 1000));
    const carnavalesFin = new Date(pascua.getTime() - (47 * 24 * 60 * 60 * 1000));

    // Semana Santa: Desde Viernes de Concilio / Domingo de Ramos hasta Domingo de Pascua
    const semanaSantaInicio = new Date(pascua.getTime() - (9 * 24 * 60 * 60 * 1000));
    const semanaSantaFin = pascua;

    const fmt = (d) => d.toISOString().split("T")[0];

    return [
        {
            codigo: `FISS_${anio}`,
            nombre: `Feria Internacional de San Sebastián ${anio}`,
            tipo_cuestionario: "FISS",
            fecha_inicio: `${anio}-01-10`,
            fecha_fin: `${anio}-02-01`,
            prioridad: 5,
            activo: true,
            tipo_fecha: "Fija Anual (Enero)"
        },
        {
            codigo: `CARNAVALES_${anio}`,
            nombre: `Carnavales Turísticos del Táchira ${anio}`,
            tipo_cuestionario: "CARNAVALES",
            fecha_inicio: fmt(carnavalesInicio),
            fecha_fin: fmt(carnavalesFin),
            prioridad: 5,
            activo: true,
            tipo_fecha: "Móvil Astronómica (Pascua -48d)"
        },
        {
            codigo: `SEMANA_SANTA_${anio}`,
            nombre: `Semana Santa Mayor ${anio}`,
            tipo_cuestionario: "SEMANA_SANTA",
            fecha_inicio: fmt(semanaSantaInicio),
            fecha_fin: fmt(semanaSantaFin),
            prioridad: 5,
            activo: true,
            tipo_fecha: "Móvil Astronómica (Pascua)"
        },
        {
            codigo: `VACACIONES_${anio}`,
            nombre: `Vacaciones Escolares y Turismo Familiar ${anio}`,
            tipo_cuestionario: "VACACIONES_ESCOLARES",
            fecha_inicio: `${anio}-07-15`,
            fecha_fin: `${anio}-09-15`,
            prioridad: 2,
            activo: true,
            tipo_fecha: "Fija Anual (Jul-Sep)"
        },
        {
            codigo: `SANTO_CRISTO_${anio}`,
            nombre: `Peregrinación del Santo Cristo de La Grita ${anio}`,
            tipo_cuestionario: "SANTO_CRISTO",
            fecha_inicio: `${anio}-08-01`,
            fecha_fin: `${anio}-08-10`,
            prioridad: 10,
            activo: true,
            tipo_fecha: "Fija Anual (Día central: 6 Ago)"
        },
        {
            codigo: `CONSOLACION_${anio}`,
            nombre: `Virgen de la Consolación de Táriba ${anio}`,
            tipo_cuestionario: "CONSOLACION_TARIBA",
            fecha_inicio: `${anio}-08-12`,
            fecha_fin: `${anio}-08-18`,
            prioridad: 10,
            activo: true,
            tipo_fecha: "Fija Anual (Día central: 15 Ago)"
        },
        {
            codigo: `FERIAS_MUN_${anio}`,
            nombre: `Ferias Tradicionales Municipales ${anio}`,
            tipo_cuestionario: "FERIAS_MUNICIPALES",
            fecha_inicio: `${anio}-09-01`,
            fecha_fin: `${anio}-09-30`,
            prioridad: 3,
            activo: true,
            tipo_fecha: "Fija Anual (Septiembre)"
        },
        {
            codigo: `FIN_DE_ANO_${anio}`,
            nombre: `Temporada Decembrina y Año Nuevo ${anio}-${anio + 1}`,
            tipo_cuestionario: "FIN_DE_ANO",
            fecha_inicio: `${anio}-12-01`,
            fecha_fin: `${anio + 1}-01-07`,
            prioridad: 5,
            activo: true,
            tipo_fecha: "Fija Anual (Diciembre-Enero)"
        }
    ];
}

/**
 * Componente principal del Calendario de Asuetos
 */
export function renderCalendarioAsuetosAdmin(containerId, authUser) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let selectedYear = new Date().getFullYear();
    let asuetosList = obtenerAsuetosPorAnio(selectedYear);

    const render = () => {
        const hoyStr = new Date().toISOString().split("T")[0];

        const cardsHTML = asuetosList.map(a => {
            const isEnCurso = hoyStr >= a.fecha_inicio && hoyStr <= a.fecha_fin;
            const badgeEnCurso = isEnCurso
                ? `<span class="px-2 py-0.5 text-[10px] bg-emerald-500 text-white font-extrabold rounded-full animate-pulse">EN CURSO HOY</span>`
                : "";

            return `
                <div class="bg-white dark:bg-slate-900 border ${isEnCurso ? "border-emerald-500 shadow-emerald-500/10 shadow-lg" : "border-slate-200 dark:border-slate-800"} rounded-2xl p-4 flex flex-col justify-between transition-all">
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/40">
                                ${a.tipo_cuestionario}
                            </span>
                            ${badgeEnCurso}
                        </div>
                        <h4 class="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                            ${a.nombre}
                        </h4>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center space-x-1">
                            <span>📅</span>
                            <span>${a.fecha_inicio} al ${a.fecha_fin}</span>
                        </p>
                        <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Modo: <span class="font-medium">${a.tipo_fecha || "Programado"}</span>
                        </p>
                    </div>

                    <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span class="text-slate-500">Prioridad: <b>${a.prioridad}</b></span>
                        <div class="flex items-center space-x-2">
                            <button type="button" data-codigo="${a.codigo}" class="btn-toggle-asueto px-2.5 py-1 rounded text-[11px] font-semibold border ${
                                a.activo 
                                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700"
                            }">
                                ${a.activo ? "Activo" : "Inactivo"}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join("");

        container.innerHTML = `
            <div class="space-y-6">
                <!-- Cabecera y Selector de Año -->
                <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div class="flex items-center space-x-2">
                            <span class="text-2xl">📅</span>
                            <h3 class="text-base font-extrabold text-slate-900 dark:text-white">
                                Calendario Oficial de Asuetos y Fiestas Turísticas del Táchira
                            </h3>
                        </div>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Cálculo automático de Carnavales, Semana Santa y fechas fijas de COTATUR. Las preguntas de temporada se activan automáticamente al llegar la fecha.
                        </p>
                    </div>

                    <div class="flex items-center space-x-3">
                        <label for="select-cal-year" class="text-xs font-semibold text-slate-600 dark:text-slate-300">Año:</label>
                        <select id="select-cal-year" class="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white outline-none">
                            <option value="2026" ${selectedYear === 2026 ? "selected" : ""}>2026 (En Curso)</option>
                            <option value="2027" ${selectedYear === 2027 ? "selected" : ""}>2027</option>
                            <option value="2028" ${selectedYear === 2028 ? "selected" : ""}>2028</option>
                            <option value="2029" ${selectedYear === 2029 ? "selected" : ""}>2029</option>
                            <option value="2030" ${selectedYear === 2030 ? "selected" : ""}>2030</option>
                        </select>
                        <button type="button" id="btn-nuevo-evento-modal"
                            class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1 shadow transition-colors">
                            <span>➕</span>
                            <span>Programar Actividad</span>
                        </button>
                    </div>
                </div>

                <!-- Grilla de Asuetos -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    ${cardsHTML}
                </div>

                <!-- Modal de Registro de Nueva Actividad Especial -->
                <div id="modal-nuevo-evento" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm hidden flex items-center justify-center p-4">
                    <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl">
                        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                            <h4 class="text-sm font-bold text-slate-900 dark:text-white">Programar Actividad o Asueto Especial</h4>
                            <button type="button" id="btn-cerrar-modal-evento" class="text-slate-400 hover:text-white text-base">✕</button>
                        </div>

                        <form id="form-nuevo-evento" class="space-y-3">
                            <div>
                                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre del Evento o Actividad *</label>
                                <input type="text" id="input-evento-nombre" required placeholder="Ej: Clásico Ciclístico Vuelta al Táchira"
                                    class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none" />
                            </div>

                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Fecha Inicio *</label>
                                    <input type="date" id="input-evento-inicio" required
                                        class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none" />
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Fecha Fin *</label>
                                    <input type="date" id="input-evento-fin" required
                                        class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none" />
                                </div>
                            </div>

                            <div>
                                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipo de Cuestionario Asociado</label>
                                <select id="select-evento-tipo" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none">
                                    <option value="EVENTO_ESPECIAL">Evento Especial / Deportivo / Concierto</option>
                                    <option value="FERIAS_MUNICIPALES">Ferias Tradicionales Municipales</option>
                                    <option value="FISS">Feria Internacional de San Sebastián</option>
                                    <option value="CARNAVALES">Carnavales Turísticos</option>
                                    <option value="SEMANA_SANTA">Semana Santa</option>
                                    <option value="SANTO_CRISTO">Peregrinación Santo Cristo</option>
                                    <option value="CONSOLACION_TARIBA">Virgen de la Consolación</option>
                                    <option value="VACACIONES_ESCOLARES">Vacaciones Escolares</option>
                                    <option value="FIN_DE_ANO">Fin de Año</option>
                                </select>
                            </div>

                            <div>
                                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Prioridad (1-10)</label>
                                <input type="number" id="input-evento-prioridad" min="1" max="10" value="5"
                                    class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none" />
                            </div>

                            <div class="pt-2 flex justify-end space-x-2">
                                <button type="button" id="btn-cancelar-modal-evento" class="px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs">Cancelar</button>
                                <button type="submit" class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs">Guardar Actividad</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Eventos
        const yearSelect = container.querySelector("#select-cal-year");
        if (yearSelect) {
            yearSelect.addEventListener("change", (e) => {
                selectedYear = parseInt(e.target.value, 10);
                asuetosList = obtenerAsuetosPorAnio(selectedYear);
                render();
            });
        }

        // Toggles
        container.querySelectorAll(".btn-toggle-asueto").forEach(btn => {
            btn.addEventListener("click", () => {
                const cod = btn.getAttribute("data-codigo");
                const item = asuetosList.find(x => x.codigo === cod);
                if (item) {
                    item.activo = !item.activo;
                    render();
                }
            });
        });

        // Modal
        const modal = container.querySelector("#modal-nuevo-evento");
        const btnOpen = container.querySelector("#btn-nuevo-evento-modal");
        const btnClose = container.querySelector("#btn-cerrar-modal-evento");
        const btnCancel = container.querySelector("#btn-cancelar-modal-evento");
        const form = container.querySelector("#form-nuevo-evento");

        if (btnOpen && modal) btnOpen.addEventListener("click", () => modal.classList.remove("hidden"));
        if (btnClose && modal) btnClose.addEventListener("click", () => modal.classList.add("hidden"));
        if (btnCancel && modal) btnCancel.addEventListener("click", () => modal.classList.add("hidden"));

        if (form) {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                const nombre = document.getElementById("input-evento-nombre").value.trim();
                const inicio = document.getElementById("input-evento-inicio").value;
                const fin = document.getElementById("input-evento-fin").value;
                const tipo = document.getElementById("select-evento-tipo").value;
                const prioridad = parseInt(document.getElementById("input-evento-prioridad").value, 10) || 5;

                if (!nombre || !inicio || !fin) {
                    alert("Por favor complete todos los campos obligatorios.");
                    return;
                }

                const nuevoCodigo = `EVT_${Date.now()}`;
                asuetosList.unshift({
                    codigo: nuevoCodigo,
                    nombre,
                    tipo_cuestionario: tipo,
                    fecha_inicio: inicio,
                    fecha_fin: fin,
                    prioridad,
                    activo: true,
                    tipo_fecha: "Actividad Programada"
                });

                modal.classList.add("hidden");
                render();
                alert(`Actividad "${nombre}" programada con éxito.`);
            });
        }
    };

    render();
}
