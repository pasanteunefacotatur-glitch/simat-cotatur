/**
 * ==============================================================================
 * PROYECTO: Sistema de Medición y Estadística Turística (Borrador Fase 1)
 * ARCHIVO: components/StepDestinoPerfil.js
 * DESCRIPCIÓN: Sección II - Destino dentro del estado, motivo de viaje y estadía.
 *              Integra buscador autocompletable por Municipio, Capital o Pueblo,
 *              ordenado por los destinos más utilizados del Táchira.
 * ==============================================================================
 */

import { CATALOGO_MUNICIPIOS_TACHIRA, MOTIVOS_VIAJE, TIPOS_ALOJAMIENTO } from "../config.js";
import { createAutocomplete } from "./AutocompleteInput.js";

export function renderStepDestinoPerfil(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const motivosButtons = MOTIVOS_VIAJE.map(
        m => `
            <button type="button" data-motivo="${m.codigo}"
                class="btn-option py-2 px-3 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 text-left transition-colors">
                ${m.etiqueta}
            </button>
        `
    ).join("");

    const alojamientosOptions = TIPOS_ALOJAMIENTO.map(
        a => `<option value="${a.codigo}">${a.etiqueta}</option>`
    ).join("");

    container.innerHTML = `
        <section class="bg-white rounded border border-gray-300 p-5 shadow-sm space-y-4">
            <div class="border-b border-gray-200 pb-2.5">
                <h2 class="text-sm font-bold text-gray-900 uppercase tracking-wide">
                    II. Datos del Desplazamiento y Estadía
                </h2>
            </div>

            <!-- Buscador Autocompletable de Municipio o Capital -->
            <div>
                <label for="select-municipio-destino" class="block text-xs font-semibold text-gray-700 mb-1.5">
                    Municipio o capital de destino <span class="text-red-600">*</span>
                </label>
                <div id="mount-autocomplete-municipio"></div>
                <p class="text-[11px] text-gray-500 mt-1">
                    Puede buscar por municipio (ej. Jáuregui, Junín), por su capital (ej. La Grita, Rubio) o localidad (ej. Peribeca).
                </p>
            </div>

            <!-- Motivo del Viaje -->
            <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1.5">
                    Motivo principal del viaje <span class="text-red-600">*</span>
                </label>
                <div class="grid grid-cols-2 gap-2" id="group-motivo-viaje">
                    ${motivosButtons}
                </div>
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

            <!-- Tipo de Alojamiento (Condicional: se oculta si noches == 0) -->
            <div id="wrapper-tipo-alojamiento">
                <label for="select-tipo-alojamiento" class="block text-xs font-semibold text-gray-700 mb-1.5">
                    Tipo de alojamiento previsto
                </label>
                <select id="select-tipo-alojamiento"
                    class="w-full bg-white border border-gray-300 rounded px-3 py-2.5 text-sm text-gray-900 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none">
                    ${alojamientosOptions}
                </select>
            </div>
        </section>
    `;

    // Inicializar autocompletado de municipios ordenado por los más utilizados
    createAutocomplete({
        mountId: "mount-autocomplete-municipio",
        inputId: "select-municipio-destino",
        placeholder: "Escriba municipio o capital (ej. San Cristóbal, La Grita, Táriba)...",
        items: CATALOGO_MUNICIPIOS_TACHIRA,
        getLabel: (item) => `${item.municipio} (Cap. ${item.capital})`,
        getSubLabel: (item) => `Capital: ${item.capital} • Ref: ${item.referencias}`,
        getSearchString: (item) => `${item.municipio} ${item.capital} ${item.referencias}`,
        allowCustom: false
    });

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

    // Lógica condicional RF-02: Si noches de pernocta es 0, ocultar alojamiento
    const inputDias = document.getElementById("input-dias-estadia");
    const wrapperAlojamiento = document.getElementById("wrapper-tipo-alojamiento");
    const selectAlojamiento = document.getElementById("select-tipo-alojamiento");

    inputDias.addEventListener("input", () => {
        const dias = parseInt(inputDias.value || "0", 10);
        if (dias === 0) {
            wrapperAlojamiento.classList.add("hidden");
            selectAlojamiento.value = "SIN_PERNOCTA";
        } else {
            wrapperAlojamiento.classList.remove("hidden");
            if (selectAlojamiento.value === "SIN_PERNOCTA") {
                selectAlojamiento.value = "POSADA";
            }
        }
    });
}
