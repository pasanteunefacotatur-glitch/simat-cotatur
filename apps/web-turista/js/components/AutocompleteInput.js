/**
 * ==============================================================================
 * PROYECTO: Sistema de Medición y Estadística Turística (Borrador Fase 1)
 * ARCHIVO: components/AutocompleteInput.js
 * DESCRIPCIÓN: Componente reutilizable de autocompletado instantáneo (0 ms).
 *              Permite buscar sin tildes por Municipio, Capital o Localidad,
 *              y despliega las opciones en orden de los más utilizados.
 *              Incluye escape HTML estricto contra inyección DOM XSS.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

/**
 * Escapa caracteres especiales HTML para prevenir DOM XSS al renderizar en innerHTML.
 */
function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Normaliza una cadena eliminando tildes/diacríticos y convirtiendo a minúsculas.
 */
export function normalizarBusqueda(texto) {
    if (!texto) return "";
    return String(texto)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

/**
 * Inicializa un campo de autocompletado sobre un contenedor DOM.
 */
export function createAutocomplete({
    mountId,
    inputId,
    placeholder,
    items,
    getLabel,
    getSubLabel,
    getSearchString,
    allowCustom = false
}) {
    const mount = document.getElementById(mountId);
    if (!mount) return;

    mount.innerHTML = `
        <div class="relative" id="${inputId}-container">
            <div class="relative flex items-center">
                <input type="text" id="${inputId}" autocomplete="off"
                    placeholder="${escapeHtml(placeholder)}"
                    class="w-full bg-white border border-gray-300 rounded px-3 py-2.5 pr-16 text-sm text-gray-900 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none" />
                <button type="button" id="${inputId}-clear"
                    class="hidden absolute right-2 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">
                    Limpiar
                </button>
            </div>
            <div id="${inputId}-dropdown"
                class="autocomplete-list hidden absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-gray-300 rounded shadow-lg z-30 divide-y divide-gray-100">
            </div>
        </div>
    `;

    const inputEl = document.getElementById(inputId);
    const clearBtn = document.getElementById(`${inputId}-clear`);
    const dropdownEl = document.getElementById(`${inputId}-dropdown`);

    // Renderiza las filas del listado desplegable
    function renderDropdown(query) {
        const q = normalizarBusqueda(query);
        const filtered = !q
            ? items
            : items.filter(item => normalizarBusqueda(getSearchString(item)).includes(q));

        const safeValue = escapeHtml(inputEl.value.trim());

        if (filtered.length === 0) {
            if (allowCustom && q.length > 1) {
                dropdownEl.innerHTML = `
                    <div class="px-3 py-2.5 text-xs text-gray-600 bg-gray-50">
                        Se registrará: <b class="text-gray-900">${safeValue}</b>
                    </div>
                `;
            } else {
                dropdownEl.innerHTML = `
                    <div class="px-3 py-2.5 text-xs text-gray-500">
                        No se encontraron coincidencias para "${safeValue}".
                    </div>
                `;
            }
            dropdownEl.classList.remove("hidden");
            return;
        }

        const headerHint = !q
            ? `<div class="px-3 py-1.5 bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                   Ordenados por los más utilizados (Escriba para filtrar)
               </div>`
            : `<div class="px-3 py-1.5 bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                   Resultados encontrados (${filtered.length})
               </div>`;

        const rowsHTML = filtered.map((item, idx) => {
            const label = escapeHtml(getLabel(item));
            const subLabel = getSubLabel ? escapeHtml(getSubLabel(item)) : "";
            const badgeFrecuente = !q && idx < 6
                ? `<span class="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">Frecuente</span>`
                : "";

            return `
                <button type="button" data-value="${label}"
                    class="autocomplete-item w-full text-left px-3 py-2.5 hover:bg-slate-50 focus:bg-slate-100 transition-colors flex items-center justify-between gap-2">
                    <div>
                        <div class="text-xs font-semibold text-gray-900">${label}</div>
                        ${subLabel ? `<div class="text-[11px] text-gray-500">${subLabel}</div>` : ""}
                    </div>
                    ${badgeFrecuente}
                </button>
            `;
        }).join("");

        dropdownEl.innerHTML = headerHint + rowsHTML;
        dropdownEl.classList.remove("hidden");

        dropdownEl.querySelectorAll(".autocomplete-item").forEach(btn => {
            btn.addEventListener("mousedown", (e) => {
                e.preventDefault(); // Evita que el blur cierre antes de asignar el valor
                const selectedVal = btn.getAttribute("data-value");
                inputEl.value = selectedVal;
                inputEl.setAttribute("data-valid-selection", selectedVal);
                clearBtn.classList.remove("hidden");
                dropdownEl.classList.add("hidden");
            });
        });
    }

    inputEl.addEventListener("focus", () => {
        renderDropdown(inputEl.getAttribute("data-valid-selection") === inputEl.value ? "" : inputEl.value);
    });

    inputEl.addEventListener("click", () => {
        renderDropdown(inputEl.getAttribute("data-valid-selection") === inputEl.value ? "" : inputEl.value);
    });

    inputEl.addEventListener("input", () => {
        inputEl.removeAttribute("data-valid-selection");
        if (inputEl.value.trim().length > 0) {
            clearBtn.classList.remove("hidden");
        } else {
            clearBtn.classList.add("hidden");
        }
        renderDropdown(inputEl.value);
    });

    inputEl.addEventListener("blur", () => {
        setTimeout(() => {
            dropdownEl.classList.add("hidden");
            const currentVal = inputEl.value.trim();
            if (currentVal && !inputEl.getAttribute("data-valid-selection")) {
                const q = normalizarBusqueda(currentVal);
                const match = items.find(it => normalizarBusqueda(getSearchString(it)).includes(q));
                if (match) {
                    const label = getLabel(match);
                    inputEl.value = label;
                    inputEl.setAttribute("data-valid-selection", label);
                }
            }
        }, 150);
    });

    clearBtn.addEventListener("click", () => {
        inputEl.value = "";
        inputEl.removeAttribute("data-valid-selection");
        clearBtn.classList.add("hidden");
        inputEl.focus();
        renderDropdown("");
    });
}
