/**
 * ==============================================================================
 * PROYECTO: Sistema de Medición y Estadística Turística (Borrador Fase 1)
 * ARCHIVO: config.js
 * DESCRIPCIÓN: Parámetros centrales, puntos de control con UUIDs de Supabase
 *              y catálogos estructurados ordenados por frecuencia de uso
 *              (Municipio + Capital + Referencias y Países más frecuentes).
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */

export const CONFIG = {
    SISTEMA_NOMBRE: "Sistema de Registro y Estadística Turística",
    ENTIDAD: "Corporación Tachirense de Turismo (COTATUR)",

    // Conexión activa con Supabase
    SUPABASE_URL: "https://njcwdhakkbiabkinsafs.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_icIarHUnV_Fvm84XkasTJA_OjsGvtNN",

    // Cloudflare Turnstile
    TURNSTILE_SITE_KEY: "0x4AAAAAAFwAvWm1yItma-Eq",

    VERSION: "0.2.0-borrador",
    ANIO: 2026
};

// Puntos de Control QR sincronizados con los UUIDs reales de Supabase
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

/**
 * Catálogo de los 29 Municipios del Estado Táchira con su Capital y referencias.
 * Ordenado de mayor a menor frecuencia de uso turístico y tránsito.
 */
export const CATALOGO_MUNICIPIOS_TACHIRA = [
    { codigo: "SAN_CRISTOBAL", municipio: "San Cristóbal", capital: "San Cristóbal", referencias: "FISS, Pueblo Nuevo, Chorro El Indio, Barrio Obrero", uso: 1000 },
    { codigo: "CARDENAS", municipio: "Cárdenas", capital: "Táriba", referencias: "Basílica Consolación, Vega de Táriba, Las Margaritas", uso: 850 },
    { codigo: "CAPACHO_NUEVO", municipio: "Capacho Nuevo", capital: "Independencia", referencias: "Peribeca, Cerro El Cristo, Mercado de Capacho", uso: 800 },
    { codigo: "JAUREGUI", municipio: "Jáuregui", capital: "La Grita", referencias: "Santo Cristo, Páramo El Rosal, Liceo Militar", uso: 750 },
    { codigo: "BOLIVAR", municipio: "Bolívar", capital: "San Antonio del Táchira", referencias: "Frontera, Aduana, Puente Simón Bolívar, Peracal", uso: 700 },
    { codigo: "PEDRO_MARIA_URENA", municipio: "Pedro María Ureña", capital: "Ureña", referencias: "Aguas Termales, Puente Atanasio Girardot, Tienditas", uso: 650 },
    { codigo: "JUNIN", municipio: "Junín", capital: "Rubio", referencias: "Ciudad Pontálida, Bramón, Ruta del Café", uso: 600 },
    { codigo: "GUASIMOS", municipio: "Guásimos", capital: "Palmira", referencias: "Agroturismo, Cestería, La Laguna, Copa de Oro", uso: 550 },
    { codigo: "ANDRES_BELLO", municipio: "Andrés Bello", capital: "Cordero", referencias: "Ruta de la Montaña, Monte Carmelo, Las Porqueras", uso: 500 },
    { codigo: "JOSE_MARIA_VARGAS", municipio: "José María Vargas", capital: "El Cobre", referencias: "Páramo El Zumbador, Angostura, Mesa de Aura", uso: 480 },
    { codigo: "LOBATERA", municipio: "Lobatera", capital: "Lobatera", referencias: "San Pedro del Río, Borotá, Minas de Carbón", uso: 460 },
    { codigo: "AYACUCHO", municipio: "Ayacucho", capital: "San Juan de Colón", referencias: "Colón, San Pedro del Río, El Vallado", uso: 440 },
    { codigo: "MICHELENA", municipio: "Michelena", capital: "Michelena", referencias: "Boca de Monte, Páramo", uso: 420 },
    { codigo: "CAPACHO_VIEJO", municipio: "Capacho Viejo", capital: "Libertad", referencias: "Lomas Bajas, Cipriano Castro", uso: 400 },
    { codigo: "GARCIA_DE_HEVIA", municipio: "García de Hevia", capital: "La Fría", referencias: "Aeropuerto Internacional, Boca de Grita, Orope", uso: 380 },
    { codigo: "FERNANDEZ_FEO", municipio: "Fernández Feo", capital: "San Rafael del Piñal", referencias: "El Piñal, Naranjales, Río Doradas, Santo Domingo", uso: 360 },
    { codigo: "LIBERTADOR", municipio: "Libertador", capital: "Abejales", referencias: "La Pedrera, San Joaquín de Navay", uso: 340 },
    { codigo: "URIBANTE", municipio: "Uribante", capital: "Pregonero", referencias: "Represa Uribante Caparo, La Trampa, Laguna de García", uso: 320 },
    { codigo: "CORDOBA", municipio: "Córdoba", capital: "Santa Ana del Táchira", referencias: "Santa Ana, Río Negro", uso: 300 },
    { codigo: "TORBES", municipio: "Torbes", capital: "San Josecito", referencias: "Río Torbes, Vega de Aza, El Corozo", uso: 280 },
    { codigo: "SUCRE", municipio: "Sucre", capital: "Queniquea", referencias: "Páramo El Batallón, Mesa del Tigre, San Pablo", uso: 260 },
    { codigo: "FRANCISCO_DE_MIRANDA", municipio: "Francisco de Miranda", capital: "San José de Bolívar", referencias: "Río Bobo, Laguna de Río Bobo", uso: 240 },
    { codigo: "SEBORUCO", municipio: "Seboruco", capital: "Seboruco", referencias: "Santa Filomena, Mirador", uso: 220 },
    { codigo: "RAFAEL_URDANETA", municipio: "Rafael Urdaneta", capital: "Delicias", referencias: "Páramo El Tamá, Betania, Villa Páez", uso: 200 },
    { codigo: "PANAMERICANO", municipio: "Panamericano", capital: "Coloncito", referencias: "La Palmita, Troncal 1", uso: 180 },
    { codigo: "SAMUEL_DARIO_MALDONADO", municipio: "Samuel Darío Maldonado", capital: "La Tendida", referencias: "Boconó, Hernández", uso: 160 },
    { codigo: "ANTONIO_ROMULO_COSTA", municipio: "Antonio Rómulo Costa", capital: "Las Mesas", referencias: "Piedra Gorda", uso: 140 },
    { codigo: "SAN_JUDAS_TADEO", municipio: "San Judas Tadeo", capital: "Umuquena", referencias: "Las Talas, La Hojita", uso: 120 },
    { codigo: "SIMON_RODRIGUEZ", municipio: "Simón Rodríguez", capital: "San Simón", referencias: "Pueblo Hondo", uso: 100 }
];

