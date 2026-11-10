package com.cotatur.simat

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.cotatur.simat.ui.theme.AppThemeMode
import com.cotatur.simat.ui.theme.SIMATCOTATURTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            var currentTheme by remember { mutableStateOf(AppThemeMode.AMOLED) }

            SIMATCOTATURTheme(themeMode = currentTheme) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MainNavigation(
                        currentTheme = currentTheme,
                        onToggleTheme = {
                            currentTheme = when (currentTheme) {
                                AppThemeMode.AMOLED -> AppThemeMode.LIGHT
                                AppThemeMode.LIGHT -> AppThemeMode.DARK
                                AppThemeMode.DARK -> AppThemeMode.AMOLED
                                AppThemeMode.SYSTEM -> AppThemeMode.AMOLED
                            }
                        }
                    )
                }
            }
        }
    }
}
