/**
 * ==============================================================================
 * PROYECTO: Sistema de Medición y Estadística Turística (Borrador Fase 1)
 * ARCHIVO: config.js
 * DESCRIPCIÓN: Parámetros centrales, puntos de control con UUIDs de Supabase
 *              y catálogos editables para futuras modificaciones de COTATUR.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

export const CONFIG = {
    SISTEMA_NOMBRE: "Sistema de Registro y Estadística Turística",
    ENTIDAD: "Corporación Tachirense de Turismo (COTATUR)",

    // Conexión activa con Supabase (Ingesta de datos mediante RPC)
    SUPABASE_URL: "https://njcwdhakkbiabkinsafs.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_icIarHUnV_Fvm84XkasTJA_OjsGvtNN",

    // Cloudflare Turnstile (Protección contra tráfico automatizado)
    TURNSTILE_SITE_KEY: "0x4AAAAAAFwAvWm1yItma-Eq",

    VERSION: "0.1.2-borrador",
    ANIO: 2026
};

/**
 * Catálogo de Puntos de Control QR sincronizado con los UUIDs reales de Supabase.
 * Si COTATUR solicita agregar nuevos puntos tras la reunión, basta con añadirlos
 * en la tabla `puntos_captura` de Supabase; el sistema los consulta automáticamente
 * y utiliza este diccionario como respaldo offline inmediato.
 */
export const PUNTOS_CONTROL_QR = {
    PEAJE_TARIBA: {
        id: "a07731b0-c77a-4df8-8cc6-95396d6743e9",
        nombre: "Peaje Vega de Táriba - Troncal 1"
    },
    PEAJE_CAMPANA: {
        id: "674525d8-2fd8-455a-af0f-a71c1854bdfb",
        nombre: "Peaje La Pedrera / La Campana - Troncal 5"
    },
    TERMINAL_SC: {
        id: "64d20a51-333e-478f-95cc-a45d05e96edb",
        nombre: "Terminal de Pasajeros - San Cristóbal"
    },
    PUENTE_ATANASIO: {
        id: "d4249187-3b50-4bc6-9a05-f85160a6b479",
        nombre: "Puente Internacional Atanasio Girardot"
    },
    PERIBECA_PUEBLO: {
        id: "9dc01181-7f8f-4f91-9c54-66aec8c580c5",
        nombre: "Punto de Información Turística - Peribeca"
    },
    CHORRO_EL_INDIO: {
        id: "fafd9b9b-54ff-42d2-8949-d636ccf912e2",
        nombre: "Parque Nacional Chorro El Indio"
    }
};

// Catálogo editable de Motivos de Viaje (Fácilmente adaptable según requerimientos de COTATUR)
export const MOTIVOS_VIAJE = [
    { codigo: "TURISMO_RECREACION", etiqueta: "Turismo / Recreación" },
    { codigo: "FAMILIAR", etiqueta: "Visita a familiares" },
    { codigo: "NEGOCIOS", etiqueta: "Negocios / Trabajo" },
    { codigo: "RELIGIOSO_CULTURAL", etiqueta: "Religioso / Evento" }
];

// Catálogo editable de Tipos de Alojamiento
export const TIPOS_ALOJAMIENTO = [
    { codigo: "POSADA", etiqueta: "Posada turística" },
    { codigo: "HOTEL", etiqueta: "Hotel" },
    { codigo: "CASA_FAMILIAR", etiqueta: "Vivienda de familiares o amigos" },
    { codigo: "ALQUILER_TEMPORAL", etiqueta: "Alquiler temporal / Cabaña" },
    { codigo: "SIN_PERNOCTA", etiqueta: "Sin pernocta (Visita de un día)" }
];

// Catálogo editable de Criterios de Evaluación (Escala 1 al 5)
export const CRITERIOS_EVALUACION = [
    { id: "vialidad", label: "Estado de las vías de acceso", default: 4 },
    { id: "seguridad", label: "Percepción de seguridad", default: 5 },
    { id: "hospitalidad", label: "Atención al visitante", default: 5 },
    { id: "servicios", label: "Servicios públicos y estaciones", default: 4 }
];

// Catálogo de Municipios del Estado Táchira
export const MUNICIPIOS_TACHIRA = [
    "San Cristóbal",
    "Cárdenas (Táriba)",
    "Jáuregui (La Grita)",
    "Capacho Nuevo",
    "Capacho Viejo",
    "Junín (Rubio)",
    "Lobatera",
    "Michelena",
    "Ayacucho (Colón)",
    "Bolívar (San Antonio)",
    "Pedro María Ureña",
    "Guásimos (Palmira)",
    "Andrés Bello (Cordero)",
    "Torbes (San Josecito)",
    "Libertador (Abejales)",
    "Uribante (Pregonero)",
    "García de Hevia (La Fría)",
    "Panamericano (Coloncito)",
    "Samuel Darío Maldonado",
    "Sucre (Queniquea)",
    "Francisco de Miranda",
    "Córdoba (Santa Ana)",
    "Fernández Feo (El Piñal)",
    "Seboruco",
    "José María Vargas (El Cobre)",
    "San Judas Tadeo (Umuquena)",
    "Simón Rodríguez (San Simón)",
    "Antonio Rómulo Costa",
    "Otro municipio"
];

// Catálogo de Estados de Venezuela
export const ESTADOS_VENEZUELA = [
    "Amazonas", "Anzoátegui", "Apure", "Aragua", "Barinas",
    "Bolívar", "Carabobo", "Cojedes", "Delta Amacuro", "Distrito Capital",
    "Falcón", "Guárico", "La Guaira", "Lara", "Mérida",
    "Miranda", "Monagas", "Nueva Esparta", "Portuguesa", "Sucre",
    "Trujillo", "Yaracuy", "Zulia"
];
