# Reglas R8 / ProGuard para SIMAT-COTATUR (Release)

# Preservar destinos Navigation 3 (@Serializable NavKey) y modelos locales
-keep @kotlinx.serialization.Serializable class com.cotatur.simat.** { *; }
-keepclassmembers class com.cotatur.simat.NavigationKeysKt { *; }
-keep class com.cotatur.simat.*Dest { *; }
-keep class com.cotatur.simat.*Dest$Companion { *; }
-keep class com.cotatur.simat.data.local.** { *; }

# kotlinx.serialization
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt
-keepclassmembers class kotlinx.serialization.json.** { *** Companion; }
-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}
-keep,includedescriptorclasses class com.cotatur.simat.**$$serializer { *; }
-keepclassmembers class com.cotatur.simat.** { *** Companion; }

# Google Credential Manager & Google Identity
-keep class androidx.credentials.** { *; }
-keep class com.google.android.libraries.identity.googleid.** { *; }
-dontwarn com.google.errorprone.annotations.**
