/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * INSTITUCIÓN: Corporación Tachirense de Turismo (COTATUR) / Gobernación del Táchira
 * DESARROLLADORA: Britney (Pasantía Institucional UNEFA)
 * ARCHIVO: config.js
 * DESCRIPCIÓN: Configuración central, constantes geográficas y credenciales públicas.
 * ==============================================================================
 */

export const CONFIG = {
    // Nombre institucional del sistema
    SISTEMA_NOMBRE: "SIMAT - COTATUR",
    ORGANIZACION: "Corporación Tachirense de Turismo",
    GOBERNACION: "Gobernación del Estado Táchira",

    // Conexión con Supabase Cloud (Ingesta de encuestas)
    SUPABASE_URL: "https://njcwdhakkbiabkinsafs.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_icIarHUnV_Fvm84XkasTJA_OjsGvtNN",

    // Cloudflare Turnstile (Protección contra bots sin fricción para el turista)
    TURNSTILE_SITE_KEY: "0x4AAAAAAFwAvWm1yItma-Eq",

    // Versión del formulario Web PWA
    VERSION: "1.0.0-draft",
    ANIO: 2026
};

// Municipios del Estado Táchira para selección rápida del turista
export const MUNICIPIOS_TACHIRA = [
    "San Cristóbal (Capital)",
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
    "Francisco de Miranda (San José de Bolívar)",
    "Córdoba (Santa Ana)",
    "Fernández Feo (El Piñal)",
    "Seboruco",
    "José María Vargas (El Cobre)",
    "San Judas Tadeo (Umuquena)",
    "Simón Rodríguez (San Simón)",
    "Antonio Rómulo Costa (Las Mesas)",
    "Otro Municipio"
];

// Estados de procedencia nacional común hacia el Táchira
export const ESTADOS_VENEZUELA = [
    "Zulia", "Mérida", "Barinas", "Distrito Capital", "Miranda",
    "Carabobo", "Lara", "Aragua", "Trujillo", "Portuguesa",
    "Falcón", "Anzoátegui", "Bolívar", "Yaracuy", "Monagas",
    "Sucre", "Guárico", "Nueva Esparta", "Cojedes", "Delta Amacuro",
    "Amazonas", "Apure", "La Guaira"
];

// Puntos de Captura y Campañas Oficiales
export const PUNTOS_CAPTURA_DEFAULT = [
    { id: "PEAJE_TARIBA", nombre: "Peaje Vega de Táriba (Troncal 1)", tipo: "PEAJE" },
    { id: "PEAJE_CAMPANA", nombre: "Peaje La Pedrera / La Campana (Troncal 5)", tipo: "PEAJE" },
    { id: "TERMINAL_SC", nombre: "Terminal Central Gen. Cipriano Castro", tipo: "TERMINAL" },
    { id: "PUENTE_ATANASIO", nombre: "Puente Internacional Atanasio Girardot", tipo: "FRONTERA" },
    { id: "PERIBECA", nombre: "Punto Turístico Peribeca Colonial", tipo: "ATRACCION" },
    { id: "CHORRO_EL_INDIO", nombre: "Parque Nacional Chorro El Indio", tipo: "ATRACCION" }
];
