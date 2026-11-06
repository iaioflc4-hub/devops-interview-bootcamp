# Publicación web y Android: debug y viabilidad

Este documento cierra dos pedidos: (1) la sesión de debug posterior a la reestructuración del currículo según LPI DevOps Tools Engineer 701-200 y (2) el análisis de dificultad para publicarlo como webapp para compartir y como app Android.

Fecha del análisis: noviembre de 2026. Los esfuerzos son estimaciones para **un desarrollador con experiencia en el stack**, no compromisos de cronograma.

---

## 1. Sesión de debug

### Qué se ejecutó

| Chequeo | Resultado |
| --- | --- |
| `node --check` sobre los 10 scripts | OK |
| `node tools/validate.js` | OK · 29 módulos · 139 tarjetas · 150 preguntas · 31 labs · 12 escenarios |
| Cobertura LPI y pesos | OK · 15/15 objetivos · pesos 20+13+13+14 = 60 |
| Chrome headless sobre `#/dashboard` | OK · renderiza "Día 1 de 5" y "Fundamentos Linux (LFCS)" |
| Chrome headless sobre `#/roadmap` | OK · 29 módulos y etiquetas de dominio |
| Chrome headless sobre `#/module/lpi703-helm` | OK · objetivo 703.3 y teoría |
| Chrome headless sobre `#/lab/lab-lfcs-storage` | OK · briefing y validación de evidencia |

No hay suite E2E ni tests de UI; la verificación de navegador es un smoke test de renderizado, no una prueba de cada interacción.

### Defectos encontrados y corregidos

1. **Off-by-one al navegar al día siguiente.** `viewModule` usaba `DATA.days[m.day]`, pero `m.day` empieza en 1 y el array en 0: desde el último módulo del día 1 se abría el día 3. Se reemplazó por `dayById(m.day + 1)`.
2. **Cifras del plan hardcodeadas.** El chrome, el panel, la ruta, el repaso, los labs, el modal de ayuda y la biblioteca repetían "4 días", "20 módulos", "23 laboratorios" y "12 incidentes". Ahora salen de `DATA.days.length`, `DATA.modules.length`, `DATA.labs.length` y `DATA.ts.length`.
3. **`planDays` quedaba en 4 para usuarios existentes.** Un backup viejo recortaba el día 5 (`Store.dayNumber()` clampa al plan). Se agregó migración en `Store.load()`: si `planDays < 5`, se eleva a 5.
4. **Error de sintaxis al insertar labs.** El último objeto de `LABS` no tenía coma final y la inserción quedó pegada: `node --check` lo detectó en la línea 509 y se corrigió. El validador no se ejecutó hasta tanto, porque el archivo no cargaba.
5. **Módulos nuevos sin respaldo de datos.** El validador exige al menos una tarjeta por módulo y labs existentes. Se agregaron 18 tarjetas, 20 preguntas y 9 laboratorios para los módulos nuevos.
6. **El validador no protegía la alineación LPI.** Ahora falla si falta un objetivo 701.1–704.4, si un módulo no declara `lpi`/`track`/`lpiDomain` o si los pesos de los días no suman 60.

### Riesgos residuales (conocidos, no bloqueantes)

- **Sin ejecución real de comandos**: el terminal es simulado y los labs nuevos (LVM, timers, Helm, logs, trazas, licencias, Terraform de equipo) son guiados o manuales. Es una decisión de seguridad documentada, no un bug.
- **Progreso local**: `localStorage` con clave `devops-bootcamp-v1`. Cambiar de origen (por ejemplo de `file://` a `https://`) pierde el progreso si no se exporta antes.
- **Simulador incompleto para el material nuevo**: `lvm`, `helm`, `otelcol` y `syft` no existen en `SimTerminal`; por eso esos labs no son de terminal.
- **Carga inicial**: `js/data/linux-course.js` (168 KB) se carga siempre aunque el usuario no abra la biblioteca.
- **IA opcional**: la API key vive en `localStorage` y viaja desde el navegador. Aceptable en uso local; inaceptable para una web pública sin proxy.
- **Sin CSP ni cabeceras de seguridad**: se pueden agregar en el hosting estático.
- **Accesibilidad y mobile**: no se auditó con lector de pantalla ni con dispositivo real; el CSS es responsive pero las tablas y el terminal denso necesitan revisión táctil.

---

## 2. Webapp para compartir

### Punto de partida

