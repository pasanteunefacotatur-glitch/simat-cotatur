# Sistema Integrado de Medición y Analítica Turística (SIMAT-COTATUR)

Plataforma para la captura, validación, procesamiento y respaldo automatizado de estadísticas de flujo y perfil del visitante para la **Corporación Tachirense de Turismo (COTATUR)**.

---

## 1. Arquitectura General del Proyecto

El sistema opera bajo un esquema desatendido de costo operativo **$0.00 USD/mes**, diseñado para entornos viales y puntos de control con conectividad intermitente o nula:

1. **Canal Web Público (`apps/web-turista/`):**
   - Formulario web ligero y adaptable para autogestión del visitante mediante lectura de códigos QR en peajes, terminales y puntos de interés turístico.
   - Almacenamiento local preventivo (`localStorage` / cola offline) con vaciado automático al detectar conexión (`online` y `visibilitychange`).
   - Sanitización de entradas contra inyección XSS e inyección de fórmulas en hojas de cálculo (`CSV/Excel Injection`).
2. **Núcleo de Base de Datos (`database/01_simat_core_schema.sql`):**
   - Motor relacional en **PostgreSQL 15+ (Supabase)**.
   - Políticas **Row Level Security (RLS)** que bloquean cualquier intento de inserción directa no autorizada desde el rol público (`anon`).
   - Funciones transaccionales `SECURITY DEFINER`:
     - `registrar_encuesta_web(p_datos JSONB)`: Ingesta validada del canal web con idempotencia (`ON CONFLICT DO NOTHING`).
     - `sincronizar_lote_apk(p_funcionario_id UUID, p_encuestas JSONB)`: Sincronización por lotes desde dispositivos móviles con verificación obligatoria de estado (`activo = true`) en la primera línea para revocación remota inmediata.
   - Disparador de servidor (`trg_asignar_temporada_encuestas`): Asigna automáticamente la temporada turística según la marca de tiempo real, evitando desfases por relojes desconfigurados en los dispositivos clientes.
3. **Almacenamiento OTA (`cotatur-app-updates`):**
   - Bucket configurado con restricción estricta de tipo MIME (`application/vnd.android.package-archive`) y límite máximo de `50 MB` para distribución de actualizaciones del aplicativo móvil.

---

## 2. Estructura Modular del Repositorio

Siguiendo el estándar de mantenibilidad del proyecto, **todos los módulos de código fuente se mantienen por debajo de las 500 líneas** y cuentan con documentación interna en español:

```text
├── index.html                                  # Punto de entrada web (GitHub Pages)
├── presentacion_formulario_cotatur.html        # Demostrador local autónomo (sin servidor)
├── .env.example                                # Plantilla de variables de entorno
├── database/
│   └── 01_simat_core_schema.sql                # Esquema PostgreSQL, RLS, Triggers y RPCs
└── apps/
    └── web-turista/
        ├── index.html                          # Contenedor principal PWA
        ├── css/
        │   └── styles.css                      # Reglas de áreas seguras (Safe Areas) y anti-zoom iOS
        └── js/
            ├── config.js                       # Constantes, municipios, estados y puntos QR
            ├── storage.js                      # UUIDv4 anónimo, cronómetro, sanitización y cola offline
            ├── app.js                          # Orquestador de módulos y envío RPC
            └── components/
                ├── Header.js                   # Encabezado institucional y punto de control activo
                ├── StepProcedencia.js          # Sección I: Procedencia nacional o internacional
                ├── StepDestinoPerfil.js        # Sección II: Destino, motivo, grupo y alojamiento condicional
                ├── StepCalificacion.js         # Sección III: Matriz numérica de evaluación (1 al 5)
                └── ModalRecompensa.js          # Comprobante de registro y descarga de guía informativa
```

---

## 3. Parámetros Dinámicos de Punto de Control (URL)

El formulario web detecta automáticamente el punto de control asignado a través del parámetro `?p=` en la URL:

- `?p=PEAJE_TARIBA` → *Peaje Vega de Táriba - Troncal 1*
- `?p=PEAJE_CAMPANA` → *Peaje La Pedrera / La Campana - Troncal 5*
- `?p=TERMINAL_SC` → *Terminal de Pasajeros - San Cristóbal*
- `?p=PUENTE_ATANASIO` → *Puente Internacional Atanasio Girardot*
- `?p=PERIBECA_PUEBLO` → *Punto de Información Turística - Peribeca*
- `?p=CHORRO_EL_INDIO` → *Parque Nacional Chorro El Indio*

---

## 4. Despliegue y Entorno de Pruebas

- **Demostración en Servidor:** `https://pasanteunefacotatur-glitch.github.io/simat-cotatur/`
- **Ejecución Local:** Puede abrirse directamente el archivo `presentacion_formulario_cotatur.html` en cualquier navegador moderno o servirse el directorio raíz mediante cualquier servidor estático (`npx serve .`).
