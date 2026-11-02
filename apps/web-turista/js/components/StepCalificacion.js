/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: components/StepCalificacion.js
 * DESCRIPCIÓN: Sección 3 - Calificación de servicios y atención en el Táchira.
 * ==============================================================================
 */

export function renderStepCalificacion(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const criterios = [
        { id: "vialidad", label: "Estado de la Vialidad", icon: "🛣️", default: 4 },
        { id: "seguridad", label: "Seguridad Ciudadana", icon: "🛡️", default: 5 },
        { id: "hospitalidad", label: "Hospitalidad Tachirense", icon: "🤝", default: 5 },
        { id: "servicios", label: "Servicios Públicos", icon: "💡", default: 4 }
    ];

    const criteriosHTML = criterios.map(c => `
        <div class="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div class="flex items-center space-x-2.5">
                <span class="text-xl">${c.icon}</span>
                <span class="text-xs font-bold text-slate-700">${c.label}</span>
            </div>
            <div class="flex space-x-1" data-rating-group="${c.id}" data-current="${c.default}">
                ${[1, 2, 3, 4, 5].map(star => `
                    <button type="button" data-val="${star}" 
                        class="star-btn w-8 h-8 flex items-center justify-center text-lg transition-transform active:scale-125 focus:outline-none">
                        ${star <= c.default ? "⭐" : "☆"}
                    </button>
                `).join("")}
            </div>
        </div>
    `).join("");

    container.innerHTML = `
        <div class="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
            <div class="flex items-center space-x-3">
                <span class="w-7 h-7 bg-blue-100 text-blue-900 font-extrabold rounded-full flex items-center justify-center text-xs">
                    3
                </span>
                <h3 class="text-base font-bold text-slate-800">
                    Tu Calificación de Servicios
                </h3>
            </div>

            <p class="text-xs text-slate-500">
                Toca las estrellas para evaluar tu experiencia durante el recorrido:
            </p>

            <div class="space-y-2.5">
                ${criteriosHTML}
            </div>
        </div>
    `;

    // Lógica interactiva de cambio de estrellas
    container.querySelectorAll("[data-rating-group]").forEach(group => {
        const buttons = group.querySelectorAll(".star-btn");
        buttons.forEach(btn => {
            btn.addEventListener("click", () => {
                const val = parseInt(btn.getAttribute("data-val"), 10);
                group.setAttribute("data-current", val);
                buttons.forEach(b => {
                    const bVal = parseInt(b.getAttribute("data-val"), 10);
                    b.textContent = bVal <= val ? "⭐" : "☆";
                });
            });
        });
    });
}
