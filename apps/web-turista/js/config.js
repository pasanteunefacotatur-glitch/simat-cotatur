/**
 * ==============================================================================
 * PROYECTO: Sistema de Medición y Estadística Turística (Borrador Fase 1)
 * ARCHIVO: config.js
 * DESCRIPCIÓN: Parámetros de configuración, catálogos geográficos y puntos QR.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

export const CONFIG = {
    SISTEMA_NOMBRE: "Sistema de Registro y Estadística Turística",
    ENTIDAD: "Corporación Tachirense de Turismo (COTATUR)",

    // Conexión con Supabase (Ingesta de datos mediante RPC)
    SUPABASE_URL: "https://njcwdhakkbiabkinsafs.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_icIarHUnV_Fvm84XkasTJA_OjsGvtNN",

    // Cloudflare Turnstile (Protección contra tráfico automatizado)
    TURNSTILE_SITE_KEY: "0x4AAAAAAFwAvWm1yItma-Eq",

    VERSION: "0.1.1-borrador",
    ANIO: 2026
};

// Catálogo de Puntos de Control QR para detección dinámica por URL (?p=CODIGO)
export const PUNTOS_CONTROL_QR = {
    PEAJE_TARIBA: "Peaje Vega de Táriba - Troncal 1",
    PEAJE_CAMPANA: "Peaje La Pedrera / La Campana - Troncal 5",
    TERMINAL_SC: "Terminal de Pasajeros - San Cristóbal",
    PUENTE_ATANASIO: "Puente Internacional Atanasio Girardot",
    PERIBECA_PUEBLO: "Punto de Información Turística - Peribeca",
    CHORRO_EL_INDIO: "Parque Nacional Chorro El Indio"
};

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
