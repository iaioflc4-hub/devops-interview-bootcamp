/* Laboratorios (modo terminal simulado, misiones en la máquina real y
   ejercicios guiados), escenarios de troubleshooting y proyecto final. */
window.LABS = [
  /* ================= DÍA 1 ================= */
  {
    id: 'lab-fhs', title: 'Explorar el filesystem y el sistema', day: 1, mode: 'terminal',
    minutes: 15, moduleId: 'd1-arquitectura',
    objective: 'Ubicar configuración, logs y datos usando el estándar FHS.',
    briefing: 'Vas a inspeccionar un servidor Linux simulado. La terminal es un entorno de práctica: **no ejecuta comandos en tu máquina**. Usá los comandos para responder dónde vive cada cosa.',
    steps: [
      { text: 'Confirmá tu directorio actual.', cmd: 'pwd' },
      { text: 'Listá el contenido de /etc.', cmd: 'ls /etc' },
      { text: 'Identificá la distribución del sistema.', cmd: 'cat /etc/os-release' },
      { text: 'Consultá el uso de disco de los filesystems.', cmd: 'df -h' },
      { text: 'Buscá archivos .conf dentro de /etc.', cmd: 'find /etc -name "*.conf"' }
    ],
    checks: [
      { type: 'cmd', re: '^\\s*pwd\\s*$', label: 'Usaste pwd', hint: 'Escribí pwd para ver el directorio actual.' },
      { type: 'cmd', re: '^\\s*ls(\\s+-[a-z]+)*\\s+/etc', label: 'Listaste /etc', hint: 'Probá: ls /etc' },
      { type: 'cmd', re: '^\\s*cat\\s+/etc/os-release', label: 'Leíste /etc/os-release', hint: 'cat /etc/os-release' },
      { type: 'cmd', re: '^\\s*df\\s+-h', label: 'Consultaste el disco con df -h', hint: 'df -h' },
      { type: 'cmd', re: '^\\s*find\\s+/etc.*-name', label: 'Buscaste con find', hint: 'find /etc -name "*.conf"' }
    ],
    success: 'Ya sabés ubicar configuración y datos. Ese mapa mental es la base de todo diagnóstico.'
  },
  {
    id: 'lab-servicio', title: 'Misión real: estado y logs de un servicio', day: 1, mode: 'manual',
    minutes: 20, moduleId: 'd1-arquitectura',
    objective: 'Verificar un servicio real en tu Ubuntu/WSL2 y validar la evidencia.',
    briefing: '**Ejecutá estos comandos en tu propia terminal Ubuntu/WSL2** y pegá la salida. Si ssh no está instalado, usá otro servicio presente (cron, dbus). No uses sudo para consultar estado.',
    safety: 'Solo comandos de lectura. No modifiques el servicio.',
    steps: [
      { text: 'Consultá el estado: systemctl status ssh --no-pager', cmd: 'systemctl status ssh --no-pager' },
      { text: 'Verificá si está activo: systemctl is-active ssh', cmd: 'systemctl is-active ssh' },
      { text: 'Leé las últimas líneas del journal: journalctl -u ssh -n 20 --no-pager', cmd: 'journalctl -u ssh -n 20 --no-pager' },
      { text: 'Pegá abajo la salida y explicá en una frase si el servicio está activo.' }
    ],
    fields: [
      { id: 'out', label: 'Salida de los comandos', placeholder: 'Pegá acá la salida de systemctl y journalctl...' },
      { id: 'why', label: 'Conclusión (una frase)', placeholder: 'El servicio ssh está activo/inactivo porque...' }
    ],
    checks: [
      { type: 'text', field: 'out', re: 'Active:|inactive|failed|Loaded:|Main PID', label: 'Pegaste la salida de systemctl status', hint: 'La salida debe incluir Loaded o Active.' },
      { type: 'text', field: 'out', re: 'journal|ssh|Started|Accepted|error|servicio', label: 'Incluiste evidencia del journal', hint: 'Pegá también las líneas de journalctl -u ssh.' },
      { type: 'text', field: 'why', re: '.{20,}', label: 'Escribiste una conclusión', hint: 'Explicá en una frase el estado del servicio.' }
    ],
    success: 'Aprendiste el par de comandos que resuelve la mitad de las guardias: estado + log.'
  },
  {
    id: 'lab-permisos', title: 'Permisos, SGID y aislamiento por grupo', day: 1, mode: 'terminal',
    minutes: 20, moduleId: 'd1-permisos',
    objective: 'Crear una carpeta compartida con SGID usando permisos octales.',
    briefing: 'El servidor simulado ya tiene los grupos y usuarios creados. Tu tarea es crear el árbol corporativo y aplicar la política de permisos.',
    steps: [
      { text: 'Creá el directorio base.', cmd: 'mkdir -p /srv/empresa/compras' },
      { text: 'Aplicá rwx para dueño y grupo, nada para otros, con SGID.', cmd: 'chmod 2770 /srv/empresa/compras' },
      { text: 'Verificá que aparezca la s en el grupo.', cmd: 'ls -ld /srv/empresa/compras' },
      { text: 'Intentá entender qué heredará un archivo nuevo (explicación en el laboratorio).' }
    ],
    checks: [
      { type: 'cmd', re: '^\\s*mkdir\\s+-p\\s+/srv/empresa/compras', label: 'Creaste el árbol con mkdir -p', hint: 'mkdir -p /srv/empresa/compras' },
      { type: 'cmd', re: '^\\s*chmod\\s+2770\\s+/srv/empresa/compras', label: 'Aplicaste chmod 2770', hint: 'chmod 2770 /srv/empresa/compras' },
      { type: 'cmd', re: '^\\s*ls\\s+-l?d?\\s+/srv/empresa/compras', label: 'Verificaste con ls -ld', hint: 'ls -ld /srv/empresa/compras' }
    ],
    success: 'SGID garantiza que todo archivo nuevo herede el grupo de la carpeta: así se comparte sin filtrar entre departamentos.'
  },
  {
    id: 'lab-acl', title: 'Misión real: ACL para una excepción', day: 1, mode: 'manual',
    minutes: 25, moduleId: 'd1-permisos',
    objective: 'Otorgar acceso puntual sin cambiar los grupos del usuario.',
    briefing: 'En tu Ubuntu/WSL2 creá un directorio de prueba en /tmp y aplicá una ACL. Necesitás sudo. Pegá la salida de getfacl como evidencia.',
    safety: 'Trabajá solo en /tmp/lab-acl. Borralo al terminar con rm -rf /tmp/lab-acl.',
    steps: [
      { text: 'Creá el directorio: mkdir -p /tmp/lab-acl', cmd: 'mkdir -p /tmp/lab-acl' },
      { text: 'Verificá el usuario actual con whoami.', cmd: 'whoami' },
      { text: 'Aplicá una ACL: sudo setfacl -m u:$(whoami):r-x /tmp/lab-acl', cmd: 'sudo setfacl -m u:$(whoami):r-x /tmp/lab-acl' },
      { text: 'Mostrá la ACL: getfacl /tmp/lab-acl', cmd: 'getfacl /tmp/lab-acl' },
      { text: 'Borrá el directorio: rm -rf /tmp/lab-acl', cmd: 'rm -rf /tmp/lab-acl' }
    ],
    fields: [
      { id: 'out', label: 'Salida de getfacl', placeholder: 'Pegá la salida de getfacl /tmp/lab-acl...' }
    ],
    checks: [
      { type: 'text', field: 'out', re: '#\\s*file:|user::|group::|mask::', label: 'Pegaste una ACL válida', hint: 'getfacl devuelve file, owner, group, user y mask.' },
      { type: 'text', field: 'out', re: 'user:([a-z0-9_-]+):r-x', label: 'La ACL incluye el usuario con r-x', hint: 'Debe aparecer user:tuusuario:r-x.' }
    ],
    success: 'Con ACL resolvés excepciones sin tocar la pertenencia de grupo, que es la raíz de la mayoría de los permisos mal otorgados.'
  },
  {
    id: 'lab-procesos', title: 'Procesos, señales y puertos', day: 1, mode: 'terminal',
    minutes: 15, moduleId: 'd1-procesos',
    objective: 'Inspeccionar procesos, enviar SIGTERM y encontrar el puerto de un servicio.',
    briefing: 'Servidor simulado con nginx corriendo (PID 4242) y un proceso colgado (PID 5150). Practicá el orden correcto de diagnóstico.',
    steps: [
      { text: 'Listá los procesos.', cmd: 'ps aux' },
      { text: 'Revisá qué escucha en el puerto 80.', cmd: 'ss -tulpn' },
      { text: 'Consultá el estado de nginx.', cmd: 'systemctl status nginx' },
      { text: 'Terminá el proceso colgado con SIGTERM (no SIGKILL).', cmd: 'kill -15 5150' }
    ],
    checks: [
      { type: 'cmd', re: '^\\s*(ps\\s+(aux|ef)|top|pgrep)', label: 'Inspeccionaste procesos', hint: 'ps aux' },
      { type: 'cmd', re: '^\\s*ss\\s+-tulpn', label: 'Revisaste puertos con ss -tulpn', hint: 'ss -tulpn' },
      { type: 'cmd', re: '^\\s*systemctl\\s+status\\s+nginx', label: 'Consultaste el servicio', hint: 'systemctl status nginx' },
      { type: 'cmd', re: '^\\s*kill\\s+-15\\s+5150', label: 'Enviaste SIGTERM al PID correcto', hint: 'kill -15 5150' }
    ],
    success: 'Usaste el orden profesional: procesos → puertos → servicio → señal ordenada.'
  },
  {
    id: 'lab-logs', title: 'Misión real: auditoría de autenticación', day: 1, mode: 'manual',
    minutes: 20, moduleId: 'd1-texto',
    objective: 'Extraer intentos fallidos de login y contar orígenes.',
    briefing: 'En tu Ubuntu/WSL2 ejecutá los comandos sobre /var/log/auth.log (o journalctl). Si el archivo no existe, usá: journalctl _COMM=sshd --no-pager | tail -100 > /tmp/auth.txt y trabajá sobre ese archivo.',
    safety: 'Solo lectura. No modifiques logs del sistema.',
    steps: [
      { text: 'Contá líneas del log: wc -l /var/log/auth.log', cmd: 'wc -l /var/log/auth.log' },
      { text: 'Buscá intentos fallidos: grep -i "failed" /var/log/auth.log | tail -20', cmd: 'grep -i "failed" /var/log/auth.log | tail -20' },
      { text: 'Extraé IPs y contalas: grep -i "failed" /var/log/auth.log | grep -oE "([0-9]{1,3}\\.){3}[0-9]{1,3}" | sort | uniq -c | sort -rn | head', cmd: 'grep -i "failed" /var/log/auth.log | grep -oE "([0-9]{1,3}\\.){3}[0-9]{1,3}" | sort | uniq -c | sort -rn | head' }
    ],
    fields: [
      { id: 'out', label: 'Salida del top de IPs (o del grep)', placeholder: 'Pegá las líneas con IP y conteo...' },
      { id: 'why', label: '¿Qué harías con esa información?', placeholder: 'Ej: bloquear la IP en el firewall, revisar si hubo login exitoso...' }
    ],
    checks: [
      { type: 'text', field: 'out', re: '\\d+\\s+\\d{1,3}(\\.\\d{1,3}){3}|failed|Failed|Accepted', label: 'Pegaste evidencia del análisis', hint: 'Debe aparecer al menos una IP con conteo o líneas failed.' },
      { type: 'text', field: 'why', re: 'firewall|bloque|fail2ban|revis|alerta|ssh|puerto|intento', label: 'Propusiste una acción concreta', hint: 'Mencioná firewall, fail2ban, revisión de accesos o deshabilitar password auth.' }
    ],
    success: 'Auditar auth.log es una tarea real de soporte y seguridad: contar y agrupar es el 90% del trabajo.'
  },
  {
    id: 'lab-awk', title: 'Pipelines sobre access.log', day: 1, mode: 'terminal',
    minutes: 20, moduleId: 'd1-texto',
    objective: 'Responder preguntas de tráfico con grep, awk, sort y uniq.',
    briefing: 'El servidor simulado tiene /var/log/nginx/access.log con 200 requests, varios 502 y una IP atacante. Respondé con pipelines de una línea.',
    steps: [
      { text: 'Contá total de requests.', cmd: 'wc -l /var/log/nginx/access.log' },
      { text: 'Contá errores 502.', cmd: 'grep -c " 502 " /var/log/nginx/access.log' },
      { text: 'Top de IPs por cantidad de requests.', cmd: 'awk \'{print $1}\' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head' },
      { text: 'Filtrá solo las líneas con error 5xx.', cmd: 'grep " 50[0-9] " /var/log/nginx/access.log' }
    ],
    checks: [
      { type: 'cmd', re: 'wc\\s+-l\\s+/var/log/nginx/access\\.log', label: 'Contaste requests con wc -l', hint: 'wc -l /var/log/nginx/access.log' },
      { type: 'cmd', re: 'grep\\s+-c\\s+["\']?\\s?502', label: 'Contaste los 502 con grep -c', hint: 'grep -c " 502 " /var/log/nginx/access.log' },
      { type: 'cmd', re: 'awk\\s+[\'"]\\{print \\$1\\}[\'"]\\s+/var/log/nginx/access\\.log\\s*\\|\\s*sort\\s*\\|\\s*uniq\\s+-c', label: 'Armaste el pipeline de top de IPs', hint: 'awk \'{print $1}\' access.log | sort | uniq -c | sort -rn' },
      { type: 'cmd', re: 'grep\\s+(-E\\s+)?["\']?\\s?5[0-9\\[]', label: 'Filtraste errores 5xx', hint: 'grep " 5[0-9][0-9] " /var/log/nginx/access.log' }
    ],
    success: 'Este es exactamente el tipo de pregunta que aparece en una prueba técnica de soporte: una línea, una respuesta.'
  },
  {
    id: 'lab-red', title: 'Misión real: diagnóstico de red por capas', day: 1, mode: 'manual',
    minutes: 25, moduleId: 'd1-redes',
    objective: 'Verificar DNS, puerto y HTTP en orden, y sacar conclusiones.',
    briefing: 'Usá tu Ubuntu/WSL2 o Windows con WSL. Ejecutá los comandos contra un dominio público. Pegá la evidencia y respondé.',
    steps: [
      { text: 'Resolvé el dominio: dig +short example.com', cmd: 'dig +short example.com' },
      { text: 'Verificá el puerto 443: nc -zv example.com 443', cmd: 'nc -zv example.com 443' },
      { text: 'Obtené headers: curl -I https://example.com', cmd: 'curl -I https://example.com' },
      { text: 'Listá tus puertos en escucha: ss -tulpn', cmd: 'ss -tulpn' }
    ],
    fields: [
      { id: 'out', label: 'Evidencia (DNS, puerto y headers)', placeholder: 'Pegá la salida de dig, nc y curl...' },
      { id: 'why', label: 'Explicá la diferencia entre 502 y 504', placeholder: '...' }
    ],
    checks: [
      { type: 'text', field: 'out', re: '\\d{1,3}(\\.\\d{1,3}){3}', label: 'Incluiste una IP resuelta por DNS', hint: 'Pegá la salida de dig +short.' },
      { type: 'text', field: 'out', re: 'HTTP/[12](\\.\\d)?\\s+\\d{3}|HTTP/1\\.1 200|HTTP/2 200', label: 'Incluiste headers HTTP', hint: 'Pegá la salida de curl -I.' },
      { type: 'text', field: 'why', re: '502.*(upstream|no pudo|proxy|conexi)|504.*timeout|timeout.*504', label: 'Distinguiste 502 de 504', hint: '502 = el proxy no pudo hablar con el upstream; 504 = timeout.' }
    ],
    success: 'El diagnóstico por capas evita el clásico "reinicié todo y no sé por qué funcionó".'
  },
  {
    id: 'lab-ssh', title: 'Misión real: claves SSH y hardening', day: 1, mode: 'manual',
    minutes: 25, moduleId: 'd1-redes',
    objective: 'Generar un par de claves y revisar la configuración de sshd.',
    briefing: 'Generá una clave de prueba (sin passphrase para el ejercicio, con -f /tmp/lab_key) y revisá sshd_config. No modifiques el servicio SSH real.',
    safety: 'No reinicies sshd ni cambies PasswordAuthentication en esta práctica: solo inspección.',
    steps: [
      { text: 'Generá la clave: ssh-keygen -t ed25519 -f /tmp/lab_key -N ""', cmd: 'ssh-keygen -t ed25519 -f /tmp/lab_key -N ""' },
      { text: 'Inspeccioná la pública: cat /tmp/lab_key.pub', cmd: 'cat /tmp/lab_key.pub' },
      { text: 'Revisá la config efectiva: sudo sshd -T | grep -E "passwordauthentication|permitrootlogin"', cmd: 'sudo sshd -T | grep -E "passwordauthentication|permitrootlogin"' },
      { text: 'Borrá las claves de prueba: rm -f /tmp/lab_key /tmp/lab_key.pub', cmd: 'rm -f /tmp/lab_key /tmp/lab_key.pub' }
    ],
    fields: [
      { id: 'out', label: 'Salida de la config de sshd', placeholder: 'pegá passwordauthentication y permitrootlogin...' },
      { id: 'why', label: '¿Qué recomendarías para producción?', placeholder: '...' }
    ],
    checks: [
      { type: 'text', field: 'out', re: 'passwordauthentication\\s+(yes|no)', label: 'Revisaste PasswordAuthentication', hint: 'sshd -T muestra los valores efectivos.' },
      { type: 'text', field: 'why', re: 'no|deshabilit|prohib|clave|root|sudo', label: 'Propusiste hardening', hint: 'Deshabilitar password auth y login directo de root.' }
    ],
    success: 'Autenticación por clave y PasswordAuthentication en no son la línea base de cualquier servidor expuesto.'
  },
  {
    id: 'lab-git', title: 'Misión real: rama, conflicto y merge', day: 2, mode: 'manual',
    minutes: 30, moduleId: 'd1-git',
    objective: 'Provocar y resolver un conflicto de merge real.',
    briefing: 'En una carpeta de prueba creá un repo y provocá un conflicto en la misma línea. Requiere git instalado.',
    safety: 'Trabajá en /tmp/lab-git. No uses un repositorio de trabajo.',
    steps: [
      { text: 'mkdir -p /tmp/lab-git && cd /tmp/lab-git && git init', cmd: 'mkdir -p /tmp/lab-git && cd /tmp/lab-git && git init' },
      { text: 'echo "linea base" > app.txt && git add . && git commit -m "base"', cmd: 'echo "linea base" > app.txt && git add . && git commit -m "base"' },
      { text: 'git switch -c feature && echo "cambio feature" > app.txt && git commit -am "feature"', cmd: 'git switch -c feature && echo "cambio feature" > app.txt && git commit -am "feature"' },
      { text: 'git switch main && echo "cambio main" > app.txt && git commit -am "main"', cmd: 'git switch main && echo "cambio main" > app.txt && git commit -am "main"' },
      { text: 'git merge feature (verás el conflicto)', cmd: 'git merge feature' },
      { text: 'Editá app.txt, quitá marcadores, git add app.txt && git commit, luego git log --graph --oneline --all', cmd: 'git add app.txt && git commit -m "resuelve conflicto" && git log --graph --oneline --all' }
    ],
    fields: [
      { id: 'out', label: 'Salida final de git log --graph', placeholder: 'Pegá el grafo...' }
    ],
    checks: [
      { type: 'text', field: 'out', re: '\\*\\s+[0-9a-f]{7}|Merge:|commit', label: 'Mostraste el grafo con el merge', hint: 'git log --graph --oneline --all' },
      { type: 'text', field: 'out', re: '.{20,}', label: 'Adjuntaste evidencia suficiente', hint: 'Pegá la salida completa.' }
    ],
    success: 'Un conflicto es solo texto con marcadores. Resolverlo con calma es una habilidad que se evalúa en la entrevista.'
  },

  /* ================= DÍA 2 ================= */
  {
    id: 'lab-docker-run', title: 'Misión real: nginx en 8080', day: 3, mode: 'manual',
    minutes: 20, moduleId: 'd2-contenedores',
    objective: 'Levantar, inspeccionar y limpiar un contenedor.',
    briefing: 'Requisito: Docker funcionando en WSL2 (docker --version). Si no lo tenés, podés ver la demo en el terminal simulado con docker run, pero la evidencia real tiene más valor.',
    safety: 'El contenedor se llama bootcamp-web y se elimina al final. No publiques el puerto 80 si ya está ocupado.',
    steps: [
      { text: 'Levantá: docker run -d --name bootcamp-web -p 8080:80 nginx:1.27', cmd: 'docker run -d --name bootcamp-web -p 8080:80 nginx:1.27' },
      { text: 'Verificá: curl -I http://localhost:8080', cmd: 'curl -I http://localhost:8080' },
      { text: 'Logs: docker logs --tail 20 bootcamp-web', cmd: 'docker logs --tail 20 bootcamp-web' },
      { text: 'Entrá: docker exec -it bootcamp-web sh -c "cat /etc/nginx/conf.d/default.conf"', cmd: 'docker exec -it bootcamp-web sh -c "cat /etc/nginx/conf.d/default.conf"' },
      { text: 'Limpiá: docker rm -f bootcamp-web', cmd: 'docker rm -f bootcamp-web' }
    ],
    fields: [
      { id: 'out', label: 'Evidencia (headers + logs)', placeholder: 'Pegá curl -I y docker logs...' }
    ],
    checks: [
      { type: 'text', field: 'out', re: 'HTTP/1\\.1 200|HTTP/2 200|Server: nginx', label: 'La respuesta HTTP fue 200 y de nginx', hint: 'Pegá la salida de curl -I.' },
      { type: 'text', field: 'out', re: '/docker-entrypoint|nginx|GET /', label: 'Incluiste logs del contenedor', hint: 'Pegá docker logs --tail 20.' }
    ],
    success: 'Ya sabés el ciclo completo: run, verificar, inspeccionar, limpiar. Es la base de toda práctica con contenedores.'
  },
  {
    id: 'lab-dockerfile', title: 'Escribir un Dockerfile con cache y no-root', day: 3, mode: 'guided',
    minutes: 30, moduleId: 'd2-imagenes',
    objective: 'Producir un Dockerfile multi-stage correcto para una app Node.',
    briefing: 'Escribí el Dockerfile completo abajo. Se valida la estructura: etapa de build, instalación reproducible, copia ordenada y usuario sin privilegios.',
    steps: [
      { text: 'Usá una etapa de build con node:20-alpine.' },
      { text: 'Copiá package*.json antes del código y usá npm ci.' },
      { text: 'En una segunda etapa mínima, copiá solo el artefacto con COPY --from.' },
      { text: 'Definí USER no-root, EXPOSE y CMD en formato exec.' }
    ],
    fields: [
      { id: 'out', label: 'Dockerfile', placeholder: 'FROM node:20-alpine AS build\nWORKDIR /app\nCOPY package*.json ./\n...' }
    ],
    checks: [
      { type: 'text', field: 'out', re: 'FROM\\s+node:[^\\s]+\\s+AS\\s+\\w+', label: 'Primera etapa con nombre', hint: 'FROM node:20-alpine AS build' },
      { type: 'text', field: 'out', re: 'COPY\\s+package\\*\\.json', label: 'Copiás package*.json antes del código', hint: 'COPY package*.json ./' },
      { type: 'text', field: 'out', re: 'RUN\\s+npm\\s+ci', label: 'Usás npm ci para instalación reproducible', hint: 'RUN npm ci (o npm ci --omit=dev)' },
      { type: 'text', field: 'out', re: 'FROM\\s+(nginx|node:[^\\s]+-alpine|.*slim|distroless)', label: 'Segunda etapa mínima', hint: 'FROM nginx:1.27-alpine o similar' },
      { type: 'text', field: 'out', re: 'COPY\\s+--from=', label: 'Copiás el artefacto entre etapas', hint: 'COPY --from=build /app/dist /usr/share/nginx/html' },
      { type: 'text', field: 'out', re: 'USER\\s+(node|nginx|[a-z][a-z0-9_-]*)', label: 'Definís usuario no-root', hint: 'USER node' },
      { type: 'forbid', field: 'out', re: 'latest|password|secret|api_key', label: 'Sin latest ni secretos en el Dockerfile', hint: 'Fijá versiones y no incluyas credenciales.' }
    ],
    success: 'Este Dockerfile es defendible en una entrevista: cache, reproducibilidad, tamaño y seguridad.'
  },
  {
    id: 'lab-compose', title: 'Stack app + base de datos con Compose', day: 3, mode: 'guided',
    minutes: 30, moduleId: 'd2-compose',
    objective: 'Escribir un compose con volumen, variables y healthcheck.',
    briefing: 'Escribí el docker-compose.yml para una API que usa Postgres. Se evalúa el nombre de servicio como host, el volumen nombrado y la espera por salud.',
    steps: [
      { text: 'Definí los servicios app y db.' },
      { text: 'La app debe conectarse a db:5432 (no localhost).' },
      { text: 'Usá un volumen nombrado para /var/lib/postgresql/data.' },
      { text: 'Agregá healthcheck a la base y depends_on con condition service_healthy.' }
    ],
    fields: [
      { id: 'out', label: 'docker-compose.yml', placeholder: 'services:\n  app:\n    build: .\n...' }
    ],
    checks: [
      { type: 'text', field: 'out', re: 'services:\\s*[\\s\\S]*app:', label: 'Definiste el servicio app', hint: 'services: app: ...' },
      { type: 'text', field: 'out', re: 'services:[\\s\\S]*\\bdb:\\s*\\n', label: 'Definiste el servicio db', hint: 'services: db: image: postgres:16-alpine' },
      { type: 'text', field: 'out', re: 'postgres', label: 'Usaste una imagen Postgres', hint: 'image: postgres:16-alpine' },
      { type: 'text', field: 'out', re: 'DB_HOST:\\s*db|POSTGRES_HOST:\\s*db|\\bdb:5432', label: 'La app apunta al servicio db', hint: 'DB_HOST: db (no localhost)' },
      { type: 'text', field: 'out', re: 'volumes:[\\s\\S]*pgdata:/var/lib/postgresql/data|/var/lib/postgresql/data', label: 'Persistencia con volumen', hint: 'volumes: [pgdata:/var/lib/postgresql/data]' },
      { type: 'text', field: 'out', re: 'healthcheck:[\\s\\S]*(pg_isready|CMD)', label: 'Agregaste healthcheck', hint: 'healthcheck: test: ["CMD-SHELL", "pg_isready -U postgres"]' },
      { type: 'text', field: 'out', re: 'condition:\\s*service_healthy', label: 'depends_on espera salud', hint: 'depends_on: db: condition: service_healthy' },
      { type: 'forbid', field: 'out', re: 'localhost:5432|DB_HOST:\\s*localhost', label: 'Sin localhost para la base', hint: 'Entre contenedores se usa el nombre del servicio.' }
    ],
    success: 'Un stack reproducible con espera sana es lo que evita el "failed to connect to database" en cada arranque.'
  },
  {
    id: 'lab-registry', title: 'Misión real: publicar en un registry', day: 3, mode: 'manual',
    minutes: 25, moduleId: 'd2-registries',
    objective: 'Publicar una imagen con tags trazables y verificar el digest.',
    briefing: 'Podés usar Docker Hub o GHCR con un token. Nunca pegues el token en la evidencia. Si no tenés cuenta, completá solo los dos primeros pasos y explicá el resto.',
    safety: 'Usá un token con alcance de escritura solo sobre el repo de prueba y revocalo al terminar.',
    steps: [
      { text: 'Construí: docker build -t bootcamp-demo:1.0 . (o con una imagen local existente)', cmd: 'docker build -t bootcamp-demo:1.0 .' },
      { text: 'Etiquetá: docker tag bootcamp-demo:1.0 <usuario>/bootcamp-demo:1.0', cmd: 'docker tag bootcamp-demo:1.0 usuario/bootcamp-demo:1.0' },
      { text: 'Autenticá con token por stdin: echo "$TOKEN" | docker login -u <usuario> --password-stdin', cmd: 'echo "$TOKEN" | docker login -u usuario --password-stdin' },
      { text: 'Publicá: docker push <usuario>/bootcamp-demo:1.0', cmd: 'docker push usuario/bootcamp-demo:1.0' },
      { text: 'Verificá el digest: docker inspect <usuario>/bootcamp-demo:1.0 --format "{{.RepoDigests}}"', cmd: 'docker inspect usuario/bootcamp-demo:1.0 --format "{{.RepoDigests}}"' }
    ],
    fields: [
      { id: 'out', label: 'Salida del push y del digest (sin tokens)', placeholder: 'Pegá la salida de docker push y RepoDigests...' },
      { id: 'why', label: '¿Por qué no usar latest en producción?', placeholder: '...' }
    ],
    checks: [
      { type: 'text', field: 'out', re: 'sha256:[a-f0-9]{20,}', label: 'Incluiste el digest de la imagen', hint: 'docker inspect ... RepoDigests devuelve sha256:...' },
      { type: 'text', field: 'why', re: 'mutable|no.*version|no.*reproduc|cambia|rollback|no identifica', label: 'Explicaste el problema de latest', hint: 'latest es mutable y no permite reproducibilidad ni rollback confiable.' }
    ],
    success: 'Publicaste un artefacto identificable por digest: la base de un deploy reproducible.'
  },
  {
    id: 'lab-cicd-map', title: 'Diseñar un pipeline con gates', day: 2, mode: 'guided',
    minutes: 25, moduleId: 'd2-cicd',
    objective: 'Diseñar las etapas de un pipeline defendible.',
    briefing: 'Describí las etapas de un pipeline para una API con tests, imagen Docker y deploy a staging y producción. Indicá qué bloquea producción y cómo harías rollback.',
    steps: [
      { text: 'Listá las etapas en orden con el trigger de cada una.' },
      { text: 'Indicá qué gates bloquean el merge y cuáles producción.' },
      { text: 'Explicá el versionado del artefacto (SHA/digest).' },
      { text: 'Describí el rollback con comandos concretos.' }
    ],
    fields: [
      { id: 'out', label: 'Diseño del pipeline', placeholder: '1. push/PR → lint...\n2. ...' }
    ],
    checks: [
      { type: 'text', field: 'out', re: 'lint|test|build|scan|deploy', label: 'Incluiste etapas de build, test y deploy', hint: 'Mencioná al menos test, build de imagen y deploy.' },
      { type: 'text', field: 'out', re: 'gate|aprob|manual|bloquea|requiere', label: 'Definiste un gate para producción', hint: 'Indicá aprobación manual o condición que bloquea.' },
      { type: 'text', field: 'out', re: 'sha|digest|tag|versi', label: 'Versionaste el artefacto', hint: 'Mencioná SHA del commit o digest.' },
      { type: 'text', field: 'out', re: 'rollback|revert|rollout undo|volver', label: 'Incluiste plan de rollback', hint: 'kubectl rollout undo o redeploy de la imagen anterior.' }
    ],
    success: 'Un diseño con gates y rollback es lo que separa un pipeline real de un script que solo compila.'
  },
  {
    id: 'lab-actions', title: 'Workflow de GitHub Actions', day: 2, mode: 'guided',
    minutes: 30, moduleId: 'd2-actions',
    objective: 'Escribir un workflow con dos jobs, cache, artifact y permisos mínimos.',
    briefing: 'Escribí el YAML completo. Se valida estructura, dependencia entre jobs, cache, artifact y permisos.',
    steps: [
      { text: 'Definí on con push a main y pull_request.' },
      { text: 'Job test: checkout, setup-node con cache npm, npm ci y npm test.' },
      { text: 'Job build con needs: test que suba dist/ como artifact.' },
      { text: 'Declará permissions: contents: read.' }
    ],
    fields: [
      { id: 'out', label: 'Workflow YAML', placeholder: 'name: ci\non:\n  push:\n    branches: [main]\njobs:\n  test:\n...' }
    ],
    checks: [
      { type: 'text', field: 'out', re: 'on:[\\s\\S]*(push|pull_request)', label: 'Definiste triggers', hint: 'on: push y pull_request' },
      { type: 'text', field: 'out', re: 'jobs:[\\s\\S]*test:', label: 'Job test definido', hint: 'jobs: test: runs-on: ubuntu-latest' },
      { type: 'text', field: 'out', re: 'actions/checkout@v4|actions/checkout', label: 'Usaste checkout', hint: 'uses: actions/checkout@v4' },
      { type: 'text', field: 'out', re: 'cache:\\s*npm|cache:\\s*[\'"]npm', label: 'Cacheaste npm', hint: 'con setup-node: cache: npm' },
      { type: 'text', field: 'out', re: 'needs:\\s*test', label: 'build depende de test', hint: 'needs: test' },
      { type: 'text', field: 'out', re: 'actions/upload-artifact', label: 'Subiste un artifact', hint: 'uses: actions/upload-artifact@v4' },
      { type: 'text', field: 'out', re: 'permissions:[\\s\\S]*contents:\\s*read', label: 'Aplicaste permisos mínimos', hint: 'permissions: contents: read' },
      { type: 'forbid', field: 'out', re: 'password\\s*:|api[_-]?key\\s*:|secret\\s*:\\s*["\'][^$]', label: 'Sin secretos hardcodeados', hint: 'Usá ${{ secrets.NOMBRE }}.' }
    ],
    success: 'Este workflow es prácticamente el estándar de la industria para una app Node.'
  },

  /* ================= DÍA 3 ================= */
  {
    id: 'lab-cloud-map', title: 'Diseñar una arquitectura cloud segura', day: 2, mode: 'guided',
    minutes: 25, moduleId: 'd3-cloud',
    objective: 'Describir una VPC de tres capas con Multi-AZ e IAM mínimo.',
    briefing: 'Diseñá en texto la arquitectura para una API con base de datos en AWS (o Azure equivalente): VPC, subnets, balanceador, cómputo, base y permisos.',
    steps: [
      { text: 'Definí CIDR de VPC y dos subnets por capa.' },
      { text: 'Ubicá ALB en públicas, cómputo y RDS en privadas.' },
      { text: 'Distribuí en al menos dos AZ.' },
      { text: 'Usá roles IAM, no claves, y security groups acotados.' }
    ],
    fields: [
      { id: 'out', label: 'Diseño de arquitectura', placeholder: 'VPC 10.0.0.0/16\n- subnet pública 10.0.1.0/24 (AZ-a)...' }
    ],
    checks: [
      { type: 'text', field: 'out', re: 'VPC|vnet', label: 'Definiste VPC/VNet', hint: 'Mencioná la VPC con su CIDR.' },
      { type: 'text', field: 'out', re: 'p[uú]blic[ao]', label: 'Subnet pública para el balanceador', hint: 'ALB en subnets públicas.' },
      { type: 'text', field: 'out', re: 'privad', label: 'Subnets privadas para app y base', hint: 'App y RDS en subnets privadas.' },
      { type: 'text', field: 'out', re: 'AZ|zona de disponibilidad|multi-?az|availability', label: 'Distribuiste en varias AZ', hint: 'Mencioná dos AZ.' },
      { type: 'text', field: 'out', re: 'rol|role|IAM', label: 'Usaste roles IAM', hint: 'La instancia asume un rol.' },
      { type: 'text', field: 'out', re: 'security group|grupo de seguridad|NSG', label: 'Definiste reglas de firewall', hint: 'Security group del ALB y de la app.' }
    ],
    success: 'Esta arquitectura es exactamente lo que se espera en una pregunta de diseño junior.'
  },
  {
    id: 'lab-terraform', title: 'Configuración Terraform válida', day: 4, mode: 'guided',
    minutes: 30, moduleId: 'd3-terraform',
    objective: 'Escribir un main.tf con provider, variable, recurso y output.',
    briefing: 'Escribí un main.tf. Podés usar el provider local o null para no crear recursos cloud. Se valida estructura y buenas prácticas.',
    steps: [
      { text: 'Declará terraform { required_providers { ... } }.' },
      { text: 'Definí una variable env con type y default.' },
      { text: 'Creá un recurso con tags que use var.env.' },
      { text: 'Agregá un output y un backend remoto comentado como recomendación.' }
    ],
    fields: [
      { id: 'out', label: 'main.tf', placeholder: 'terraform {\n  required_providers {\n    random = { source = "hashicorp/random" }\n  }\n}' }
    ],
    checks: [
      { type: 'text', field: 'out', re: 'terraform\\s*\\{[\\s\\S]*required_providers', label: 'Declaraste provider requerido', hint: 'terraform { required_providers { ... } }' },
      { type: 'text', field: 'out', re: 'variable\\s+"(env|environment|entorno)"[\\s\\S]*type\\s*=\\s*string[\\s\\S]*(default|validation)', label: 'Variable con type y default/validation', hint: 'variable "env" { type = string, default = "dev" }' },
      { type: 'text', field: 'out', re: 'resource\\s+"[^"]+"\\s+"[^"]+"', label: 'Definiste un recurso', hint: 'resource "null_resource" "ejemplo" { ... }' },
      { type: 'text', field: 'out', re: 'tags\\s*=|tags\\s*=\\s*\\{[\\s\\S]*\\$\\{?var\\.', label: 'Recurso parametrizado con tags', hint: 'tags = { Env = var.env }' },
      { type: 'text', field: 'out', re: 'output\\s+"[^"]+"', label: 'Definiste un output', hint: 'output "nombre" { value = ... }' },
      { type: 'forbid', field: 'out', re: 'access_key|secret_key|password\\s*=', label: 'Sin credenciales en el código', hint: 'Usá variables de entorno o roles.' }
    ],
    success: 'Con esta estructura ya podés explicar el ciclo init → plan → apply en cualquier entrevista.'
  },
  {
    id: 'lab-k8s-deploy', title: 'Misión real: desplegar, escalar y borrar un Pod', day: 4, mode: 'manual',
    minutes: 30, moduleId: 'd3-k8s-arq',
    objective: 'Comprobar la reconciliación de un Deployment.',
    briefing: 'Necesitás un clúster local (minikube, kind o k3s) o un clúster de práctica. Si no lo tenés, usá el terminal simulado para explorar los comandos y documentá la limitación.',
    steps: [
      { text: 'Creá el deployment: kubectl create deployment web --image=nginx:1.27 --replicas=2', cmd: 'kubectl create deployment web --image=nginx:1.27 --replicas=2' },
      { text: 'Verificá: kubectl get pods -o wide', cmd: 'kubectl get pods -o wide' },
      { text: 'Borrá un Pod: kubectl delete pod <nombre>', cmd: 'kubectl delete pod web-xxxx' },
      { text: 'Comprobá que se recrea: kubectl get pods', cmd: 'kubectl get pods' },
      { text: 'Escalá: kubectl scale deployment web --replicas=3', cmd: 'kubectl scale deployment web --replicas=3' }
    ],
    fields: [
      { id: 'out', label: 'Evidencia de pods y recreación', placeholder: 'Pegá kubectl get pods antes y después...' },
      { id: 'why', label: '¿Qué controlador recreó el Pod?', placeholder: '...' }
    ],
    checks: [
      { type: 'text', field: 'out', re: 'NAME\\s+READY\\s+STATUS|Running|web-', label: 'Pegaste salida de kubectl get pods', hint: 'Debe aparecer el estado Running y el nombre del Pod.' },
      { type: 'text', field: 'why', re: 'replicaset|deployment|reconcili', label: 'Identificaste el controlador', hint: 'El ReplicaSet del Deployment mantiene las réplicas.' }
    ],
    success: 'Comprobaste que en Kubernetes lo declarativo manda: el Pod se reemplaza solo.'
  },
  {
    id: 'lab-k8s-service', title: 'Manifiesto con Service y probes', day: 4, mode: 'guided',
    minutes: 30, moduleId: 'd3-k8s-workloads',
    objective: 'Escribir un Deployment con ConfigMap, Secret, Service y probes.',
    briefing: 'Escribí un manifiesto completo (multidocumento YAML). Se valida coherencia de labels, puertos, probes y configuración.',
    steps: [
      { text: 'Deployment con 2 réplicas y labels app: api.' },
      { text: 'ConfigMap con LOG_LEVEL y Secret con DB_PASSWORD como envFrom o env.' },
      { text: 'Service ClusterIP puerto 80 targetPort 8080.' },
      { text: 'readinessProbe en /ready y livenessProbe en /healthz.' }
    ],
    fields: [
      { id: 'out', label: 'manifiesto.yaml', placeholder: 'apiVersion: apps/v1\nkind: Deployment\n...' }
    ],
    checks: [
      { type: 'text', field: 'out', re: 'kind:\\s*Deployment', label: 'Definiste un Deployment', hint: 'apiVersion: apps/v1 kind: Deployment' },
      { type: 'text', field: 'out', re: 'kind:\\s*Service', label: 'Definiste un Service', hint: 'kind: Service' },
      { type: 'text', field: 'out', re: 'targetPort:\\s*8080', label: 'Service apunta al puerto correcto', hint: 'targetPort: 8080' },
      { type: 'text', field: 'out', re: 'readinessProbe', label: 'Definiste readinessProbe', hint: 'readinessProbe: httpGet: path: /ready' },
      { type: 'text', field: 'out', re: 'livenessProbe', label: 'Definiste livenessProbe', hint: 'livenessProbe: httpGet: path: /healthz' },
      { type: 'text', field: 'out', re: 'kind:\\s*ConfigMap', label: 'Usaste ConfigMap', hint: 'kind: ConfigMap con LOG_LEVEL' },
      { type: 'text', field: 'out', re: 'kind:\\s*Secret', label: 'Usaste Secret para credenciales', hint: 'kind: Secret con DB_PASSWORD' },
      { type: 'text', field: 'out', re: 'selector:[\\s\\S]*app:\\s*api', label: 'Selector coherente con las labels', hint: 'selector.matchLabels.app: api' }
    ],
    success: 'Con Service y probes bien definidos, la app entra y sale de tráfico sin intervención manual.'
  },

  /* ================= DÍA 4 ================= */
  {
    id: 'lab-promql', title: 'Consultas PromQL y alerta de errores', day: 5, mode: 'guided',
    minutes: 25, moduleId: 'd4-observabilidad',
    objective: 'Escribir consultas de tasa de error y latencia, y una regla de alerta.',
    briefing: 'Escribí PromQL y una regla de alerta. Se valida el uso de rate, la división de errores sobre el total y un umbral con duración.',
    steps: [
      { text: 'Tasa de requests por segundo por status.' },
      { text: 'Latencia p95 con histogram_quantile.' },
      { text: 'Tasa de 5xx sobre el total.' },
      { text: 'Regla de alerta que dispare con >5% durante 10 minutos.' }
    ],
    fields: [
      { id: 'queries', label: 'Consultas PromQL', placeholder: 'sum(rate(http_requests_total[5m])) by (status)\n...' },
      { id: 'rule', label: 'Regla de alerta (YAML)', placeholder: 'groups:\n  - name: api\n    rules:\n      - alert: HighErrorRate\n...' }
    ],
    checks: [
      { type: 'text', field: 'queries', re: 'rate\\(http_requests_total\\[5m\\]\\)', label: 'Usaste rate sobre el contador', hint: 'rate(http_requests_total[5m])' },
      { type: 'text', field: 'queries', re: 'histogram_quantile\\(0\\.95', label: 'Calculaste p95', hint: 'histogram_quantile(0.95, ...)' },
      { type: 'text', field: 'rule', re: 'alert:\\s*\\w+', label: 'Nombraste la alerta', hint: 'alert: HighErrorRate' },
      { type: 'text', field: 'rule', re: 'expr:[\\s\\S]*status=~?"?5|expr:[\\s\\S]*5\\.\\.', label: 'La expresión detecta 5xx', hint: 'status=~"5.."' },
      { type: 'text', field: 'rule', re: 'for:\\s*(5m|10m|15m)', label: 'Definiste duración con for', hint: 'for: 10m' },
      { type: 'text', field: 'rule', re: 'severity|labels:[\\s\\S]*severity', label: 'Agregaste severidad', hint: 'labels: severity: warning' }
    ],
    success: 'Esta dupla consulta + alerta es exactamente lo que se pide en una guardia real.'
  },
  {
    id: 'lab-security', title: 'Pipeline DevSecOps completo', day: 5, mode: 'guided',
    minutes: 25, moduleId: 'd4-devsecops',
    objective: 'Definir controles de seguridad por etapa y criterio de bloqueo.',
    briefing: 'Describí las etapas de seguridad de un pipeline Node + Docker + Terraform y qué severidad bloquea el merge.',
    steps: [
      { text: 'Incluí SAST, SCA, escaneo de imagen, IaC y detección de secretos.' },
      { text: 'Indicá la herramienta y el momento de ejecución.' },
      { text: 'Definí qué bloquea y qué genera ticket.' }
    ],
    fields: [
      { id: 'out', label: 'Diseño de seguridad del pipeline', placeholder: '- SAST en PR: ...\n- SCA: ...' }
    ],
    checks: [
      { type: 'text', field: 'out', re: 'SAST|sast', label: 'Incluiste SAST', hint: 'Semgrep o CodeQL en el pull request.' },
      { type: 'text', field: 'out', re: 'SCA|depend|npm audit|Dependabot|Trivy', label: 'Incluiste análisis de dependencias', hint: 'Dependabot, npm audit o Trivy fs.' },
      { type: 'text', field: 'out', re: 'imagen|image|container', label: 'Incluiste escaneo de imagen', hint: 'Trivy image con severidad.' },
      { type: 'text', field: 'out', re: 'IaC|terraform|checkov|tfsec', label: 'Incluiste escaneo de IaC', hint: 'Checkov o tfsec.' },
      { type: 'text', field: 'out', re: 'secreto|secret|gitleaks|trufflehog', label: 'Incluiste detección de secretos', hint: 'gitleaks en pre-commit y CI.' },
      { type: 'text', field: 'out', re: 'cr[ií]tic|high|severidad|bloque', label: 'Definiste criterio de bloqueo', hint: 'Bloquear críticos con fix; medios como ticket.' }
    ],
    success: 'Seguridad en el pipeline bien entendida: detección temprana sin convertirla en un cuello de botella.'
  },
  {
    id: 'lab-lfcs-storage', title: 'Misión real: inventario y montaje de almacenamiento', day: 1, mode: 'manual',
    minutes: 25, moduleId: 'lfcs-storage',
    objective: 'Relevar discos, filesystems y puntos de montaje, y validar una entrada de fstab.',
    briefing: 'Ejecutá los comandos en tu VM o WSL2. **No formatees ni reparticiones nada**: este laboratorio es de solo lectura y validación. Si no tenés un disco extra, el inventario del disco raíz alcanza.',
    safety: 'Comandos de lectura. No ejecutes mkfs, fdisk ni lvextend sobre dispositivos en uso.',
    steps: [
      { text: 'Inventariá discos, filesystems y UUID.', cmd: 'lsblk -f' },
      { text: 'Mirá dónde está montado la raíz y con qué opciones.', cmd: 'findmnt /' },
      { text: 'Consultá espacio e inodos.', cmd: 'df -hT; df -i' },
      { text: 'Revisá las entradas persistentes y validá fstab.', cmd: 'cat /etc/fstab; sudo findmnt --verify' },
      { text: 'Pegá el inventario y explicá qué usarías en fstab y por qué.' }
    ],
    fields: [
      { id: 'out', label: 'Salida de lsblk, findmnt y df', placeholder: 'Pegá el árbol de discos y el filesystem de /...' },
      { id: 'why', label: '¿UUID o /dev/sdX en fstab? Justificá', placeholder: 'Usaría UUID porque...' }
    ],
    checks: [
      { type: 'text', field: 'out', re: 'UUID|FSTYPE|ext4|xfs|btrfs', label: 'Pegaste el inventario con filesystem o UUID', hint: 'lsblk -f muestra FSTYPE y UUID.' },
      { type: 'text', field: 'out', re: 'Mounted|mount|/dev/|/', label: 'Incluiste el punto de montaje de la raíz', hint: 'findmnt / y df -hT muestran el punto de montaje.' },
      { type: 'text', field: 'why', re: 'UUID', label: 'Elegiste UUID y lo justificaste', hint: 'El nombre /dev/sdX puede cambiar entre arranques.' }
    ],
    success: 'Ya podés relevar almacenamiento sin tocar nada y justificar una entrada de fstab segura.'
  },
  {
    id: 'lab-lfcs-systemd', title: 'Unidad y timer de systemd', day: 1, mode: 'guided',
    minutes: 25, moduleId: 'lfcs-systemd',
    objective: 'Escribir un service y un timer persistentes y habilitarlos correctamente.',
    briefing: 'Escribí abajo los dos archivos de unidad y los comandos de activación. Se valida la estructura: sección [Unit], ExecStart, OnCalendar, Persistent y el enable del timer (no del service).',
    steps: [
      { text: 'Definí el .service con [Unit], [Service] y ExecStart apuntando a un script.' },
      { text: 'Definí el .timer con OnCalendar, Persistent=true y [Install] WantedBy=timers.target.' },
      { text: 'Habilitá y arrancá solo el timer.' },
      { text: 'Verificá la próxima ejecución y probá el service a mano.' }
    ],
    fields: [
      { id: 'out', label: 'Unidades + comandos', placeholder: '[Unit]\nDescription=Backup diario\n\n[Service]\nType=oneshot\nExecStart=/usr/local/bin/backup.sh\n\n[Timer]\nOnCalendar=*-*-* 03:00:00\nPersistent=true\n\n[Install]\nWantedBy=timers.target\n\n# systemctl enable --now backup.timer' }
    ],
    checks: [
      { type: 'text', field: 'out', re: '\[Unit\]', label: 'Incluiste la sección [Unit]', hint: 'Toda unidad empieza con [Unit] y Description.' },
      { type: 'text', field: 'out', re: 'ExecStart=', label: 'El service define ExecStart', hint: 'ExecStart apunta al script o comando a ejecutar.' },
      { type: 'text', field: 'out', re: 'OnCalendar=', label: 'El timer define OnCalendar', hint: 'Sin OnCalendar el timer no tiene cuándo dispararse.' },
      { type: 'text', field: 'out', re: 'Persistent\s*=\s*(true|yes)', label: 'Persistent activado', hint: 'Persistent=true recupera ejecuciones perdidas por estar apagado.' },
      { type: 'text', field: 'out', re: 'enable\s+--now|systemctl\s+enable', label: 'Habilitaste el timer con systemctl', hint: 'Se habilita el .timer, no el .service.' }
    ],
    success: 'Timer persistente listo. Es la alternativa moderna a cron con logs y estados.'
  },
  {
    id: 'lab-lpi701-arq', title: 'Diseñar la API de un carrito', day: 2, mode: 'guided',
    minutes: 30, moduleId: 'lpi701-arq',
    objective: 'Producir un contrato REST con estado, errores, idempotencia y migración.',
    briefing: 'Diseñá en texto la API de un carrito de compras pensada para correr en varias réplicas. Se evalúa el contrato, el manejo de estado, la idempotencia y el plan de migración.',
    steps: [
      { text: 'Listá recursos y verbos (GET/POST/PUT/DELETE) con códigos de estado.' },
      { text: 'Definí dónde vive la sesión y por qué la app es stateless.' },
      { text: 'Definí la clave de idempotencia para el pago y el comportamiento ante reintentos.' },
      { text: 'Escribí el plan de migración de una columna en fases.' }
    ],
    fields: [
      { id: 'out', label: 'Diseño de la API', placeholder: 'GET /v1/carts/{id}\nPOST /v1/carts/{id}/items\nPOST /v1/payments (Idempotency-Key)\nErrores: 400, 404, 409, 429...' }
    ],
    checks: [
      { type: 'text', field: 'out', re: 'GET|POST|PUT|DELETE', label: 'Definiste recursos y verbos', hint: 'Usá verbos HTTP explícitos por recurso.' },
      { type: 'text', field: 'out', re: 'JSON|json', label: 'El contrato usa JSON', hint: 'Indicá el formato de representación.' },
      { type: 'text', field: 'out', re: 'idempot', label: 'Definiste idempotencia', hint: 'Clave de idempotencia en pagos evita cobros duplicados.' },
      { type: 'text', field: 'out', re: '/v1|version', label: 'Versionaste el contrato', hint: 'Versionar la API permite evolucionar sin romper consumidores.' },
      { type: 'text', field: 'out', re: 'stateless|sin estado|redis|sesión|sesion', label: 'Definiste dónde vive la sesión', hint: 'La sesión no puede vivir en la memoria del proceso.' },
      { type: 'text', field: 'out', re: 'migrac', label: 'Incluiste un plan de migración', hint: 'Agregar columna, backfill, deploy y quitar la vieja en otro release.' }
    ],
    success: 'Diseño defendible: contrato explícito, estado fuera del proceso y migración sin downtime.'
  },
  {
    id: 'lab-lpi701-plataformas', title: 'Elegir servicios de plataforma', day: 2, mode: 'guided',
    minutes: 25, moduleId: 'lpi701-plataformas',
    objective: 'Justificar storage, base, caché, cola y CDN para una app con picos.',
    briefing: 'Una app de pedidos recibe picos de tráfico y guarda imágenes de productos. Elegí un servicio para cada necesidad y explicá la semántica de entrega de la cola.',
    steps: [
      { text: 'Elegí almacenamiento para las imágenes y explicá cómo se accede sin hacerlo público.' },
      { text: 'Elegí base para pedidos y justificá por qué no NoSQL.' },
      { text: 'Elegí caché para sesiones y definí TTL.' },
      { text: 'Elegí broker y qué hace el consumidor ante un duplicado.' },
      { text: 'Agregá CDN y política de invalidación.' }
    ],
    fields: [
      { id: 'out', label: 'Selección de servicios y justificación', placeholder: 'Imágenes: S3 + URL prefirmada...\nPedidos: PostgreSQL...\nSesión: Redis...' }
    ],
    checks: [
      { type: 'text', field: 'out', re: 's3|bucket|objeto|object', label: 'Elegiste almacenamiento de objetos', hint: 'S3/GCS/Blob con URLs prefirmadas.' },
      { type: 'text', field: 'out', re: 'postgres|mysql|sql|relacional', label: 'Elegiste base relacional para pedidos', hint: 'Transacciones y joins son requisito del dominio.' },
      { type: 'text', field: 'out', re: 'redis|cach[eé]|memoria', label: 'Definiste caché para sesión o datos calientes', hint: 'Redis es el ejemplo habitual.' },
      { type: 'text', field: 'out', re: 'kafka|rabbit|mq|cola|broker', label: 'Definiste una cola o broker', hint: 'Desacopla el pico de tráfico del procesamiento.' },
      { type: 'text', field: 'out', re: 'idempot|duplicad|at-least-once|dlq', label: 'Contemplaste duplicados o DLQ', hint: 'At-least-once exige consumidor idempotente.' },
      { type: 'text', field: 'out', re: 'cdn|cloudfront|cloudflare', label: 'Incluiste CDN', hint: 'CDN para estáticos con TTL e invalidación.' }
    ],
    success: 'Elegiste por patrón de acceso, no por moda. Eso es lo que evalúa 701.2.'
  },
  {
    id: 'lab-lpi701-licencias', title: 'Auditoría de licencias y SBOM', day: 2, mode: 'guided',
    minutes: 25, moduleId: 'lpi701-licencias',
    objective: 'Clasificar licencias y decidir si el proyecto puede distribuirse como propietario o SaaS.',
    briefing: 'Usá un proyecto tuyo o inventá el inventario. Generá el SBOM, listá licencias de producción y analizá el impacto de distribuir o exponer el servicio por red.',
    steps: [
      { text: 'Generá el SBOM con syft, npm o la herramienta del ecosistema.' },
      { text: 'Listá dependencias de producción y sus licencias.' },
      { text: 'Separá permisivas (MIT/BSD/Apache) de copyleft (GPL/LGPL/AGPL).' },
      { text: 'Concluí si podés distribuirlo y qué harías con una licencia incompatible.' }
    ],
    fields: [
      { id: 'out', label: 'SBOM y análisis', placeholder: 'SBOM: sbom.json (SPDX)\nMIT: express, ...\nAGPL: ...\nConclusión: ...' }
    ],
    checks: [
      { type: 'text', field: 'out', re: 'sbom|spdx|cyclonedx', label: 'Generaste o describiste el SBOM', hint: 'SPDX y CycloneDX son los formatos estándar.' },
      { type: 'text', field: 'out', re: 'MIT|Apache|BSD', label: 'Identificaste licencias permisivas', hint: 'MIT, BSD y Apache 2.0 son permisivas.' },
      { type: 'text', field: 'out', re: 'GPL|AGPL|LGPL|copyleft', label: 'Identificaste copyleft', hint: 'GPL/AGPL imponen obligaciones al distribuir o al servir por red.' },
      { type: 'text', field: 'out', re: 'compatib|incompatib', label: 'Analizaste compatibilidad', hint: 'No todas las licencias se pueden combinar.' },
      { type: 'text', field: 'out', re: 'dependencia|transitiv|distribu|SaaS|red', label: 'Concluiste sobre distribución o SaaS', hint: 'AGPL aplica también al uso por red.' }
    ],
    success: 'Ahora podés responder en una due diligence qué compone tu software y bajo qué licencia.'
  },
  {
    id: 'lab-helm', title: 'Release de Helm con rollback', day: 4, mode: 'guided',
    minutes: 30, moduleId: 'lpi703-helm',
    objective: 'Escribir values.yaml y operar install, upgrade atómico y rollback.',
    briefing: 'Escribí el values.yaml de una app (2 réplicas, imagen fijada, resources, Ingress) y los comandos de instalación, actualización y reversión. Los secretos deben quedar fuera del archivo versionado.',
    steps: [
      { text: 'Definí replicaCount, image con tag fijo, resources e ingress.' },
      { text: 'Instalá el release con -f values.yaml en un namespace.' },
      { text: 'Actualizá con helm upgrade --install --atomic --wait.' },
      { text: 'Mostrá helm history y helm rollback a la revisión anterior.' },
      { text: 'Explicá cómo inyectarías los secretos.' }
    ],
    fields: [
      { id: 'out', label: 'values.yaml + comandos', placeholder: 'replicaCount: 2\nimage:\n  repository: ghcr.io/ana/api\n  tag: "1.4.2"\nresources:\n  limits:\n    memory: 256Mi\n\nhelm upgrade --install api ./chart -f values.yaml --atomic --wait' }
    ],
    checks: [
      { type: 'text', field: 'out', re: 'replicaCount|replicas', label: 'Definiste réplicas', hint: 'replicaCount es el nombre habitual en charts.' },
      { type: 'text', field: 'out', re: 'image|repository|tag', label: 'Fijaste imagen y tag', hint: 'Evitá latest; fijá un tag o digest.' },
      { type: 'text', field: 'out', re: 'helm\s+install|helm\s+upgrade', label: 'Incluiste install o upgrade', hint: 'helm upgrade --install es idempotente en CI.' },
      { type: 'text', field: 'out', re: 'values\.yaml|-f\s', label: 'Usaste un archivo de values', hint: 'Pasá los values por archivo, no por --set en producción.' },
      { type: 'text', field: 'out', re: 'atomic|wait', label: 'Actualización segura con --atomic o --wait', hint: '--atomic revierte si el rollout falla.' },
      { type: 'text', field: 'out', re: 'rollback|history', label: 'Definiste rollback o historial', hint: 'helm history y helm rollback son el botón de pánico.' },
      { type: 'text', field: 'out', re: 'secret|sealed|external|vault', label: 'Los secretos quedan fuera del values', hint: 'Sealed Secrets, External Secrets o Vault.' }
    ],
    success: 'Release reproducible y reversible. Helm deja de ser magia.'
  },
  {
    id: 'lab-logs-stack', title: 'Diseñar el stack de logs', day: 5, mode: 'guided',
    minutes: 25, moduleId: 'lpi704-logs',
    objective: 'Definir pipeline, backend, retención y esquema de logs seguro.',
    briefing: 'Diseñá el pipeline de logs de una API en Kubernetes. Elegí agente, backend y visualización, definí retención y campos obligatorios, e indicá qué dato no loguearías.',
    steps: [
      { text: 'Elegí agente (Fluent Bit, Filebeat, Promtail, Vector).' },
      { text: 'Elegí backend (Loki, Elasticsearch/OpenSearch, Graylog) y justificá.' },
      { text: 'Definí campos estructurados y trace_id.' },
      { text: 'Definí retención y costo.' },
      { text: 'Excluí datos sensibles explícitamente.' }
    ],
    fields: [
      { id: 'out', label: 'Diseño del pipeline', placeholder: 'Agente: Fluent Bit (DaemonSet)\nBackend: Loki + Grafana\nFormato: JSON {ts, level, service, trace_id}\nRetención: 14 días caliente...' }
    ],
    checks: [
      { type: 'text', field: 'out', re: 'fluent|filebeat|promtail|vector', label: 'Elegiste un agente de recolección', hint: 'Fluent Bit, Filebeat, Promtail o Vector.' },
      { type: 'text', field: 'out', re: 'loki|elastic|opensearch|graylog', label: 'Elegiste backend de logs', hint: 'Loki o Elasticsearch/OpenSearch son los habituales.' },
      { type: 'text', field: 'out', re: 'grafana|kibana', label: 'Elegiste visualización', hint: 'Grafana o Kibana.' },
      { type: 'text', field: 'out', re: 'retenci|retention|d[ií]as', label: 'Definiste retención', hint: 'Sin retención el costo crece sin límite.' },
      { type: 'text', field: 'out', re: 'trace_id|json|estructurad', label: 'Definiste logs estructurados o correlación', hint: 'JSON con trace_id permite correlacionar con trazas.' },
      { type: 'text', field: 'out', re: 'token|contrase|password|personal|PII|sensible', label: 'Excluiste datos sensibles', hint: 'Nunca loguees credenciales ni datos personales completos.' }
    ],
    success: 'Pipeline de logs con costo controlado y datos protegidos.'
  },
  {
    id: 'lab-tracing', title: 'Instrumentar una traza distribuida', day: 5, mode: 'guided',
    minutes: 25, moduleId: 'lpi704-tracing',
    objective: 'Diseñar spans, propagación de contexto y muestreo para dos servicios.',
    briefing: 'Describí una request que pasa por gateway, api y base. Definí los spans, la propagación traceparent, un span de negocio y la estrategia de muestreo.',
    steps: [
      { text: 'Dibujá los spans y quién es padre de quién.' },
      { text: 'Mostrá el header traceparent entre servicios.' },
      { text: 'Agregá un span de negocio con atributos útiles.' },
      { text: 'Elegí head o tail sampling y justificá.' },
      { text: 'Indicá el backend (Tempo o Jaeger) y cómo buscarías el cuello de botella.' }
    ],
    fields: [
      { id: 'out', label: 'Diseño de trazas', placeholder: 'trace_id: 4bf92f...\nspans: gateway(12ms) -> api(180ms) -> db(150ms)\ntraceparent: 00-<trace>-<span>-01\nSampling: tail 10%, 100% errores...' }
    ],
    checks: [
      { type: 'text', field: 'out', re: 'span', label: 'Definiste spans', hint: 'Cada unidad de trabajo es un span con duración y padre.' },
      { type: 'text', field: 'out', re: 'traceparent|trace_id|trace id', label: 'Propagaste el contexto', hint: 'El header traceparent transporta trace_id y span_id.' },
      { type: 'text', field: 'out', re: 'opentelemetry|otel|collector', label: 'Mencionaste OpenTelemetry', hint: 'SDK + Collector es el estándar actual.' },
      { type: 'text', field: 'out', re: 'sampling|muestreo', label: 'Definiste muestreo', hint: 'Guardar el 100% es caro; tail conserva errores.' },
      { type: 'text', field: 'out', re: 'tempo|jaeger', label: 'Elegiste backend de trazas', hint: 'Grafana Tempo o Jaeger.' },
      { type: 'text', field: 'out', re: 'db|base|cuello|latencia', label: 'Señalaste dónde buscar el cuello de botella', hint: 'El span más largo es el candidato.' }
    ],
    success: 'Sabés ubicar el tiempo perdido entre servicios sin adivinar.'
  },
  {
    id: 'lab-terraform-team', title: 'Terraform para equipo: backend, módulos y CI', day: 4, mode: 'guided',
    minutes: 30, moduleId: 'tf-equipo',
    objective: 'Definir backend remoto con lock, módulo versionado y plan en CI.',
    briefing: 'Escribí el backend.hcl, la estructura de dos entornos y el job de CI que corre fmt, validate, plan y apply del plan aprobado.',
    steps: [
      { text: 'Definí el backend remoto con versionado, cifrado y lock.' },
      { text: 'Elegí un state por entorno (staging/prod).' },
      { text: 'Invocá un módulo con source y version fija.' },
      { text: 'Escribí el pipeline de CI con plan guardado y aprobación.' },
      { text: 'Explicá cómo detectar drift.' }
    ],
    fields: [
      { id: 'out', label: 'Backend + estructura + CI', placeholder: 'bucket = "empresa-tfstate"\nkey = "prod/terraform.tfstate"\nregion = "us-east-1"\ndynamodb_table = "tf-lock"\n\nmodule "red" { source = "..." version = "2.1.0" }\n\nterraform plan -out=tfplan -detailed-exitcode' }
    ],
    checks: [
      { type: 'text', field: 'out', re: 'backend', label: 'Configuraste backend remoto', hint: 'backend \"s3\" o equivalente en un .hcl.' },
      { type: 'text', field: 'out', re: 's3|gcs|azurerm|remote|cloud', label: 'Elegiste un backend concreto', hint: 'S3, GCS, Azure Storage o Terraform Cloud.' },
      { type: 'text', field: 'out', re: 'lock|dynamodb|bloqueo', label: 'Definiste bloqueo de state', hint: 'DynamoDB o el lock nativo del backend.' },
      { type: 'text', field: 'out', re: 'module', label: 'Usaste un módulo', hint: 'Encapsulá red, base o servicio en un módulo.' },
      { type: 'text', field: 'out', re: 'version', label: 'Fijaste versión del módulo', hint: 'Un módulo sin version es una bomba de tiempo.' },
      { type: 'text', field: 'out', re: 'plan', label: 'Incluiste plan en CI', hint: 'El plan se revisa y se aplica exacto con tfplan.' },
      { type: 'text', field: 'out', re: 'detailed-exitcode|drift|exit', label: 'Contemplaste drift o exit code', hint: 'plan -detailed-exitcode devuelve 2 si hay cambios.' }
    ],
    success: 'Terraform deja de depender de una laptop y pasa a ser un proceso auditable.'
  }
];

