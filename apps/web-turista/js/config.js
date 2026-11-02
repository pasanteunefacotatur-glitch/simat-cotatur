/**
 * ==============================================================================
 * PROYECTO: Sistema de Medición y Estadística Turística (Borrador Fase 1)
 * ARCHIVO: config.js
 * DESCRIPCIÓN: Parámetros de configuración, catálogos geográficos y conexión.
 * ==============================================================================
 */

export const CONFIG = {
    SISTEMA_NOMBRE: "Sistema de Registro y Estadística Turística",
    ENTIDAD: "Corporación Tachirense de Turismo (COTATUR)",

    // Conexión con Supabase (Ingesta de datos)
    SUPABASE_URL: "https://njcwdhakkbiabkinsafs.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_icIarHUnV_Fvm84XkasTJA_OjsGvtNN",

    // Cloudflare Turnstile
    TURNSTILE_SITE_KEY: "0x4AAAAAAFwAvWm1yItma-Eq",

    VERSION: "0.1.0-borrador",
    ANIO: 2026
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
