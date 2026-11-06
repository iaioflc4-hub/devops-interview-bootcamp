# Seguridad

## Modelo de amenaza

La aplicación es una SPA de estudio, sin backend ni cuentas. Sus activos son:

1. El progreso del usuario (local, no crítico).
2. La API key opcional de IA (si se configura).
3. La integridad del contenido y de las validaciones.
4. El equipo del usuario, que **no** debe ser afectado por la app.

Las amenazas relevantes son: XSS por contenido/notas, robo de la API key, comandos destructivos ejecutados por error y falsos positivos en la validación.

## Lo que la app NO hace

- No ejecuta comandos del sistema: no hay `child_process`, shell, WSL ni Docker desde el navegador.
- No accede a archivos del equipo.
- No solicita ni almacena `sudo`, claves SSH, tokens cloud ni credenciales del sistema.
- No envía telemetría ni datos a servidores propios.
- No instala servicios ni modifica configuración del SO.
- No usa `eval` sobre entrada del usuario.

El terminal integrado es un intérprete propio sobre un filesystem en memoria. Comandos como `rm -rf` solo afectan ese árbol virtual y se reinician con `reset`.

## Superficie de ejecución real

Las misiones "máquina real" son instrucciones para que **el usuario** ejecute en su entorno. La app:

- Marca advertencias en los labs con pasos sensibles.
- Limita los ejercicios a `/tmp/lab-*` o a consultas de solo lectura.
- Nunca pide ejecutar como root comandos de modificación.
- Solo valida el texto pegado; no puede verificar que el comando se haya ejecutado.

Riesgo residual: el usuario puede ejecutar un comando destructivo por iniciativa propia. Mitigación: advertencias explícitas, comandos copiables y alcance acotado. No hay privilegios elevados automáticos.

## Validación y confianza

- La validación es determinística y local; no "simula éxito".
- En el terminal simulado, el resultado refleja el estado virtual, que se muestra claramente como simulado.
- En las misiones reales, la validación comprueba patrones de evidencia; un usuario podría pegar texto inventado. Es un límite aceptado de un entrenador personal: el objetivo es aprender, no auditar.
- Los escenarios y preguntas muestran la respuesta modelo después de responder, para evitar aprendizaje de reflejo sin comprensión.

## API key de IA (opcional)

Si se habilita IA:

- La clave se guarda en `localStorage` en texto plano, en el navegador.
- Se envía en el header `Authorization` al `baseUrl` configurado, directamente desde el navegador.
- No se envía al proyecto ni a terceros distintos del proveedor elegido.
- Cualquier extensión maliciosa del navegador o acceso físico al perfil podría leerla.
- El proveedor puede registrar el contenido enviado (preguntas, respuestas, contexto del módulo).

Recomendaciones:

1. Usá una clave de alcance mínimo y presupuesto limitado.
2. No configures IA en equipos compartidos.
3. Para uso profesional, poné un proxy propio en lugar de llamar al proveedor desde el navegador.
4. Revocá la clave si sospechás acceso.

Desactivar la IA no afecta ninguna función: la app usa evaluación determinística.

## Almacenamiento local

- Clave única `devops-bootcamp-v1`.
- Contiene progreso, notas y, si se configuró, la API key.
- Se borra con "Borrar todo" o limpiando datos del sitio.
- Exportar/importar JSON permite respaldar. El archivo exportado **incluye la API key** si estaba configurada: tratalo como sensible.
- `file://` y `http://localhost:8080` son orígenes distintos y no comparten datos.

## Prevención de XSS

`MD.md`:

- Escapa `& < > " '` antes de renderizar.
- Permite solo enlaces `http://` o `https://` con `rel="noopener noreferrer"`.
- No interpreta HTML crudo del usuario.

Las notas personales pasan por el mismo renderizador. El contenido de datos es estático y propio del proyecto.

## Buenas prácticas para el usuario

- No pegues secretos reales en las evidencias de los laboratorios.
- No ejecutes comandos de la app en producción.
- Revisá cada comando antes de ejecutarlo; en especial `rm`, `chmod`, `kill`, `docker system prune` y `terraform destroy`.
- Mantené un backup exportado antes de cambiar de navegador o equipo.
- Si usás IA, revisá qué información enviás.

## Reporte de problemas

Este proyecto es local y no tiene canal de soporte. Si encontrás una vulnerabilidad, documentá el escenario, el impacto y los pasos de reproducción en el archivo de notas del proyecto antes de compartirlo.
