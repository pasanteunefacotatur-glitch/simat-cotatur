/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: components/StepDestinoPerfil.js
 * DESCRIPCIÓN: Sección 2 - Destino en Táchira, motivo del viaje y estadía estimada.
 * ==============================================================================
 */

import { MUNICIPIOS_TACHIRA } from "../config.js";

export function renderStepDestinoPerfil(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Generar opciones de municipios del Táchira
    const municipiosOptions = MUNICIPIOS_TACHIRA.map(
        m => `<option value="${m}">${m}</option>`
    ).join("");

    container.innerHTML = `
        <div class="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
            <div class="flex items-center space-x-3">
                <span class="w-7 h-7 bg-blue-100 text-blue-900 font-extrabold rounded-full flex items-center justify-center text-xs">
                    2
                </span>
                <h3 class="text-base font-bold text-slate-800">
                    Tu viaje en el Táchira
                </h3>
            </div>

            <!-- Destino principal en Táchira -->
            <div>
                <label for="select-municipio-destino" class="block text-xs font-semibold text-slate-600 mb-1">
                    Municipio o destino principal:
                </label>
                <select id="select-municipio-destino"
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all">
                    <option value="" disabled selected>Selecciona tu destino en Táchira...</option>
                    ${municipiosOptions}
                </select>
            </div>

            <!-- Motivo principal de visita -->
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-2">
                    Motivo principal de tu visita:
                </label>
                <div class="grid grid-cols-2 gap-2" id="group-motivo-viaje">
                    <button type="button" data-motivo="TURISMO_RECREACION"
                        class="btn-option py-2.5 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-blue-50 text-left transition-all active:scale-95">
                        🏕️ Vacaciones / Turismo
                    </button>
                    <button type="button" data-motivo="FAMILIAR"
                        class="btn-option py-2.5 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-blue-50 text-left transition-all active:scale-95">
                        👨‍👩‍👧‍👦 Visita Familiar
                    </button>
                    <button type="button" data-motivo="NEGOCIOS"
                        class="btn-option py-2.5 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-blue-50 text-left transition-all active:scale-95">
                        💼 Negocios / Trabajo
                    </button>
                    <button type="button" data-motivo="RELIGIOSO_CULTURAL"
                        class="btn-option py-2.5 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-blue-50 text-left transition-all active:scale-95">
                        ⛪ Religioso / Fiestas
                    </button>
                </div>
            </div>

            <!-- Estadía y Tamaño del Grupo -->
            <div class="grid grid-cols-2 gap-3 pt-2">
                <div>
                    <label for="input-grupo-tamano" class="block text-xs font-semibold text-slate-600 mb-1">
                        Personas en el grupo:
                    </label>
                    <input type="number" id="input-grupo-tamano" min="1" max="50" value="2"
                        class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-bold text-center focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
                <div>
                    <label for="input-dias-estadia" class="block text-xs font-semibold text-slate-600 mb-1">
                        Días de permanencia:
                    </label>
                    <input type="number" id="input-dias-estadia" min="1" max="90" value="3"
                        class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-bold text-center focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
            </div>
        </div>
    `;

    // Lógica de selección única de motivo
    const buttons = container.querySelectorAll("#group-motivo-viaje button");
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            buttons.forEach(b => {
                b.className = "btn-option py-2.5 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-blue-50 text-left transition-all active:scale-95";
            });
            btn.className = "btn-option py-2.5 px-3 border-2 border-blue-900 rounded-xl text-xs font-bold text-white bg-blue-900 shadow-md text-left transition-all";
            btn.setAttribute("data-selected", "true");
        });
    });

    // Seleccionar por defecto el primero
    if (buttons.length > 0) {
        buttons[0].click();
    }
}
