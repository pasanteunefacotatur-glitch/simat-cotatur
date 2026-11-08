/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: apps/web-admin/js/components/MapPicker.js
 * DESCRIPCIÓN: Selector interactivo de coordenadas en mapa (Leaflet + OpenStreetMap)
 *              con autodetección automática del Municipio del Estado Táchira y
 *              validación estricta de geocerca territorial (impide guardar puntos
 *              ubicados fuera del Estado Táchira).
 *              Sin atajos ni puntos rápidos innecesarios.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

/**
 * Coordenadas centrales de las capitales de los 29 Municipios del Estado Táchira
 * para detección instantánea por cercanía geodésica y cruce con Nominatim.
 */
export const MUNICIPIOS_GEO_TACHIRA = [
    { municipio: "San Cristóbal", capital: "San Cristóbal", lat: 7.7669, lng: -72.2250 },
    { municipio: "Cárdenas", capital: "Táriba", lat: 7.8181, lng: -72.2242 },
    { municipio: "Capacho Nuevo", capital: "Independencia", lat: 7.8219, lng: -72.3075 },
    { municipio: "Capacho Viejo", capital: "Libertad", lat: 7.8264, lng: -72.3197 },
    { municipio: "Guásimos", capital: "Palmira", lat: 7.8408, lng: -72.2286 },
    { municipio: "Andrés Bello", capital: "Cordero", lat: 7.8572, lng: -72.1803 },
    { municipio: "Torbes", capital: "San Josecito", lat: 7.6611, lng: -72.2169 },
    { municipio: "Córdoba", capital: "Santa Ana del Táchira", lat: 7.6442, lng: -72.2764 },
    { municipio: "Junín", capital: "Rubio", lat: 7.7019, lng: -72.3564 },
    { municipio: "Bolívar", capital: "San Antonio del Táchira", lat: 7.8144, lng: -72.4431 },
    { municipio: "Pedro María Ureña", capital: "Ureña", lat: 7.9169, lng: -72.4458 },
    { municipio: "Rafael Urdaneta", capital: "Delicias", lat: 7.5658, lng: -72.4478 },
    { municipio: "Lobatera", capital: "Lobatera", lat: 7.9269, lng: -72.2456 },
    { municipio: "Michelena", capital: "Michelena", lat: 7.9553, lng: -72.2433 },
    { municipio: "Ayacucho", capital: "San Juan de Colón", lat: 8.0319, lng: -72.2608 },
    { municipio: "García de Hevia", capital: "La Fría", lat: 8.2169, lng: -72.2478 },
    { municipio: "Antonio Rómulo Costa", capital: "Las Mesas", lat: 8.1636, lng: -72.1647 },
    { municipio: "Seboruco", capital: "Seboruco", lat: 8.1456, lng: -72.0719 },
    { municipio: "San Judas Tadeo", capital: "Umuquena", lat: 8.2683, lng: -72.0650 },
    { municipio: "Panamericano", capital: "Coloncito", lat: 8.3228, lng: -72.0839 },
    { municipio: "Samuel Darío Maldonado", capital: "La Tendida", lat: 8.5106, lng: -71.8322 },
    { municipio: "Simón Rodríguez", capital: "San Simón", lat: 8.3611, lng: -71.8550 },
    { municipio: "Jáuregui", capital: "La Grita", lat: 8.1333, lng: -71.9833 },
    { municipio: "José María Vargas", capital: "El Cobre", lat: 8.0342, lng: -72.0597 },
    { municipio: "Sucre", capital: "Queniquea", lat: 7.9169, lng: -72.0156 },
    { municipio: "Francisco de Miranda", capital: "San José de Bolívar", lat: 7.9114, lng: -71.9708 },
    { municipio: "Uribante", capital: "Pregonero", lat: 8.0192, lng: -71.7583 },
    { municipio: "Fernández Feo", capital: "San Rafael del Piñal", lat: 7.5306, lng: -71.9589 },
    { municipio: "Libertador", capital: "Abejales", lat: 7.6247, lng: -71.5175 }
];

let mapInstance = null;
let currentMarker = null;
let activeState = {
    lat: 7.7669,
    lng: -72.2250,
    municipio: "San Cristóbal",
    esValidoTachira: true,
    motivoInvalido: ""
};