/**
 * Catálogo de Países de Procedencia ordenados por mayor flujo hacia el Táchira.
 */
export const CATALOGO_PAISES = [
    { codigo: "CO", nombre: "Colombia", referencias: "Cúcuta, Norte de Santander, Bogotá, Bucaramanga, Medellín, Cali", uso: 1000 },
    { codigo: "US", nombre: "Estados Unidos", referencias: "USA, Miami, Florida, Nueva York, Texas", uso: 500 },
    { codigo: "ES", nombre: "España", referencias: "Madrid, Barcelona, Canarias, Tenerife", uso: 450 },
    { codigo: "EC", nombre: "Ecuador", referencias: "Quito, Guayaquil, Cuenca", uso: 400 },
    { codigo: "PE", nombre: "Perú", referencias: "Lima, Arequipa, Trujillo", uso: 380 },
    { codigo: "CL", nombre: "Chile", referencias: "Santiago, Valparaíso", uso: 360 },
    { codigo: "PA", nombre: "Panamá", referencias: "Ciudad de Panamá", uso: 340 },
    { codigo: "MX", nombre: "México", referencias: "CDMX, Monterrey, Guadalajara", uso: 320 },
    { codigo: "AR", nombre: "Argentina", referencias: "Buenos Aires, Córdoba", uso: 300 },
    { codigo: "BR", nombre: "Brasil", referencias: "São Paulo, Manaos, Boa Vista, Río", uso: 280 },
    { codigo: "IT", nombre: "Italia", referencias: "Roma, Milán, Nápoles", uso: 260 },
    { codigo: "PT", nombre: "Portugal", referencias: "Lisboa, Madeira, Oporto", uso: 240 },
    { codigo: "CA", nombre: "Canadá", referencias: "Toronto, Montreal, Vancouver", uso: 220 },
    { codigo: "DE", nombre: "Alemania", referencias: "Berlín, Múnich, Frankfurt", uso: 200 },
    { codigo: "FR", nombre: "Francia", referencias: "París, Lyon", uso: 180 },
    { codigo: "DO", nombre: "República Dominicana", referencias: "Santo Domingo, Punta Cana", uso: 160 },
    { codigo: "CR", nombre: "Costa Rica", referencias: "San José", uso: 150 },
    { codigo: "UY", nombre: "Uruguay", referencias: "Montevideo", uso: 140 },
    { codigo: "BO", nombre: "Bolivia", referencias: "La Paz, Santa Cruz", uso: 130 },
    { codigo: "PY", nombre: "Paraguay", referencias: "Asunción", uso: 120 },
    { codigo: "GB", nombre: "Reino Unido", referencias: "Londres, Inglaterra", uso: 110 },
    { codigo: "CH", nombre: "Suiza", referencias: "Zúrich, Ginebra", uso: 100 },
    { codigo: "CN", nombre: "China", referencias: "Pekín, Shanghái", uso: 90 },
    { codigo: "OT", nombre: "Otro país", referencias: "Internacional", uso: 50 }
];

