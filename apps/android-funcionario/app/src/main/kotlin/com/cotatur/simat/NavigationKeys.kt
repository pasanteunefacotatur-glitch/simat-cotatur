package com.cotatur.simat

import androidx.navigation3.runtime.NavKey
import kotlinx.serialization.Serializable

/**
 * Destinos de navegación del aplicativo móvil SIMAT-COTATUR (Navigation 3).
 */
@Serializable
data object MainMenuDest : NavKey

@Serializable
data object EncuestaTuristaDest : NavKey

@Serializable
data object CensoPrestadoresDest : NavKey

@Serializable
data object OutboxDetalleDest : NavKey

@Serializable
data object AjustesPuntoDest : NavKey

@Serializable
data object SupervisionDest : NavKey