La app ya es una SPA estática sin build: hash routing, datos en archivos JS y estado en `localStorage`. Eso es una ventaja enorme para publicar. Tamaño actual de la app (sin imágenes): ~0,7 MB sin comprimir, dominado por contenido (currículo, tarjetas, preguntas, labs y biblioteca Linux).

### Opción A — Web estática + PWA (recomendada para empezar)

**Dificultad: baja. Esfuerzo: 2–4 días.**

Qué falta:

1. Publicar la carpeta en Cloudflare Pages, Netlify, Vercel o GitHub Pages (HTTPS y CDN gratis en los planes básicos).
2. `manifest.webmanifest` con nombre, colores, íconos 192/512 y `display: standalone`.
3. `sw.js` con cache del app shell y estrategia cache-first para datos estáticos, versión de caché por release y fallback offline.
4. Revisar rutas relativas: el hash routing ya funciona sin rewrites.
5. Página de privacidad y aviso de que el terminal es simulado.
6. Lazy-load de `linux-course.js` (168 KB) y, si se quiere, de los bancos de preguntas.
7. Cabeceras: CSP, `X-Content-Type-Options`, `Referrer-Policy`.
8. Desactivar la IA o moverla a un proxy propio; nunca publicar una clave.

Ventajas: conserva el modelo local-first, costo casi cero, sin cuentas ni base de datos, despliegue en minutos. Limitación: el progreso no se comparte entre dispositivos y se pierde si el usuario limpia el navegador (ya existe export/import).

### Opción B — Cuentas y sincronización

**Dificultad: media. Esfuerzo: 2–3 semanas.**

Arquitectura mínima:

- Auth (magic link o email/contraseña) con Supabase, Firebase o Clerk.
- Postgres con tablas `profiles`, `progress`, `sr_cards`, `lab_results`, `interviews`, `notes` y políticas RLS por usuario.
- Abstraer `Store` detrás de un repositorio: hoy es síncrono y escribe `localStorage` en cada mutación; habría que pasar a escritura local + cola de sincronización y resolver conflictos (last-write-wins por campo o merge por timestamp).
- Mantener modo offline: la app sigue funcionando sin red y sincroniza al reconectar.
- Export/import y borrado de cuenta (requisito de privacidad).

Riesgos: doble fuente de verdad, conflictos de SM-2 entre dispositivos, migraciones de esquema, costo de soporte, y el esfuerzo real de auth/recuperación de cuenta suele subestimarse. No lo haría antes de validar que la gente vuelve.

### Opción C — Plataforma de contenido multiusuario

**Dificultad: alta. Esfuerzo: 4–8 semanas.** Panel de administración, versionado de contenido, roles, métricas de cohortes y moderación. Solo tiene sentido si el objetivo es vender cursos o gestionar varias instituciones.

### Riesgos legales y de contenido (aplican a cualquier opción)

- **Material del Diplomado UTN-FRD**: `Curso_Linux_UTN.html` y su extracción están hoy como referencia local. Para publicar abiertamente hace falta permiso de quien produjo ese material o reemplazarlo.
- **Marcas LPI y LFCS**: se pueden nombrar de forma descriptiva ("alineado con los objetivos de..."), pero no afirmar afiliación, certificación oficial ni usar sus logos sin autorización.
- **Preguntas de examen**: el banco actual es original; no se deben copiar ítems reales de LPI.
- **Datos personales**: con cuentas hay que tener política de privacidad, base legal, retención y borrado; con IA, avisar que el texto se envía a un tercero.

### Costos aproximados

| Ítem | Costo |
| --- | --- |
| Hosting estático + HTTPS | 0 USD (plan gratuito) |
| Dominio propio | ~10–15 USD/año |
| Backend con auth y Postgres | 0–25 USD/mes según uso |
| Proxy de IA | 0–20 USD/mes según tráfico |
| Monitoreo de errores (Sentry free) | 0 USD |

---

## 3. App Android

### Opción A — TWA (Trusted Web Activity) con la PWA

**Dificultad: baja-media. Esfuerzo: 3–5 días + revisión de Google (1–3 días).**

Es la misma web envuelta en una app publicada en Play Store mediante Bubblewrap. Requisitos: PWA en HTTPS, `assetlinks.json` en el dominio, íconos, splash, política de privacidad, ficha de Play y cuenta de desarrollador (25 USD pago único). La app usa Chrome para renderizar; si el usuario no tiene Chrome o el service worker no está listo, la experiencia offline se resiente.

