# Documentación Técnica y Manuales (`docs/`)

Este directorio alojará los manuales finales del sistema y las guías rápidas de adaptación:

## Guía Rápida para Aplicar Modificaciones de COTATUR tras la Reunión

Toda la estructura del formulario ha sido parametrizada en [`apps/web-turista/js/config.js`](../apps/web-turista/js/config.js) para que cualquier cambio solicitado por COTATUR se aplique editando un único archivo de configuración:

1. **Agregar o modificar Puntos de Control QR:**
   - Editar el objeto `PUNTOS_CONTROL_QR` en `apps/web-turista/js/config.js` o insertar la fila en la tabla `puntos_captura` de Supabase.
2. **Agregar o cambiar Motivos de Viaje:**
   - Editar el arreglo `MOTIVOS_VIAJE` en `apps/web-turista/js/config.js`.
3. **Agregar o cambiar Tipos de Alojamiento:**
   - Editar el arreglo `TIPOS_ALOJAMIENTO` en `apps/web-turista/js/config.js`.
4. **Modificar Criterios de Evaluación (Escala 1 al 5):**
   - Editar el arreglo `CRITERIOS_EVALUACION` en `apps/web-turista/js/config.js`.
