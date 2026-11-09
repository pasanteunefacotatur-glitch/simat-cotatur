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
                    class="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-3 pr-14 text-sm text-gray-900 dark:text-white focus:border-[#198754] focus:ring-1 focus:ring-[#198754] outline-none shadow-sm transition-all" />
                <button type="button" id="${inputId}-clear"
                    class="hidden absolute right-1.5 w-11 h-11 rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-500 dark:text-slate-300 flex items-center justify-center text-sm font-bold tap-target-btn transition-colors"
                    title="Borrar texto">
                    ✕
                </button>
            </div>
            <div id="${inputId}-dropdown"
                class="autocomplete-list hidden absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 divide-y divide-gray-100 dark:divide-slate-800">
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
                    <div class="px-4 py-3 text-xs text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/50">
                        Se registrará: <b class="text-gray-900 dark:text-white">${safeValue}</b>
                    </div>
                `;
            } else {
                dropdownEl.innerHTML = `
                    <div class="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">
                        No se encontraron coincidencias para "${safeValue}".
                    </div>
                `;
            }
            dropdownEl.classList.remove("hidden");
            return;
        }

        const headerHint = !q
            ? `<div class="px-4 py-2 bg-gray-50 dark:bg-slate-800/60 text-[10px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                   Destinos frecuentes del Táchira (Escriba para filtrar)
               </div>`
            : `<div class="px-4 py-2 bg-gray-50 dark:bg-slate-800/60 text-[10px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                   Resultados encontrados (${filtered.length})
               </div>`;

        const rowsHTML = filtered.map((item, idx) => {
            const label = escapeHtml(getLabel(item));
            const subLabel = getSubLabel ? escapeHtml(getSubLabel(item)) : "";
            const badgeFrecuente = !q && idx < 6
                ? `<span class="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">Popular</span>`
                : "";

            return `
                <button type="button" data-value="${label}"
                    class="autocomplete-item w-full text-left px-4 py-3 hover:bg-emerald-50/60 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between gap-2">
                    <div>
                        <div class="text-xs font-bold text-gray-900 dark:text-white">${label}</div>
                        ${subLabel ? `<div class="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">${subLabel}</div>` : ""}
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