// Catálogo de Estados de Venezuela ordenados por mayor emisión de visitantes al Táchira
export const ESTADOS_VENEZUELA = [
    "Zulia", "Mérida", "Barinas", "Distrito Capital", "Carabobo",
    "Lara", "Miranda", "Aragua", "Trujillo", "Portuguesa",
    "Táchira (Turismo interno)", "Anzoátegui", "Bolívar", "Falcón", "Apure",
    "Monagas", "Yaracuy", "Guárico", "Sucre", "Nueva Esparta",
    "La Guaira", "Cojedes", "Delta Amacuro", "Amazonas"
];

export const MOTIVOS_VIAJE = [
    { codigo: "TURISMO_RECREACION", etiqueta: "Turismo / Recreación" },
    { codigo: "FAMILIAR", etiqueta: "Visita a familiares" },
    { codigo: "NEGOCIOS", etiqueta: "Negocios / Trabajo" },
    { codigo: "RELIGIOSO_CULTURAL", etiqueta: "Religioso / Evento" }
];

export const TIPOS_ALOJAMIENTO = [
    { codigo: "POSADA", etiqueta: "Posada turística" },
    { codigo: "HOTEL", etiqueta: "Hotel" },
    { codigo: "CASA_FAMILIAR", etiqueta: "Vivienda de familiares o amigos" },
    { codigo: "ALQUILER_TEMPORAL", etiqueta: "Alquiler temporal / Cabaña" },
    { codigo: "SIN_PERNOCTA", etiqueta: "Sin pernocta (Visita de un día)" }
];

export const CRITERIOS_EVALUACION = [
    { id: "vialidad", label: "Estado de las vías de acceso", default: 4 },
    { id: "seguridad", label: "Percepción de seguridad", default: 5 },
    { id: "hospitalidad", label: "Atención al visitante", default: 5 },
    { id: "servicios", label: "Servicios públicos y estaciones", default: 4 }
];

/**
 * Catálogo de Tipología de Viaje (¿Con quién viaja?)
 */
export const COMPOSICION_GRUPO = [
    { codigo: "GRUPO_FAMILIAR", etiqueta: "👨‍👩‍👧‍👦 Familia (con niños / adultos mayores)" },
    { codigo: "PAREJA", etiqueta: "👫 En Pareja" },
    { codigo: "AMIGOS_COMPANEROS", etiqueta: "👥 Amigos / Compañeros" },
    { codigo: "SOLO_INDIVIDUAL", etiqueta: "🎒 Solo / Individual" },
    { codigo: "EXCURSION_ORGANIZADA", etiqueta: "🚌 Excursión Organizada" }
];

/**
 * Rangos de edad predominante del responsable o grupo
 */
export const RANGOS_EDAD = [
    { codigo: "18_29", etiqueta: "18 a 29 años (Jóvenes)" },
    { codigo: "30_49", etiqueta: "30 a 49 años (Adultos)" },
    { codigo: "50_MAS", etiqueta: "50 años o más (Adultos mayores)" }
];

/**
 * Configuración de Preguntas Específicas por Temporada / Asueto
 */
