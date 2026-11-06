# DevOps Interview Bootcamp

Plataforma local de entrenamiento intensivo para entrevistas de **Trainee / Junior DevOps, Cloud Engineer, Infrastructure Engineer y DevOps Support**. No es un curso de lectura: combina práctica en terminal, laboratorios con validación, repetición espaciada, escenarios de incidentes y simulacros de entrevista.

Funciona **sin backend, sin build y sin costo**: es una SPA estática que se abre en el navegador y guarda todo en `localStorage`. La IA es opcional.

**Demo en vivo:** https://iaioflc4-hub.github.io/devops-interview-bootcamp/

---

## Inicio rápido

1. Abrí `index.html` con Chrome o Edge (doble clic).
2. La primera vez arranca en el **Panel**. Seguí "Continuar" para entrar al primer módulo.
3. Si el navegador restringe el almacenamiento local con `file://`, serví la carpeta:

```bash
python -m http.server 8080
# luego abrí http://localhost:8080
```

Requisitos: navegador moderno (Chrome/Edge/Firefox). Node.js solo hace falta para las herramientas de validación. WSL2/Ubuntu son opcionales y se usan en las misiones "máquina real".

---

## Qué incluye

| Componente | Cantidad | Descripción |
| --- | --- | --- |
| Módulos | 29 | Cinco bloques: LFCS, 701 ingeniería, 702 contenedores, 703 Kubernetes + Terraform, 704 seguridad y observabilidad |
| Objetivos LPI 701-200 | 15/15 | Dominios 701, 702, 703 y 704 cubiertos con pesos oficiales (60 puntos) |
| Tarjetas de repaso | 145 | Motor SM-2 adaptado al plan intensivo, con intervalos cortos |
| Preguntas de entrevista | 150 | Abiertas, multiple choice, comandos, escenarios, YAML y diseño |
| Laboratorios | 31 | Terminal simulado, misiones reales validadas y ejercicios guiados |
| Escenarios de troubleshooting | 12 | Incidentes con evidencia, causa raíz y resolución |
| Clases de biblioteca | 24 | Material Linux del Diplomado UTN-FRD extraído de `Curso_Linux_UTN.html` |
| Proyecto final | 21 ítems | Mini DevOps Pipeline con checklist evaluable en 5 secciones |

Cada módulo incluye objetivos, teoría técnica, comandos con ejemplo, uso real, laboratorio, desafío con criterios, errores frecuentes, criterios de dominio y preguntas asociadas.

## Alineación con LPI DevOps Tools Engineer 701-200

El plan usa los cuatro dominios oficiales del examen (v2.0) como columna vertebral y agrega los prerrequisitos prácticos y los complementos que el examen no cubre pero el trabajo sí.

| Bloque | Cobertura | Peso LPI |
| --- | --- | --- |
| Día 1 · Fundamentos Linux (LFCS) | Almacenamiento y LVM, systemd y timers, permisos, procesos, texto y redes | prerrequisito |
| Día 2 · 701 Software Engineering | 701.1 diseño de servicios, 701.2 plataformas cloud, 701.3 Git, 701.4 CI/CD, 701.5 licencias | 20 |
| Día 3 · 702 Application Container | 702.1 Docker y Podman, 702.2 Compose, 702.3 imágenes OCI y registries | 13 |
| Día 4 · 703 Kubernetes + Terraform | 703.1 arquitectura, 703.2 operación, 703.3 Helm y Kustomize; Terraform e IaC de equipo | 13 |
| Día 5 · 704 Security & Observability | 704.1 seguridad cloud native, 704.2 Prometheus, 704.3 logs, 704.4 trazas, troubleshooting y entrevista | 14 |

Los 15 objetivos del examen están cubiertos. `tools/validate.js` falla si falta uno, si un módulo no declara su track o si los pesos no suman 60. LFCS y Terraform quedan marcados como prerrequisito y complemento, no como objetivos oficiales.

### Secciones de la aplicación

- **Panel**: día actual, progreso global, repaso pendiente, temas débiles, preparación por rol.
- **Ruta**: los 5 bloques (LFCS + dominios 701–704) con sus módulos, peso LPI y avance.
- **Repaso**: cola de tarjetas con "Otra vez / Difícil / Bien / Fácil", atajos de teclado (Espacio para revelar, 1–4 para calificar), resumen al terminar la sesión y próximos vencimientos.
- **Laboratorios**: terminal simulado con filesystem realista (`/etc`, `/var/log`, Docker y kubectl simulados), misiones en WSL2 con validación de evidencia y ejercicios guiados de Dockerfile, Compose, Actions, Terraform, Kubernetes, Helm, licencias, PromQL, logs, trazas y DevSecOps.
- **Terminal**: entorno libre simulado con historial (↑/↓), autocompletado con Tab, Ctrl+L para limpiar, Ctrl+C para cancelar y sugerencia ante comandos mal escritos.
- **Troubleshooting**: 12 incidentes (502, CrashLoopBackOff, DNS, disco lleno, permisos, OOMKilled, TLS vencido, fstab roto, etc.).
- **Entrevista**: simulacro adaptativo con puntaje por dimensión (precisión 30%, resolución 25%, troubleshooting 20%, arquitectura 15%, comunicación 10%), fortalezas, brechas y readiness por rol.
- **Tutor**: diálogo socrático sobre cada módulo, con o sin IA.
- **Analítica**: precisión por categoría, estado de tarjetas, constancia de 30 días, historial de entrevistas.
- **Biblioteca**: las 24 clases de Linux con teoría, comandos y laboratorios originales.
- **Notas**: chuletas por día y notas personales en Markdown.
- **Proyecto**: checklist del pipeline completo con evaluación.
- **Ajustes**: perfil, fecha de inicio, IA opcional, export/import de backup y borrado.

