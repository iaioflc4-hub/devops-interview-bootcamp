# Diagnóstico de la aplicación

Problemas de uso de la plataforma. Para incidentes técnicos de DevOps, usá los escenarios dentro de la app.

## La app abre atenuada con un recuadro vacío en el centro

Era un bug de CSS: el `display: grid` del backdrop del modal pisaba el atributo `hidden`, así que el modal vacío quedaba visible y su capa oscura bloqueaba los clics. Ya está corregido con `.modal-backdrop[hidden] { display: none; }` en `css/app.css`.

Si lo ves en una copia vieja, actualizá `css/app.css` y recargá con `Ctrl + Shift + R` para saltar la caché. Verificá también que `npm`/servidor no esté sirviendo una versión anterior.

## La página queda en blanco

1. Abrí la consola del navegador con `F12` → pestaña Console.
2. Si dice `Failed to load resource`, falta un archivo. Verificá que existan:
   - `js/data/linux-course.js`
   - `js/data/curriculum.js`
   - `js/data/flashcards.js`
   - `js/data/interview.js`
   - `js/data/labs.js`
   - `js/core/md.js`
   - `js/core/store.js`
   - `js/core/terminal.js`
   - `js/core/ai.js`
   - `js/ui/app.js`
3. Si el primer archivo faltante es `linux-course.js`, regeneralo: `node tools/extract-course.js`.
4. Si no hay errores y el panel no aparece, probá con `http://localhost:8080` en lugar de `file://`.

## El progreso no persiste

- El modo incógnito y algunas políticas de navegador bloquean `localStorage`.
- Abrir con `file://` puede tener comportamiento distinto según el navegador; serví con `python -m http.server`.
- Verificá en DevTools → Application → Local Storage que exista `devops-bootcamp-v1`.
- Si usás otro navegador u otro puerto, es otro origen: los datos no se comparten. Exportá e importá.

## Perdí el progreso

- Revisá si hay un JSON exportado en Descargas (`devops-bootcamp-*.json`).
- Ajustes → Importar → seleccionar el archivo.
- Sin backup no es posible recuperarlo: no hay servidor ni copia remota.

## La importación falla

- El archivo debe ser el JSON exportado por esta app.
- Un JSON truncado o editado a mano puede ser inválido; probá con un editor para confirmar que cierra correctamente.
- La importación reemplaza el progreso actual. Exportá antes.

## Un laboratorio no valida aunque hice los pasos

- Leé la pista de cada check en rojo.
- En el terminal simulado, los checks miran el **historial de comandos** y el orden importa: repetí el comando exacto que indica la pista.
- Si reiniciaste el entorno, el historial se limpia: volvé a ejecutar los comandos.
- En misiones manuales, pegá la salida completa: recortar líneas suele eliminar el patrón esperado.
- Los checks de "forbid" fallan si aparece un patrón prohibido (por ejemplo `latest` o `password:` en un Dockerfile).
- La validación es intencionalmente estricta; no es un bug que no acepte una variante muy distinta.

## El terminal dice "command not found"

El simulador soporta un subconjunto de comandos. Escribí `help` para ver la lista. Si necesitás uno no soportado:

- Usá una misión real en tu Ubuntu/WSL2.
- O documentá la limitación en tus notas.

Errores habituales:

- `chmod` simbólico parcial: usá octal (`chmod 2770`) o `g+s`.
- `awk` solo soporta `{print $N}` y conteos simples.
- Redirecciones `2>` sin `2>&1` al final pueden no comportarse como en bash real.
- `&&` no está implementado: ejecutá los comandos por separado.

## Los servicios simulados no cambian

`systemctl` afecta solo el estado virtual de `nginx`, `ssh`, `miapp` y `cron`. `systemctl daemon-reload` u operaciones no soportadas devuelven un mensaje explícito. `reset` restaura todo.

## El botón "Reiniciar entorno" borra lo que escribí

Sí: reconstruye el filesystem virtual y limpia el historial. Guardá la evidencia que necesites antes de reiniciar.

## La entrevista no avanza o el puntaje parece bajo

- Las preguntas abiertas se evalúan por cobertura de conceptos. Respuestas muy cortas o sin los términos técnicos clave puntúan bajo aunque la idea sea correcta.
- Revisá "Faltó mencionar" para ver qué esperaba el evaluador.
- La respuesta modelo se muestra siempre después de responder.
- Si una dimensión no tuvo preguntas, se excluye del cálculo y los pesos se renormalizan.

## La IA no funciona

- Verificá que esté habilitada, con base URL, modelo y clave completos (Ajustes).
- Errores `401`: clave inválida o sin permisos.
- Errores `429`: límite de cuota del proveedor.
- Error de red o CORS: el proveedor no permite llamadas desde el navegador. Probá otro endpoint compatible o usá la evaluación sin IA.
- `Timeout de la IA`: el adaptador corta a los 25 segundos.
- La app sigue funcionando sin IA: el feedback determinístico no depende de ella.

## No puedo descargar el backup

- Bloqueador de descargas o política del navegador. Probá con `http://localhost:8080`.
- Copiá manualmente el contenido: DevTools → Application → Local Storage → `devops-bootcamp-v1`.

## La app se ve distinta o sin estilos

- Verificá que `css/app.css` exista y se cargue (Network en DevTools).
- No hay Tailwind ni CDN: si un bloqueador elimina hojas externas, esta app no depende de ellas.

## Chrome muestra un error de archivo local

Algunas políticas empresariales bloquean `file://`. Serví la carpeta:

```bash
python -m http.server 8080
```

## Cómo verificar que la instalación está sana

```bash
node tools/validate.js
```

Debe imprimir el resumen (29 módulos, 145 tarjetas, 150 preguntas, 31 labs, 12 escenarios) y terminar en `OK: todas las validaciones pasaron.` Si hay errores, indican el id exacto del dato o del lab afectado.
