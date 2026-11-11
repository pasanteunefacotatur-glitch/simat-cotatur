# Reglas de Proyecto: SIMAT-COTATUR (Corporación Tachirense de Turismo)

> **Ámbito:** Exclusivo para este repositorio (`Proyecto Pasantia Britney`).  
> **Objetivo:** Definir la metodología, alcance técnico y exclusión de herramientas no pertinentes para este proyecto, sin alterar la configuración global de otros proyectos del usuario.

---

## 1. Metodología Oficial: Superpowers Framework (Jesse Vincent / obra)
* **Ingeniería Disciplinada (TDD):** Todo cambio funcional debe verificarse contra los endpoints reales (Supabase REST/RPC) o el build móvil antes de darse por completado.
* **Depuración Sistemática:** Diagnóstico directo de la causa raíz examinando respuestas HTTP, trazas de logs y código fuente. Cero conjeturas.
* **Cero Burocracia / Cero Slop:** No utilizar ni invocar roles teóricos de EGM (*Hostile Critic, Pedantic Auditor, etc.*). El desarrollo es directo, atómico y centrado en la experiencia de usuario real.

---

## 2. Herramientas y Plugins Excluidos para este Proyecto
Para mantener el contexto limpio y enfocado, **en este proyecto NO se deben activar ni invocar**:
* **`egm` (Elephant & Goldfish Model):** Descartado para este repositorio.
* **`science` (Bioinformática / Ciencias Moleculares):** Herramientas médicas/moleculares (AlphaFold, PyMOL, PDB, NCBI, etc.) no tienen pertinencia en este proyecto turístico.
* **`ingenieria-covenin-construccion`:** Normas de ingeniería sismorresistente ajenas a este software.
* **`firebase`:** Este proyecto opera soberanamente sobre **Supabase (PostgreSQL)**, no sobre Google Firebase.
* **`vercel`:** El despliegue se gestiona mediante GitHub Pages y Supabase Storage.

*(Estas herramientas permanecen intactas en la máquina para otros proyectos del usuario que sí las requieran).*

---

## 3. Stack Tecnológico Oficial y Autorizado
1. **Móvil Android:**
   * Kotlin 2.0+, Jetpack Compose, Material 3, Coroutines, Flow.
   * Almacenamiento local SQLite/Room con arquitectura *Offline-First*.
   * Actualizaciones remotas automáticas OTA contra Supabase Storage (`version.json`).
2. **Web Turista y Web Supervisor:**
   * HTML5, Tailwind CSS, JavaScript modular (ESM), diseño estricto *Mobile-First*.
   * Compatibilidad total con pantallas táctiles, selectores Bottom Sheet y autocompletado en 0 ms.
3. **Backend y Seguridad:**
   * Supabase Cloud (PostgreSQL 15, RLS, RPCs soberanas).
   * Roles institucionales: `ENCUESTADOR`, `SUPERVISOR`, `ADMIN`.

---

## 4. Reglas Críticas de Calidad
* **Límite de Modularidad:** Ningún archivo de código debe superar las **500 líneas**. Si un módulo crece, debe subdividirse en componentes especializados.
* **Trazabilidad Institucional:** Mantener siempre la identidad visual y los créditos oficiales de COTATUR, la Gobernación Bolivariana del Táchira y la UNEFA.
