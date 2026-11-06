# Guía de laboratorios

Los laboratorios son el corazón de la plataforma: teoría sin práctica no se retiene ni se defiende en una entrevista.

En el repaso, `Espacio` o `Enter` revelan la respuesta y `1`–`4` califican (Otra vez, Difícil, Bien, Fácil). Al terminar la cola se muestra un resumen con respuestas, precisión y tiempo.

## Atajos del terminal simulado

| Tecla | Acción |
| --- | --- |
| `↑` / `↓` | Recorrer el historial de comandos |
| `Tab` | Autocompletar comando o ruta; si hay varias opciones, las muestra |
| `Ctrl + L` | Limpiar la pantalla |
| `Ctrl + C` | Cancelar la línea actual |
| `help` | Lista de comandos simulados |
| `reset` | Reiniciar el entorno virtual |

## Tres modos

### 1. Terminal simulado (`terminal`)

Entorno Linux virtual dentro de la app. **No ejecuta comandos reales.** Tiene:

- `/etc` (os-release, fstab, passwd, group, nginx, sshd_config)
- `/var/log` (syslog, auth.log, nginx/access.log con 200 requests y errores 502, error.log)
- `/srv/empresa` para permisos
- `/home/student` con notas y un proyecto
- Servicios ficticios (`nginx` activo, `miapp` caído) y procesos con PIDs
- Docker (`ps`, `images`, `run`, `logs`, `exec`, `inspect`) y kubectl (`get`, `describe`, `logs`, `scale`, `rollout`) simulados

La validación lee el **historial de comandos** del terminal: hay que ejecutar los comandos correctos, no solo leerlos.

| Lab | Qué demuestra |
| --- | --- |
| `lab-fhs` | Navegación, FHS, identificación de distro y disco |
| `lab-permisos` | `mkdir -p`, `chmod 2770`, verificación con `ls -ld` y SGID |
| `lab-procesos` | `ps`, `ss -tulpn`, `systemctl status`, `kill -15` al PID correcto |
| `lab-awk` | `wc -l`, `grep -c`, pipeline `awk | sort | uniq -c`, filtro 5xx |

### 2. Misión en tu máquina (`manual`)

Ejecutás comandos reales en tu Ubuntu/WSL2 y pegás la salida. La app valida patrones de la evidencia (por ejemplo `Active: active`, un digest `sha256:...`, una ACL `user:x:r-x`). No hay ejecución remota: vos controlás cada comando.

| Lab | Entorno | Evidencia esperada |
| --- | --- | --- |
| `lab-servicio` | systemd | `systemctl status` + `journalctl` |
| `lab-acl` | `/tmp/lab-acl` | salida de `getfacl` con usuario y `r-x` |
| `lab-logs` | auth.log o journal | IPs y conteo de intentos fallidos |
| `lab-red` | red pública | `dig`, `nc`, `curl -I` y explicación 502/504 |
| `lab-ssh` | sshd | `sshd -T` con `passwordauthentication` |
| `lab-git` | `/tmp/lab-git` | conflicto resuelto + `git log --graph` |
| `lab-docker-run` | Docker | `curl -I :8080` con 200 y logs de nginx |
| `lab-registry` | Docker + registry | `RepoDigests` con `sha256:` |
| `lab-k8s-deploy` | kind/minikube | pods Running y explicación del ReplicaSet |

Reglas de seguridad para estas misiones:

- Solo lectura salvo indicación explícita.
- Trabajá en `/tmp/lab-*`, nunca en rutas del sistema.
- No uses `sudo` para modificar servicios en los ejercicios de inspección.
- Borrá las claves/archivos de prueba al terminar.
- Si un comando no está disponible, documentá la limitación en la evidencia (la validación exige la salida real).

### 3. Ejercicio guiado (`guided`)

Escribís configuración y se valida estructura y buenas prácticas con regex: Dockerfile multi-stage y no-root, Compose con healthcheck y volumen, workflow de Actions con `needs`/`artifact`/`permissions`, HCL de Terraform, manifiesto de Kubernetes con Service y probes, PromQL + alerta, y diseño DevSecOps.

No ejecuta nada: el objetivo es que puedas **escribir y defender** la configuración.

## Escenarios de troubleshooting (12)

Cada escenario incluye síntoma, contexto, evidencia realista, 2–3 preguntas de diagnóstico, pistas progresivas y una resolución escrita.

| Escenario | Causa raíz |
| --- | --- |
| `ts-502` | Upstream caído: nginx recibe connection refused |
| `ts-crashloop` | Archivo de configuración faltante en la imagen, exit 1 |
| `ts-dns` | `DB_HOST=localhost` en lugar del nombre de servicio |
| `ts-disk` | Log de 38 GB sin rotación llenó `/var` |
| `ts-perm` | Falta bit de ejecución + filesystem montado `noexec` |
| `ts-network` | Host incorrecto entre contenedores |
| `ts-ci` | Test de integración sin servicio Postgres en el runner |
| `ts-oom` | Caché sin límite supera el memory limit, OOMKilled 137 |
| `ts-tls` | Certificado vencido sin renovación automática |
| `ts-fstab` | UUID incorrecto en `/etc/fstab`, emergency mode |
| `ts-load` | NFS lento: procesos en estado D, CPU ociosa |
| `ts-secret` | Access key commiteada y activa, usada desde IP desconocida |

Método esperado en todos: **síntoma → alcance → qué cambió → hipótesis → evidencia → mitigación → causa raíz → prevención**.

Se considera resuelto si acertás todas las preguntas y tu resolución escrita cubre al menos el 60% de los pasos esperados. El informe con causa raíz y comandos se revela al evaluar.

## Cómo aprovechar la validación

- Si un check falla, leé la pista: indica el comando o el dato que falta.
- En el terminal, podés reiniciar el entorno con el botón o el comando `reset`.
- Los checks usan expresiones regulares tolerantes (mayúsculas/minúsculas, flags combinados), pero el comando debe ser reconocible.
- En las misiones manuales, pegá la salida completa del comando: recortarla suele quitar justo el patrón que valida.
- No marques un laboratorio como hecho si solo copiaste la respuesta: en la entrevista te van a pedir el "por qué".

## Proyecto final

`PROJECT` guía el Mini DevOps Pipeline: repositorio → CI → tests → imagen → registry → contenedor → healthcheck → monitoreo. Tiene 21 ítems en 5 secciones con evidencia exigible. El criterio es explícito: **si no podés demostrarlo con un comando, una URL o un log, no está hecho.**

Para la presentación de 3 minutos, usá el orden del diagrama y respondé:

1. ¿Qué dispara el pipeline y qué bloquea el deploy?
2. ¿Cómo se versiona y promueve la imagen?
3. ¿Cómo verificás que el servicio quedó sano?
4. ¿Qué harías si el deploy rompe producción?
5. ¿Dónde mirarías primero si hay errores?
