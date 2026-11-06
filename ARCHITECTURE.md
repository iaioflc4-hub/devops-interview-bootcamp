# Arquitectura

## Decisión principal

**SPA estática, data-driven, sin build y sin backend.** El objetivo era una plataforma que funcionara en Windows 11 con 8 GB de RAM, WSL2, sin cuentas ni costos, y que pudiera abrirse con doble clic. Un frontend React + backend FastAPI + SQLite habría agregado instalación, procesos y superficie de ataque sin mejorar el aprendizaje.

Tradeoff asumido: sin backend no hay ejecución real de comandos ni sincronización entre dispositivos. Se resuelve con un terminal simulado y misiones reales validadas por evidencia (ver "Ejecución real").

```
index.html
   ├── js/data/*.js        contenido (currículo, tarjetas, preguntas, labs)
   ├── js/core/md.js       render seguro de Markdown
   ├── js/core/store.js    estado + localStorage + SM-2 + métricas
   ├── js/core/terminal.js filesystem virtual + intérprete simulado
   ├── js/core/ai.js       adaptador opcional compatible OpenAI
   └── js/ui/app.js        router hash + vistas + validadores
```

Sin módulos ES ni bundler: scripts clásicos en orden, con globals (`COURSE`, `FLASHCARDS`, `QUESTIONS`, `LABS`, `SCENARIOS`, `PROJECT`, `LINUX_COURSE`, `Store`, `MD`, `SimTerminal`, `AI`). Esto permite abrir con `file://` sin CORS.

## Flujo de datos

```
Datos estáticos ──► Vistas ──► acciones del usuario
                         │
                         ▼
                   Store (memoria)
                         │
                         ▼
              localStorage['devops-bootcamp-v1']
```

- `Store.load()` hace merge de los valores por defecto con lo persistido (tolera versiones viejas).
- Toda mutación llama `Store.save()`.
- `render()` reconstruye la vista desde cero y vuelve a enlazar eventos; el estado de UI efímero (sesión de entrevista, cola de repaso) vive en variables del módulo `app.js`.

## Modelo de estado

```js
{
  settings: { name, startDate, dailyGoalMin, planDays: 5,
              ai: { enabled, baseUrl, model, apiKey } },
  progress: { [moduleId]: { studied, studiedAt, challenges: { [i]: bool } } },
  sr:       { [cardId]: { ease, interval, reps, lapses, due, last, lastGrade, history[] } },
  stats:    { answered, correct, byCategory, byTag, byModule },
  interviews: [ { id, date, type, score, breakdown, answers, categories } ],
  labs:     { [labId]: { done, attempts, lastResult, completedAt } },
  troubleshoot: { [id]: { solved, attempts, lastResult } },
  project:  { [itemId]: bool },
  notes:    [ { id, title, body, ts } ],
  xp, streak: { days: [YYYY-MM-DD] }, activity: [ { ts, type, detail } ]
}
```

## Alineación LPI 701-200

El currículo usa los cuatro dominios del examen LPI DevOps Tools Engineer 701-200 v2.0 como columna vertebral:

- **701 Software Engineering** (peso 20): 701.1 diseño de servicios, 701.2 plataformas, 701.3 Git, 701.4 CI/CD, 701.5 licencias.
- **702 Application Container** (peso 13): 702.1 Docker/Podman, 702.2 Compose, 702.3 imágenes OCI.
- **703 Kubernetes** (peso 13): 703.1 arquitectura, 703.2 operación, 703.3 Helm.
- **704 Security and Observability** (peso 14): 704.1 seguridad, 704.2 Prometheus, 704.3 logs, 704.4 trazas.

`js/data/curriculum.js` define los 5 bloques y los 20 módulos base. `js/data/curriculum-lpi.js` agrega los 9 módulos faltantes y aplica `lpi`, `lpiDomain` y `track` a los 29. Cada día declara su peso (20+13+13+14 = 60) y el validador verifica que exista al menos un módulo por objetivo. LFCS es el prerrequisito práctico y Terraform el complemento de IaC; ninguno se presenta como objetivo oficial.

## Repetición espaciada

SM-2 simplificado y adaptado a una preparación intensiva de 5 días:

- Primera exposición: **Difícil 20 min · Bien 8 h · Fácil 1 día**.
- Repasos posteriores: `intervalo × factor` (Difícil 1.2, Bien = facilidad, Fácil = facilidad × 1.35), mínimo 45 min, tope 21 días.
- "Otra vez": intervalo 10 min, `reps = 0`, facilidad −0.2 (piso 1.3).
- La facilidad sube 0.1 con "Fácil" y baja 0.15 con "Difícil", entre 1.3 y 2.9.
- Cada respuesta guarda grado, timestamp y tiempo de respuesta (máx. 60 registros por tarjeta).

La cola prioriza vencidas por fecha y luego tarjetas nuevas por día del currículo. El panel muestra vencidas + nuevas.