/**
 * Calcula la distancia en kilómetros entre dos coordenadas GPS (Fórmula de Haversine).
 */
export function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Encuentra el municipio del Táchira más cercano a la coordenada indicada.
 */
export function detectarMunicipioMasCercano(lat, lng) {
    let mejor = MUNICIPIOS_GEO_TACHIRA[0];
    let minDist = Infinity;

    for (const m of MUNICIPIOS_GEO_TACHIRA) {
        const d = calcularDistanciaKm(lat, lng, m.lat, m.lng);
        if (d < minDist) {
            minDist = d;
            mejor = m;
        }
    }
    return { ...mejor, distanciaKm: minDist };
}

/**
 * Valida geométricamente si un par (lat, lng) está dentro de los límites del Estado Táchira
 * (Excluyendo Norte de Santander en Colombia, Mérida, Barinas, Zulia y Apure).
 */
export function validarGeocercaTachira(lat, lng) {
    // 1. Caja envolvente general del Estado Táchira
    if (lat < 7.36 || lat > 8.66 || lng < -72.49 || lng > -71.33) {
        return {
            valido: false,
            motivo: "El punto se encuentra fuera de los límites geográficos del Estado Táchira."
        };
    }

    // 2. Frontera occidental con Colombia (Río Táchira / Cúcuta / Villa del Rosario / Pamplona)
    if (lng < -72.465) {
        return {
            valido: false,
            motivo: "El punto está en territorio colombiano (Norte de Santander)."
        };
    }
    if (lat >= 7.75 && lat <= 8.05 && lng < -72.452) {
        return {
            valido: false,
            motivo: "El punto cruza la línea fronteriza hacia Cúcuta / Villa del Rosario (Colombia)."
        };
    }
    if (lat > 8.05 && lng < -72.41) {
        return {
            valido: false,
            motivo: "El punto está al oeste de la frontera del Municipio Ayacucho / García de Hevia."
        };
    }

    // 3. Límite noroeste con el Sur del Lago (Estado Zulia)
    if (lat > 8.43 && lng < -72.12) {
        return {
            valido: false,
            motivo: "El punto pertenece al Estado Zulia (Sur del Lago)."
        };
    }

    // 4. Límite noreste con el Estado Mérida (Bailadores / Tovar / Guaraque)
    if (lat > 8.24 && lng > -71.76) {
        return {
            valido: false,
            motivo: "El punto pertenece al Estado Mérida."
        };
    }

    // 5. Límite sur con Apure / Colombia (Páramo El Tamá / Río Nula)
    const cercano = detectarMunicipioMasCercano(lat, lng);
    if (cercano.distanciaKm > 38) {
        return {
            valido: false,
            motivo: "El punto está demasiado alejado de los municipios del Estado Táchira."
        };
    }

    return { valido: true, motivo: "" };
}

/**
 * Normaliza un nombre devuelto por OpenStreetMap Nominatim al catálogo oficial de los 29 municipios.
 */
function normalizarMunicipioNominatim(textoRaw) {
    if (!textoRaw) return null;
    const limpio = String(textoRaw)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    for (const item of MUNICIPIOS_GEO_TACHIRA) {
        const mNorm = item.municipio.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const cNorm = item.capital.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        if (limpio.includes(mNorm) || limpio.includes(cNorm)) {
            return item.municipio;
        }
    }
    return null;
}

/**
 * Inicializa el mapa interactivo dentro del contenedor indicado.
 */
