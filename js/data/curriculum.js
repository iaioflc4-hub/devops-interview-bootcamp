/* Currículo alineado con el examen LPI DevOps Tools Engineer 701-200 v2.0:
   dominios 701 Software Engineering, 702 Application Container, 703 Kubernetes y
   704 Security and Observability (15 objetivos con peso). Se completa con LFCS
   como base práctica, Terraform como IaC de equipo y Kubernetes extendido.
   Cada módulo declara su objetivo LPI en el mapa LPI_TRACK del final del archivo.
   Los laboratorios viven en labs.js. */
window.COURSE = {
  days: [
    {
      id: 1, title: 'Fundamentos Linux (LFCS)', lpi: 'LFCS', weight: 0, tag: 'linux',
      summary: 'Prerrequisito del examen: sistema operativo, permisos, procesos, texto, redes, almacenamiento y systemd. Es la base que LPI asume a nivel LPIC-1 y que LFCS evalúa de forma práctica.',
      objective: 'Administrar un servidor Linux con comandos reales: filesystem, permisos, servicios, almacenamiento y diagnóstico de red.',
      modules: ['d1-arquitectura', 'd1-permisos', 'd1-procesos', 'd1-texto', 'd1-redes', 'lfcs-storage', 'lfcs-systemd'],
      interviewFocus: ['Linux', 'Redes', 'Almacenamiento', 'systemd']
    },
    {
      id: 2, title: '701 · Ingeniería de software', lpi: 'LPI 701', weight: 20, tag: 'git',
      summary: 'Cómo se diseña, versiona y entrega software: arquitectura de servicios, plataformas cloud, Git, CI/CD, licencias y cadena de suministro.',
      objective: 'Diseñar una aplicación cloud native, versionar su código y automatizar su entrega con criterios de calidad y cumplimiento.',
      modules: ['lpi701-arq', 'lpi701-plataformas', 'd3-cloud', 'd1-git', 'd2-cicd', 'd2-actions', 'lpi701-licencias'],
      interviewFocus: ['Arquitectura', 'Cloud', 'Git', 'CI/CD', 'Licencias']
    },
    {
      id: 3, title: '702 · Contenedores', lpi: 'LPI 702', weight: 13, tag: 'docker',
      summary: 'Operación de contenedores Docker y Podman, imágenes OCI, redes, volúmenes, Compose y registries: el bloque con más peso práctico del examen.',
      objective: 'Construir imágenes reproducibles y operar stacks multi-contenedor con red, almacenamiento y publicación en un registry.',
      modules: ['d2-contenedores', 'd2-imagenes', 'd2-compose', 'd2-registries'],
      interviewFocus: ['Docker', 'Podman', 'Compose', 'Registries']
    },
    {
      id: 4, title: '703 · Kubernetes + Terraform', lpi: 'LPI 703 + Terraform', weight: 13, tag: 'k8s',
      summary: 'Arquitectura y operación de Kubernetes, empaquetado con Helm y Kustomize, más infraestructura como código con Terraform para trabajo en equipo.',
      objective: 'Desplegar y diagnosticar workloads en Kubernetes, empaquetar software con Helm y gestionar infraestructura con state remoto y módulos.',
      modules: ['d3-k8s-arq', 'd3-k8s-workloads', 'lpi703-helm', 'd3-terraform', 'tf-equipo'],
      interviewFocus: ['Kubernetes', 'Helm', 'Terraform', 'IaC']
    },
    {
      id: 5, title: '704 · Seguridad y observabilidad', lpi: 'LPI 704', weight: 14, tag: 'obs',
      summary: 'Seguridad cloud native, Prometheus, logs, trazas y el método de diagnóstico y comunicación que se evalúa en la entrevista final.',
      objective: 'Detectar y mitigar riesgos, instrumentar un servicio con métricas, logs y trazas, y resolver incidentes con método.',
      modules: ['d4-devsecops', 'd4-observabilidad', 'lpi704-logs', 'lpi704-tracing', 'd4-troubleshooting', 'd4-entrevista'],
      interviewFocus: ['Seguridad', 'Prometheus', 'Logs', 'Tracing', 'Troubleshooting']
    }
  ],

  modules: [
    /* ================= DÍA 1 ================= */
    {
      id: 'd1-arquitectura', day: 1, title: 'Arquitectura Linux y filesystem',
      subtitle: 'Kernel, shell, FHS y arranque', minutes: 55, tags: ['linux'], difficulty: 1,
      objectives: [
        'Describir la relación kernel → shell → procesos de usuario.',
        'Ubicar cualquier archivo en el estándar FHS sin dudar.',
        'Explicar la secuencia de arranque hasta systemd (PID 1).'
      ],
      theory:
'Linux es un **kernel** (núcleo) que administra CPU, memoria, disco y dispositivos. Todo lo demás —shell, servicios, tus scripts— es espacio de usuario. El shell traduce lo que escribís a llamadas al sistema y lanza procesos. Cada proceso tiene un **PID** y es hijo de otro proceso; el árbol entero cuelga de **PID 1**, que en sistemas modernos es **systemd**.\n\n' +
'### El sistema de archivos\nNo hay unidades C: ni D:. Existe un único árbol que nace en **/**. Los discos se montan dentro de ese árbol. El estándar **FHS** define qué va en cada carpeta:\n\n' +
'| Ruta | Contenido |\n' +
'| --- | --- |\n' +
'| /etc | Configuración de texto plano del sistema y servicios |\n' +
'| /var | Datos variables: logs en /var/log, bases de datos, web |\n' +
'| /usr | Binarios y bibliotecas no esenciales (usr/bin, usr/lib) |\n' +
'| /bin, /sbin | Binarios esenciales (hoy symlinks a /usr/bin) |\n' +
'| /home | Directorios personales de usuarios |\n' +
'| /tmp | Temporal, se limpia al reiniciar |\n' +
'| /proc, /sys | Pseudofilesystems en RAM con estado del kernel |\n' +
'| /dev | Dispositivos como archivos (sda, null, pts) |\n' +
'| /mnt, /media | Puntos de montaje manuales y automáticos |\n\n' +
'### Arranque en cuatro fases\n1. **Firmware** (BIOS/UEFI) ejecuta POST y busca el bootloader en MBR o en la partición EFI.\n2. **GRUB** carga **vmlinuz** (kernel comprimido) e **initramfs** (mini sistema en RAM con los drivers necesarios para montar la raíz).\n3. El kernel monta **/** primero en solo lectura, ejecuta fsck y la remonta en lectura/escritura.\n4. El kernel lanza **/sbin/init → systemd** con PID 1, que arranca unidades (.service, .target, .mount, .socket) en paralelo.\n\n' +
'### Distros que vas a ver en ofertas\n- **Debian/Ubuntu**: paquetes .deb, apt/dpkg. Base de la mayoría de imágenes Docker.\n- **RHEL/Rocky/Fedora**: paquetes .rpm, dnf. Muy común en banca y empresas grandes.\n- **Alpine**: imagen mínima con musl y apk, habitual en contenedores.\n\n' +
'### Servicios y logs\n**systemd** administra servicios: systemctl start/stop/restart/status/enable. Los logs centralizados se consultan con **journalctl** (-u unidad, -f follow, --since). En Debian/Ubuntu además existen archivos clásicos en /var/log (syslog, auth.log, nginx/).\n\n' +
'> En una entrevista, si te preguntan "¿qué pasa cuando arranca Linux?", la respuesta esperada es esta secuencia, no una lista de comandos.',
      realWorld: 'Un Pod de Kubernetes que reinicia sin parar suele resolverse mirando el mismo tríptico que en un servidor: estado del proceso, logs y configuración. Entender PID 1 explica por qué en un contenedor el proceso principal debe quedarse en primer plano.',
      commands: [
        { cmd: 'uname -a', desc: 'Kernel, hostname, arquitectura y versión.', example: 'uname -a\n# Linux debian 6.1.0-18-amd64 x86_64 GNU/Linux' },
        { cmd: 'cat /etc/os-release', desc: 'Identifica la distribución y su versión exacta.', example: 'cat /etc/os-release\n# PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"' },
        { cmd: 'systemctl status ssh', desc: 'Estado de un servicio, PID, último log y si está enabled.', example: 'systemctl status ssh\nsystemctl is-active ssh' },
        { cmd: 'journalctl -u ssh -n 50 --no-pager', desc: 'Últimas 50 líneas del journal de la unidad ssh.', example: 'journalctl -u nginx --since "10 min ago"' },
        { cmd: 'lsblk -f && df -hT', desc: 'Discos, filesystems, UUIDs y uso de espacio.', example: 'lsblk -f\ndf -hT' }
      ],
      labIds: ['lab-fhs', 'lab-servicio'],
      challenge: {
        prompt: 'En tu Ubuntu/WSL2, identificá: versión de kernel, distro exacta, servicio SSH activo o no, y qué filesystem usa /. Pegá los comandos y la salida resumida.',
        criteria: ['Usaste uname -r o uname -a', 'Usaste cat /etc/os-release', 'Consultaste systemctl is-active ssh', 'Identificaste el filesystem de / con df -hT']
      },
      mistakes: [
        'Confundir kernel con distribución: Ubuntu es una distro, Linux es el kernel.',
        'Creer que /proc ocupa espacio en disco (vive en RAM).',
        'Editar configuración y olvidar reiniciar o recargar el servicio; el cambio no aplica solo.'
      ],
      mastery: [
        'Podés dibujar el arranque desde el botón de encendido hasta el prompt sin mirar apuntes.',
        'Ante una ruta desconocida, sabés si pertenece a configuración, datos variables o binarios.',
        'Explicás la diferencia entre systemctl restart y reload con un caso de uso.'
      ],
      keyIdeas: ['kernel vs espacio de usuario', 'PID 1 es systemd', 'FHS', 'initramfs', 'journalctl']
    },
    {
      id: 'd1-permisos', day: 1, title: 'Usuarios, grupos y permisos',
      subtitle: 'UGO, SUID/SGID/sticky, ACL y sudo', minutes: 60, tags: ['linux'], difficulty: 2,
      objectives: [
        'Leer y escribir permisos en octal y simbólico sin errores.',
        'Aplicar SGID y ACL para separar departamentos.',
        'Explicar el principio de menor privilegio con ejemplos concretos.'
      ],
      theory:
'Cada archivo tiene dueño (UID), grupo (GID) y tres tripletas de permisos: **usuario, grupo y otros** (UGO). Los valores son **r=4, w=2, x=1**. Un 750 significa rwx para el dueño, r-x para el grupo y nada para el resto.\n\n' +
'### r, w, x significan cosas distintas según el tipo\n| Permiso | Archivo | Directorio |\n| --- | --- | --- |\n| r | Leer contenido | Listar nombres |\n| w | Modificar contenido | Crear, borrar y renombrar entradas |\n| x | Ejecutar | Entrar (cd) y acceder a los inodos |\n\n' +
'Por eso un directorio con r pero sin x deja ver nombres y no abrir nada. Es una pregunta clásica de entrevista.\n\n' +
'### Permisos especiales\n- **SUID (4000)**: el binario se ejecuta con los privilegios del dueño. Ejemplo: /usr/bin/passwd, que necesita escribir /etc/shadow.\n- **SGID (2000)**: en un directorio, los archivos nuevos heredan el grupo del directorio. Es la base de las carpetas compartidas por equipo.\n- **Sticky bit (1000)**: en /tmp permite que solo el dueño (o root) borre su archivo.\n- **ACL**: cuando UGO no alcanza, setfacl agrega permisos por usuario o grupo sin cambiar el grupo principal: setfacl -m u:ana:r-x /srv/proyecto.\n\n' +
'### Identidad y elevación\nLos usuarios viven en /etc/passwd (UID, home, shell) y las contraseñas hasheadas en /etc/shadow (solo root). Los grupos están en /etc/group. **sudo** ejecuta un comando como otro usuario según /etc/sudoers; la práctica correcta es otorgar comandos específicos, no "ALL=(ALL) NOPASSWD".\n\n' +
'### Comandos de creación\nuseradd crea la cuenta, pero sin -m no crea el home y sin -s queda con la shell por defecto. Para agregar a un grupo secundario, el flag **-a** es obligatorio: usermod -aG docker ana. Si lo omitís, borrás todas las membresías previas.\n\n' +
'> Regla de entrevista: nunca des 777. Si te bloqueás, explicá qué permiso mínimo necesita el proceso (lectura para un servidor web, escritura solo en el directorio de uploads).',
      realWorld: 'Una app que corre como root puede escribir cualquier archivo del host; una que corre como usuario sin privilegios y con el grupo correcto reduce el impacto de una vulnerabilidad. Lo mismo aplica a contenedores: USER no-root en el Dockerfile.',
      commands: [
        { cmd: 'chmod 2770 /srv/compras', desc: 'rwx dueño, rwx grupo, nada otros y SGID activo.', example: 'chmod 2770 /srv/compras\nls -ld /srv/compras  # drwxrws---' },
        { cmd: 'usermod -aG docker ana', desc: 'Agrega a un grupo secundario conservando los anteriores.', example: 'sudo usermod -aG docker ana\nid ana' },
        { cmd: 'setfacl -m u:carlos:r-x /srv/ventas', desc: 'ACL puntual para un usuario ajeno al grupo.', example: 'setfacl -m u:carlos:r-x /srv/ventas\ngetfacl /srv/ventas' },
        { cmd: 'find / -perm -4000 -type f 2>/dev/null', desc: 'Audita binarios con SUID (superficie de ataque).', example: 'find / -perm -4000 -type f 2>/dev/null' },
        { cmd: 'sudo -l', desc: 'Muestra qué comandos puede ejecutar el usuario con sudo.', example: 'sudo -l' }
      ],
      labIds: ['lab-permisos', 'lab-acl'],
      challenge: {
        prompt: 'Creá los grupos compras y ventas, los usuarios ana (ventas) y bruno (compras), y una carpeta /srv/empresa/compras con permiso 2770. Verificá con id y ls -ld.',
        criteria: ['groupadd para ambos grupos', 'useradd -m -G', 'chmod 2770', 'Verificación con ls -ld mostrando la s del grupo']
      },
      mistakes: [
        'Usar usermod -G sin -a y borrar grupos existentes del usuario.',
        'Dar 777 a un directorio web para "que funcione".',
        'Olvidar que sin x en el directorio no se puede acceder a los archivos aunque tengan permisos.'
      ],
      mastery: [
        'Convertís permisos entre octal y simbólico en segundos.',
        'Elegís entre SGID y ACL según el caso y justificás la decisión.',
        'Explicás SUID con el ejemplo de passwd y su riesgo de seguridad.'
      ],
      keyIdeas: ['r=4 w=2 x=1', 'SUID 4000', 'SGID 2000', 'sticky 1000', 'usermod -aG', 'ACL']
    },
    {
      id: 'd1-procesos', day: 1, title: 'Procesos, señales y servicios',
      subtitle: 'ps, top, kill, systemd y logs', minutes: 50, tags: ['linux'], difficulty: 2,
      objectives: [
        'Interpretar load average contra cantidad de núcleos.',
        'Distinguir SIGTERM de SIGKILL y elegir la señal correcta.',
        'Diagnosticar un servicio que no arranca con systemctl y journalctl.'
      ],
      theory:
'Un proceso es un programa en memoria con PID, PPID, usuario y estado. Los estados clave: **R** ejecutando, **S** esperando, **D** espera crítica de I/O (no responde ni a SIGKILL), **T** detenido, **Z** zombie (terminó pero su padre no leyó el exit code).\n\n' +
'### Lectura profesional de top/htop\nEl **load average** muestra procesos en ejecución o esperando recursos en 1, 5 y 15 minutos. Se compara con la cantidad de núcleos (nproc). En una máquina de 4 núcleos, 4.00 es saturación plena; 8.00 indica cola de espera. Ojo: también cuenta procesos bloqueados por disco, por eso un load alto con CPU baja sugiere I/O.\n\n' +
'En memoria, **VIRT** es lo reservado, **RES** la RAM real usada y **SHR** lo compartido. OOM killer mata procesos cuando falta memoria; en Kubernetes eso se ve como OOMKilled y exit code 137.\n\n' +
'### Señales\n| Señal | Número | Uso |\n' +
'| --- | --- | --- |\n' +
'| SIGHUP | 1 | Recargar configuración en demonios |\n' +
'| SIGINT | 2 | Ctrl+C |\n' +
'| SIGKILL | 9 | Matar sin limpieza; último recurso |\n' +
'| SIGTERM | 15 | Cierre ordenado (default de kill) |\n' +
'| SIGSTOP/SIGCONT | 19/18 | Pausar y reanudar |\n\n' +
'Enviar SIGKILL a una base de datos puede corromper archivos: siempre SIGTERM primero y esperar.\n\n' +
'### Servicios y trabajos\nsystemctl enable define el arranque automático; start solo lo inicia ahora. **enable --now** hace ambos. Un servicio en estado failed deja rastro en journalctl -u nombre. Los trabajos de la shell se manejan con **&**, Ctrl+Z, jobs, bg y fg; **nohup** protege un proceso de SIGHUP al cerrar la sesión SSH.\n\n' +
'> Si un servicio no arranca, el orden de diagnóstico es: systemctl status → journalctl -u → validar configuración (nginx -t, sshd -t) → revisar puerto ocupado con ss -tulpn.',
      realWorld: 'El 80% de las guardias junior es esto: entrar a un servidor, ver qué proceso consume recursos, revisar logs y reiniciar con criterio. La diferencia entre alguien entrenado y un principiante es el orden del diagnóstico.',
      commands: [
        { cmd: 'ps aux --sort=-%mem | head', desc: 'Top 10 procesos por memoria.', example: 'ps aux --sort=-%mem | head\nps -ef | grep nginx' },
        { cmd: 'kill -15 2841', desc: 'Cierre ordenado; si no responde en 10s, evaluar -9.', example: 'kill -15 2841\nkill -9 2841' },
        { cmd: 'systemctl restart nginx', desc: 'Aplica cambios de configuración del servicio.', example: 'systemctl restart nginx\nsystemctl status nginx --no-pager' },
        { cmd: 'ss -tulpn', desc: 'Puertos TCP/UDP escuchando y proceso dueño.', example: 'ss -tulpn | grep :80' },
        { cmd: 'journalctl -u nginx --since "15 min ago" -p err', desc: 'Errores recientes del servicio.', example: 'journalctl -u nginx --since today -p warning' }
      ],
      labIds: ['lab-procesos', 'lab-logs'],
      challenge: {
        prompt: 'Lanzá un proceso de prueba (sleep 600 &), encontralo con ps, enviale SIGTERM y verificá que desapareció. Documentá PIDs y comandos.',
        criteria: ['Usaste ps aux o pgrep', 'Usaste kill -15 con el PID correcto', 'Verificaste con ps que ya no existe']
      },
      mistakes: [
        'Matar con -9 de entrada y corromper datos.',
        'Confundir enable (persistente) con start (sesión actual).',
        'Leer load average sin compararlo con la cantidad de núcleos.'
      ],
      mastery: [
        'Diagnosticás un servicio caído en menos de 5 minutos con evidencia de logs.',
        'Elegís señales correctamente y explicás el riesgo de SIGKILL.',
        'Interpretás top completo: load, CPU, memoria y estados.'
      ],
      keyIdeas: ['SIGTERM 15', 'SIGKILL 9', 'load average vs nproc', 'OOMKilled 137', 'journalctl', 'nohup']
    },
    {
      id: 'd1-texto', day: 1, title: 'Texto, pipes y búsqueda',
      subtitle: 'grep, sed, awk, find, redirecciones y vim', minutes: 60, tags: ['linux'], difficulty: 2,
      objectives: [
        'Encadenar pipes para responder preguntas sobre logs.',
        'Distinguir stdout, stderr y sus redirecciones.',
        'Editar configuración en un servidor sin interfaz gráfica.'
      ],
      theory:
'En Linux todo programa recibe y entrega texto. Ese diseño permite combinar herramientas pequeñas. Los tres descriptores son **stdin (0)**, **stdout (1)** y **stderr (2)**.\n\n' +
'### Redirecciones que tenés que saber de memoria\n| Operador | Efecto |\n| --- | --- |\n| > | Sobrescribe stdout |\n| >> | Agrega al final |\n| 2> | Redirige solo errores |\n| &> o > archivo 2>&1 | Todo al mismo archivo |\n| < | Entrada desde archivo |\n| \\| | Conecta stdout de uno con stdin del otro |\n| tee | Muestra y guarda a la vez |\n\n' +
'### Preguntas típicas de log resueltas con pipes\n- ¿Qué IP intentó entrar más veces? grep "Failed password" auth.log | awk \'{print $(NF-3)}\' | sort | uniq -c | sort -rn | head\n- ¿Cuántos 5xx hubo? awk \'$9 ~ /^5/ {c++} END {print c}\' access.log\n- ¿Qué archivos pesan más de 100 MB? find /var -type f -size +100M\n\n' +
'grep filtra (-i sin distinguir mayúsculas, -r recursivo, -n con número de línea, -v invierte, -c cuenta). sed sustituye y edita en flujo: sed -i \'s/old/new/g\' archivo. awk es un lenguaje de procesamiento por columnas. find busca por nombre, tipo, tamaño, fecha y puede ejecutar acciones con -exec.\n\n' +
'### vim sin pánico\nTres modos: normal (navegación), inserción (i, a, o) y comando (:). Salir guardando es **:wq**, salir descartando es **:q!**. Buscar es **/patrón** y reemplazar todo es **:%s/viejo/nuevo/g**. En un servidor de producción suele ser el único editor disponible.\n\n' +
'> Cuidado con rm -rf y sed -i: en Linux no hay papelera. Antes de un comando destructivo, corré la misma selección con ls o grep para ver qué va a afectar.',
      realWorld: 'Triaje de incidentes: extraer de 2 GB de logs las 20 líneas relevantes en segundos. Es la habilidad que más impresiona en una prueba técnica de soporte.',
      commands: [
        { cmd: 'grep -c " 502 " /var/log/nginx/access.log', desc: 'Cuenta errores 502 en el access log.', example: 'grep -c " 502 " /var/log/nginx/access.log' },
        { cmd: 'awk \'{print $1}\' access.log | sort | uniq -c | sort -rn | head', desc: 'Top de IPs por cantidad de requests.', example: 'awk \'{print $1}\' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head' },
        { cmd: 'find /var/log -type f -size +100M', desc: 'Archivos de log mayores a 100 MB.', example: 'find /var/log -type f -size +100M -exec ls -lh {} \\;' },
        { cmd: 'sed -i.bak \'s/listen 80/listen 8080/\' nginx.conf', desc: 'Sustituye creando copia .bak antes de modificar.', example: 'sed -i.bak \'s/80/8080/g\' default.conf' },
        { cmd: 'tail -f /var/log/syslog', desc: 'Sigue el log en vivo mientras reproducís el error.', example: 'tail -fn 50 /var/log/nginx/error.log' }
      ],
      labIds: ['lab-logs', 'lab-awk'],
      challenge: {
        prompt: 'Con el access.log de ejemplo del laboratorio, obtené: total de requests, cantidad de 502 y la IP más frecuente. Pegá los pipelines usados.',
        criteria: ['Usaste wc -l', 'Usaste grep -c para 502', 'Usaste awk + sort + uniq -c']
      },
      mistakes: [
        'Usar cat con archivos gigantes en lugar de less o tail.',
        'Redirigir errores al mismo archivo con > y perder stdout.',
        'Ejecutar sed -i sin backup en configuración de producción.'
      ],
      mastery: [
        'Resolvés preguntas sobre logs combinando grep, awk y sort en una línea.',
        'Explicás la diferencia entre > y >> con un caso de pérdida de datos.',
        'Te movés en vim y guardás cambios sin dudar.'
      ],
      keyIdeas: ['stdin stdout stderr', 'pipe', 'grep -v', 'awk columnas', 'find -exec', 'vim :wq']
    },
    {
      id: 'd1-redes', day: 1, title: 'Redes, DNS, HTTP y SSH',
      subtitle: 'TCP/IP, puertos, firewall y acceso remoto', minutes: 55, tags: ['redes'], difficulty: 2,
      objectives: [
        'Explicar el recorrido completo de una request HTTP hasta el contenedor.',
        'Diagnosticar DNS, conectividad y puertos con herramientas estándar.',
        'Configurar acceso SSH por clave sin contraseña.'
      ],
      theory:
'Cuando un usuario abre **https://app.empresa.com**, ocurren varias cosas en orden: resolución **DNS** (nombre → IP), conexión **TCP** al puerto 443, handshake **TLS**, request **HTTP** y respuesta. Si falla, el síntoma te dice en qué capa mirar.\n\n' +
'### Capas y protocolos\n- **IP**: direccionamiento y ruteo entre redes. Máscara y gateway definen qué es local y qué se envía al router.\n- **TCP**: conexión confiable con handshake de tres vías; **UDP** sin conexión para DNS, DHCP y métricas.\n- **DNS**: registros A/AAAA (IP), CNAME (alias), MX, TXT. Resolución recursiva con TTL y caché.\n- **DHCP**: entrega IP, máscara, gateway y DNS por lease.\n- **HTTP/HTTPS**: métodos, códigos de estado (2xx ok, 3xx redirección, 4xx cliente, 5xx servidor), headers, TLS.\n\n' +
'### Diagnóstico en orden\n1. ¿Resuelve el nombre? dig +short app.empresa.com / nslookup.\n2. ¿Hay ruta? ping (ICMP, puede estar bloqueado), traceroute.\n3. ¿El puerto está abierto? ss -tulpn en el servidor, nc -zv host 443 o curl -v desde el cliente.\n4. ¿Responde la app? curl -I https://app.empresa.com.\n5. ¿Firewall? ufw status, iptables -L, security groups del cloud.\n\n' +
'Un **502 Bad Gateway** indica que el proxy (nginx) no pudo hablar con el upstream: la app está caída, escucha en otro puerto o el nombre interno no resuelve. Un **504** es timeout del upstream. Distinguirlos es una pregunta de entrevista frecuente.\n\n' +
'### SSH\nEs el acceso remoto cifrado por el puerto 22. La autenticación por clave usa un par: la privada nunca sale de tu máquina, la pública se copia a ~/.ssh/authorized_keys. ssh-keygen genera el par y ssh-copy-id lo instala. Buenas prácticas: deshabilitar login de root y PasswordAuthentication, usar un usuario con sudo y un firewall que restrinja el 22.\n\n' +
'> En contenedores o cloud, "no hay red" casi nunca es la red: revisá que el servicio escuche en 0.0.0.0 y no en 127.0.0.1, y que el puerto esté publicado/exposed.',
      realWorld: 'Debuggear un 502 en Kubernetes es idéntico: ingress → service → endpoints → pod. Cambia la herramienta (kubectl port-forward, kubectl exec, dig desde un pod), no el razonamiento por capas.',
      commands: [
        { cmd: 'dig +short app.empresa.com', desc: 'Resolución DNS directa.', example: 'dig +short google.com\ndig @8.8.8.8 app.empresa.com' },
        { cmd: 'curl -I https://app.empresa.com', desc: 'Solo headers: código de estado y servidor.', example: 'curl -I https://example.com\ncurl -v https://example.com' },
        { cmd: 'ss -tulpn', desc: 'Qué escucha en cada puerto y qué proceso lo hace.', example: 'ss -tulpn | grep -E ":(80|443|22)"' },
        { cmd: 'ssh-keygen -t ed25519 -C "ana@empresa"', desc: 'Genera par de claves moderna.', example: 'ssh-keygen -t ed25519\nssh-copy-id ana@servidor' },
        { cmd: 'nc -zv 10.0.0.5 5432', desc: 'Prueba si un puerto TCP acepta conexión.', example: 'nc -zv db.internal 5432' }
      ],
      labIds: ['lab-red', 'lab-ssh'],
      challenge: {
        prompt: 'Desde tu WSL2 resolvé un dominio con dig, verificá el puerto 443 con nc, obtené los headers con curl -I y explicá la diferencia entre 502 y 504.',
        criteria: ['dig ejecutado con salida', 'nc o curl -v sobre el 443', 'Explicación correcta de 502 vs 504']
      },
      mistakes: [
        'Reiniciar la app cuando el problema era DNS.',
        'Servicio escuchando en localhost dentro del contenedor y publicado al host.',
        'Confundir 404 (ruta inexistente) con 502 (upstream inaccesible).'
      ],
      mastery: [
        'Aplicás el diagnóstico por capas sin saltarte pasos.',
        'Explicás qué hace cada respuesta HTTP en un caso real.',
        'Configurás SSH por clave y justificás el hardening.'
      ],
      keyIdeas: ['DNS A record', 'TCP handshake', '502 vs 504', '0.0.0.0', 'ssh-keygen', 'sudo ufw']
    },
    {
      id: 'd1-git', day: 2, title: 'Git para trabajo en equipo',
      subtitle: 'Commits, ramas, merge, rebase y conflictos', minutes: 50, tags: ['git'], difficulty: 2,
      objectives: [
        'Explicar el modelo de tres áreas de Git.',
        'Resolver un conflicto de merge sin pánico.',
        'Elegir entre merge y rebase y justificarlo.'
      ],
      theory:
'Git guarda **snapshots** inmutables identificados por hash. Cada commit apunta a su padre, formando un grafo. Hay tres áreas: **working tree** (archivos), **index/staging** (lo preparado con git add) y **repositorio** (commits). git status siempre te dice en cuál estás parado.\n\n' +
'### Flujo básico\n' +
'~~~\n' +
'git switch -c feature/login\n' +
'git add archivo\n' +
'git commit -m "feat: agrega login"\n' +
'git push -u origin feature/login\n' +
'~~~\n\n' +
'### Merge vs rebase\n- **merge** crea un commit de unión y preserva la historia real. Es lo correcto para integrar una rama ya compartida.\n- **rebase** reescribe tus commits sobre otra base y deja la historia lineal. Nunca se hace rebase de una rama pública: cambia hashes y obliga a force push.\n\n' +
'### Conflictos\nOcurren cuando dos ramas modifican las mismas líneas. Git marca el archivo con <<<<<<<, ======= y >>>>>>>. Se resuelve editando, eliminando marcadores, git add y finalizando con git commit (o git rebase --continue). Ante la duda: git merge --abort o git rebase --abort.\n\n' +
'### Comandos de rescate\n- git log --oneline --graph --all: entender la historia.\n- git diff y git diff --staged: ver cambios antes de commitear.\n- git restore archivo / git restore --staged archivo: descartar cambios del working tree o del index.\n- git revert HASH: deshacer un commit público creando otro (seguro en producción).\n- git reset --soft HEAD~1: deshacer el commit conservando cambios; --hard los elimina.\n\n' +
'### Ramas y convenciones\nmain protegida, ramas cortas por feature, pull request con revisión y CI. Tags semánticos (v1.4.2) para releases. Un .gitignore evita subir node_modules, .env y binarios.\n\n' +
'> En entrevista: "¿Qué harías si commiteaste un secreto?" Respuesta: rotar la credencial primero, luego sacarlo de la historia (git filter-repo) y forzar la limpieza en el remoto. El secreto ya se filtró: asumilo comprometido.\n\n### Submódulos y otros SCM\nUn **submódulo** vincula otro repositorio en un commit fijo: sirve para dependencias compartidas, pero obliga a recordar `git submodule update --init --recursive` después de cada clon o cambio. El objetivo 701.3 también pide **awareness** de SVN y CVS: son sistemas **centralizados** (un servidor guarda la historia y el cliente una copia de trabajo), mientras Git es **distribuido**: cada clon tiene la historia completa y puede commitear sin red.',
      realWorld: 'En un pipeline, cada push a una rama dispara CI y cada merge a main dispara deploy. Sin un modelo claro de ramas, los rollbacks se vuelven imposibles.',
      commands: [
        { cmd: 'git switch -c feature/x', desc: 'Crea y cambia a una rama nueva.', example: 'git switch -c feature/login\ngit push -u origin feature/login' },
        { cmd: 'git log --oneline --graph --all --decorate', desc: 'Historia visual de todas las ramas.', example: 'git log --oneline --graph --all' },
        { cmd: 'git add -p', desc: 'Prepara cambios por bloques, revisando el diff.', example: 'git add -p\ngit commit -m "fix: valida email"' },
        { cmd: 'git revert <hash>', desc: 'Deshace un commit público de forma segura.', example: 'git revert a1b2c3d' },
        { cmd: 'git stash && git stash pop', desc: 'Guarda trabajo temporal para cambiar de contexto.', example: 'git stash push -m "wip login"\ngit stash pop' }
      ],
      labIds: ['lab-git'],
      challenge: {
        prompt: 'Creá un repo, una rama feature, un commit en main y otro en la rama con la misma línea modificada, mergeá y resolvé el conflicto. Mostrá git log --graph.',
        criteria: ['Rama creada con switch -c', 'Conflicto provocado en la misma línea', 'Resolución sin marcadores', 'git log --graph con el merge']
      },
      mistakes: [
        'Hacer rebase de main o de ramas compartidas.',
        'Commitear .env con credenciales.',
        'Usar reset --hard sin entender que borra trabajo local.'
      ],
      mastery: [
        'Contás el flujo de un cambio desde la rama hasta producción.',
        'Resolvés conflictos explicando qué quedó de cada lado.',
        'Elegís revert sobre reset en un escenario de producción.'
      ],
      keyIdeas: ['staging area', 'merge commit', 'rebase reescribe hashes', 'pull request', 'git revert', 'gitignore']
    },

    /* ================= DÍA 2 ================= */
    {
      id: 'd2-contenedores', day: 3, title: 'Contenedores y arquitectura Docker',
      subtitle: 'VM vs contenedor, daemon, runc, capas', minutes: 50, tags: ['docker'], difficulty: 2,
      objectives: [
        'Explicar por qué un contenedor no es una máquina virtual.',
        'Describir cómo el daemon crea un contenedor a partir de una imagen.',
        'Entender namespaces, cgroups y por qué el aislamiento no es absoluto.'
      ],
      theory:
'Una **máquina virtual** virtualiza hardware y ejecuta un kernel completo propio. Un **contenedor** es un proceso aislado del host que comparte el kernel de Linux. Eso lo hace liviano (arranca en milisegundos y no reserva RAM de un SO completo), pero implica que Windows y macOS necesitan una VM Linux por debajo para correr contenedores Linux (Docker Desktop o WSL2).\n\n' +
'### Cómo funciona por dentro\nEl kernel ofrece dos mecanismos:\n- **namespaces**: aislamiento de visibilidad (PID, red, montajes, hostname, usuarios). El contenedor cree que es el único.\n- **cgroups**: límites y medición de CPU, memoria y I/O. Sin límites, un contenedor puede consumir todo el host.\n\n' +
'### Arquitectura Docker\n1. **docker CLI** envía comandos al **daemon (dockerd)** vía socket.\n2. El daemon descarga **imágenes** de un **registry** (Docker Hub, ECR, GHCR).\n3. Crea el contenedor con **containerd/runc** agregando una capa de escritura sobre las capas de solo lectura de la imagen.\n4. Red y almacenamiento se conectan con drivers (bridge, overlay, volume, bind mount).\n\n' +
'### Ciclo de vida\n**docker run** = pull (si falta) + create + start. **docker ps -a** muestra también los detenidos (el código de salida es la primera pista: 0 éxito, 1 error de app, 137 OOMKilled/SIGKILL, 143 SIGTERM). **docker logs** lee stdout/stderr del proceso; si la app escribe en un archivo interno, no verás nada.\n\n' +
'### Contenedor vs imagen vs volumen\n| Objeto | Naturaleza |\n| --- | --- |\n| Imagen | Plantilla inmutable por capas |\n| Contenedor | Instancia en ejecución con capa escribible efímera |\n| Volumen | Persistencia administrada por Docker |\n| Bind mount | Directorio del host montado directamente |\n\n' +
'> La frase que abre puertas: "el contenedor es un proceso con namespaces y cgroups, no una VM liviana". Y si borrás el contenedor, los datos de su capa se pierden.\n\n### Docker, Podman y OCI\nLa imagen y el runtime son estándares **OCI**: por eso una imagen construida con Docker corre en Podman, containerd o Kubernetes. **Podman** es daemonless y permite **rootless** (usuario sin privilegios apoyado en user namespaces), lo que reduce el impacto de una fuga; la sintaxis es casi idéntica (podman run, podman build, podman pod). Docker sigue siendo el estándar de desarrollo; Podman aparece en RHEL y en entornos que prohíben un daemon root.',
      realWorld: 'En un pipeline, la misma imagen que se construye se promueve entre ambientes. Si la imagen es reproducible, "funciona en mi máquina" deja de ser un problema; si el Dockerfile baja latest en cada build, no es reproducible.',
      commands: [
        { cmd: 'docker run -d --name web -p 8080:80 nginx:1.27', desc: 'Levanta nginx mapeando host:contenedor.', example: 'docker run -d --name web -p 8080:80 nginx:1.27\ndocker ps' },
        { cmd: 'docker logs -f web', desc: 'Logs del proceso principal del contenedor.', example: 'docker logs --tail 50 web' },
        { cmd: 'docker exec -it web sh', desc: 'Shell dentro del contenedor para diagnóstico.', example: 'docker exec -it web sh -c "cat /etc/nginx/conf.d/default.conf"' },
        { cmd: 'docker inspect web --format "{{.State.Status}} {{.State.ExitCode}}"', desc: 'Estado y código de salida.', example: 'docker inspect web --format "{{json .State}}"' },
        { cmd: 'docker stats --no-stream', desc: 'CPU, memoria y red por contenedor.', example: 'docker stats --no-stream' }
      ],
      labIds: ['lab-docker-run'],
      challenge: {
        prompt: 'Levantá nginx en el puerto 8080, verificá con curl, revisá logs, entrá al contenedor y mostrá el archivo de configuración. Luego detenelo y borralo.',
        criteria: ['docker run -d -p 8080:80', 'curl -I localhost:8080 con 200', 'docker exec para ver config', 'docker rm -f al final']
      },
      mistakes: [
        'Confundir puerto host con puerto del contenedor (-p 8080:80).',
        'Guardar datos dentro del contenedor y perderlos al recrearlo.',
        'Asumir que el contenedor tiene systemd o cron: no los tiene, el proceso principal debe correr en foreground.'
      ],
      mastery: [
        'Explicás namespaces y cgroups con un ejemplo de riesgo real.',
        'Interpretás exit codes 1, 137 y 143.',
        'Diferenciás imagen, contenedor, volumen y capa.'
      ],
      keyIdeas: ['namespaces', 'cgroups', 'comparte kernel', 'exit 137', 'capa escribible', 'docker logs']
    },
    {
      id: 'd2-imagenes', day: 3, title: 'Dockerfiles e imágenes reproducibles',
      subtitle: 'Capas, cache, multi-stage y no-root', minutes: 60, tags: ['docker'], difficulty: 3,
      objectives: [
        'Escribir un Dockerfile con cache efectivo y usuario no-root.',
        'Explicar el orden de capas y por qué importa.',
        'Reducir una imagen con multi-stage build.'
      ],
      theory:
'Un Dockerfile se ejecuta instrucción por instrucción; cada una crea una **capa** cacheada. Si cambiás una capa, se invalidan todas las siguientes. De ahí la regla de oro: **primero lo que cambia menos**.\n\n' +
'### Dockerfile correcto para Node\n' +
'~~~\n' +
'FROM node:20-alpine AS base\n' +
'WORKDIR /app\n' +
'COPY package*.json ./\n' +
'RUN npm ci --omit=dev\n' +
'COPY . .\n' +
'USER node\n' +
'EXPOSE 3000\n' +
'CMD ["node", "server.js"]\n' +
'~~~\n\n' +
'Copiar package.json antes que el código evita reinstalar dependencias en cada cambio de código. **npm ci** es reproducible; **npm install** puede actualizar versiones. **multi-stage** compila en una etapa y copia solo el artefacto a la etapa final (imagen mucho más chica y sin toolchain de build).\n\n' +
'### Instrucciones clave\n| Instrucción | Uso |\n' +
'| --- | --- |\n' +
'| FROM | Imagen base (fijá versión, no latest) |\n' +
'| RUN | Ejecuta en build y queda en la capa |\n' +
'| COPY vs ADD | COPY es explícito; ADD solo para tar/URL |\n' +
'| ENV vs ARG | ENV persiste en runtime; ARG solo en build |\n' +
'| ENTRYPOINT + CMD | ENTRYPOINT fijo, CMD como argumentos por defecto |\n' +
'| USER | Cambia a usuario sin privilegios |\n\n' +
'### Buenas prácticas que se evalúan\n1. Imagen base mínima y versión fija (alpine, distroless, slim).\n2. Sin secretos en capas: los ARG y COPY quedan en la historia. Usá secretos de build o variables en runtime.\n3. .dockerignore para no copiar node_modules, .git ni .env.\n4. HEALTHCHECK o probes equivalentes.\n5. Usuario no-root y filesystem de solo lectura cuando sea posible.\n6. Una sola responsabilidad por contenedor.\n\n' +
'> Si te preguntan cómo reducir el tamaño: multi-stage, base alpine/slim, unir RUN con && y limpiar caches de apt/apk en la misma capa.',
      realWorld: 'Una imagen de 1.2 GB tarda minutos en cada deploy y multiplica la superficie de ataque. La misma app en alpine con multi-stage puede quedar en 120 MB y desplegarse en segundos.',
      commands: [
        { cmd: 'docker build -t miapp:1.0 .', desc: 'Construye la imagen desde el Dockerfile del directorio.', example: 'docker build -t miapp:1.0 .\ndocker images miapp' },
        { cmd: 'docker history miapp:1.0', desc: 'Muestra capas y tamaño de cada instrucción.', example: 'docker history --no-trunc miapp:1.0' },
        { cmd: 'docker run --rm -p 3000:3000 miapp:1.0', desc: 'Ejecuta y borra el contenedor al salir.', example: 'docker run --rm -e NODE_ENV=production -p 3000:3000 miapp:1.0' },
        { cmd: 'docker build --build-arg VERSION=1.0 -t miapp:1.0 .', desc: 'Pasa argumentos de build.', example: 'docker build --build-arg VERSION=1.0 -t miapp:1.0 .' },
        { cmd: 'docker scout quickview miapp:1.0', desc: 'Resumen de vulnerabilidades de la imagen (si está disponible).', example: 'docker scout quickview miapp:1.0' }
      ],
      labIds: ['lab-dockerfile'],
      challenge: {
        prompt: 'Escribí un Dockerfile multi-stage para una app Node: build con devDependencies, runtime con solo producción, usuario no-root y .dockerignore. Compilá y compará tamaños.',
        criteria: ['Dos etapas FROM', 'COPY --from en la etapa final', 'USER no-root', 'package.json copiado antes del código']
      },
      mistakes: [
        'Usar latest como base y romper builds sin aviso.',
        'COPY . . antes de instalar dependencias y perder la cache.',
        'Dejar el contenedor corriendo como root por comodidad.'
      ],
      mastery: [
        'Justificás cada instrucción del Dockerfile ante un entrevistador.',
        'Medís y explicás la reducción de tamaño con multi-stage.',
        'Detectás secretos o capas innecesarias en un Dockerfile ajeno.'
      ],
      keyIdeas: ['capas y cache', 'npm ci', 'multi-stage', 'USER no-root', 'dockerignore', 'ENTRYPOINT vs CMD']
    },
    {
      id: 'd2-compose', day: 3, title: 'Volúmenes, redes y Docker Compose',
      subtitle: 'Persistencia, DNS interno y stack local', minutes: 45, tags: ['docker'], difficulty: 3,
      objectives: [
        'Elegir volumen nombrado o bind mount según el caso.',
        'Explicar cómo se resuelven los servicios por nombre en Compose.',
        'Levantar un stack app + base de datos con healthchecks.'
      ],
      theory:
'Los datos de un contenedor mueren con él. Para persistir hay dos opciones: **volumen nombrado** (Docker lo administra, ideal para bases de datos) y **bind mount** (ruta del host, ideal para desarrollo o configuración). En producción se prefieren volúmenes o almacenamiento del orquestador.\n\n' +
'### Redes\nDocker crea una red **bridge** por defecto. En una red definida por el usuario, los contenedores se resuelven por **nombre de servicio**: la app se conecta a db:5432, no a localhost. publicar puertos (-p) solo es necesario para acceder desde el host; entre contenedores se usa el puerto interno.\n\n' +
'### Compose\n' +
'~~~\n' +
'services:\n' +
'  app:\n' +
'    build: .\n' +
'    ports: ["3000:3000"]\n' +
'    environment:\n' +
'      DB_HOST: db\n' +
'    depends_on:\n' +
'      db:\n' +
'        condition: service_healthy\n' +
'  db:\n' +
'    image: postgres:16-alpine\n' +
'    environment:\n' +
'      POSTGRES_PASSWORD: example\n' +
'    volumes: [pgdata:/var/lib/postgresql/data]\n' +
'    healthcheck:\n' +
'      test: ["CMD-SHELL", "pg_isready -U postgres"]\n' +
'      interval: 5s\n' +
'volumes:\n' +
'  pgdata:\n' +
'~~~\n\n' +
'**depends_on** con condition healthcheck espera a que la base responda. Sin eso, la app arranca antes y falla al conectar. Compose es para desarrollo local y pruebas; en producción se usa Kubernetes u otro orquestador.\n\n' +
'### Depuración típica\n- docker compose ps: estado real.\n- docker compose logs -f app: logs por servicio.\n- No such host: la app usa localhost en lugar del nombre del servicio.\n- Connection refused: la base no está lista o el puerto es incorrecto.\n- Volumen con datos viejos: docker compose down -v los borra (¡cuidado!).\n\n' +
'> Un error clásico de entrevista: "la app no conecta a la base en Compose". Causa #1: host localhost. Causa #2: falta healthcheck y arranca antes. Causa #3: credenciales distintas entre servicios.\n\n### Actualizar y Podman Compose\n`docker compose up -d` recrea solo los servicios cuya definición cambió; si la imagen usa un tag mutable hay que forzar `docker compose pull && docker compose up -d`. `podman-compose` implementa el mismo modelo sobre Podman y comparte el archivo compose.yaml. En CI conviene `--abort-on-container-exit --exit-code-from tests` para que el pipeline falle si un test falla.',
      realWorld: 'Compose es el estándar para reproducir un entorno completo en una laptop y para pruebas de integración en CI: levanta app y dependencias, corre tests, destruye todo.',
      commands: [
        { cmd: 'docker compose up -d --build', desc: 'Construye y levanta el stack en segundo plano.', example: 'docker compose up -d --build\ndocker compose ps' },
        { cmd: 'docker compose logs -f app', desc: 'Sigue los logs de un servicio.', example: 'docker compose logs -f --tail 100 app' },
        { cmd: 'docker compose exec db psql -U postgres', desc: 'Abre psql dentro del servicio db.', example: 'docker compose exec db psql -U postgres -c "\\l"' },
        { cmd: 'docker volume ls && docker volume inspect proyecto_pgdata', desc: 'Verifica los volúmenes creados.', example: 'docker volume ls\ndocker volume inspect proyecto_pgdata' },
        { cmd: 'docker compose down -v', desc: 'Baja el stack y elimina volúmenes (destructivo).', example: 'docker compose down -v' }
      ],
      labIds: ['lab-compose'],
      challenge: {
        prompt: 'Armá un compose con app y postgres usando volume nombrado y healthcheck. Verificá que la app conecta por nombre de servicio y que los datos sobreviven a docker compose down sin -v.',
        criteria: ['Servicios con nombre y variables de entorno', 'Volume nombrado para postgres', 'healthcheck con condition', 'Datos persistidos tras recrear']
      },
      mistakes: [
        'Usar localhost para conectar entre contenedores.',
        'Bajar el stack con -v en un entorno con datos que se quieren conservar.',
        'Publicar la base de datos al host sin necesidad y sin password fuerte.'
      ],
      mastery: [
        'Diagramás el stack y el flujo de red entre servicios.',
        'Elegís volumen vs bind mount explicando consecuencias.',
        'Diagnosticás un fallo de conexión en Compose con evidencia.'
      ],
      keyIdeas: ['volumen nombrado', 'bind mount', 'DNS por servicio', 'depends_on healthcheck', 'compose down -v']
    },
    {
      id: 'd2-registries', day: 3, title: 'Registries y versionado de imágenes',
      subtitle: 'Tags, inmutabilidad y promoción', minutes: 30, tags: ['docker'], difficulty: 2,
      objectives: [
        'Explicar por qué latest es peligroso en producción.',
        'Nombrar y taggear imágenes de forma trazable.',
        'Autenticarse y publicar en un registry.'
      ],
      theory:
'Un **registry** almacena y distribuye imágenes: Docker Hub, GitHub Container Registry (ghcr.io), AWS ECR, Azure ACR, Harbor self-hosted. El **repositorio** agrupa imágenes por nombre y el **tag** identifica una versión concreta; la combinación nombre:tag es la referencia.\n\n' +
'### Estrategia de tags\n- **latest** no significa la más nueva: significa el tag por defecto y cambia sin aviso. Nunca lo uses como referencia de deploy.\n- Usá **semver** (1.4.2) para releases y el **SHA del commit** (sha-9f2c1a) para trazabilidad.\n- El patrón habitual: construir con el SHA, publicar también un tag semántico y, si querés, mover latest como alias.\n\n' +
'### Inmutabilidad y digest\nCada imagen tiene un **digest** (sha256:...) que identifica su contenido exacto. Desplegar por digest garantiza que corrés lo que probaste, incluso si alguien reescribió el tag.\n\n' +
'### Flujo con GitHub Actions\n' +
'~~~\n' +
'- uses: docker/login-action@v3\n' +
'  with:\n' +
'    registry: ghcr.io\n' +
'    username: ${{ github.actor }}\n' +
'    password: ${{ secrets.GITHUB_TOKEN }}\n' +
'~~~\n\n' +
'Luego docker build y docker push con tags derivados del SHA. El token del registry se guarda como **secret**, nunca en el repositorio.\n\n' +
'### Escaneo y limpieza\nLos registries aplican escaneo de vulnerabilidades y retención. Las imágenes viejas consumen almacenamiento y amplían la superficie: conviene una política de retención por cantidad o antigüedad.\n\n' +
'> Pregunta frecuente: "¿cómo garantizás que el deploy usa exactamente lo testeado?" Respuesta: imagen inmutable por digest, construida una sola vez y promovida entre ambientes, no reconstruida en cada etapa.',
      realWorld: 'Muchos incidentes nacen de un latest que cambió entre el test y el deploy. Fijar digest y promover artefactos elimina esa clase de fallo.',
      commands: [
        { cmd: 'docker login ghcr.io -u USUARIO', desc: 'Autenticación con un token como contraseña.', example: 'echo $GH_TOKEN | docker login ghcr.io -u ana --password-stdin' },
        { cmd: 'docker tag miapp:1.0 ghcr.io/ana/miapp:1.0', desc: 'Prepara la imagen para publicar.', example: 'docker tag miapp:1.0 ghcr.io/ana/miapp:1.0' },
        { cmd: 'docker push ghcr.io/ana/miapp:1.0', desc: 'Publica la imagen en el registry.', example: 'docker push ghcr.io/ana/miapp:1.0' },
        { cmd: 'docker pull nginx@sha256:...', desc: 'Descarga una imagen por digest inmutable.', example: 'docker pull nginx@sha256:abc123...' },
        { cmd: 'docker manifest inspect nginx:1.27', desc: 'Inspecciona arquitecturas y digest sin descargar.', example: 'docker manifest inspect nginx:1.27 | head -40' }
      ],
      labIds: ['lab-registry'],
      challenge: {
        prompt: 'Creá un repo en GitHub, autenticá docker contra ghcr.io con un PAT, publicá tu imagen con tag 1.0 y con el SHA del commit, y verificá el digest.',
        criteria: ['login con token por stdin', 'Dos tags de la misma imagen', 'push exitoso', 'docker inspect con RepoDigests']
      },
      mistakes: [
        'Subir credenciales del registry en el Dockerfile o en el repo.',
        'Desplegar latest en producción.',
        'Reconstruir la imagen en cada ambiente en lugar de promover la misma.'
      ],
      mastery: [
        'Explicás tags, digest e inmutabilidad sin confundirlos.',
        'Configurás login no interactivo para CI.',
        'Justificás una política de retención y escaneo.'
      ],
      keyIdeas: ['registry', 'tag vs digest', 'latest peligroso', 'GHCR', 'promoción de artefactos']
    },
    {
      id: 'd2-cicd', day: 2, title: 'Fundamentos de CI/CD',
      subtitle: 'Integración, entrega, despliegue y pipelines', minutes: 45, tags: ['cicd'], difficulty: 2,
      objectives: [
        'Diferenciar CI, Continuous Delivery y Continuous Deployment.',
        'Diseñar un pipeline con etapas, gates y artefactos.',
        'Explicar rollback y estrategias de despliegue.'
      ],
      theory:
'**Integración continua (CI)**: cada cambio se integra a main con build y tests automáticos. El objetivo es detectar el error en minutos, no en el deploy. **Continuous Delivery**: todo cambio que pasa CI queda listo para desplegar, pero la decisión es manual. **Continuous Deployment**: el deploy a producción es automático si pasan las validaciones.\n\n' +
'### Anatomía de un pipeline\n1. **Trigger**: push, pull request, tag, schedule.\n2. **Checkout** del código en un runner limpio.\n3. **Build**: compilar, instalar dependencias, cachear.\n4. **Test**: unitarios, integración, linters, análisis estático.\n5. **Package**: construir imagen o artefacto, versionarlo.\n6. **Scan**: vulnerabilidades de imagen y dependencias.\n7. **Deploy**: staging automático, producción con aprobación o automática.\n8. **Verify**: smoke tests, health checks, métricas.\n9. **Rollback** si falla.\n\n' +
'### Principios de diseño\n- **Idempotencia**: correr el pipeline dos veces no rompe nada.\n- **Fail fast**: lo barato primero (lint) y lo caro después (integración).\n- **Artefacto único**: se construye una vez y se promociona.\n- **Secretos** inyectados por el runner, nunca en el repo.\n- **Tiempo**: cache de dependencias y paralelización; un pipeline lento se ignora.\n\n' +
'### Gates y calidad\nUn gate es una condición que bloquea el avance: tests verdes, cobertura mínima, escaneo sin críticos, aprobación manual. Sin gates, el pipeline es teatro.\n\n' +
'### Rollback\nDebe ser un botón, no un procedimiento artesanal: volver a la imagen/tag anterior, o revertir el commit y dejar que el pipeline redepliegue. Requiere versionado de artefactos e infraestructura inmutable.\n\n' +
'> "¿CI/CD es solo GitHub Actions?" No: es una práctica. Las herramientas cambian (Jenkins, GitLab CI, Actions, Argo CD); los conceptos — trigger, stages, artifacts, gates, rollback — son los mismos.',
      realWorld: 'Un equipo sin pipeline tarda días en desplegar y tiene miedo a los cambios. Con CI/CD, un deploy es aburrido: build, test, imagen, gate, deploy y verificación.',
      commands: [
        { cmd: 'act -l', desc: 'Lista workflows de GitHub Actions en local (herramienta act).', example: 'act -l' },
        { cmd: 'git tag -a v1.4.0 -m "release" && git push --tags', desc: 'Dispara pipelines basados en tags de release.', example: 'git tag -a v1.4.0 -m "release 1.4.0"\ngit push origin v1.4.0' },
        { cmd: 'docker compose -f compose.test.yml up --abort-on-container-exit', desc: 'Corre tests de integración en CI.', example: 'docker compose -f compose.test.yml up --abort-on-container-exit --exit-code-from tests' }
      ],
      labIds: ['lab-cicd-map'],
      challenge: {
        prompt: 'Diseñá en texto las etapas de un pipeline para una API con tests, imagen Docker y deploy a staging. Indicá qué bloquea el paso a producción y cómo harías rollback.',
        criteria: ['Etapas ordenadas con fail fast', 'Gate explícito para producción', 'Artefacto versionado', 'Plan de rollback concreto']
      },
      mistakes: [
        'Correr deploy antes que los tests.',
        'Reconstruir la imagen en producción en lugar de promover.',
        'Guardar secretos como variables de repositorio en texto plano.'
      ],
      mastery: [
        'Diferenciás delivery y deployment con un ejemplo.',
        'Diseñás un pipeline con gates y artefactos coherentes.',
        'Explicás un rollback en menos de 30 segundos.'
      ],
      keyIdeas: ['CI vs CD vs deployment', 'fail fast', 'artefacto único', 'gate', 'rollback']
    },
    {
      id: 'd2-actions', day: 2, title: 'GitHub Actions en la práctica',
      subtitle: 'Workflows, jobs, runners, secrets y matrices', minutes: 60, tags: ['cicd'], difficulty: 3,
      objectives: [
        'Leer y escribir un workflow YAML sin errores de indentación.',
        'Explicar jobs, steps, runners y dependencias.',
        'Depurar un pipeline fallido con logs y artefactos.'
      ],
      theory:
'Un workflow es un archivo YAML en **.github/workflows/**. Se dispara con **on** (push, pull_request, workflow_dispatch, schedule) y contiene **jobs** que corren en **runners** (ubuntu-latest, windows-latest, self-hosted). Cada job ejecuta **steps**: **uses** llama a una action y **run** ejecuta shell.\n\n' +
'~~~\n' +
'name: ci\n' +
'on:\n' +
'  push:\n' +
'    branches: [main]\n' +
'  pull_request:\n' +
'jobs:\n' +
'  test:\n' +
'    runs-on: ubuntu-latest\n' +
'    steps:\n' +
'      - uses: actions/checkout@v4\n' +
'      - uses: actions/setup-node@v4\n' +
'        with:\n' +
'          node-version: 20\n' +
'          cache: npm\n' +
'      - run: npm ci\n' +
'      - run: npm test\n' +
'  build:\n' +
'    needs: test\n' +
'    runs-on: ubuntu-latest\n' +
'    steps:\n' +
'      - run: echo "build de la imagen"\n' +
'~~~\n\n' +
'### Conceptos que tenés que dominar\n- **needs**: dependencias entre jobs (sin needs, corren en paralelo).\n- **env** y **secrets**: variables por workflow o secretos cifrados; se referencian con el contexto secrets.\n- **matrix**: corre la misma job con múltiples versiones (node 18/20/22) en paralelo.\n- **artifacts**: upload/download para pasar archivos entre jobs.\n- **cache**: acelera dependencias; clave basada en lockfile.\n- **permissions**: mínimo privilegio del GITHUB_TOKEN (contents: read).\n- **concurrency**: cancela runs viejos del mismo branch.\n\n' +
'### Depuración\n1. Leé el step que falló, no todo el log.\n2. Reproducí local con la misma versión de runtime y las mismas variables.\n3. Activá debug con ACTIONS_STEP_DEBUG=true si hace falta.\n4. Los errores de YAML suelen ser indentación de dos espacios o claves mal anidadas.\n\n' +
'> En la entrevista, demostrá que entendés el ciclo: el runner es efímero, no hay estado entre jobs salvo artifacts/cache, y los secretos no se imprimen (si los imprimís, el log los enmascara igual).',
      realWorld: 'Un pipeline con matriz detecta incompatibilidades de versión antes de producción. Los artifacts permiten auditar qué se construyó en cada release.',
      commands: [
        { cmd: 'gh workflow list', desc: 'Lista workflows del repositorio (GitHub CLI).', example: 'gh workflow list\ngh run list --limit 10' },
        { cmd: 'gh run view <id> --log-failed', desc: 'Muestra solo los logs del step fallido.', example: 'gh run view 123456 --log-failed' },
        { cmd: 'yamllint .github/workflows/ci.yml', desc: 'Valida sintaxis YAML antes de pushear.', example: 'yamllint .github/workflows/ci.yml' },
        { cmd: 'gh run rerun <id> --failed', desc: 'Reintenta solo los jobs fallidos.', example: 'gh run rerun 123456 --failed' }
      ],
      labIds: ['lab-actions'],
      challenge: {
        prompt: 'Escribí un workflow con dos jobs: test (npm ci + test) y build (needs: test) que suba un artifact. Agregá cache de npm y permissions de solo lectura.',
        criteria: ['on con push y pull_request', 'needs entre jobs', 'cache de dependencias', 'upload-artifact', 'permissions: contents: read']
      },
      mistakes: [
        'YAML con tabs o indentación inconsistente.',
        'Secretos hardcodeados en el workflow.',
        'Olvidar needs y asumir orden de ejecución.'
      ],
      mastery: [
        'Escribís un workflow funcional de memoria con estructura correcta.',
        'Diagnosticás por qué un job no ve el artifact del anterior.',
        'Aplicás mínimo privilegio al token.'
      ],
      keyIdeas: ['on triggers', 'jobs vs steps', 'needs', 'matrix', 'artifacts', 'secrets', 'permissions']
    },

    /* ================= DÍA 3 ================= */
    {
      id: 'd3-cloud', day: 2, title: 'Cloud computing e IAM',
      subtitle: 'IaaS/PaaS/SaaS, VPC, AZ, storage y menor privilegio', minutes: 55, tags: ['cloud'], difficulty: 3,
      objectives: [
        'Elegir IaaS, PaaS o SaaS según el problema.',
        'Explicar región, AZ, subnet pública/privada y balanceador.',
        'Aplicar mínimo privilegio en IAM.'
      ],
      theory:
'**IaaS** te da máquinas, red y disco (EC2, VM). **PaaS** te da la plataforma y vos solo desplegás la app (App Service, Elastic Beanstalk, Render). **SaaS** es software terminado (Gmail, Slack). Cuanto más arriba en la escalera, menos control y menos operación.\n\n' +
'### Regiones y zonas de disponibilidad\nUna **región** agrupa datacenters en un área geográfica. Cada región tiene varias **AZ** (availability zones) con energía y red independientes. Un diseño tolerante a fallos distribuye instancias en al menos dos AZ detrás de un balanceador.\n\n' +
'### Red en la nube (AWS como referencia)\n- **VPC**: red virtual aislada con rango CIDR (10.0.0.0/16).\n- **Subnet pública**: ruta al Internet Gateway; ahí viven balanceadores y bastiones.\n- **Subnet privada**: sin ruta directa a internet; sale por **NAT Gateway**. Ahí van apps y bases.\n- **Security Group**: firewall stateful por instancia (solo allow).\n- **NACL**: firewall stateless por subnet.\n- **Load Balancer**: distribuye tráfico y hace health checks.\n\n' +
'### Almacenamiento\n| Tipo | Uso |\n' +
'| --- | --- |\n' +
'| Bloque (EBS) | Disco de una VM, baja latencia |\n' +
'| Archivos (EFS) | Compartido entre varias instancias |\n' +
'| Objetos (S3) | Archivos, backups, static sites; durabilidad altísima |\n\n' +
'### IAM\nUsuarios, grupos, roles y políticas JSON. La regla es **mínimo privilegio**: permisos específicos sobre recursos específicos, roles para servicios (una EC2 asume un rol, no lleva claves), MFA en cuentas humanas y rotación de credenciales. Nunca claves de acceso en el código.\n\n' +
'> Pregunta trampa: "¿por qué no dar AdministratorAccess al pipeline?" Porque un runner comprometido podría borrar la infraestructura completa. El pipeline debe poder hacer solo lo necesario, idealmente vía rol asumible con condiciones.',
      realWorld: 'La mayoría de las brechas cloud empiezan con credenciales de larga duración o buckets públicos. El diseño de IAM y red es parte del trabajo diario, no un trámite.',
      commands: [
        { cmd: 'aws sts get-caller-identity', desc: 'Confirma qué identidad y cuenta estás usando.', example: 'aws sts get-caller-identity' },
        { cmd: 'aws ec2 describe-instances --query "Reservations[].Instances[].[InstanceId,State.Name]"', desc: 'Inventario de instancias.', example: 'aws ec2 describe-instances --output table' },
        { cmd: 'aws s3 ls', desc: 'Lista buckets accesibles con la identidad actual.', example: 'aws s3 ls\naws s3 cp archivo.txt s3://mi-bucket/' },
        { cmd: 'aws iam list-attached-role-policies --role-name mi-rol', desc: 'Audita permisos de un rol.', example: 'aws iam list-attached-role-policies --role-name app-role' }
      ],
      labIds: ['lab-cloud-map'],
      challenge: {
        prompt: 'Diseñá en un párrafo la arquitectura para una API con base de datos en AWS: VPC, dos subnets (pública/privada), ALB, dos instancias en AZ distintas, RDS privado y rol IAM para la app.',
        criteria: ['Subnet pública con ALB', 'App y base en privadas', 'Multi-AZ', 'Rol IAM en lugar de claves']
      },
      mistakes: [
        'Poner la base de datos en subnet pública.',
        'Usar claves de acceso en lugar de roles.',
        'Creer que Multi-AZ es un backup (es alta disponibilidad, no recuperación de datos borrados).'
      ],
      mastery: [
        'Justificás IaaS vs PaaS para un caso concreto.',
        'Dibujás una VPC de tres capas sin mirar.',
        'Explicás mínimo privilegio con un ejemplo de política.'
      ],
      keyIdeas: ['IaaS PaaS SaaS', 'AZ', 'subnet pública privada', 'security group', 'IAM role', 'S3 vs EBS']
    },
    {
      id: 'd3-terraform', day: 4, title: 'Terraform e infraestructura como código',
      subtitle: 'Providers, state, plan/apply y módulos', minutes: 60, tags: ['terraform'], difficulty: 3,
      objectives: [
        'Explicar el ciclo init → plan → apply y qué hace el state.',
        'Escribir un recurso y una variable sin errores de sintaxis.',
        'Evitar los riesgos clásicos del state y de los apply ciegos.'
      ],
      theory:
'**Infrastructure as Code** significa describir infraestructura en archivos versionados, revisables y repetibles. Terraform es declarativo: describís el estado deseado y la herramienta calcula la diferencia con el estado real.\n\n' +
'### Ciclo de trabajo\n1. **terraform init**: descarga providers y módulos, inicializa backend.\n2. **terraform validate** y **fmt**: sintaxis y estilo.\n3. **terraform plan**: muestra qué va a crear, cambiar o destruir (el diff).\n4. **terraform apply**: ejecuta el plan (pedí revisión antes de aprobar).\n5. **terraform destroy**: elimina todo lo gestionado (peligroso en producción).\n\n' +
'### State\nEl archivo **terraform.tfstate** mapea recursos declarados con IDs reales del proveedor. No es opcional: sin state, Terraform no sabe qué existe. En equipo va en un **backend remoto** (S3 + DynamoDB para lock, Terraform Cloud) con cifrado y bloqueo para evitar applies concurrentes que corrompan el state. **Nunca** se commitea a Git porque puede contener datos sensibles.\n\n' +
'~~~\n' +
'resource "aws_s3_bucket" "logs" {\n' +
'  bucket = "empresa-logs-${var.env}"\n' +
'  tags = { Env = var.env }\n' +
'}\n' +
'~~~\n\n' +
'### Variables, outputs y módulos\nLas **variables** parametrizan (con defaults y validaciones), los **outputs** exponen valores, los **módulos** encapsulan patrones reutilizables. **locals** evita repetir expresiones. **for_each** y **count** crean múltiples recursos.\n\n' +
'### Lifecycle y drift\n**prevent_destroy** protege recursos críticos; **ignore_changes** evita peleas con cambios externos. El **drift** es la diferencia entre el state y la realidad (alguien cambió algo a mano): se detecta con plan y se corrige reimportando o aplicando.\n\n' +
'> Entrevista: "¿qué pasa si dos personas hacen apply a la vez?" Sin lock remoto, ambos leen el mismo state y uno pisa al otro. Con DynamoDB lock, el segundo espera o falla.',
      realWorld: 'Un plan revisado es la última barrera antes de tocar producción. Leer un plan que dice "destroy" sobre una base de datos es una habilidad que salva empleos.',
      commands: [
        { cmd: 'terraform init', desc: 'Inicializa providers y backend.', example: 'terraform init -upgrade' },
        { cmd: 'terraform plan -out=tfplan', desc: 'Genera y guarda el plan para aplicarlo exacto.', example: 'terraform plan -out=tfplan\nterraform show tfplan' },
        { cmd: 'terraform apply tfplan', desc: 'Aplica el plan revisado sin volver a calcular.', example: 'terraform apply tfplan' },
        { cmd: 'terraform state list', desc: 'Lista recursos gestionados en el state.', example: 'terraform state list\nterraform state show aws_s3_bucket.logs' },
        { cmd: 'terraform output -json', desc: 'Expone outputs para scripts.', example: 'terraform output -json | jq .bucket_name' }
      ],
      labIds: ['lab-terraform'],
      challenge: {
        prompt: 'Creá un main.tf con provider local (o null_resource), una variable env con validación, un output y un recurso con tags. Ejecutá init, fmt, validate, plan y apply.',
        criteria: ['variable con type y default', 'recurso con tags usando var', 'output', 'plan revisado antes del apply']
      },
      mistakes: [
        'Commitear tfstate o secretos.',
        'Aplicar sin leer el plan.',
        'Editar recursos a mano en la consola y generar drift.'
      ],
      mastery: [
        'Explicás state, lock y backend remoto con precisión.',
        'Leés un plan e identificás cambios destructivos.',
        'Estructurás variables, outputs y módulos de forma mantenible.'
      ],
      keyIdeas: ['declarativo', 'state', 'plan', 'backend remoto', 'lock', 'drift', 'módulos']
    },
    {
      id: 'd3-k8s-arq', day: 4, title: 'Arquitectura de Kubernetes',
      subtitle: 'Control plane, nodos, Pods y reconciliación', minutes: 55, tags: ['k8s'], difficulty: 3,
      objectives: [
        'Describir el control plane y el rol de cada componente.',
        'Explicar el ciclo de reconciliación de un Pod.',
        'Distinguir Pod, ReplicaSet y Deployment.'
      ],
      theory:
'Kubernetes orquesta contenedores en un clúster. Vos declarás el estado deseado en objetos YAML y el **control plane** trabaja para que la realidad coincida (bucle de reconciliación).\n\n' +
'### Control plane\n- **kube-apiserver**: única puerta de entrada; valida y persiste objetos.\n- **etcd**: base de datos clave-valor con el estado del clúster. Si se pierde, se pierde el clúster (backups obrigatorios).\n- **kube-scheduler**: decide en qué nodo corre cada Pod según recursos, afinidad y taints.\n- **kube-controller-manager**: ejecuta controladores (Deployment, Node, Endpoint) que reconcilian.\n- **cloud-controller-manager**: integra con el proveedor cloud (LB, discos).\n\n' +
'### Nodos\nCada nodo corre **kubelet** (recibe PodSpecs y los ejecuta vía CRI), **kube-proxy** (reglas de red para Services) y el runtime de contenedores (containerd).\n\n' +
'### Objetos esenciales\n- **Pod**: unidad mínima, uno o más contenedores con red y volúmenes compartidos. Es efímero: no se repara, se reemplaza.\n- **ReplicaSet**: mantiene N réplicas de un Pod.\n- **Deployment**: gestiona ReplicaSets y permite rolling updates y rollback.\n- **StatefulSet**: identidad estable y almacenamiento por réplica (bases de datos).\n- **DaemonSet**: un Pod por nodo (agentes de monitoreo).\n- **Job/CronJob**: tareas finitas y programadas.\n\n' +
'### Namespaces, labels y selectors\nLos namespaces separan recursos (dev/staging/prod). Los **labels** etiquetan y los **selectors** agrupan; son la base de Services y Deployments. **requests** reservan recursos para el scheduler y **limits** los topes en runtime; superar el límite de memoria produce OOMKilled.\n\n' +
'> Si te preguntan "¿qué pasa cuando aplicás un Deployment?", la respuesta es: el API server lo guarda, el controller crea un ReplicaSet, este crea Pods, el scheduler los asigna a nodos y kubelet los ejecuta. Nada de eso es imperativo.',
      realWorld: 'Entender el bucle de reconciliación explica por qué borrar un Pod no lo elimina para siempre: el ReplicaSet lo recrea. Para mantenimiento se usa cordon/drain, no borrar Pods a mano.',
      commands: [
        { cmd: 'kubectl get nodes -o wide', desc: 'Estado, roles, IPs y versión de los nodos.', example: 'kubectl get nodes -o wide' },
        { cmd: 'kubectl get pods -A -o wide', desc: 'Pods de todos los namespaces con nodo asignado.', example: 'kubectl get pods -A -o wide' },
        { cmd: 'kubectl describe pod <pod>', desc: 'Eventos, estado, imagen y causas de fallo.', example: 'kubectl describe pod web-7d9f8c-abcde' },
        { cmd: 'kubectl logs <pod> --previous', desc: 'Logs del contenedor anterior (reinicios).', example: 'kubectl logs web-7d9f8c-abcde --previous' },
        { cmd: 'kubectl get events --sort-by=.lastTimestamp', desc: 'Eventos del clúster ordenados por tiempo.', example: 'kubectl get events -A --sort-by=.lastTimestamp | tail -20' }
      ],
      labIds: ['lab-k8s-deploy'],
      challenge: {
        prompt: 'Desplegá nginx con 2 réplicas, verificá en qué nodos quedaron, borrá un Pod y comprobá que se recrea. Explicá qué controlador lo hizo.',
        criteria: ['kubectl create deployment o manifiesto', 'kubectl scale --replicas=2', 'Pod borrado y recreado', 'Explicación del ReplicaSet']
      },
      mistakes: [
        'Editar Pods directamente en lugar de su controlador.',
        'Confundir requests con limits.',
        'Creer que un Deployment da persistencia (no lo hace).'
      ],
      mastery: [
        'Recitás el flujo de creación y reconciliación de un Pod.',
        'Elegís el workload correcto para un caso (Deployment, StatefulSet, DaemonSet, Job).',
        'Interpretás describe y eventos para diagnosticar.'
      ],
      keyIdeas: ['etcd', 'scheduler', 'kubelet', 'reconciliación', 'Deployment vs ReplicaSet', 'requests/limits']
    },
    {
      id: 'd3-k8s-workloads', day: 4, title: 'Services, ConfigMaps, probes y escalado',
      subtitle: 'Exponer, configurar y mantener apps sanas', minutes: 60, tags: ['k8s'], difficulty: 3,
      objectives: [
        'Explicar cómo un Service encuentra Pods y qué hace un Ingress.',
        'Configurar liveness, readiness y startup probes con criterio.',
        'Diagnosticar CrashLoopBackOff y fallos de Service sin endpoints.'
      ],
      theory:
'Un **Service** da una IP y un nombre DNS estables a un conjunto de Pods efímeros, seleccionados por labels. Tipos: **ClusterIP** (interno), **NodePort** (puerto en cada nodo), **LoadBalancer** (IP externa del proveedor). Un **Ingress** publica varios Services por host/path con un controlador (nginx-ingress, traefik).\n\n' +
'### Configuración\n**ConfigMap** para configuración no sensible, **Secret** para credenciales (codificado en base64, no cifrado por defecto: requiere cifrado en etcd o un gestor externo). Se inyectan como variables de entorno o volúmenes.\n\n' +
'### Probes\n| Probe | Pregunta | Si falla |\n' +
'| --- | --- | --- |\n' +
'| liveness | ¿sigue vivo? | Reinicia el contenedor |\n' +
'| readiness | ¿puede recibir tráfico? | Lo saca de los endpoints |\n' +
'| startup | ¿terminó de arrancar? | Bloquea las otras probes |\n\n' +
'Una liveness mal configurada con el mismo endpoint que readiness puede causar reinicios en cascada cuando la app está lenta. Regla: liveness solo verifica que el proceso no esté colgado; readiness verifica dependencias.\n\n' +
'### Escalado y actualizaciones\n**HPA** escala réplicas según CPU/memoria o métricas custom. **VPA** ajusta requests/limits. **Cluster Autoscaler** agrega nodos. Un Deployment hace **rolling update** con maxSurge y maxUnavailable; **kubectl rollout undo** vuelve atrás.\n\n' +
'### Diagnóstico de Service sin respuesta\n1. kubectl get endpoints mi-svc: si está vacío, el selector no matchea Pods o no están Ready.\n2. kubectl describe svc y describe pod para ver labels y puertos.\n3. Verificar targetPort vs containerPort: un desajuste es la causa más común.\n4. Probar desde dentro: kubectl run tmp --rm -it --image=busybox -- wget -qO- http://mi-svc.\n\n' +
'> CrashLoopBackOff no es una causa, es un síntoma. Se diagnostica con logs, describe y exit code: 1 error de app, 137 OOMKilled, 143 SIGTERM, imagen inexistente o comando inválido.\n\n### Almacenamiento y otros workloads\nUn **PersistentVolumeClaim** pide almacenamiento con accessModes (ReadWriteOnce, ReadWriteMany) y tamaño; el binding lo resuelve un PV o una StorageClass con aprovisionamiento dinámico. El Pod lo monta referenciando `claimName` en `volumes`. Además de Deployments: **StatefulSet** para identidad y disco estable por réplica (bases de datos), **DaemonSet** para un Pod por nodo (agentes de logs o métricas), **Job** para tareas finitas y **CronJob** para programadas. Elegir mal el workload es una fuente clásica de incidentes.',
      realWorld: 'El Ingress público, el Service interno y las probes son el triángulo que define si una app está disponible. Casi todo incidente de disponibilidad se investiga ahí.',
      commands: [
        { cmd: 'kubectl expose deployment web --port=80 --target-port=8080', desc: 'Crea un Service ClusterIP para el Deployment.', example: 'kubectl expose deployment web --port=80 --target-port=8080' },
        { cmd: 'kubectl get endpoints mi-svc', desc: 'Verifica si el Service tiene Pods detrás.', example: 'kubectl get endpoints web' },
        { cmd: 'kubectl scale deployment web --replicas=4', desc: 'Escala réplicas manualmente.', example: 'kubectl scale deployment web --replicas=4' },
        { cmd: 'kubectl rollout status deployment/web && kubectl rollout undo deployment/web', desc: 'Verifica y revierte un despliegue.', example: 'kubectl rollout status deployment/web\nkubectl rollout undo deployment/web' },
        { cmd: 'kubectl exec -it <pod> -- sh', desc: 'Diagnóstico dentro del contenedor.', example: 'kubectl exec -it web-abc -- sh -c "wget -qO- localhost:8080/health"' }
      ],
      labIds: ['lab-k8s-service'],
      challenge: {
        prompt: 'Escribí un manifiesto con Deployment de 2 réplicas, ConfigMap, Secret, Service y probes. Aplicalo con kubectl apply -f y verificá endpoints y rollout.',
        criteria: ['Deployment con labels y selector coherentes', 'ConfigMap y Secret referenciados', 'Readiness y liveness distintas', 'Service con targetPort correcto']
      },
      mistakes: [
        'Selector del Service que no coincide con las labels del Pod.',
        'targetPort incorrecto (8080 en lugar de 80).',
        'Usar liveness en una dependencia externa y reiniciar la app por un fallo ajeno.'
      ],
      mastery: [
        'Diagnosticás Service sin endpoints en 3 comandos.',
        'Elegís probes y justificás endpoints distintos.',
        'Explicás rolling update y rollback con maxSurge.'
      ],
      keyIdeas: ['Service selector', 'targetPort', 'Ingress', 'readiness vs liveness', 'CrashLoopBackOff', 'HPA']
    },

    /* ================= DÍA 4 ================= */
    {
      id: 'd4-observabilidad', day: 5, title: 'Observabilidad y alertas',
      subtitle: 'Métricas, logs, trazas, Prometheus y Grafana', minutes: 50, tags: ['obs'], difficulty: 3,
      objectives: [
        'Diferenciar métricas, logs y trazas y cuándo usar cada una.',
        'Escribir una consulta PromQL básica y una alerta con umbral.',
        'Distinguir síntoma de causa en un dashboard.'
      ],
      theory:
'**Observabilidad** es poder responder preguntas nuevas sobre el sistema sin cambiar el código. Se apoya en tres señales:\n- **Métricas**: números agregados en el tiempo (CPU, requests/s, latencia p95, errores). Baratas y perfectas para alertar.\n- **Logs**: eventos discretos con contexto. Buenos para causas puntuales, caros a escala.\n- **Trazas**: recorrido de una request por servicios, con spans y duración. Indispensables en microservicios.\n\n' +
'### Prometheus y Grafana\nPrometheus hace **scrape** periódico de endpoints /metrics y guarda series temporales. Las consultas usan **PromQL**:\n- rate(http_requests_total[5m]): requests por segundo en 5 minutos.\n- histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])): latencia p95.\n- sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])): tasa de errores.\n\n' +
'Grafana visualiza, pero no almacena. **Alertmanager** agrupa, silencia y enruta alertas a Slack, PagerDuty o email.\n\n' +
'### SLI, SLO y error budget\n- **SLI**: medida (porcentaje de requests exitosas).\n- **SLO**: objetivo (99.9% en 30 días).\n- **Error budget**: 0.1% de margen; cuando se agota, se prioriza estabilidad sobre features.\n\n' +
'### Alertas útiles\nAlertar sobre **síntomas** que afectan al usuario (latencia, errores, disponibilidad), no sobre cada métrica. Una alerta por CPU al 80% sin contexto genera fatiga. Toda alerta debe tener umbral, duración (for: 5m), severidad y runbook.\n\n' +
'> La frase clave: "no puedo arreglar lo que no puedo ver". Pero también: demasiadas métricas sin SLO no son observabilidad, son ruido.\n\n### Exporters, descubrimiento y agregación\nPrometheus obtiene métricas por **scrape** de exporters: **node_exporter** para el host, **blackbox_exporter** para probes HTTP/TCP/ICMP y exporters de aplicación. El **service discovery** por archivos o por la API de Kubernetes descubre targets sin editar la configuración a mano. En PromQL, `sum by (label)` agrega entre series y `rate(...[5m])` calcula la tasa; `avg_over_time` y `max_over_time` agregan en el tiempo. Para retención larga y consultas globales se usa **Thanos** o almacenamiento remoto, porque Prometheus local no está pensado como archivo histórico.',
      realWorld: 'En un incidente, el orden es: dashboard de SLI → ¿es error, latencia o saturación? → logs del servicio afectado → traza de una request lenta → causa raíz.',
      commands: [
        { cmd: 'rate(http_requests_total[5m])', desc: 'Tasa de requests por segundo.', example: 'sum(rate(http_requests_total[5m])) by (status)' },
        { cmd: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))', desc: 'Latencia p95 del servicio.', example: 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))' },
        { cmd: 'up == 0', desc: 'Instancias que Prometheus no puede scrapear.', example: 'up == 0' },
        { cmd: 'docker logs --since 10m api', desc: 'Logs recientes para correlacionar con la métrica.', example: 'docker logs --since 10m api 2>&1 | grep -i error' }
      ],
      labIds: ['lab-promql'],
      challenge: {
        prompt: 'Escribí en PromQL: tasa de errores 5xx sobre total, y una regla de alerta que dispare si supera 5% durante 10 minutos.',
        criteria: ['Uso de rate y suma por status', 'División de errores sobre total', 'Regla con for: 10m', 'Etiqueta de severidad']
      },
      mistakes: [
        'Alertar por CPU sin relación con el impacto al usuario.',
        'Usar logs como única fuente y no poder agregar tendencias.',
        'Confundir p95 con promedio (el promedio esconde colas).'
      ],
      mastery: [
        'Elegís la señal correcta según la pregunta.',
        'Escribís una consulta y una alerta con umbral defendible.',
        'Explicás SLI/SLO/error budget con un ejemplo.'
      ],
      keyIdeas: ['métricas logs trazas', 'PromQL rate', 'p95', 'Alertmanager', 'SLI SLO', 'fatiga de alertas']
    },
    {
      id: 'd4-devsecops', day: 5, title: 'DevSecOps y seguridad del pipeline',
      subtitle: 'SAST, DAST, dependencias, secretos y supply chain', minutes: 50, tags: ['sec'], difficulty: 3,
      objectives: [
        'Ubicar SAST, DAST y SCA en el pipeline.',
        'Explicar gestión de secretos y menor privilegio.',
        'Responder qué hacer ante una credencial filtrada.'
      ],
      theory:
'DevSecOps mueve la seguridad a la izquierda: se integra en el pipeline en lugar de ser una auditoría final. La idea no es bloquear todo, sino detectar temprano y con contexto.\n\n' +
'### Herramientas por etapa\n| Etapa | Técnica | Ejemplos |\n' +
'| --- | --- | --- |\n' +
'| Código | SAST (analiza fuente) | Semgrep, CodeQL, SonarQube |\n' +
'| Dependencias | SCA (vulnerabilidades conocidas) | Dependabot, Trivy, Snyk, npm audit |\n' +
'| Imagen | Escaneo de capas y SO base | Trivy, Grype, Docker Scout |\n' +
'| Runtime/staging | DAST (prueba la app corriendo) | OWASP ZAP |\n' +
'| Infra | IaC scanning | Checkov, tfsec, kube-linter |\n' +
'| Secretos | Detección de credenciales | gitleaks, trufflehog |\n\n' +
'### Secretos\nNunca en Git, ni en imágenes, ni en logs. Opciones: secretos del CI (GH Actions secrets), gestores dedicados (Vault, AWS Secrets Manager, SOPS) o Sealed Secrets en Kubernetes. Rotación periódica y alcance mínimo. Un secreto commiteado se considera **comprometido**: primero se rota, después se limpia la historia.\n\n' +
'### Contenedores e infra\nImagen base mínima y fija, usuario no-root, filesystem read-only, sin capabilities extra, sin docker.sock montado. En Kubernetes: NetworkPolicies, RBAC acotado, PodSecurityStandards, secrets cifrados en etcd.\n\n' +
'### Supply chain\nFirmar imágenes (cosign), generar SBOM (syft) y fijar dependencias con lockfile. Los ataques a la cadena de suministro buscan el paquete o la action que todos usan; pinnear versiones por SHA reduce el riesgo.\n\n' +
'> Si te preguntan "¿el escaneo debe romper el build?", la respuesta madura es: depende de la severidad y de si hay fix disponible. Crítico con exploit conocido y parche disponible → bloquea; medio sin fix → ticket y excepción documentada.\n\n### TLS, identidad y vulnerabilidades\n**TLS** cifra el transporte con un certificado **X.509** emitido por una CA; la clave privada nunca sale del servidor y la renovación automática (cert-manager, Let’s Encrypt) evita el incidente de certificado vencido. Para identidad: **OAuth2** delega autorización, **OpenID Connect** agrega identidad sobre OAuth2 y **SAML** se usa en empresas; **2FA/MFA** con TOTP es el mínimo para cuentas privilegiadas. Las contraseñas se guardan con hash + salt (bcrypt/argon2), nunca cifradas de forma reversible. Un **CVE** se identifica por ID y se prioriza por score CVSS, exploit conocido y exposición real, no solo por el número.',
      realWorld: 'Un token de AWS en un repo público puede ser explotado en minutos por bots. Rotar y detectar con gitleaks en pre-commit cuesta minutos; una brecha cuesta muchísimo más.',
      commands: [
        { cmd: 'trivy image miapp:1.0', desc: 'Escanea vulnerabilidades de la imagen.', example: 'trivy image --severity HIGH,CRITICAL miapp:1.0' },
        { cmd: 'gitleaks detect --source . -v', desc: 'Busca secretos en el repositorio.', example: 'gitleaks detect --source . --no-git -v' },
        { cmd: 'npm audit --omit=dev', desc: 'Vulnerabilidades en dependencias de producción.', example: 'npm audit --omit=dev --audit-level=high' },
        { cmd: 'checkov -d .', desc: 'Escaneo de configuración IaC.', example: 'checkov -d terraform/ --compact' }
      ],
      labIds: ['lab-security'],
      challenge: {
        prompt: 'Diseñá las etapas de seguridad de un pipeline Node + Docker + Terraform, indicando herramienta, cuándo corre y qué severidad bloquea el merge.',
        criteria: ['SAST, SCA e imagen cubiertos', 'Detección de secretos', 'IaC scanning', 'Criterio de bloqueo por severidad']
      },
      mistakes: [
        'Guardar secretos en variables de repositorio visibles o en el Dockerfile.',
        'Bloquear el pipeline por cualquier hallazgo y forzar bypasses.',
        'Escanear solo en producción y no en el pull request.'
      ],
      mastery: [
        'Ubicás cada tipo de análisis en la etapa correcta.',
        'Explicás el procedimiento ante un secreto filtrado en orden.',
        'Justificás qué bloquea y qué genera ticket.'
      ],
      keyIdeas: ['SAST', 'DAST', 'SCA', 'SBOM', 'rotación de secretos', 'menor privilegio', 'supply chain']
    },
    {
      id: 'd4-troubleshooting', day: 5, title: 'Metodología de troubleshooting',
      subtitle: 'Diagnóstico sistemático, incidentes y rollback', minutes: 55, tags: ['obs'], difficulty: 3,
      objectives: [
        'Aplicar un método de diagnóstico en lugar de probar al azar.',
        'Comunicar un incidente con impacto, estado y próximos pasos.',
        'Diagnosticar 502, CrashLoopBackOff, disco lleno y DNS.'
      ],
      theory:
'Principio número uno: **cambiar una cosa a la vez** y registrar qué se hizo. Probar comandos al azar genera más incidentes que los que resuelve.\n\n' +
'### Método en 6 pasos\n1. **Definir el síntoma** con datos: ¿desde cuándo, a quién afecta, qué porcentaje, qué error exacto?\n2. **Acotar el alcance**: ¿un usuario, un servicio, una zona, todo?\n3. **Formular hipótesis** ordenadas por probabilidad y costo de verificación.\n4. **Verificar con evidencia** (logs, métricas, estado, red) sin tocar nada aún.\n5. **Mitigar** (rollback, restart controlado, failover) para recuperar servicio.\n6. **Causa raíz y prevención**: postmortem sin culpables, acción concreta con dueño.\n\n' +
'### Los cuatro sospechosos habituales\n- **Cambio reciente**: deploy, config, certificado, DNS, feature flag. Es la causa más frecuente; preguntá siempre "¿qué cambió?".\n- **Recursos**: CPU, memoria (OOMKilled 137), disco 100%, file descriptors, conexiones de base.\n- **Dependencias**: base de datos lenta, DNS, API externa, cola saturada.\n- **Red/permisos**: security group, NetworkPolicy, token vencido, certificado expirado.\n\n' +
'### Comunicación de incidente\nFormato: **impacto** (qué no funciona y para quién), **estado** (investigando/mitigando/resuelto), **acción actual**, **próxima actualización**. Sin especulación ni culpa. Un incidente mal comunicado escala mal.\n\n' +
'### Rollback antes que heroísmo\nSi el último deploy rompió, revertir es la mitigación más rápida. Investigar la causa se hace después, con el servicio estable.\n\n' +
'> En entrevista, narrá el caso con estructura: síntoma → hipótesis → evidencia → acción → resultado → prevención. Eso demuestra método, no memoria.',
      realWorld: 'La diferencia entre un junior y un semi-senior no es saber más comandos: es tener un método repetible y comunicarlo con calma bajo presión.',
      commands: [
        { cmd: 'kubectl describe pod <pod> | tail -30', desc: 'Eventos y razones de reinicio.', example: 'kubectl describe pod api-6d9f-xyz | tail -30' },
        { cmd: 'df -h && df -i', desc: 'Espacio y agotamiento de inodos.', example: 'df -h\ndf -i' },
        { cmd: 'du -sh /var/* | sort -h | tail', desc: 'Qué consume el disco.', example: 'du -sh /var/* 2>/dev/null | sort -h | tail -5' },
        { cmd: 'kubectl rollout undo deployment/api', desc: 'Mitigación por rollback.', example: 'kubectl rollout undo deployment/api\nkubectl rollout status deployment/api' },
        { cmd: 'dig +short api.internal && nc -zv api.internal 8080', desc: 'DNS y puerto antes de culpar a la app.', example: 'dig +short api.internal\nnc -zv api.internal 8080' }
      ],
      labIds: [],
      challenge: {
        prompt: 'Tomá el escenario de disco lleno del módulo de troubleshooting y escribí el informe: síntoma, evidencia, causa, mitigación y prevención, en menos de 10 líneas.',
        criteria: ['Síntoma medible', 'Evidencia con comando', 'Causa raíz distinta del síntoma', 'Prevención concreta']
      },
      mistakes: [
        'Reiniciar todo sin leer logs.',
        'Cambiar varias cosas a la vez y no saber qué funcionó.',
        'Confundir mitigación con causa raíz.'
      ],
      mastery: [
        'Seguís el método sin saltarte la evidencia.',
        'Comunicás un incidente en el formato correcto.',
        'Distinguís síntoma (502) de causa (upstream caído).'
      ],
      keyIdeas: ['un cambio a la vez', 'qué cambió', 'mitigar vs causa raíz', 'rollback', 'postmortem']
    },
    {
      id: 'd4-entrevista', day: 5, title: 'Estrategia para la entrevista técnica',
      subtitle: 'Estructura de respuesta, tradeoffs y preguntas al entrevistador', minutes: 40, tags: ['obs'], difficulty: 2,
      objectives: [
        'Estructurar respuestas técnicas en 60-90 segundos.',
        'Explicar tradeoffs en lugar de dar definiciones.',
        'Cerrar la entrevista con preguntas que suman.'
      ],
      theory:
'Una entrevista junior no busca erudición: busca **criterio**, orden y honestidad técnica. Si no sabés algo, decilo y explicá cómo lo averiguarías. Eso puntúa mejor que inventar.\n\n' +
'### Estructura de respuesta (STAR técnico)\n- **Situación**: contexto en una frase.\n- **Tarea**: qué había que resolver.\n- **Acción**: qué hiciste vos y por qué (comandos, decisiones, tradeoffs).\n- **Resultado**: métrica o consecuencia concreta.\n\n' +
'### Cómo responder preguntas de definición\nDefinición en una frase → ejemplo real → riesgo o error común → cómo lo verificarías. Por ejemplo, Docker: "contenedor es un proceso aislado con namespaces y cgroups" → "corro nginx en 8080" → "si no limito memoria puede afectar el host" → "lo verifico con docker stats".\n\n' +
'### Tradeoffs que se preguntan siempre\n- **VM vs contenedor**: aislamiento vs densidad.\n- **Merge vs rebase**: historia real vs linealidad.\n- **Delivery vs deployment**: control vs velocidad.\n- **Terraform vs clickops**: reproducibilidad vs inmediatez.\n- **Monolito vs microservicios**: simplicidad operativa vs escalado independiente.\n- **liveness vs readiness**: reiniciar vs sacar de tráfico.\n\n' +
'### Señales que te hacen quedar bien\n- Reconocer límites: "no lo usé en producción, pero entiendo que...".\n- Preguntar requisitos antes de diseñar.\n- Mencionar seguridad y observabilidad sin que te lo pidan.\n- Explicar rollback en tus diseños.\n\n' +
'### Preguntas para hacer vos\n¿Cómo es el pipeline hoy? ¿Qué incidentes tuvieron el último mes? ¿Qué parte del stack está más dolorosa? ¿Cómo se decide un deploy? Demuestran interés real por el trabajo.\n\n' +
'> Los errores que más restan: respuestas de una sola palabra, no mencionar cómo verificarías, y culpar a otros equipos en anécdotas.',
      realWorld: 'En la entrevista final suelen pesar más la comunicación y el método que la respuesta exacta. Un candidato que dice "no sé, lo verificaría así" transmite confianza.',
      commands: [],
      labIds: [],
      challenge: {
        prompt: 'Grabate respondiendo en 90 segundos: "contame un incidente que hayas resuelto". Usá STAR técnico y subilo a la sección de notas.',
        criteria: ['Situación y tarea claras', 'Acciones concretas con comandos', 'Resultado medible', 'Prevención mencionada']
      },
      mistakes: [
        'Dar definiciones de manual sin ejemplo ni verificación.',
        'Decir que sí a todo para no quedar mal.',
        'Respuestas de 5 minutos sin estructura.'
      ],
      mastery: [
        'Respondés cualquier concepto en el formato definición → ejemplo → riesgo → verificación.',
        'Explicás tres tradeoffs con criterio propio.',
        'Cerrás con preguntas pertinentes.'
      ],
      keyIdeas: ['STAR', 'tradeoffs', 'reconocer límites', 'verificación', 'preguntas al entrevistador']
    }
  ],

  cheatsheets: [
    {
      id: 'cheat-linux', title: 'Chuleta · Linux operativo',
      body:
'### Inspección\n' +
'~~~\n' +
'uname -a                 # kernel y arquitectura\n' +
'cat /etc/os-release      # distro\n' +
'df -hT                   # uso de disco por filesystem\n' +
'free -h                  # memoria\n' +
'nproc                    # núcleos (para load average)\n' +
'ss -tulpn                # puertos escuchando\n' +
'~~~\n\n' +
'### Permisos\n' +
'~~~\n' +
'chmod 750 archivo        # rwx r-x ---\n' +
'chmod 2770 dir           # SGID + rwx grupo\n' +
'chown -R ana:dev /srv/app\n' +
'setfacl -m u:carlos:r-x dir\n' +
'find / -perm -4000 -type f 2>/dev/null   # SUID\n' +
'~~~\n\n' +
'### Procesos y servicios\n' +
'~~~\n' +
'ps aux --sort=-%mem | head\n' +
'kill -15 PID             # ordenado\n' +
'kill -9 PID              # último recurso\n' +
'systemctl status nginx\n' +
'journalctl -u nginx -f\n' +
'~~~\n\n' +
'### Texto y logs\n' +
'~~~\n' +
'grep -rn "error" /etc/nginx/\n' +
'awk \'{print $1}\' access.log | sort | uniq -c | sort -rn | head\n' +
'find /var/log -type f -size +100M\n' +
'tail -f /var/log/syslog\n' +
'sed -i.bak \'s/80/8080/g\' default.conf\n' +
'~~~'
    },
    {
      id: 'cheat-docker', title: 'Chuleta · Docker y CI',
      body:
'### Contenedores\n' +
'~~~\n' +
'docker run -d --name web -p 8080:80 nginx:1.27\n' +
'docker ps -a\n' +
'docker logs --tail 100 web\n' +
'docker exec -it web sh\n' +
'docker inspect web --format "{{.State.ExitCode}}"\n' +
'docker stats --no-stream\n' +
'~~~\n\n' +
'### Imágenes y compose\n' +
'~~~\n' +
'docker build -t miapp:1.0 .\n' +
'docker tag miapp:1.0 ghcr.io/ana/miapp:1.0\n' +
'docker push ghcr.io/ana/miapp:1.0\n' +
'docker compose up -d --build\n' +
'docker compose logs -f app\n' +
'docker compose down -v      # ¡borra volúmenes!\n' +
'~~~\n\n' +
'### Exit codes\n' +
'| Código | Significado |\n' +
'| --- | --- |\n' +
'| 0 | Éxito |\n' +
'| 1 | Error de aplicación |\n' +
'| 137 | SIGKILL / OOMKilled |\n' +
'| 143 | SIGTERM (cierre ordenado) |'
    },
    {
      id: 'cheat-cloud-k8s', title: 'Chuleta · Terraform y Kubernetes',
      body:
'### Terraform\n' +
'~~~\n' +
'terraform init\n' +
'terraform fmt -check\n' +
'terraform validate\n' +
'terraform plan -out=tfplan\n' +
'terraform apply tfplan\n' +
'terraform state list\n' +
'terraform destroy            # destructivo\n' +
'~~~\n\n' +
'### Kubernetes\n' +
'~~~\n' +
'kubectl get pods -A -o wide\n' +
'kubectl describe pod POD\n' +
'kubectl logs POD --previous\n' +
'kubectl get events --sort-by=.lastTimestamp\n' +
'kubectl get endpoints SVC\n' +
'kubectl rollout undo deployment/api\n' +
'kubectl exec -it POD -- sh\n' +
'~~~\n\n' +
'### Manifiesto mínimo\n' +
'~~~\n' +
'apiVersion: apps/v1\n' +
'kind: Deployment\n' +
'metadata: { name: web }\n' +
'spec:\n' +
'  replicas: 2\n' +
'  selector: { matchLabels: { app: web } }\n' +
'  template:\n' +
'    metadata: { labels: { app: web } }\n' +
'    spec:\n' +
'      containers:\n' +
'        - name: web\n' +
'          image: nginx:1.27\n' +
'          ports: [{ containerPort: 80 }]\n' +
'~~~'
    },
    {
      id: 'cheat-troubleshoot', title: 'Chuleta · Diagnóstico rápido',
      body:
'### Orden de ataque\n1. ¿Qué cambió? (deploy, config, cert, DNS)\n2. ¿A quién afecta? (uno, todos, una zona)\n3. ¿Recursos? (CPU, RAM, disco, inodos, conexiones)\n4. ¿Dependencias? (DB, DNS, API externa, cola)\n5. ¿Red y permisos? (SG, NetworkPolicy, token, TLS)\n\n' +
'### Comandos de guardia\n' +
'~~~\n' +
'df -h; df -i; du -sh /var/* | sort -h | tail\n' +
'free -h; ps aux --sort=-%mem | head\n' +
'ss -tulpn; dig +short svc.internal; nc -zv svc 8080\n' +
'journalctl -u app --since "15 min ago" -p err\n' +
'kubectl describe pod POD; kubectl get endpoints SVC\n' +
'docker inspect C --format "{{.State.ExitCode}}"\n' +
'~~~\n\n' +
'### 502 vs 504\n| Código | Significado |\n' +
'| --- | --- |\n' +
'| 502 | El proxy no pudo hablar con el upstream |\n' +
'| 503 | Servicio no disponible (sin capacidad) |\n' +
'| 504 | El upstream tardó demasiado (timeout) |'
    }
  ]
};