Ventajas: un solo código, actualizaciones sin pasar por review, look nativo aceptable. Limitaciones: sin notificaciones locales nativas (solo web push, que depende de infraestructura), sin acceso a archivos/almacenamiento nativo, y la calidad depende del WebView/Chrome.

### Opción B — Capacitor (WebView empaquetado)

**Dificultad: media. Esfuerzo: 1–2 semanas.**

Empaqueta los assets dentro del APK/AAB, por lo que la app funciona 100% offline sin depender de Chrome. Permite plugins de notificaciones locales (recordatorios de repaso), export/import de archivos, compartir, botón atrás y biometría.

Consideraciones: el almacenamiento del WebView es distinto del navegador, así que hay que ofrecer importar un backup; hay que revisar rendimiento en equipos de gama baja; y sigue siendo una app híbrida (no nativa).

### Opción C — Reescritura nativa (Kotlin/Compose o Flutter)

**Dificultad: alta. Esfuerzo: 8–14 semanas.**

Solo se justifica si el producto necesita algo que la web no da bien: notificaciones confiables, sincronización en background, modo offline estricto, o una experiencia de terminal táctil muy pulida. Hay que reimplementar router, SM-2, persistencia, validador, terminal simulado y las 29 pantallas de contenido. No lo recomiendo para esta etapa.

### Lo que hay que revisar en mobile antes de publicar

- Ancho de 360 px: tablas del currículo, tarjetas y modal de ayuda.
- Terminal: teclado en pantalla, autocompletado, historial y Ctrl+C/L no existen en móvil; definir botones.
- Áreas seguras (notch), landscape, tipografías y tamaños táctiles (44 px mínimo).
- Páginas largas de teoría y 31 labs: navegación y scroll.
- Import/export de backup accesible desde Ajustes.
- Peso de la app: ~0,7 MB de contenido + íconos; aceptable.

### Requisitos de Play Store (verificar los vigentes)

Cuenta de desarrollador, política de privacidad pública, formulario de seguridad de datos, clasificación de contenido, target API reciente, app bundle firmado, capturas y descripción. Para cuentas personales nuevas, Google suele exigir una prueba cerrada con un grupo de testers antes de producción; conviene planificarlo.

---

## 4. Estimación consolidada

| Escenario | Esfuerzo | Dificultad | Riesgo principal |
| --- | --- | --- | --- |
| Web estática para compartir | 1–2 días | Baja | ninguno técnico; falta de difusión |
| Web + PWA offline | 2–4 días | Baja | service worker mal versionado |
| Web + cuentas y sync | 2–3 semanas | Media | conflictos y costo de auth |
| Android TWA | 3–5 días + review | Baja-media | dependencia de Chrome/assetlinks |
| Android Capacitor | 1–2 semanas | Media | almacenamiento y plugins |
| Android nativo | 8–14 semanas | Alta | reescritura completa |
| Revisión legal del contenido | 1 semana + asesoría | Media | permiso del material UTN y marcas |

---

## 5. Recomendación por etapas

1. **Semana 1 — publicar la web estática**: hosting, dominio, PWA, privacidad, sin IA o con proxy. Medir visitas, módulos completados y tarjetas repasadas.
2. **Semana 2 — Android con TWA**: reutiliza la PWA y permite estar en Play Store con esfuerzo mínimo.
3. **Después de datos reales**: si la retención y el pedido de "seguir en otro dispositivo" lo justifican, agregar cuentas y sincronización (2–3 semanas).
4. **No reescribir nativo** hasta tener evidencia de que la experiencia web es el cuello de botella.

### Métricas para decidir la inversión

- Visitas al link compartido y % que completa el primer módulo.
- Retención D1/D7 del repaso espaciado.
- Cantidad de export/import de backups (señal de cambio de dispositivo).
- Pedidos de sync multidispositivo y de notificaciones.
- Errores JS por release (Sentry) y tiempo de carga en 3G/4G.

---

## 6. Supuestos

- Un desarrollador con experiencia en JS/HTML/CSS y conocimientos básicos de Android.
- Se conserva la arquitectura sin build; no se migra a React/Vite.
- El contenido y las preguntas son originales o se cuenta con permiso para publicarlos.
- No se promete soporte 24/7 ni SLA; es un proyecto educativo.
