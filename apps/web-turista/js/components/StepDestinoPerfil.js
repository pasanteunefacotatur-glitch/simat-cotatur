/**
 * ==============================================================================
 * PROYECTO: Sistema de Medición y Estadística Turística (Borrador Fase 1)
 * ARCHIVO: components/StepDestinoPerfil.js
 * DESCRIPCIÓN: Sección II - Destino dentro del estado, motivo de viaje y estadía.
 * ==============================================================================
 */

import { MUNICIPIOS_TACHIRA } from "../config.js";

export function renderStepDestinoPerfil(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const municipiosOptions = MUNICIPIOS_TACHIRA.map(
        m => `<option value="${m}">${m}</option>`
    ).join("");

    container.innerHTML = `
        <section class="bg-white rounded border border-gray-300 p-5 shadow-sm space-y-4">
            <div class="border-b border-gray-200 pb-2.5">
                <h2 class="text-sm font-bold text-gray-900 uppercase tracking-wide">
                    II. Datos del Desplazamiento y Estadía
                </h2>
            </div>

            <!-- Municipio de Destino -->
            <div>
                <label for="select-municipio-destino" class="block text-xs font-semibold text-gray-700 mb-1.5">
                    Municipio de destino principal <span class="text-red-600">*</span>
                </label>
                <select id="select-municipio-destino"
                    class="w-full bg-white border border-gray-300 rounded px-3 py-2.5 text-sm text-gray-900 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none">
                    <option value="" disabled selected>Seleccione el municipio de destino...</option>
                    ${municipiosOptions}
                </select>
            </div>

            <!-- Motivo del Viaje -->
            <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1.5">
                    Motivo principal del viaje <span class="text-red-600">*</span>
                </label>
                <div class="grid grid-cols-2 gap-2" id="group-motivo-viaje">
                    <button type="button" data-motivo="TURISMO_RECREACION"
                        class="btn-option py-2 px-3 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 text-left transition-colors">
                        Turismo / Recreación
                    </button>
                    <button type="button" data-motivo="FAMILIAR"
                        class="btn-option py-2 px-3 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 text-left transition-colors">
                        Visita a familiares
                    </button>
                    <button type="button" data-motivo="NEGOCIOS"
                        class="btn-option py-2 px-3 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 text-left transition-colors">
                        Negocios / Trabajo
                    </button>
                    <button type="button" data-motivo="RELIGIOSO_CULTURAL"
                        class="btn-option py-2 px-3 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 text-left transition-colors">
                        Religioso / Evento
                    </button>
                </div>
            </div>

            <!-- Tipo de Alojamiento -->
            <div>
                <label for="select-tipo-alojamiento" class="block text-xs font-semibold text-gray-700 mb-1.5">
                    Tipo de alojamiento previsto
                </label>
                <select id="select-tipo-alojamiento"
                    class="w-full bg-white border border-gray-300 rounded px-3 py-2.5 text-sm text-gray-900 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none">
                    <option value="HOTEL">Hotel</option>
                    <option value="POSADA" selected>Posada turística</option>
                    <option value="CASA_FAMILIAR">Vivienda de familiares o amigos</option>
                    <option value="ALQUILER_TEMPORAL">Alquiler temporal / Cabaña</option>
                    <option value="SIN_PERNOCTA">Sin pernocta (Visita de un día)</option>
                </select>
            </div>

            <!-- Grupo y Estadía -->
            <div class="grid grid-cols-2 gap-3 pt-1">
                <div>
                    <label for="input-grupo-tamano" class="block text-xs font-semibold text-gray-700 mb-1.5">
                        Integrantes del grupo
                    </label>
                    <input type="number" id="input-grupo-tamano" min="1" max="50" value="2"
                        class="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:border-slate-800 outline-none" />
                </div>
                <div>
                    <label for="input-dias-estadia" class="block text-xs font-semibold text-gray-700 mb-1.5">
                        Noches de pernocta
                    </label>
                    <input type="number" id="input-dias-estadia" min="0" max="90" value="3"
                        class="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:border-slate-800 outline-none" />
                </div>
            </div>
        </section>
    `;

    // Control de selección de motivo
    const buttons = container.querySelectorAll("#group-motivo-viaje button");
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            buttons.forEach(b => {
                b.className = "btn-option py-2 px-3 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 text-left transition-colors";
                b.removeAttribute("data-selected");
            });
            btn.className = "btn-option py-2 px-3 border border-slate-800 rounded text-xs font-semibold text-white bg-slate-800 text-left transition-colors";
            btn.setAttribute("data-selected", "true");
        });
    });

    if (buttons.length > 0) {
        buttons[0].click();
    }
}
