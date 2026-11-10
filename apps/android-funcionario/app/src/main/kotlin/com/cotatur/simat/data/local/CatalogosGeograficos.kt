package com.cotatur.simat.data.local

/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR
 * ARCHIVO: CatalogosGeograficos.kt
 * DESCRIPCIÓN: Catálogos oficiales para recolección de datos geográficos exactos:
 *              - Los 29 Municipios del Estado Táchira con sus capitales.
 *              - Todos los Estados de Venezuela (24 entidades federales).
 *              - Catálogo amplio de Países internacionales y emisores turísticos.
 * ==============================================================================
 */
object CatalogosGeograficos {

    val MUNICIPIOS_TACHIRA_29 = listOf(
        "San Cristóbal",
        "Cárdenas (Táriba)",
        "Capacho Nuevo (Independencia)",
        "Capacho Viejo (Libertad)",
        "Jáuregui (La Grita)",
        "Bolívar (San Antonio)",
        "Pedro María Ureña (Ureña)",
        "Junín (Rubio)",
        "Guásimos (Palmira)",
        "Andrés Bello (Cordero)",
        "José María Vargas (El Cobre)",
        "Lobatera (San Pedro del Río)",
        "Ayacucho (Colón)",
        "Michelena",
        "García de Hevia (La Fría)",
        "Fernández Feo (El Piñal)",
        "Libertador (Abejales)",
        "Uribante (Pregonero)",
        "Córdoba (Santa Ana)",
        "Torbes (San Josecito)",
        "Sucre (Queniquea)",
        "Francisco de Miranda (San José de Bolívar)",
        "Seboruco",
        "Rafael Urdaneta (Delicias)",
        "Panamericano (Coloncito)",
        "Samuel Darío Maldonado (La Tendida)",
        "Antonio Rómulo Costa (Las Mesas)",
        "San Judas Tadeo (Umuquena)",
        "Simón Rodríguez (San Simón)"
    )

    val MUNICIPIOS_FRECUENTES = listOf(
        "San Cristóbal",
        "Cárdenas (Táriba)",
        "Junín (Rubio)",
        "Jáuregui (La Grita)",
        "Guásimos (Palmira)",
        "Lobatera (San Pedro)",
        "Capacho Nuevo/Viejo",
        "Uribante (Pregonero)",
        "Bolívar (San Antonio)"
    )

    val PAISES_CATALOGO = listOf(
        "Colombia", "España", "Estados Unidos", "Ecuador", "Perú",
        "Chile", "Panamá", "México", "Argentina", "Brasil",
        "Italia", "Portugal", "Canadá", "Alemania", "Francia",
        "República Dominicana", "Costa Rica", "Uruguay", "Bolivia",
        "Paraguay", "Reino Unido", "Suiza", "China", "Países Bajos",
        "Bélgica", "Aruba / Curazao", "Trinidad y Tobago"
    )

    val PAISES_FRECUENTES = listOf(
        "Colombia", "España", "Estados Unidos",
        "Ecuador", "Perú", "Chile"
    )

    val ESTADOS_VENEZUELA_24 = listOf(
        "Zulia", "Mérida", "Barinas", "Distrito Capital",
        "Carabobo", "Lara", "Táchira (Local)", "Trujillo",
        "Aragua", "Anzoátegui", "Bolívar", "Falcón",
        "Miranda", "Monagas", "Nueva Esparta", "Portuguesa",
        "Sucre", "Yaracuy", "Apure", "Cojedes",
        "Guárico", "Delta Amacuro", "Amazonas", "La Guaira"
    )

    val ESTADOS_FRECUENTES = listOf(
        "Zulia", "Mérida", "Barinas", "Distrito Capital",
        "Carabobo", "Lara", "Táchira (Local)", "Trujillo",
        "Aragua", "Anzoátegui", "Bolívar"
    )
}
