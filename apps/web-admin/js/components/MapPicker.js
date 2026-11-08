/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-admin/js/components/MapPicker.js
 * DESCRIPCIÓN: Selector interactivo de coordenadas en mapa (Leaflet + OpenStreetMap).
 *              Permite al supervisor ubicar un punto de control arrastrando un pin
 *              o haciendo clic en el mapa del Táchira, evitando errores humanos de tipeo.
 *              Las coordenadas se gestionan de forma automática e invisible.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

// Presets de ubicaciones clave en el Estado Táchira para fijar con un solo clic
export const PRESETS_TACHIRA = [
    { nombre: "Peaje Vega de Táriba (Troncal 1)", municipio: "Cárdenas", lat: 7.8228, lng: -72.2272 },
    { nombre: "Peaje Vega de Aza (Troncal 5)", municipio: "Torbes", lat: 7.6405, lng: -72.2155 },
    { nombre: "Peaje La Restauradora / Orope", municipio: "García de Hevia", lat: 8.3542, lng: -72.2789 },
    { nombre: "Terminal Central San Cristóbal", municipio: "San Cristóbal", lat: 7.7608, lng: -72.2356 },
    { nombre: "Punto de Control Peracal", municipio: "Bolívar", lat: 7.8267, lng: -72.3989 },
    { nombre: "Puente Atanasio Girardot", municipio: "Pedro María Ureña", lat: 7.8833, lng: -72.4333 },
    { nombre: "Pueblo Típico de Peribeca", municipio: "Capacho Nuevo", lat: 7.8183, lng: -72.3167 },
    { nombre: "San Pedro del Río", municipio: "Ayacucho", lat: 7.9714, lng: -72.3164 },
    { nombre: "Ateneo del Táchira / COTATUR", municipio: "San Cristóbal", lat: 7.7672, lng: -72.2248 }
];

let mapInstance = null;
let currentMarker = null;
let activeCoords = { lat: 7.7669, lng: -72.2250 };

/**
 * Inicializa el mapa interactivo dentro del contenedor indicado.
 */
export function initMapPicker(containerId, onCoordsChangeCallback) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Si ya existía una instancia, removerla para reinicializar limpio
    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }

    // Coordenadas iniciales: Centro de San Cristóbal / Táchira
    const defaultLat = 7.7669;
    const defaultLng = -72.2250;
    activeCoords = { lat: defaultLat, lng: defaultLng };

    // Crear mapa Leaflet
    mapInstance = L.map(containerId, {
        center: [defaultLat, defaultLng],
        zoom: 12,
        zoomControl: true
    });

    // Capa de mapas OpenStreetMap (100% gratuita y sin credenciales de pago)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | COTATUR',
        maxZoom: 19
    }).addTo(mapInstance);

    // Icono institucional personalizado de pin
    const pinIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
            <div style="background-color: #f59e0b; border: 3px solid #0f172a; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.4);">
                <span style="transform: rotate(45deg); font-size: 14px; font-weight: bold;">📍</span>
            </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -34]
    });

    // Marcador arrastrable
    currentMarker = L.marker([defaultLat, defaultLng], {
        draggable: true,
        icon: pinIcon
    }).addTo(mapInstance);

    currentMarker.bindPopup("<b>Punto Seleccionado</b><br>Arrastra este pin a la ubicación exacta.").openPopup();

    // Evento al arrastrar el pin
    currentMarker.on("dragend", function (e) {
        const position = e.target.getLatLng();
        actualizarCoordenadas(position.lat, position.lng, onCoordsChangeCallback);
    });

    // Evento al hacer clic en cualquier lugar del mapa
    mapInstance.on("click", function (e) {
        currentMarker.setLatLng(e.latlng);
        actualizarCoordenadas(e.latlng.lat, e.latlng.lng, onCoordsChangeCallback);
    });

    // Forzar redibujado de teselas por si el mapa abrió en un modal o pestaña
    setTimeout(() => {
        if (mapInstance) mapInstance.invalidateSize();
    }, 250);

    return {
        setPreset: (lat, lng) => {
            if (mapInstance && currentMarker) {
                mapInstance.flyTo([lat, lng], 14, { duration: 1 });
                currentMarker.setLatLng([lat, lng]);
                actualizarCoordenadas(lat, lng, onCoordsChangeCallback);
            }
        },
        getCoords: () => activeCoords
    };
}

function actualizarCoordenadas(lat, lng, callback) {
    activeCoords = {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6))
    };

    // Actualizar badge visual amigable
    const badgeEl = document.getElementById("map-coords-status");
    if (badgeEl) {
        badgeEl.innerHTML = `
            <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
            <span class="text-emerald-700 dark:text-emerald-300 font-semibold">Ubicación fijada en el mapa con éxito</span>
        `;
    }

    if (typeof callback === "function") {
        callback(activeCoords);
    }
}