export const TEMPORADAS_CONFIG = {
    FISS: {
        codigo: "FISS",
        titulo: "Feria Internacional de San Sebastián",
        badge: "🎉 Temporada Ferial FISS",
        preguntas: [
            {
                id: "fiss_eventos",
                tipo: "chips_multi",
                label: "¿A cuáles actividades o eventos feriales tiene previsto asistir?",
                opciones: [
                    "Desfile de Feria", "Feria Ganadera (Asogata)", "Pabellones Colombia-Venezuela",
                    "Corridas de Toros", "Conciertos / Noches de Feria", "Elección de la Reina"
                ]
            }
        ]
    },
    CARNAVALES: {
        codigo: "CARNAVALES",
        titulo: "Carnavales Turísticos del Táchira",
        badge: "🎭 Carnavales",
        preguntas: [
            {
                id: "carnaval_atractivo",
                tipo: "chips_single",
                label: "¿Qué atractivo o circuito turístico visita principalmente?",
                opciones: [
                    "Ruta de Montaña y Páramos", "Aguas Termales (Ureña/San Cristóbal)",
                    "Balnearios y Ríos", "Pueblos Típicos (Peribeca / San Pedro)"
                ]
            }
        ]
    },
    SEMANA_SANTA: {
        codigo: "SEMANA_SANTA",
        titulo: "Semana Santa Mayor en Táchira",
        badge: "🕊️ Semana Santa",
        preguntas: [
            {
                id: "semana_santa_visita",
                tipo: "chips_single",
                label: "¿Cuál es la actividad principal de su visita?",
                opciones: [
                    "Peregrinación y Ruta de los 7 Templos", "Turismo de Naturaleza / Páramos",
                    "Descanso y Convivencia Familiar", "Tradiciones Gastronómicas"
                ]
            }
        ]
    },
    SANTO_CRISTO: {
        codigo: "SANTO_CRISTO",
        titulo: "Peregrinación del Santo Cristo de La Grita",
        badge: "✝️ Peregrinación Santo Cristo",
        preguntas: [
            {
                id: "santocristo_modo",
                tipo: "chips_single",
                label: "¿Cómo realiza la peregrinación hacia La Grita?",
                opciones: [
                    "Caminata a pie (Peregrino)", "En Bicicleta", "Vehículo Particular", "Excursión en Autobús"
                ]
            },
            {
                id: "santocristo_frecuencia",
                tipo: "chips_single",
                label: "¿Es su primera peregrinación o es una tradición anual?",
                opciones: [
                    "Es mi primera vez", "Tradición de todos los años", "Visita ocasional"
                ]
            }
        ]
    },
    CONSOLACION_TARIBA: {
        codigo: "CONSOLACION_TARIBA",
        titulo: "Fiestas de la Virgen de la Consolación de Táriba",
        badge: "🙏 Virgen de la Consolación",
        preguntas: [
            {
                id: "consolacion_modo",
                tipo: "chips_single",
                label: "¿Participa en la peregrinación hacia la Basílica de Táriba?",
                opciones: [
                    "Sí, caminata desde San Cristóbal", "En vehículo / transporte", "Visita turística general"
                ]
            }
        ]
    },
    FERIAS_MUNICIPALES: {
        codigo: "FERIAS_MUNICIPALES",
        titulo: "Ferias Tradicionales Municipales",
        badge: "🎪 Ferias Municipales",
        preguntas: [
            {
                id: "feria_atractivo",
                tipo: "chips_single",
                label: "¿Qué destaca de las ferias del municipio visitado?",
                opciones: [
                    "Eventos culturales y reinado", "Gastronomía típica", "Clima y paisajes", "Reencuentro familiar"
                ]
            }
        ]
    },
    VACACIONES_ESCOLARES: {
        codigo: "VACACIONES_ESCOLARES",
        titulo: "Temporada de Vacaciones Escolares",
        badge: "☀️ Vacaciones",
        preguntas: [
            {
                id: "vacaciones_circuito",
                tipo: "chips_single",
                label: "¿Cuál es el principal atractivo de su itinerario?",
                opciones: [
                    "Clima de montaña y páramos", "Parques y recreación infantil", "Compras y gastronomía", "Rutas agrícolas"
                ]
            }
        ]
    },
    FIN_DE_ANO: {
        codigo: "FIN_DE_ANO",
        titulo: "Temporada Decembrina y Año Nuevo",
        badge: "🎄 Fin de Año en Táchira",
        preguntas: [
            {
                id: "diciembre_motivo",
                tipo: "chips_single",
                label: "¿Qué motivo describe mejor su estadía decembrina?",
                opciones: [
                    "Reencuentro familiar / Navidades", "Turismo y clima andino", "Ruta de pesebres y tradiciones"
                ]
            }
        ]
    },
    EVENTO_ESPECIAL: {
        codigo: "EVENTO_ESPECIAL",
        titulo: "Evento Especial / Deportivo / Concierto",
        badge: "⭐ Evento Especial",
        preguntas: [
            {
                id: "evento_exclusivo",
                tipo: "chips_single",
                label: "¿Vino al Estado Táchira exclusivamente por este evento?",
                opciones: [
                    "Sí, vine únicamente por el evento", "No, aproveché para hacer turismo también"
                ]
            }
        ]
    },
    REGULAR: {
        codigo: "REGULAR",
        titulo: "Temporada Regular",
        badge: "🏞️ Turismo Táchira",
        preguntas: []
    }
};