## Evaluación

### Laboratorios

Cada lab declara `checks` con un tipo:

- `cmd`: regex sobre el historial del terminal (flag `m` para multilínea).
- `text`: regex sobre un campo de evidencia o sobre el texto consolidado.
- `forbid`: el patrón **no** debe aparecer (por ejemplo `latest` o secretos).

Un lab se marca completo solo si **todos** los checks pasan. Cada check fallido muestra su pista. La evidencia no se inventa: en modo manual el usuario pega salida real.

### Escenarios

Se combinan preguntas de opción múltiple con checks regex sobre la resolución escrita. Se resuelve si **todas** las respuestas son correctas y se detecta al menos el 60% de los pasos de resolución.

### Entrevista

- Adaptativo: sube de nivel con ≥75, baja con <50, dentro de 1–4.
- Preguntas abiertas: cobertura de palabras clave (80%) + extensión mínima (20%); en comunicación se suma estructura ("porque", "ejemplo", "primero", "impacto").
- Ponderación final: precisión 30%, resolución 25%, troubleshooting 20%, arquitectura 15%, comunicación 10%. Las dimensiones sin preguntas se excluyen y los pesos se renormalizan.
- Readiness por rol: derivado del puntaje global con factores por perfil (Trainee 1.18, Junior 0.95, Cloud/Infra 0.88, Support 1.10), acotado a 100.

## Terminal simulado

`SimTerminal` implementa:

- Filesystem virtual en memoria con nodos `dir`/`file`, dueños, grupos y modos.
- Rutas absolutas/relativas, `.`, `..`, `~` (vía cwd por defecto).
- Pipes (`|`), redirección (`>`, `>>`, `2>&1`) y `tee`.
- Comandos de navegación, archivos, texto, sistema, red, Docker y kubectl simulados.
- Estado ficticio de servicios (`nginx`, `ssh`, `miapp`, `cron`) y procesos con PIDs estables.
- `reset()` restaura el estado inicial; `snapshot()` expone modos y servicios para futuras validaciones por filesystem.

**No hay `child_process`, ni shell, ni acceso al sistema.** El diseño es deliberadamente cerrado.

## Ejecución real (limitación consciente)

La especificación pedía terminal real con WSL2 o contenedores. Se optó por **no** incluir un puente de ejecución por:

- Requeriría un backend local con permisos de shell, superficies de ataque y riesgos de comandos destructivos.
- El navegador no puede acceder al SO de forma segura.
- La app debía seguir siendo útil sin instalación.

Alternativa implementada, permitida por la especificación: **misiones manuales con validación de evidencia**. El usuario ejecuta comandos de solo lectura o de laboratorio en su Ubuntu/WSL2, pega la salida y el validador comprueba que la evidencia corresponde a lo pedido. Los pasos destructivos están marcados y limitados a rutas de prueba (`/tmp/lab-*`).

Extensión posible: backend local en Node con allowlist de comandos, ejecución en contenedor efímero y confirmación explícita. No se implementó por costo/riesgo.

## IA opcional

`js/core/ai.js` es un adaptador mínimo para APIs compatibles con OpenAI (`POST /chat/completions`). Se activa desde Ajustes con base URL, modelo y clave. Si falla (sin red, CORS, 401, timeout de 25 s), la vista muestra el error y la evaluación determinística sigue funcionando. Ninguna función central depende de IA.

Riesgo asumido y documentado: la clave vive en `localStorage` y se envía desde el navegador; para uso serio conviene un proxy propio. Ver `SECURITY.md`.

## Renderizado seguro

`MD.md` escapa HTML antes de interpretar Markdown y solo permite enlaces `http(s)`. El contenido es local y propio, pero la disciplina evita XSS si en el futuro se agregan notas o contenido importado.

## Decisiones descartadas

| Alternativa | Por qué no |
| --- | --- |
| React + Vite + Tailwind | Requiere `npm install`, build y ~300 MB de dependencias; no aporta al objetivo |
| FastAPI + SQLite | Instalación y proceso extra; sin ejecución real no hay beneficio frente a localStorage |
| xterm.js | Dependencia externa y necesidad de backend para comandos reales; el simulador propio cubre el objetivo didáctico |
| Chart.js | Los gráficos necesarios (barras, anillo, heatmap) son CSS puro |
| Backend con shell | Riesgo de seguridad desproporcionado para una app de estudio |

## Puntos de extensión

1. Agregar tarjetas/preguntas/labs: editar `js/data/*.js` respetando los esquemas; `node tools/validate.js` detecta referencias rotas.
2. Nuevo comando de terminal: agregar un `case` en `runSimple` y probarlo en el validador.
3. Nueva vista: `case` en `render()` y `data-route` en el nav.
4. Backend real: implementar un endpoint local y reemplazar `SimTerminal.exec` por una llamada con confirmación; mantener el modo simulado como fallback.
