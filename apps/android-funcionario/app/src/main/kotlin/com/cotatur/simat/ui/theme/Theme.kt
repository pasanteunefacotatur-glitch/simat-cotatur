package com.cotatur.simat.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

/**
 * Modos de tema soportados por la aplicación móvil SIMAT-COTATUR.
 */
enum class AppThemeMode {
    LIGHT,   // Modo Solar / Exterior de alto contraste
    DARK,    // Modo Oscuro LCD estándar
    AMOLED,  // Modo Negro Puro 0 nits (Ahorro de batería extremo)
    SYSTEM   // Hereda del sistema operativo Android
}

val LocalThemeMode = staticCompositionLocalOf { AppThemeMode.AMOLED }

private val LightColorScheme = lightColorScheme(
    primary = PrimaryLight,
    onPrimary = OnPrimaryLight,
    primaryContainer = PrimaryContainerLight,
    onPrimaryContainer = OnPrimaryContainerLight,
    secondary = SecondaryLight,
    onSecondary = OnSecondaryLight,
    secondaryContainer = SecondaryContainerLight,
    onSecondaryContainer = OnSecondaryContainerLight,
    tertiary = TertiaryLight,
    onTertiary = OnTertiaryLight,
    background = BackgroundLight,
    onBackground = OnBackgroundLight,
    surface = SurfaceLight,
    onSurface = OnSurfaceLight,
    surfaceVariant = SurfaceVariantLight,
    onSurfaceVariant = OnSurfaceVariantLight,
    outline = OutlineLight
)

private val DarkColorScheme = darkColorScheme(
    primary = PrimaryDark,
    onPrimary = OnPrimaryDark,
    primaryContainer = PrimaryContainerDark,
    onPrimaryContainer = OnPrimaryContainerDark,
    secondary = SecondaryDark,
    onSecondary = OnSecondaryDark,
    secondaryContainer = SecondaryContainerDark,
    onSecondaryContainer = OnSecondaryContainerDark,
    tertiary = TertiaryDark,
    onTertiary = OnTertiaryDark,
    background = BackgroundDark,
    onBackground = OnBackgroundDark,
    surface = SurfaceDark,
    onSurface = OnSurfaceDark,
    surfaceVariant = SurfaceVariantDark,
    onSurfaceVariant = OnSurfaceVariantDark,
    outline = OutlineDark
)

private val AmoledColorScheme = darkColorScheme(
    primary = PrimaryAmoled,
    onPrimary = OnPrimaryAmoled,
    primaryContainer = PrimaryContainerAmoled,
    onPrimaryContainer = OnPrimaryContainerAmoled,
    secondary = SecondaryAmoled,
    onSecondary = OnSecondaryAmoled,
    secondaryContainer = SecondaryContainerAmoled,
    onSecondaryContainer = OnSecondaryContainerAmoled,
    tertiary = TertiaryAmoled,
    onTertiary = OnTertiaryAmoled,
    background = BackgroundAmoled,
    onBackground = OnBackgroundAmoled,
    surface = SurfaceAmoled,
    onSurface = OnSurfaceAmoled,
    surfaceVariant = SurfaceVariantAmoled,
    onSurfaceVariant = OnSurfaceVariantAmoled,
    outline = OutlineAmoled
)

@Composable
fun SIMATCOTATURTheme(
    themeMode: AppThemeMode = AppThemeMode.AMOLED,
    content: @Composable () -> Unit
) {
    val isSystemDark = isSystemInDarkTheme()
    val activeColorScheme = when (themeMode) {
        AppThemeMode.LIGHT -> LightColorScheme
        AppThemeMode.DARK -> DarkColorScheme
        AppThemeMode.AMOLED -> AmoledColorScheme
        AppThemeMode.SYSTEM -> if (isSystemDark) AmoledColorScheme else LightColorScheme
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            val isLight = themeMode == AppThemeMode.LIGHT || (themeMode == AppThemeMode.SYSTEM && !isSystemDark)
            val insetsController = WindowCompat.getInsetsController(window, view)
            insetsController.isAppearanceLightStatusBars = isLight
            insetsController.isAppearanceLightNavigationBars = isLight
        }
    }

    CompositionLocalProvider(LocalThemeMode provides themeMode) {
        MaterialTheme(
            colorScheme = activeColorScheme,
            typography = Typography,
            content = content
        )
    }
}