export function initMapPicker(containerId, onLocationChangeCallback) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }

    const defaultLat = 7.7669;
    const defaultLng = -72.2250;

    mapInstance = L.map(containerId, {
        center: [defaultLat, defaultLng],
        zoom: 11,
        zoomControl: true
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | COTATUR Táchira',
        maxZoom: 19
    }).addTo(mapInstance);

    const pinIcon = L.divIcon({
        className: "custom-map-pin",
        html: `
            <div style="background-color: #f59e0b; border: 3px solid #0f172a; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.4);">
                <span style="transform: rotate(45deg); font-size: 14px; font-weight: bold;">📍</span>
            </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -34]
    });

    currentMarker = L.marker([defaultLat, defaultLng], {
        draggable: true,
        icon: pinIcon
    }).addTo(mapInstance);

    currentMarker.bindPopup("<b>Punto de Control</b><br>Mueve el pin o haz clic en el mapa del Táchira.").openPopup();

    currentMarker.on("dragend", function (e) {
        const position = e.target.getLatLng();
        procesarUbicacionSeleccionada(position.lat, position.lng, onLocationChangeCallback);
    });

    mapInstance.on("click", function (e) {
        currentMarker.setLatLng(e.latlng);
        procesarUbicacionSeleccionada(e.latlng.lat, e.latlng.lng, onLocationChangeCallback);
    });

    setTimeout(() => {
        if (mapInstance) mapInstance.invalidateSize();
        procesarUbicacionSeleccionada(defaultLat, defaultLng, onLocationChangeCallback);
    }, 250);

    return {
        getState: () => activeState
    };
}

/**
 * Procesa la coordenada, valida que esté en el Estado Táchira y detecta el Municipio.
 */
async function procesarUbicacionSeleccionada(lat, lng, callback) {
    const latFixed = Number(lat.toFixed(6));
    const lngFixed = Number(lng.toFixed(6));

    // 1. Validación inmediata por geocerca matemática y municipio más cercano
    const checkGeo = validarGeocercaTachira(latFixed, lngFixed);
    const cercano = detectarMunicipioMasCercano(latFixed, lngFixed);

    activeState = {
        lat: latFixed,
        lng: lngFixed,
        municipio: checkGeo.valido ? cercano.municipio : "",
        esValidoTachira: checkGeo.valido,
        motivoInvalido: checkGeo.motivo
    };

    actualizarInterfazMapa(activeState);
    if (typeof callback === "function") callback(activeState);

    // 2. Refinamiento asíncrono con Geocodificación Inversa (OpenStreetMap Nominatim)
    if (navigator.onLine) {
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latFixed}&lon=${lngFixed}&zoom=12&addressdetails=1`;
            const res = await fetch(url, {
                headers: { "Accept-Language": "es" }
            });
            if (res.ok) {
                const data = await res.json();
                const addr = data.address || {};
                const estadoStr = String(addr.state || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                const paisCode = String(addr.country_code || "ve").toLowerCase();

                if (paisCode !== "ve" || (estadoStr && !estadoStr.includes("tachira"))) {
                    activeState.esValidoTachira = false;
                    activeState.municipio = "";
                    activeState.motivoInvalido = `Ubicación fuera del Estado Táchira (${addr.state || addr.country || "Otro territorio"}).`;
                } else {
                    const candidatoRaw = `${addr.county || ""} ${addr.municipality || ""} ${addr.city || ""} ${addr.town || ""} ${addr.village || ""}`;
                    const muniExacto = normalizarMunicipioNominatim(candidatoRaw);
                    activeState.esValidoTachira = true;
                    activeState.motivoInvalido = "";
                    activeState.municipio = muniExacto || cercano.municipio;
                }

                actualizarInterfazMapa(activeState);
                if (typeof callback === "function") callback(activeState);
            }
        } catch (_) {
            // Si Nominatim no responde, se mantiene el cálculo geodésico local de los 29 municipios
        }
    }
}

function actualizarInterfazMapa(state) {
    const badgeEl = document.getElementById("map-coords-status");
    const inputMuni = document.getElementById("nuevo-punto-municipio");

    if (state.esValidoTachira) {
        if (inputMuni) {
            inputMuni.value = state.municipio;
            inputMuni.classList.remove("border-red-500");
        }
        if (badgeEl) {
            badgeEl.innerHTML = `
                <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                <span class="text-emerald-700 dark:text-emerald-400 font-bold">
                    ✅ Estado Táchira • Municipio detectado: ${state.municipio}
                </span>
            `;
        }
    } else {
        if (inputMuni) {
            inputMuni.value = "";
            inputMuni.classList.add("border-red-500");
        }
        if (badgeEl) {
            badgeEl.innerHTML = `
                <span class="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5 animate-ping"></span>
                <span class="text-red-600 dark:text-red-400 font-bold">
                    ⚠️ Fuera del Táchira: ${state.motivoInvalido}
                </span>
            `;
        }
    }
}
