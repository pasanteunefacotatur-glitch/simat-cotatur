# Registro de Cambios (Changelog) • SIMAT-COTATUR

Todas las modificaciones notables del **Sistema Integrado de Medición y Analítica Turística (SIMAT-COTATUR)** se documentan en este archivo bajo el estándar [Semantic Versioning](https://semver.org/lang/es/).

---

## [v0.5.0-alpha] - 2026-11-08 (Fase Alpha - Consolidación Web y Supervisión Maestro)

### 🚀 Novedades y Características Principales
- **Diapositiva Ejecutiva 16:9 para Ruedas de Prensa:** Incorporación de un modo de presentación en relación de aspecto 16:9 (`1920x1080 px`) con modo pantalla completa y exportación/impresión horizontal directa para videobeams y pantallas LED de la Gobernación del Estado Táchira.
- **Vinculación Estricta Asueto-Calendario:**
  - $0$ eventos hoy: Fija automáticamente `REGULAR` y oculta el selector para evitar errores humanos.
  - $1$ evento hoy: Se selecciona automáticamente ese asueto y despliega sus preguntas específicas sin opciones redundantes.
  - $\ge 2$ eventos hoy: Despliega el selector mostrando **únicamente los asuetos vigentes en la fecha actual**.
- **Asignación de Personal en 2 Columnas (Multipunto):**
  - Columna Izquierda: *Personal Asignado*.
  - Columna Derecha: *Personal Sin Asignar (Disponibles)*.
  - Soporte de relación muchos-a-muchos: un funcionario encuestador puede estar activo en múltiples puntos de control a la vez.
- **Geocerca Perimetral del Estado Táchira y Autodetección de Municipio:**
  - Cálculo geodésico sobre las 29 capitales municipales del Táchira cruzado con OpenStreetMap Nominatim.
  - Bloqueo estricto si el pin se posiciona fuera de los límites del Estado Táchira (Colombia, Mérida, Zulia, Barinas, Apure).
- **Indicador Pasivo por GPS Silencioso:**
  - Establecido un radio de tolerancia operativa de **1.5 km** alrededor del pin de control.
  - Si el encuestador se encuentra en el punto correcto, la interfaz se mantiene 100% limpia sin alertas invasivas.
  - Solo alerta de forma pasiva si el encuestador se encuentra físicamente más cerca de otro punto de control activo registrado.
- **Normalización de Temas Visuales:** Configuración explícita de `darkMode: 'class'` en Tailwind CDN y sincronización completa en Claro (`☀️`), Oscuro LCD (`🌙`) y AMOLED Negro Puro (`⬛`).

---

## [v0.4.0] - 2026-11-08

### Añadido
- Algoritmo astronómico Meeus/Jones/Butcher para el cálculo dinámico de Carnavales y Semana Santa anual.
- Estructura y tabla de encuestas para prestadores de servicios turísticos (`encuestas_prestadores`): hoteles, posadas, restaurantes y capacidad hotelera.
- Creación de RPC `admin_obtener_metricas_gobernador` en PostgreSQL para balance ejecutivo.

---

## [v0.3.0] - 2026-11-07

### Añadido
- Panel de control administrativo y supervisión (`admin.html`).
- Autenticación por Cédula de Identidad con contraseña inicial por defecto igual a la cédula.
- Flujo de primer ingreso obligatorio con vinculación de correo electrónico vía Google.
- Selector interactivo de coordenadas con Leaflet y OpenStreetMap (eliminación de tecleo manual de coordenadas).

---

## [v0.2.0] - 2026-11-05

### Añadido
- Catálogo autocompletable de los 29 municipios del Táchira sin distinción de tildes ni mayúsculas.
- Catálogo priorizado de países emisores y estados de Venezuela.
- Corrección de cronómetro de llenado para que no se reinicie si el usuario omite un campo obligatorio.
- Cola local offline resiliente (`localStorage`) con sincronización automática en eventos `online` y `visibilitychange`.

---

## [v0.1.0] - 2026-10-31

### Añadido
- Arquitectura inicial del proyecto SIMAT-COTATUR.
- Esquema de base de datos relacional en Supabase con Row Level Security (RLS).
- Formulario base de perfil del visitante y generación de código QR para carteleras en peajes.