/* ================= ESCENARIOS DE TROUBLESHOOTING ================= */
window.SCENARIOS = [
  {
    id: 'ts-502', title: 'Nginx responde 502 Bad Gateway', day: 5, minutes: 15, moduleId: 'd4-troubleshooting',
    symptom: 'Los usuarios reportan 502 al abrir la aplicación. Nginx está activo y responde, pero no puede entregar contenido.',
    context: 'Servidor con nginx como reverse proxy hacia una API Node que corre en el puerto 3000. No hubo cambios de código en las últimas 24 horas, pero el equipo de infraestructura reinició servicios anoche.',
    evidence: [
      { label: 'nginx error.log', body: '2026/11/05 09:12:44 [error] 812#812: *45 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.0.7, server: app.empresa.local, request: "GET /api/health HTTP/1.1", upstream: "http://127.0.0.1:3000/api/health"' },
      { label: 'ss -tulpn | grep -E ":(80|3000)"', body: 'LISTEN 0 511 0.0.0.0:80 0.0.0.0:* users:(("nginx",pid=812))\n# no aparece nada escuchando en 3000' },
      { label: 'systemctl status miapp', body: '● miapp.service - API Node\n     Loaded: loaded (/etc/systemd/system/miapp.service; enabled)\n     Active: inactive (dead) since Thu 2026-11-05 02:14:11\n    Process: 1214 ExecStart=/usr/bin/node /opt/miapp/server.js (code=exited, status=1/FAILURE)' }
    ],
    questions: [
      { q: '¿Cuál es la causa más probable del 502?', options: ['Un error de DNS público', 'El upstream en 127.0.0.1:3000 no está escuchando', 'El certificado TLS expiró', 'La base de datos está lenta'], correct: 1,
        explain: 'Connection refused al upstream y ningún socket en 3000 indican que la API no está corriendo, no un problema de DNS ni TLS.' },
      { q: '¿Cuál es el primer paso de diagnóstico que aporta evidencia?', options: ['Reiniciar nginx', 'Revisar el error.log de nginx y el estado del servicio de la API', 'Aumentar el timeout del proxy', 'Escalar el servidor'], correct: 1,
        explain: 'El error.log ya dice connection refused; el siguiente paso es confirmar el estado del servicio y sus logs.' },
      { q: '¿Cómo confirmás la causa raíz antes de mitigar?', options: ['Revisar journalctl -u miapp y el exit code', 'Cambiar el puerto en nginx', 'Reinstalar nginx', 'Reiniciar el servidor completo'], correct: 0,
        explain: 'El servicio salió con status 1; journalctl muestra el error de la app (por ejemplo, variable de entorno faltante).' }
    ],
    hints: [
      'El error de nginx dice connection refused, no timeout: el puerto no acepta conexiones.',
      'Si nada escucha en 3000, el problema es el servicio de la API, no el proxy.',
      'status=1/FAILURE indica que la app arrancó y falló, no que systemd no pudo lanzarla.'
    ],
    rootCause: 'La API no está corriendo: al reiniciar servicios se perdió una variable de entorno y el proceso terminó con status 1. Nginx no tiene upstream al cual conectarse y devuelve 502.',
    resolution: ['systemctl status miapp --no-pager', 'journalctl -u miapp -n 50 --no-pager', 'systemctl start miapp', 'curl -I http://127.0.0.1:3000/api/health', 'curl -I https://app.empresa.local'],
    solutionChecks: [
      { re: 'journalctl|logs', label: 'Revisaste los logs de la app', hint: 'journalctl -u miapp' },
      { re: 'systemctl\\s+(start|restart)\\s+miapp', label: 'Iniciaste el servicio de la app', hint: 'systemctl start miapp (o restart)' },
      { re: 'curl', label: 'Verificaste con curl', hint: 'curl al healthcheck local y al proxy.' }
    ],
    prevention: 'Healthcheck del upstream monitoreado, variables en un archivo de entorno versionado, y un smoke test post-reinicio en el runbook.'
  },
  {
    id: 'ts-crashloop', title: 'Pod en CrashLoopBackOff', day: 5, minutes: 15, moduleId: 'd3-k8s-workloads',
    symptom: 'El Deployment de la API no levanta: los Pods reinician constantemente y el servicio devuelve 503.',
    context: 'Se desplegó una nueva versión de la imagen. El Pod arranca y muere a los pocos segundos.',
    evidence: [
      { label: 'kubectl get pods', body: 'NAME                    READY   STATUS             RESTARTS      AGE\napi-7d9f8c6b5f-2xk4p    0/1     CrashLoopBackOff   7 (42s ago)   6m' },
      { label: 'kubectl describe pod api-7d9f8c6b5f-2xk4p (extracto)', body: 'Last State:     Terminated\n  Reason:       Error\n  Exit Code:    1\nEvents:\n  Warning  BackOff  kubelet  Back-off restarting failed container api' },
      { label: 'kubectl logs api-7d9f8c6b5f-2xk4p --previous', body: 'Error: Cannot find module \'./config/production.json\'\n    at Module._resolveFilename (node:internal/modules/cjs/loader:1145:15)' }
    ],
    questions: [
      { q: '¿Qué te dice el exit code 1 en este contexto?', options: ['El contenedor fue matado por memoria', 'La aplicación falló por un error propio al arrancar', 'El nodo se quedó sin disco', 'La imagen no existe'], correct: 1,
        explain: 'Exit 1 es error de aplicación. 137 sería OOMKilled, 143 SIGTERM y ErrImagePull aparecería como evento aparte.' },
      { q: '¿Por qué es clave el flag --previous?', options: ['Muestra logs del contenedor que ya murió', 'Muestra logs del nodo', 'Fuerza el reinicio', 'Borra el Pod'], correct: 0,
        explain: 'El contenedor actual se reinicia antes de poder leer sus logs; --previous trae los del intento anterior.' },
      { q: '¿Cuál es la mitigación más rápida?', options: ['Aumentar los limits de memoria', 'Rollback a la revisión anterior del Deployment', 'Borrar el namespace', 'Reiniciar el nodo'], correct: 1,
        explain: 'La versión nueva está incompleta (falta un archivo de config). Rollback restaura el servicio; el fix se hace después.' }
    ],
    hints: [
      '0/1 READY con reinicios y exit 1 no es un problema de recursos.',
      'El log habla de un módulo faltante: la imagen nueva no incluye un archivo requerido.',
      'Mitigá primero: kubectl rollout undo deployment/api.'
    ],
    rootCause: 'La imagen nueva no incluye config/production.json (quedó fuera del .dockerignore/COPY). La app termina con exit 1 y Kubernetes reinicia con backoff exponencial.',
    resolution: ['kubectl logs api-7d9f8c6b5f-2xk4p --previous', 'kubectl rollout undo deployment/api', 'kubectl rollout status deployment/api', 'kubectl get pods && kubectl get endpoints api'],
    solutionChecks: [
      { re: 'logs[\\s\\S]*--previous|--previous', label: 'Leíste los logs del contenedor anterior', hint: 'kubectl logs POD --previous' },
      { re: 'rollout\\s+undo', label: 'Aplicaste rollback', hint: 'kubectl rollout undo deployment/api' },
      { re: 'get\\s+(pods|endpoints)|rollout\\s+status', label: 'Verificaste la recuperación', hint: 'kubectl rollout status y get endpoints.' }
    ],
    prevention: 'Build reproducible con multi-stage y .dockerignore revisado, test de arranque en CI con la imagen real (docker run + healthcheck) y canary antes de producción.'
  },
  {
    id: 'ts-dns', title: 'La app no resuelve nombres internos', day: 5, minutes: 12, moduleId: 'd1-redes',
    symptom: 'El servicio de pagos falla con "no such host" al llamar a otro servicio interno, mientras que el resto de la app funciona.',
    context: 'Servicios en Docker Compose sobre la misma red. El servicio de pagos se conecta a pagos-db por nombre.',
    evidence: [
      { label: 'Log de la app', body: 'Error: getaddrinfo ENOTFOUND pagos-db\n    at GetAddrInfoReqWrap.onlookup [as oncomplete]' },
      { label: 'docker compose ps', body: 'NAME                SERVICE   STATUS\npagos-api-1         api       Up 2 minutes\npagos-db-1          db        Up 2 minutes (healthy)' },
      { label: 'Config de la app', body: 'DB_HOST=localhost\nDB_PORT=5432' }
    ],
    questions: [
      { q: '¿Por qué falla la resolución de pagos-db?', options: ['El DNS público está caído', 'La app usa localhost en vez del nombre del servicio', 'La base no tiene datos', 'Falta el puerto 443'], correct: 1,
        explain: 'El log muestra ENOTFOUND pagos-db, pero la config apunta a localhost. Dentro del contenedor, localhost es el propio contenedor.' },
      { q: '¿Cómo verificás el nombre correcto?', options: ['Desde otro contenedor de la red, con getent hosts db o nslookup', 'En la máquina host con ping google.com', 'Con docker inspect del host', 'Reiniciando Docker'], correct: 0,
        explain: 'La resolución por nombre de servicio solo existe dentro de la red del proyecto; se prueba desde otro contenedor.' },
      { q: '¿Cuál es el arreglo?', options: ['Publicar el puerto de la base al host', 'Cambiar DB_HOST al nombre del servicio (db) y reiniciar', 'Instalar un DNS externo', 'Usar la IP del host'], correct: 1,
        explain: 'El nombre del servicio es el host DNS en Compose. Publicar puertos no arregla la resolución interna.' }
    ],
    hints: [
      'ENOTFOUND es un error de resolución, no de credenciales ni de puerto.',
      'Dentro de un contenedor, localhost nunca es otro contenedor.',
      'En Compose el host es el nombre del servicio: db.'
    ],
    rootCause: 'La variable DB_HOST estaba en localhost mientras la base corre en el servicio db. Docker resuelve nombres de servicio en la red del proyecto, no localhost.',
    resolution: ['docker compose exec api getent hosts db', 'docker compose exec api sh -c "echo $DB_HOST"', '# corregir DB_HOST=db en compose o .env', 'docker compose up -d api', 'docker compose logs -f api'],
    solutionChecks: [
      { re: 'getent|nslookup|dig', label: 'Verificaste la resolución desde el contenedor', hint: 'docker compose exec api getent hosts db' },
      { re: 'DB_HOST|localhost|db\\b', label: 'Identificaste la variable incorrecta', hint: 'DB_HOST=localhost vs DB_HOST=db' },
      { re: 'compose\\s+(up|restart)|docker\\s+(restart|compose)', label: 'Aplicaste el cambio reiniciando el servicio', hint: 'docker compose up -d api' }
    ],
    prevention: 'Validar variables de entorno al arrancar (fail fast), usar un .env de ejemplo versionado y un healthcheck de dependencias en CI.'
  },
  {
    id: 'ts-disk', title: 'Disco al 100% y servicios caídos', day: 5, minutes: 12, moduleId: 'd1-procesos',
    symptom: 'La base de datos deja de aceptar escrituras y nginx devuelve 500. El monitoring alerta disco lleno.',
    context: 'Servidor con /var en una partición separada. Hace una semana se habilitó logging debug en una app.',
    evidence: [
      { label: 'df -h', body: 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda2        40G   40G     0 100% /\n/dev/sda3        80G   79G   1.1G  99% /var' },
      { label: 'du -sh /var/* | sort -h | tail -3', body: '1.2G /var/lib\n3.1G /var/www\n41G  /var/log' },
      { label: 'ls -lh /var/log/miapp/', body: '-rw-r--r-- 1 root root  38G Nov  5 09:20 application.log\n-rw-r--r-- 1 root root  12M Nov  5 00:00 application.log.1' }
    ],
    questions: [
      { q: '¿Cuál es la causa inmediata?', options: ['La base de datos creció', 'Un log de 38 GB sin rotación llenó /var', 'Faltan inodos', 'El disco está dañado'], correct: 1,
        explain: 'du y ls muestran un único application.log de 38 GB: logging debug sin rotación.' },
      { q: '¿Qué hacés primero para recuperar servicio sin perder el proceso?', options: ['rm -rf /var/log', 'Truncar el log activo (truncate -s 0) y reiniciar la app', 'Formatear /var', 'Reiniciar el servidor'], correct: 1,
        explain: 'Truncar libera espacio sin borrar el archivo abierto; borrarlo deja el descriptor abierto y el espacio no se libera hasta reiniciar el proceso.' },
      { q: '¿Qué medida previene la recurrencia?', options: ['Comprar más disco', 'Configurar logrotate y bajar el nivel de log', 'Mover todo a /tmp', 'Deshabilitar logs'], correct: 1,
        explain: 'La rotación con límites y un nivel de log razonable atacan la causa; agregar disco solo posterga.' }
    ],
    hints: [
      'df muestra el filesystem, du muestra quién consume.',
      'Un archivo borrado abierto sigue ocupando espacio: revisá con lsof +L1.',
      'El log de la app es 38 GB: rotación y nivel de log.'
    ],
    rootCause: 'Se habilitó logging en nivel debug y no hay logrotate para la app. /var llegó al 99% y los servicios que escriben fallaron.',
    resolution: ['df -h /var', 'du -sh /var/* | sort -h | tail -5', 'sudo lsof +L1 | head', 'sudo truncate -s 0 /var/log/miapp/application.log', 'sudo systemctl restart miapp', 'df -h /var'],
    solutionChecks: [
      { re: 'df\\s+-h|df\\s+-i', label: 'Mediste el filesystem', hint: 'df -h /var' },
      { re: 'du\\s+-sh', label: 'Ubicaste el consumo con du', hint: 'du -sh /var/* | sort -h' },
      { re: 'truncate|logrotate|rm\\s', label: 'Liberaste espacio de forma controlada', hint: 'truncate -s 0 sobre el log activo.' },
      { re: 'systemctl\\s+(restart|start)', label: 'Reiniciaste el servicio afectado', hint: 'systemctl restart miapp' }
    ],
    prevention: 'logrotate con size/maxage y compress, alerta al 80% de uso, límite de logs en el agente y nivel info en producción.'
  },
  {
    id: 'ts-perm', title: 'Permission denied al ejecutar el deploy', day: 5, minutes: 10, moduleId: 'd1-permisos',
    symptom: 'El pipeline falla al ejecutar el script de despliegue con "Permission denied", aunque el archivo existe.',
    context: 'El script se copió desde un repositorio a /opt/deploy/deploy.sh y lo ejecuta un usuario de servicio.',
    evidence: [
      { label: 'Error del pipeline', body: '/opt/deploy/deploy.sh: line 1: ./deploy.sh: Permission denied\nError: Process completed with exit code 126' },
      { label: 'ls -l /opt/deploy/', body: '-rw-r--r-- 1 root root 412 Nov  4 18:22 deploy.sh' },
      { label: 'id deploy', body: 'uid=1001(deploy) gid=1001(deploy) groups=1001(deploy)' },
      { label: 'mount | grep " /opt"', body: '/dev/sdb1 on /opt type ext4 (rw,nosuid,noexec,relatime)' }
    ],
    questions: [
      { q: '¿Cuántas causas hay en la evidencia?', options: ['Una: falta chmod +x', 'Dos: falta el bit de ejecución y el filesystem está montado noexec', 'Una: el usuario no es root', 'Ninguna, es un error de red'], correct: 1,
        explain: 'El archivo es 644 (sin x) y además /opt está montado con noexec: aunque agregues x, no se ejecutará desde ahí.' },
      { q: '¿Qué significa el exit code 126?', options: ['Comando no encontrado', 'El comando existe pero no se puede ejecutar', 'Error de sintaxis', 'Timeout'], correct: 1,
        explain: '126 = permiso denegado al ejecutar; 127 sería comando no encontrado.' },
      { q: '¿Cuál es la solución correcta?', options: ['chmod 777 y listo', 'chmod +x y ejecutar con bash, o mover el script a un filesystem sin noexec', 'Correr todo como root', 'Deshabilitar el firewall'], correct: 1,
        explain: 'El bit x es necesario, pero noexec bloquea igual. Ejecutar con bash o mover el script resuelve sin ampliar permisos.' }
    ],
    hints: [
      'Mirá los permisos: -rw-r--r-- no tiene x.',
      'Revisá las opciones de montaje: noexec impide ejecutar binarios.',
      'Exit 126 no es "no existe".'
    ],
    rootCause: 'El script no tiene bit de ejecución y /opt está montado con noexec. Se suma que se copió como root sin ajustar dueño para el usuario deploy.',
    resolution: ['ls -l /opt/deploy/deploy.sh', 'mount | grep " /opt"', 'sudo chmod 750 /opt/deploy/deploy.sh && sudo chown deploy:deploy /opt/deploy/deploy.sh', 'bash /opt/deploy/deploy.sh   # o mover a /usr/local/bin'],
    solutionChecks: [
      { re: 'ls\\s+-l', label: 'Revisaste permisos', hint: 'ls -l /opt/deploy/deploy.sh' },
      { re: 'chmod\\s+(\\+x|[0-9]*7[0-9]*)', label: 'Agregaste permiso de ejecución', hint: 'chmod 750 deploy.sh' },
      { re: 'bash|noexec|mount', label: 'Contemplaste el noexec o ejecutaste con bash', hint: 'Verificá el mount con noexec.' }
    ],
    prevention: 'Empaquetar el deploy como imagen o binario, verificar permisos en el Dockerfile/artefacto y evitar noexec en rutas de scripts operativos.'
  },
  {
    id: 'ts-network', title: 'Contenedores que no se ven entre sí', day: 5, minutes: 12, moduleId: 'd2-compose',
    symptom: 'La API no puede conectar con Redis: "connection refused" en el puerto 6379. Ambos contenedores están Up.',
    context: 'Stack con Compose. Se agregó Redis recientemente. La API usa REDIS_HOST=redis y REDIS_PORT=6379.',
    evidence: [
      { label: 'docker compose ps', body: 'NAME         SERVICE   STATUS         PORTS\napp-1        app       Up 3 minutes   0.0.0.0:3000->3000/tcp\nredis-1      redis     Up 3 minutes   6379/tcp' },
      { label: 'docker compose exec app sh -c "getent hosts redis"', body: '172.19.0.3      redis' },
      { label: 'docker compose exec app sh -c "nc -zv redis 6379"', body: 'nc: bad address \'redis\'  (busybox nc sin DNS) — se probó con getent y resolvió' },
      { label: 'docker compose exec redis redis-cli ping', body: 'PONG' }
    ],
    questions: [
      { q: 'Si el nombre resuelve y Redis responde PONG, ¿dónde está el problema?', options: ['En DNS de Docker', 'En la configuración de la app (host/puerto o binding)', 'En el firewall del host', 'En la imagen de Redis'], correct: 1,
        explain: 'getent resuelve y redis-cli responde dentro del contenedor. El fallo está en cómo la app se conecta (por ejemplo, usa localhost o un puerto viejo).' },
      { q: '¿Qué verificación confirma que Redis escucha en la interfaz correcta?', options: ['docker compose exec redis ss -tulpn', 'ping redis', 'docker images', 'curl localhost'], correct: 0,
        explain: 'ss dentro del contenedor muestra en qué dirección escucha Redis (0.0.0.0 vs 127.0.0.1).' },
      { q: '¿Por qué no hace falta publicar 6379 al host?', options: ['Porque Compose no lo permite', 'Porque la comunicación entre contenedores usa la red interna', 'Porque Redis no acepta conexiones externas', 'Porque el puerto es privilegiado'], correct: 1,
        explain: 'Los servicios se comunican por la red del proyecto; publicar al host solo es necesario para acceso externo.' }
    ],
    hints: [
      'Separá resolución (DNS), conectividad (puerto) y configuración de la app.',
      'PONG dentro del contenedor demuestra que Redis está sano.',
      'Revisá si la app quedó con REDIS_HOST=localhost o un puerto anterior.'
    ],
    rootCause: 'La app tenía REDIS_HOST=localhost (config vieja). Resolución y conectividad funcionaban; el host incorrecto producía connection refused.',
    resolution: ['docker compose exec app getent hosts redis', 'docker compose exec redis sh -c "ss -tulpn || netstat -tulpn"', 'docker compose exec redis redis-cli ping', '# corregir REDIS_HOST=redis', 'docker compose up -d app', 'docker compose logs -f app'],
    solutionChecks: [
      { re: 'getent|nslookup', label: 'Verificaste DNS interno', hint: 'docker compose exec app getent hosts redis' },
      { re: 'redis-cli|PONG|ss\\s+-tulpn', label: 'Comprobaste el servicio Redis', hint: 'redis-cli ping dentro del contenedor.' },
      { re: 'REDIS_HOST|localhost|compose\\s+up', label: 'Corregiste la configuración y reiniciaste', hint: 'REDIS_HOST=redis y docker compose up -d app.' }
    ],
    prevention: 'Validación de configuración al inicio (fail fast), smoke test de dependencias en CI y un .env.example documentado.'
  },
  {
    id: 'ts-ci', title: 'El pipeline falla solo en el runner', day: 5, minutes: 12, moduleId: 'd2-actions',
    symptom: 'Los tests pasan en la laptop de desarrollo pero fallan en GitHub Actions desde el último merge.',
    context: 'Proyecto Node con tests de integración que usan una base de datos local.',
    evidence: [
      { label: 'Log del step npm test', body: 'Error: connect ECONNREFUSED 127.0.0.1:5432\n    at TCPConnectWrap.afterConnect [as oncomplete]\n  test/integration/users.test.js:14' },
      { label: 'Workflow (extracto)', body: 'jobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm ci\n      - run: npm test' },
      { label: 'package.json (extracto)', body: '"test": "jest"\n"test:unit": "jest test/unit"\n"test:integration": "jest test/integration"' }
    ],
    questions: [
      { q: '¿Por qué funciona local y falla en CI?', options: ['El código es distinto', 'El runner no tiene una base de datos escuchando en 5432', 'GitHub bloquea el puerto 5432', 'Falta node'], correct: 1,
        explain: 'En local la base corría; el runner es efímero y no tiene Postgres. El test de integración asume una dependencia inexistente.' },
      { q: '¿Cuál es la solución más robusta?', options: ['Saltear los tests de integración', 'Usar services en el workflow (Postgres) y esperar healthcheck', 'Cambiar el test a unitario sin decirlo', 'Instalar Postgres en cada developer'], correct: 1,
        explain: 'GitHub Actions permite declarar services con healthcheck; el job espera a que la base esté lista.' },
      { q: '¿Cómo evitás que un test dependa de un servicio no declarado?', options: ['Con un gate de CI que corra integración contra services', 'Ejecutando todo en local', 'Aumentando el timeout', 'Usando latest'], correct: 0,
        explain: 'El pipeline declara sus dependencias y corre integración contra ellas; si falta, el gate lo detecta siempre.' }
    ],
    hints: [
      'ECONNREFUSED 127.0.0.1:5432 en un runner limpio significa que no hay Postgres.',
      'GitHub Actions tiene services con puertos y healthcheck.',
      'No adaptes el test: adaptá el entorno del pipeline.'
    ],
    rootCause: 'El test de integración requiere Postgres, pero el workflow solo hace checkout, npm ci y test. El runner no tiene la base.',
    resolution: ['# agregar al job:\nservices:\n  postgres:\n    image: postgres:16-alpine\n    env:\n      POSTGRES_PASSWORD: test\n    ports: ["5432:5432"]\n    options: >-\n      --health-cmd "pg_isready -U postgres" --health-interval 5s\n      --health-timeout 3s --health-retries 10', 'npm test   # con DB_HOST=127.0.0.1'],
    solutionChecks: [
      { re: 'services:', label: 'Declaraste el servicio de base en el workflow', hint: 'jobs.<job>.services.postgres' },
      { re: 'postgres', label: 'Usaste la imagen de Postgres', hint: 'image: postgres:16-alpine' },
      { re: 'health|pg_isready', label: 'Agregaste healthcheck', hint: 'options con pg_isready.' }
    ],
    prevention: 'Los tests de integración declaran sus dependencias en el pipeline, con healthcheck y variables de entorno explícitas.'
  },
  {
    id: 'ts-oom', title: 'Pod OOMKilled en producción', day: 5, minutes: 12, moduleId: 'd3-k8s-arq',
    symptom: 'La API reinicia varias veces por hora en producción. En staging no ocurre.',
    context: 'Deployment con limits de memoria 256Mi. El tráfico de producción es mayor y se agregó una caché en memoria.',
    evidence: [
      { label: 'kubectl describe pod api-7f8c9 (extracto)', body: '    Last State:  Terminated\n      Reason:    OOMKilled\n      Exit Code: 137\n    Limits:\n      memory:  256Mi\n    Requests:\n      memory:  128Mi' },
      { label: 'kubectl top pod', body: 'NAME                  CPU(cores)   MEMORY(bytes)\napi-7f8c9d6f5-abcde   45m          254Mi' },
      { label: 'Métrica de memoria (últimas 2 h)', body: 'La memoria crece de 120Mi a 256Mi en 35 minutos y cae al reiniciar (patrón diente de sierra).' }
    ],
    questions: [
      { q: '¿Qué indica exit code 137 + OOMKilled?', options: ['Error de aplicación', 'El contenedor superó el límite de memoria y el kernel lo mató', 'Timeout de readiness', 'Imagen corrupta'], correct: 1,
        explain: '137 = SIGKILL y OOMKilled confirma que fue el kernel por exceder el límite de memoria.' },
      { q: '¿Qué revela el patrón diente de sierra?', options: ['Un leak de memoria o una caché sin límite', 'Un problema de CPU', 'Un error de red', 'Un disco lento'], correct: 0,
        explain: 'El crecimiento sostenido hasta el límite y la caída al reiniciar sugieren acumulación de memoria (leak o caché sin política de expiración).' },
      { q: '¿Cuál es la respuesta correcta a corto y largo plazo?', options: ['Solo subir el límite a 1Gi', 'Subir el límite como mitigación y corregir el leak/caché con métricas', 'Quitar los limits', 'Reiniciar el clúster'], correct: 1,
        explain: 'Quitar limits es riesgoso para el nodo; subir sin corregir solo posterga el fallo.' }
    ],
    hints: [
      'Buscá OOMKilled y el exit code en los eventos.',
      'El patrón de crecimiento sostenido apunta a retención de memoria.',
      'Los limits protegen al nodo: no los elimines.'
    ],
    rootCause: 'La caché en memoria no tiene límite ni TTL y el tráfico de producción la hace crecer hasta superar el limit de 256Mi.',
    resolution: ['kubectl describe pod api-7f8c9d6f5-abcde | grep -A5 "Last State"', 'kubectl top pod', 'kubectl set resources deployment/api --limits=memory=512Mi', '# corregir la caché: límite de entradas y TTL', 'kubectl rollout status deployment/api'],
    solutionChecks: [
      { re: 'describe|OOMKilled|137', label: 'Confirmaste OOMKilled con describe', hint: 'kubectl describe pod | grep Last State' },
      { re: 'top|m[eé]tricas|grafana', label: 'Revisaste el consumo de memoria', hint: 'kubectl top pod' },
      { re: 'set resources|limits|512Mi|patch', label: 'Ajustaste recursos como mitigación', hint: 'kubectl set resources ... --limits=memory=512Mi' },
      { re: 'cach[eé]|leak|TTL|l[ií]mite', label: 'Identificaste la causa en el código/config', hint: 'Caché sin TTL o leak.' }
    ],
    prevention: 'Caché con TTL y tamaño máximo, profiling de memoria en staging con carga realista, alertas de memoria al 80% del limit y revisiones de capacity planning.'
  },
  {
    id: 'ts-tls', title: 'Certificado TLS vencido', day: 5, minutes: 10, moduleId: 'd1-redes',
    symptom: 'Los usuarios ven un error de certificado y las integraciones externas fallan con "certificate has expired".',
    context: 'El servicio está detrás de un Ingress con TLS terminado en el balanceador. El certificado se renovaba manualmente cada año.',
    evidence: [
      { label: 'curl -vI https://app.empresa.com', body: '*  SSL certificate verify result: certificate has expired (10), continuing anyway.\n< HTTP/2 200' },
      { label: 'openssl s_client -connect app.empresa.com:443 | openssl x509 -noout -dates', body: 'notBefore=Oct 20 00:00:00 2025 GMT\nnotAfter=Oct 20 23:59:59 2026 GMT' },
      { label: 'kubectl get certificate', body: 'NAME        READY   SECRET      AGE\napp-tls   False   app-tls     376d' }
    ],
    questions: [
      { q: '¿Cuál es la causa?', options: ['El DNS apunta mal', 'El certificado expiró y no se renovó automáticamente', 'El puerto 443 está cerrado', 'La app está caída'], correct: 1,
        explain: 'notAfter ya pasó y el Certificate está NotReady: falta renovación.' },
      { q: '¿Cómo se previene en Kubernetes?', options: ['Renovar a mano cada año en el calendario', 'cert-manager con renovación automática y alerta de expiración', 'Usar HTTP', 'Comprar un certificado de 10 años'], correct: 1,
        explain: 'cert-manager emite y renueva; además conviene alertar a 30/14 días de la expiración.' }
    ],
    hints: [
      'openssl x509 -dates muestra el vencimiento real.',
      'READY False en el Certificate indica que la emisión no se completó.',
      'La renovación manual es un riesgo operativo.'
    ],
    rootCause: 'El certificado venció (notAfter superado) y la renovación era manual. El objeto Certificate está en False porque la emisión falló.',
    resolution: ['openssl s_client -connect app.empresa.com:443 2>/dev/null | openssl x509 -noout -dates', 'kubectl describe certificate app-tls', 'kubectl delete certificaterequest --all   # forzar reemisión', 'kubectl get certificate -w'],
    solutionChecks: [
      { re: 'openssl|s_client|notAfter', label: 'Verificaste las fechas del certificado', hint: 'openssl s_client ... | x509 -dates' },
      { re: 'certificate|cert-manager|describe', label: 'Revisaste el recurso de certificado', hint: 'kubectl describe certificate' },
      { re: 'delete|renew|reemit|kubectl', label: 'Forzaste la renovación', hint: 'Forzar reemisión con cert-manager.' }
    ],
    prevention: 'cert-manager o ACME automático, alerta a 30 y 14 días de expiración y un runbook de rotación documentado.'
  },
  {
    id: 'ts-fstab', title: 'El servidor no arranca tras editar fstab', day: 5, minutes: 15, moduleId: 'd1-arquitectura',
    symptom: 'Después de reiniciar, el servidor entra en modo emergencia y no levanta servicios.',
    context: 'Se agregó una línea al /etc/fstab para montar un disco nuevo y se reinició sin probar mount -a.',
    evidence: [
      { label: 'Pantalla de emergencia', body: '[FAILED] Failed to mount /datos.\nSee \'systemctl status datos.mount\' for details.\nYou are in emergency mode.' },
      { label: '/etc/fstab (línea agregada)', body: 'UUID=1234-abcd  /datos  ext4  defaults  0 2' },
      { label: 'blkid del disco nuevo', body: '/dev/sdb1: UUID="9f8e7d6c-1234" TYPE="ext4"' }
    ],
    questions: [
      { q: '¿Por qué el sistema no arranca normalmente?', options: ['El disco está lleno', 'El UUID de fstab no coincide y el montaje falla, dejando el sistema en emergencia', 'Falta el kernel', 'La red no funciona'], correct: 1,
        explain: 'Un UUID inexistente hace fallar el mount; systemd entra en emergency mode.' },
      { q: '¿Cómo se repara desde emergencia?', options: ['Reinstalar el SO', 'Montar / en rw, corregir el UUID con blkid y probar mount -a', 'Formatear el disco', 'Borrar /etc/fstab'], correct: 1,
        explain: 'Se remonta la raíz en rw, se corrige la línea con el UUID real (o se comenta) y se verifica con mount -a.' },
      { q: '¿Qué prueba evitaba el incidente?', options: ['df -h', 'mount -a antes de reiniciar', 'lsblk', 'systemctl reboot'], correct: 1,
        explain: 'mount -a valida todo el fstab sin reiniciar. Es la regla de oro.' }
    ],
    hints: [
      'El UUID de fstab debe coincidir con blkid.',
      'En emergencia la raíz suele estar en solo lectura: remontala con mount -o remount,rw /.',
      'Opcional: usar nofail para discos no críticos.'
    ],
    rootCause: 'La línea de /etc/fstab tiene un UUID que no existe (se copió mal). El montaje falla, systemd no puede completar el arranque y entra en emergencia.',
    resolution: ['mount -o remount,rw /', 'blkid /dev/sdb1', 'vi /etc/fstab   # corregir UUID o comentar la línea', 'mount -a', 'systemctl reboot'],
    solutionChecks: [
      { re: 'blkid', label: 'Obtuviste el UUID real', hint: 'blkid /dev/sdb1' },
      { re: 'fstab', label: 'Corregiste fstab', hint: 'Editar la línea con el UUID correcto o comentarla.' },
      { re: 'mount\\s+-a', label: 'Validaste con mount -a', hint: 'mount -a antes de reiniciar.' }
    ],
    prevention: 'Siempre mount -a antes de reiniciar, usar nofail para discos opcionales y un snapshot/consola de recuperación disponible en cloud.'
  },
  {
    id: 'ts-load', title: 'Load average alto con CPU ociosa', day: 5, minutes: 12, moduleId: 'd4-troubleshooting',
    symptom: 'El monitoring alerta load average de 18 en un servidor de 4 núcleos, pero la CPU está al 12%.',
    context: 'Servidor de aplicación con un NFS montado para uploads. El problema empezó esta mañana.',
    evidence: [
      { label: 'uptime', body: ' 09:40:12 up 3 days,  load average: 18.42, 17.90, 12.10' },
      { label: 'vmstat 1 3', body: 'procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----\n r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st\n 0 14      0 210000  12000 480000    0    0     8     4  200  500  8  4 12 76  0' },
      { label: 'ps aux --sort=-stat | head', body: 'USER  PID %CPU %MEM STAT COMMAND\napp   981  0.4  1.2 D    /usr/bin/python3 worker.py --sync-uploads' }
    ],
    questions: [
      { q: '¿Qué explica load alto con CPU baja?', options: ['Un virus minando cripto', 'Procesos bloqueados en espera de I/O (estado D), probablemente NFS', 'Falta de memoria', 'Un error de DNS'], correct: 1,
        explain: 'vmstat muestra wa=76% y procesos b=14; ps muestra workers en estado D esperando I/O.' },
      { q: '¿Qué comando confirma el recurso lento?', options: ['iostat -x 1 o iotop', 'ping 8.8.8.8', 'docker ps', 'systemctl list-units'], correct: 0,
        explain: 'iostat/iotop muestran saturación y latencia de disco/NFS.' },
      { q: '¿Cuál es la mitigación inmediata?', options: ['Reiniciar el servidor', 'Bajar la concurrencia de uploads y revisar la latencia del NFS', 'Agregar CPU', 'Borrar logs'], correct: 1,
        explain: 'Si el cuello es I/O remoto, agregar CPU no ayuda: hay que reducir concurrencia y verificar el NFS.' }
    ],
    hints: [
      'Compará load con nproc: 18 en 4 núcleos es 4.5x.',
      'El %wa alto en vmstat indica espera de I/O.',
      'Los procesos en estado D no responden a señales: no los mates a ciegas.'
    ],
    rootCause: 'El NFS de uploads aumentó su latencia; los workers quedan en estado D esperando I/O y saturan la cola, elevando el load sin consumir CPU.',
    resolution: ['uptime; nproc', 'vmstat 1 5', 'iostat -x 1 3', 'mount | grep nfs', 'showmount -e nfs-server', '# reducir concurrencia y escalar/monitorear NFS'],
    solutionChecks: [
      { re: 'vmstat|iostat|iotop', label: 'Mediste espera de I/O', hint: 'vmstat 1 3 o iostat -x 1' },
      { re: 'nfs|mount', label: 'Revisaste el montaje NFS', hint: 'mount | grep nfs' },
      { re: 'D\\b|bloque|espera|concurrencia', label: 'Identificaste procesos bloqueados', hint: 'ps con STAT D y reducción de concurrencia.' }
    ],
    prevention: 'Monitorear latencia de NFS, límites de concurrencia en workers de I/O, alerta por %wa y no poner uploads críticos en NFS sin métricas.'
  },
  {
    id: 'ts-secret', title: 'Secreto expuesto en el repositorio', day: 5, minutes: 10, moduleId: 'd4-devsecops',
    symptom: 'Un escaneo detecta una AWS Access Key en un commit de hace 3 días en un repositorio público.',
    context: 'El archivo .env se commiteó por error y luego se borró en un commit posterior. La clave sigue activa.',
    evidence: [
      { label: 'Resultado del escaneo', body: 'Finding: AWS Access Key ID\nFile: config/.env\nCommit: 8f2a1c9 (hace 3 días)\nEntropy: high\nStatus: ACTIVE' },
      { label: 'git log --oneline', body: 'b7c1a2e elimina .env\n8f2a1c9 agrega configuración local\n4d9e0aa feat: nuevo endpoint' },
      { label: 'CloudTrail (extracto)', body: 'EventName: ListBuckets\nUserIdentity: AKIA...\nSourceIPAddress: 185.x.x.x (desconocida)' }
    ],
    questions: [
      { q: '¿Cuál es la primera acción?', options: ['Borrar el commit', 'Rotar/desactivar la credencial inmediatamente', 'Hacer el repo privado', 'Agregar .env al .gitignore'], correct: 1,
        explain: 'La credencial ya está comprometida y hay accesos desde una IP desconocida. Primero se revoca, después se limpia.' },
      { q: '¿Por qué borrar el archivo no alcanza?', options: ['Porque Git guarda la historia completa', 'Porque el archivo está en caché', 'Porque el .env se recrea', 'Porque el repo es público'], correct: 0,
        explain: 'El commit permanece en la historia y sigue siendo accesible aunque el archivo se borre.' },
      { q: '¿Qué orden correcto sigue el incidente?', options: ['Limpiar historia → rotar → auditar', 'Rotar → auditar accesos → limpiar historia → prevenir', 'Avisar → esperar → borrar', 'Solo rotar'], correct: 1,
        explain: 'Rotar primero, auditar el uso, luego limpiar la historia y agregar controles.' }
    ],
    hints: [
      'Asumí siempre que la credencial ya fue usada.',
      'git filter-repo reescribe la historia; requiere coordinación.',
      'La detección debe estar en pre-commit y en CI.'
    ],
    rootCause: 'Se commiteó un .env con credenciales y se borró después sin rotar. La clave quedó activa y fue usada desde una IP desconocida.',
    resolution: ['# 1. Desactivar la clave en IAM (o rotarla)', 'aws iam update-access-key --access-key-id AKIA... --status Inactive', 'aws iam list-access-keys --user-name deploy', '# 2. Auditar CloudTrail del período', '# 3. Limpiar historia con git filter-repo y forzar push coordinado', '# 4. gitleaks en pre-commit y CI'],
    solutionChecks: [
      { re: 'rot|revoc|desactiv|Inactive|delete', label: 'Rotaste/revocaste la credencial', hint: 'Desactivar o rotar la clave en IAM.' },
      { re: 'audit|CloudTrail|logs|accesos', label: 'Auditaste el uso de la credencial', hint: 'Revisar CloudTrail/registros de acceso.' },
      { re: 'filter-repo|historia|gitleaks', label: 'Planificaste limpieza y prevención', hint: 'filter-repo + gitleaks en pre-commit.' }
    ],
    prevention: 'gitleaks en pre-commit y CI, secret scanning del proveedor, OIDC en lugar de claves estáticas y un runbook de respuesta a incidentes de credenciales.'
  }
];

/* ================= PROYECTO FINAL ================= */
window.PROJECT = {
  title: 'Mini DevOps Pipeline',
  intro: 'Integrá todo lo aprendido en un flujo real: repositorio → CI → tests → imagen → contenedor → healthcheck → monitoreo. Entregá evidencia de cada paso y prepará la explicación de 3 minutos para la entrevista.',
  architecture:
'~~~\n' +
'GitHub Repository\n' +
'        ↓\n' +
'GitHub Actions (CI)\n' +
'        ↓\n' +
'Automated Tests\n' +
'        ↓\n' +
'Docker Image Build → Registry\n' +
'        ↓\n' +
'Container Execution\n' +
'        ↓\n' +
'Health Check\n' +
'        ↓\n' +
'Monitoring (logs + métricas)\n' +
'~~~\n\n' +
'**Criterio de éxito:** cada flecha debe poder demostrarse con un comando, una captura o una URL. Si algo no se puede demostrar, no está hecho.',
  sections: [
    {
      id: 'repo', title: '1. Repositorio y aplicación',
      items: [
        { id: 'p-repo', label: 'Repositorio en GitHub con README y .gitignore' },
        { id: 'p-app', label: 'Aplicación mínima con endpoint /health y un endpoint de negocio' },
        { id: 'p-tests', label: 'Tests automatizados que corren con un solo comando' },
        { id: 'p-env', label: 'Variables de entorno documentadas en .env.example (sin secretos)' }
      ]
    },
    {
      id: 'container', title: '2. Contenedor',
      items: [
        { id: 'p-dockerfile', label: 'Dockerfile multi-stage con versión fija de base y usuario no-root' },
        { id: 'p-ignore', label: '.dockerignore con node_modules, .git y .env' },
        { id: 'p-run', label: 'Contenedor ejecutado localmente con puerto publicado y healthcheck' },
        { id: 'p-compose', label: 'docker-compose.yml con app y dependencias (si aplica)' }
      ]
    },
    {
      id: 'pipeline', title: '3. Pipeline CI/CD',
      items: [
        { id: 'p-workflow', label: 'Workflow con lint, tests, build de imagen y scan' },
        { id: 'p-needs', label: 'Jobs encadenados con needs y artifact publicado' },
        { id: 'p-secrets', label: 'Credenciales del registry en secrets, nunca en el YAML' },
        { id: 'p-broken', label: 'Fallo provocado y diagnosticado con el log del step' }
      ]
    },
    {
      id: 'ops', title: '4. Operación y observabilidad',
      items: [
        { id: 'p-smoke', label: 'Smoke test post-deploy contra /health' },
        { id: 'p-logs', label: 'Logs centralizados o al menos estructurados a stdout' },
        { id: 'p-metrics', label: 'Métrica o dashboard mínimo (requests, errores, latencia)' },
        { id: 'p-alert', label: 'Una alerta con umbral y duración definidos' },
        { id: 'p-rollback', label: 'Procedimiento de rollback escrito y probado' }
      ]
    },
    {
      id: 'deliver', title: '5. Documentación y entrevista',
      items: [
        { id: 'p-arch', label: 'Diagrama de arquitectura en el README' },
        { id: 'p-runbook', label: 'Runbook: cómo desplegar, verificar y revertir' },
        { id: 'p-sec', label: 'Sección de seguridad: permisos, secretos y escaneo' },
        { id: 'p-pitch', label: 'Explicación de 3 minutos del flujo completo, practicada en voz alta' }
      ]
    }
  ]
};