---

## Flujo diario recomendado (2–3 h)

1. Panel → leer el objetivo del día.
2. Dos o tres módulos: teoría breve, comandos y **marcar estudiado solo después de practicar**.
3. Laboratorio del módulo (simulado o en tu máquina).
4. Repaso de tarjetas: 10–15 minutos, respondiendo en voz alta antes de revelar.
5. Si queda tiempo: escenario de troubleshooting o simulacro de entrevista.

La última sesión de cada día conviene hacerla de repaso: el motor programa intervalos de 10 min, 20 min, 8 h, 1 día y 2 días.

---

## Estructura del proyecto

```
index.html                  Shell de la SPA
css/app.css                 Interfaz oscura, responsive, sin dependencias
js/core/md.js               Renderizador Markdown seguro
js/core/store.js            Persistencia, SM-2, métricas y ranking
js/core/terminal.js         Terminal simulado (filesystem virtual)
js/core/ai.js               Adaptador opcional compatible con OpenAI
js/ui/app.js                Router y todas las vistas
js/data/curriculum.js       5 bloques y 20 módulos base + chuletas
js/data/curriculum-lpi.js   Ampliación LPI 701-200: 9 módulos nuevos y mapa de objetivos
js/data/flashcards.js       145 tarjetas
js/data/interview.js        150 preguntas
js/data/labs.js             31 laboratorios, 12 escenarios y proyecto
js/data/linux-course.js     Biblioteca extraída del HTML original (generada)
tools/extract-course.js     Regenera la biblioteca desde Curso_Linux_UTN.html
tools/validate.js           Valida datos, SM-2 y labs de terminal
INSTALLATION.md, ARCHITECTURE.md, LAB_GUIDE.md,
SECURITY.md, TROUBLESHOOTING.md, PUBLISHING.md   Documentación y guía de publicación
```

Verificación:

```bash
node tools/validate.js
```

Comprueba integridad de referencias, cobertura de los 15 objetivos LPI y pesos (60), 145 tarjetas, 150 preguntas, 31 labs, 12 escenarios, regex de validación, SM-2 (intervalos y persistencia), Markdown y los 4 laboratorios de terminal de punta a punta.

---

## Privacidad y seguridad

- Todo el progreso vive en **este navegador** (`localStorage`, clave `devops-bootcamp-v1`). No hay cuentas ni telemetría.
- El terminal integrado es **simulado**: no ejecuta comandos reales.
- Las misiones reales las ejecutás vos; la app solo valida el texto que pegás.
- La app no pide `sudo`, claves SSH ni credenciales cloud. Si configurás IA, la API key se guarda localmente y se envía solo al endpoint elegido.

Ver `SECURITY.md` para el detalle.

---

## Limitaciones conocidas

1. **No hay ejecución real de comandos desde el navegador.** El terminal es didáctico y las misiones reales usan validación de evidencia. Un backend local con WSL2/Docker quedó fuera del alcance por seguridad (ver `ARCHITECTURE.md`, "Ejecución real").
2. **La evaluación sin IA es determinística**: cobertura de conceptos y palabras clave, no semántica. La IA opcional mejora el feedback, no la nota base.
3. **Progreso local**: si se limpia el almacenamiento del navegador, se pierde. Exportá un backup desde Ajustes.
4. **Un solo usuario**: no hay sincronización entre dispositivos.
5. Los laboratorios de Kubernetes/Docker reales requieren instalar Docker Desktop, minikube/kind o k3s; la app guía, no instala.
6. La biblioteca Linux es material del curso original: se ofrece como referencia, no como parte evaluada del plan DevOps.
7. El plan pasó de 4 a 5 días. Un backup viejo migra `planDays` automáticamente al cargarse.
8. Los laboratorios nuevos de LVM, timers, licencias, Helm, logs y trazas son guiados o manuales: el terminal simulado no implementa esas herramientas.
9. Se puede compartir el contenido por web o empaquetar como app Android sin reescribir la app; ver `PUBLISHING.md` para el análisis y las etapas.

---

## Inspiración y referencias

Revisé proyectos open source parecidos y adopté ideas que encajan con esta plataforma. La implementación es propia: no se copió código de esos repositorios.

- [skillcoco/skillcoco](https://github.com/skillcoco/skillcoco) (MIT): motor SM-2, laboratorios con validación determinística y tutor con API key propia. Confirmó el enfoque local-first y la separación entre evaluación automática y opcional por IA.
- [joegsuero/terminal-playground](https://github.com/joegsuero/terminal-playground) (MIT): lecciones progresivas con ayuda contextual. Inspiró las pistas por check y el `help` del simulador.
- [thomasloupe/SimulaCLI](https://github.com/thomasloupe/SimulaCLI): historial con flechas, autocompletado con Tab, Ctrl+C y operadores de shell. Inspiró la UX del terminal.
- [bregman-arie/devops-exercises](https://github.com/bregman-arie/devops-exercises): banco de ejercicios organizado por tema y dificultad. Referencia para la estructura del banco de preguntas.
- [kamranahmedse/developer-roadmap](https://github.com/kamranahmedse/developer-roadmap): progreso por nodos de una ruta. Inspiró la vista de ruta y el cálculo de avance.

## Material de origen

- `DepOpsApp.txt`: especificación funcional de la plataforma.
- `Curso_Linux_UTN.html`: manual del Diplomado Linux UTN-FRD. `tools/extract-course.js` extrae sus 24 clases a `js/data/linux-course.js`; regeneralo con `node tools/extract-course.js`.
