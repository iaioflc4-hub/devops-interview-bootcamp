/* Ampliación del currículo para cubrir el examen LPI DevOps Tools Engineer
   701-200 v2.0. Se carga después de curriculum.js: agrega los módulos que
   faltaban (LFCS almacenamiento/systemd, 701.1, 701.2, 701.5, 703.3, 704.3,
   704.4 y Terraform en equipo) y etiqueta cada módulo existente con su
   objetivo LPI o su track de complemento. */

(function () {
  'use strict';

  var extraModules = [
    {
      id: 'lfcs-storage', day: 1, title: 'Almacenamiento, particiones y LVM',
      subtitle: 'lsblk, fstab, LVM, swap y NFS', minutes: 60, tags: ['linux'], difficulty: 2,
      lpi: 'LFCS 3.1', lpiDomain: 'LFCS · Storage', track: 'lfcs',
      objectives: [
        'Identificar discos, particiones y filesystems con lsblk, blkid y findmnt.',
        'Montar un volumen de forma persistente y segura en /etc/fstab.',
        'Crear y extender un volumen lógico con LVM sin perder datos.'
      ],
      theory: `Los discos aparecen en /dev como sda, nvme0n1 o vda. Sobre el disco se crea una tabla de particiones **GPT** (moderna) o **MBR** (legacy, límite de 2 TB y cuatro particiones primarias), y sobre cada partición un **filesystem**: ext4, xfs, btrfs o swap. El disco no se usa por su nombre: se monta en un directorio y se referencia por **UUID** para que el orden de detección no rompa el arranque.

### Ver antes de tocar
\`lsblk -f\` muestra el árbol de discos con filesystem, UUID y punto de montaje. \`blkid\` lista UUID y tipo. \`findmnt\` dice qué está montado, dónde y con qué opciones. \`df -hT\` muestra uso por filesystem y \`df -i\` el consumo de inodos: un disco con espacio libre puede fallar porque se agotaron los inodos.

### fstab sin romper el arranque
/etc/fstab tiene seis campos: dispositivo (UUID=...), punto de montaje, tipo, opciones, dump y pass. Opciones habituales: defaults, noatime, ro, noexec, nosuid, nofail y x-systemd.automount. Un error deja el sistema sin arrancar: se valida con \`mount -a\` y \`findmnt --verify\` antes de reiniciar, y se corrige desde rescue.target o un live USB.

### LVM
LVM intercala una capa flexible: un **PV** (disco o partición) se agrupa en un **VG**, y del VG se crean **LV** que se formatean y montan. Permite extender en caliente si hay espacio libre: \`lvextend -r -L +5G /dev/vg0/datos\` redimensiona el filesystem con -r. El triaje básico es \`pvs\`, \`vgs\`, \`lvs\` y \`df -h\`.

### Swap y NFS
**Swap** es memoria de respaldo en disco (\`swapon --show\`). **NFS** comparte directorios por red: /etc/exports en el servidor y \`mount -t nfs servidor:/ruta /mnt/punto\` en el cliente.

> Nunca ejecutes mkfs ni reparticiones sin confirmar con lsblk y findmnt que el dispositivo no está en uso. Ese error es irreversible.`,
      realWorld: 'La causa más común de un servidor que no arranca después de un mantenimiento es una entrada de fstab mal escrita o un disco que ya no existe. nofail y la validación previa evitan la guardia a las 3 de la mañana.',
      commands: [
        { cmd: 'lsblk -f', desc: 'Árbol de discos, filesystems, UUID y puntos de montaje.', example: 'lsblk -f\n# sdb1 ext4 5f2c... /srv/datos' },
        { cmd: 'blkid /dev/sdb1', desc: 'UUID y tipo de un dispositivo concreto.', example: 'blkid /dev/sdb1\n# /dev/sdb1: UUID="5f2c..." TYPE="ext4"' },
        { cmd: 'findmnt /var && df -hT', desc: 'Qué filesystem sostiene una ruta y con qué opciones.', example: 'findmnt /\ndf -hT' },
        { cmd: 'sudo mount -a && findmnt --verify', desc: 'Valida fstab sin reiniciar.', example: 'sudo mount -a\nfindmnt --verify --verbose' },
        { cmd: 'sudo lvextend -r -L +5G /dev/vg0/datos', desc: 'Extiende el LV y su filesystem en caliente.', example: 'sudo lvextend -r -L +5G /dev/vg0/datos\nlvs' },
        { cmd: 'df -h; df -i', desc: 'Espacio e inodos: dos límites distintos.', example: 'df -h\ndf -i' }
      ],
      labIds: ['lab-lfcs-storage'],
      challenge: {
        prompt: 'En una VM o WSL2, creá un archivo loop de 1 GB, formatealo ext4, montalo en /mnt/lab y agregá una entrada en fstab con UUID y nofail. Verificá con findmnt y desmontá al final.',
        criteria: ['lsblk o losetup muestra el dispositivo', 'mkfs.ext4 ejecutado sobre el loop', 'Entrada de fstab con UUID y nofail', 'findmnt confirma el montaje', 'Desmontaje limpio al terminar']
      },
      mistakes: [
        'Poner /dev/sdb1 en fstab: el nombre puede cambiar entre arranques.',
        'Editar fstab sin probar mount -a y reiniciar a ciegas.',
        'Formatear un dispositivo que está montado o en uso.',
        'Mirar solo df -h y no df -i cuando las escrituras fallan con espacio libre.'
      ],
      mastery: [
        'Explicás la diferencia entre partición, filesystem y punto de montaje.',
        'Diagnosticás por qué un volumen no monta leyendo findmnt y journalctl.',
        'Extendés un LV en producción sin downtime y sabés cuándo no es posible.'
      ],
      keyIdeas: ['GPT vs MBR', 'UUID en fstab', 'nofail', 'PV/VG/LV', 'lvextend -r', 'inodos']
    },
    {
      id: 'lfcs-systemd', day: 1, title: 'systemd, unidades y timers',
      subtitle: 'Units, targets, journald persistente y arranque', minutes: 55, tags: ['linux'], difficulty: 2,
      lpi: 'LFCS 2.2', lpiDomain: 'LFCS · Operation of Running Systems', track: 'lfcs',
      objectives: [
        'Distinguir service, timer, socket, mount y target.',
        'Crear un timer persistente sin depender de cron.',
        'Diagnosticar el arranque con systemd-analyze y journalctl -b.'
      ],
      theory: `systemd es el PID 1 y el gestor de unidades. Cada recurso se declara en una **unit** con secciones [Unit], [Service], [Timer], [Install]. Tipos que hay que reconocer: **.service** (proceso), **.timer** (programación), **.socket** (activación por conexión), **.mount** (punto de montaje) y **.target** (agrupación, equivalente a un runlevel).

### Ciclo de vida
\`systemctl start\` inicia ahora; \`enable\` registra el arranque automático; \`enable --now\` hace ambos; \`disable\` lo quita; \`mask\` lo bloquea incluso ante dependencias. \`systemctl cat\` muestra la unidad y sus drop-ins; \`systemctl edit\` crea un override sin tocar el archivo del paquete. Esa es la forma correcta de personalizar: los cambios en /usr/lib/systemd/system se pierden al actualizar.

### Timers en lugar de cron
Un timer necesita dos archivos: el .service con ExecStart y el .timer con OnCalendar (o OnUnitActiveSec) y, si querés que no se pierda una ejecución por estar apagado, Persistent=true. Se habilita el timer, no el service. \`systemctl list-timers\` confirma la próxima ejecución.

### Logs y arranque
journald guarda los logs; por defecto pueden ser volátiles en /run/log/journal. Para persistirlos: mkdir -p /var/log/journal y Storage=persistent en journald.conf. \`journalctl -b\` muestra el arranque actual, \`-b -1\` el anterior, \`-p err\` solo errores y \`-o json\` para procesar. \`systemd-analyze blame\` ordena los servicios por tiempo de arranque y \`systemctl isolate rescue.target\` entra en modo rescate.

> Si un servicio no arranca, la secuencia es systemctl status → systemctl cat → journalctl -u → validar la configuración propia del servicio. Reiniciar sin leer el journal es apostar.`,
      realWorld: 'Un timer mal configurado que se ejecuta cada minuto puede saturar la base de datos. Revisar OnCalendar y Persistent es parte del code review de automatizaciones, no un detalle de examen.',
      commands: [
        { cmd: 'systemctl list-units --type=service --state=running', desc: 'Servicios activos ahora.', example: 'systemctl list-units --type=service --state=running' },
        { cmd: 'systemctl cat cron && systemctl edit cron', desc: 'Ver la unidad y crear un override sin editarla.', example: 'systemctl cat cron\nsudo systemctl edit cron --full' },
        { cmd: 'systemctl enable --now backup.timer', desc: 'Activa y registra un timer en un solo paso.', example: 'sudo systemctl enable --now backup.timer\nsystemctl list-timers backup.timer' },
        { cmd: 'systemd-analyze blame', desc: 'Servicios que más demoran el arranque.', example: 'systemd-analyze blame | head' },
        { cmd: 'journalctl -b -p err --no-pager', desc: 'Errores del arranque actual.', example: 'journalctl -b -1 -p err --no-pager' },
        { cmd: 'systemd-run --on-calendar="*-*-* 03:00" /usr/local/bin/tarea', desc: 'Timer transitorio sin crear archivos.', example: 'systemd-run --on-calendar="daily" --unit=prueba /bin/true' }
      ],
      labIds: ['lab-lfcs-systemd'],
      challenge: {
        prompt: 'Escribí un .service y un .timer que ejecuten un script de backup a las 03:00 con Persistent=true. Habilitá el timer, verificá con list-timers y simulá la ejecución con systemctl start del service.',
        criteria: ['service con ExecStart y usuario sin privilegios', 'timer con OnCalendar y Persistent', 'WantedBy=timer.target o timers.target', 'systemctl enable --now', 'list-timers muestra la próxima ejecución']
      },
      mistakes: [
        'Habilitar el .service en lugar del .timer.',
        'Editar archivos en /usr/lib/systemd/system en vez de usar drop-ins.',
        'Asumir que journald persiste entre reinicios sin configurarlo.',
        'Poner WorkingDirectory o variables de entorno que no existen en el contexto del servicio.'
      ],
      mastery: [
        'Elegís entre timer, socket y cron con un criterio operativo.',
        'Diagnosticás un arranque lento con systemd-analyze y blame.',
        'Recuperás un sistema que no llega al prompt gráfico con rescue.target.'
      ],
      keyIdeas: ['unit types', 'drop-in', 'enable --now', 'OnCalendar', 'Persistent=true', 'journald persistente', 'rescue.target']
    },
    {
      id: 'lpi701-arq', day: 2, title: 'Diseño de software y arquitectura de servicios',
      subtitle: '701.1 · APIs, estado, cloud native y migraciones', minutes: 60, tags: ['cloud'], difficulty: 3,
      lpi: '701.1', lpiDomain: '701 · Software Engineering', track: 'lpi701',
      objectives: [
        'Diseñar una API REST con estados, versionado e idempotencia claros.',
        'Elegir entre estado en servidor, sesión y tokens sin romper el escalado.',
        'Planificar una migración de monolito y una migración de base de datos.'
      ],
      theory: `El examen 701.1 no pide memorizar frameworks: pide **diseñar servicios** que funcionen en contenedores y en la nube. La unidad es el **servicio** con una responsabilidad clara, contrato explícito y bajo acoplamiento. SOA y microservicios son dos formas de esa idea; el monolito no es un pecado, pero escalarlo horizontalmente exige sesiones fuera del proceso y despliegues coordinados.

### APIs
REST usa recursos y verbos HTTP: GET no debe modificar estado, PUT y DELETE deben ser **idempotentes** (repetir la llamada deja el mismo resultado), POST crea. Los códigos de estado comunican el resultado sin inventar payloads: 201 al crear, 400 por validación, 401/403 por autenticación y autorización, 409 por conflicto, 429 por rate limit. JSON es el formato por defecto. Versioná el contrato (/v1) antes de romperlo; los consumidores no se actualizan solos.

### Estado, sesiones y transacciones
Un servicio **stateless** guarda la sesión en un almacén compartido (Redis, base de datos) o en un token firmado (JWT), no en la memoria del proceso. JWT no se puede revocar sin lista negra: no sirve para todo. Las transacciones de base garantizan atomicidad (ACID); entre servicios se usa saga o compensación, porque no hay transacción distribuida gratis. La concurrencia se controla con locks, colas o versiones optimistas.

### Cloud native
Doce factores, entre ellos: configuración por variables de entorno, procesos desechables, logs a stdout, dependencias declaradas y separación build/release/run. **Servidores inmutables**: no se parchea a mano, se reconstruye la imagen. **Loose coupling** + reintentos con idempotencia + timeouts. Una app cloud native se puede escalar, reiniciar y mover sin perder estado.

### Migraciones y legacy
Migrar de monolito a servicios: primero separar por dominio, exponer interfaces, medir y recién extraer. Los riesgos son transacciones cruzadas, reportes que leen la base directa y equipos acostumbrados al deploy único. Las migraciones de esquema (database migrations) deben ser compatibles hacia atrás: agregar columna, backfill, desplegar código nuevo, quitar la vieja. Nunca un cambio destructivo en el mismo deploy que el código.

> En entrevista, un buen diseño menciona contrato, estado, errores, observabilidad y plan de migración sin que se lo pidan.`,
      realWorld: 'La mayoría de los incidentes de escalado vienen de sesiones en memoria o de endpoints no idempotentes que duplican cobros cuando el cliente reintenta. Diseñar reintentos sin idempotencia es diseñar incidentes.',
      commands: [
        { cmd: 'curl -s -X GET https://api.local/v1/orders/42 | jq', desc: 'Consumir un recurso y validar el contrato JSON.', example: 'curl -s https://api.local/v1/orders/42 | jq .status' },
        { cmd: 'curl -i -X POST https://api.local/v1/orders -H "Content-Type: application/json" -d @order.json', desc: 'Ver códigos y headers de una creación.', example: 'curl -i -X POST https://api.local/v1/orders -H "Content-Type: application/json" -d "{\\"sku\\":\\"A1\\",\\"qty\\":2}"' },
        { cmd: 'hey -z 30s -c 20 https://api.local/health', desc: 'Carga básica para medir latencia y errores.', example: 'hey -z 30s -c 20 https://api.local/v1/orders' },
        { cmd: 'docker run --rm -e APP_MODE=production miapp:1.0', desc: 'Configuración por entorno, no por archivo.', example: 'docker run --rm -e APP_MODE=production -e DB_HOST=db miapp:1.0' },
        { cmd: 'psql -c "ALTER TABLE orders ADD COLUMN channel text"', desc: 'Primera fase de una migración compatible.', example: 'psql -c "ALTER TABLE orders ADD COLUMN channel text"\n# backfill, deploy, luego quitar la columna vieja' }
      ],
      labIds: ['lab-lpi701-arq'],
      challenge: {
        prompt: 'Diseñá la API de un carrito de compras: recursos, verbos, códigos de error, idempotencia de pagos, dónde vive la sesión y cómo migrarías una columna sin downtime.',
        criteria: ['Recursos REST y verbos coherentes', 'Idempotencia explícita en pagos', 'Sesión fuera del proceso', 'Plan de migración en fases', 'Logs y métricas mencionados']
      },
      mistakes: [
        'Guardar la sesión en memoria y escalar a más de una réplica.',
        'Usar POST para operaciones que el cliente va a reintentar sin idempotencia.',
        'Cambiar el contrato de una API sin versión ni período de transición.',
        'Hacer un ALTER destructivo en el mismo deploy que el código nuevo.'
      ],
      mastery: [
        'Distinguís estado de sesión, token y dato de negocio.',
        'Justificás SOA, microservicios o monolito según equipo y escala.',
        'Presentás una migración de monolito por fases con riesgos concretos.'
      ],
      keyIdeas: ['REST', 'idempotencia', 'stateless', 'JWT vs sesión', '12-factor', 'immutable servers', 'database migrations']
    },
    {
      id: 'lpi701-plataformas', day: 2, title: 'Servicios de plataforma: storage, bases y colas',
      subtitle: '701.2 · S3, SQL/NoSQL, brokers, FaaS, CDN e IAM', minutes: 55, tags: ['cloud'], difficulty: 3,
      lpi: '701.2', lpiDomain: '701 · Software Engineering', track: 'lpi701',
      objectives: [
        'Elegir almacenamiento de objetos, bloque o base según el acceso.',
        'Distinguir SQL, NoSQL y series temporales con criterio de consulta.',
        'Explicar semántica de entrega de un broker y su efecto en la app.'
      ],
      theory: `Una aplicación moderna se arma con servicios gestionados. La pregunta de examen es siempre la misma: **qué garantiza cada servicio y cuánto cuesta operarlo**.

### Almacenamiento
- **Objetos (S3, GCS, Blob)**: buckets, claves, ACL o políticas, URLs prefirmadas, versionado y ciclo de vida. Ideal para archivos, backups y estáticos. No es un filesystem: no podés hacer append ni locking POSIX.
- **Bloque (EBS, discos)**: un volumen para una VM, baja latencia, se formatea.
- **Archivos (EFS, NFS)**: compartido entre varias máquinas.

### Bases de datos
**Relacionales** (PostgreSQL, MySQL/MariaDB): esquema, transacciones ACID, joins. **Clave-valor/caché** (Redis): latencia mínima, sesiones, colas simples. **Documentales** (MongoDB): esquema flexible. **Series temporales** (InfluxDB, Prometheus): métricas con retención. **Búsqueda** (Elasticsearch/OpenSearch): texto completo, no fuente de verdad. La elección se hace por patrón de consulta y consistencia, no por moda.

### Mensajería
Un **broker** (Kafka, RabbitMQ, MQTT) desacopla productor y consumidor. Semánticas: **at-most-once** (puede perder), **at-least-once** (puede duplicar, exige consumidor idempotente) y **exactly-once** (costosa y limitada al ecosistema). Kafka conserva un log particionado con consumer groups; MQTT es para dispositivos con conexiones intermitentes. Un mensaje sin dead-letter queue es un incidente esperando.

### Plataformas
IaaS (máquinas y red), PaaS (runtime administrado), SaaS (software terminado), FaaS (funciones por evento, con límites de tiempo y cold start). **CDN** cachea contenido cerca del usuario y descarga origen; hay que entender TTL e invalidación. **IAM** define identidad y permisos: roles para servicios, MFA para humanos, mínimo privilegio y credenciales de corta duración.

> Regla práctica: si necesitás joins y transacciones, relacional; si necesitás latencia de milisegundos para una clave, caché; si son archivos, objetos; si necesitás desacoplar picos, cola.`,
      realWorld: 'Un bucket público con datos de clientes o una cola sin DLQ son hallazgos que aparecen en cualquier auditoría. Elegir el servicio correcto también es una decisión de seguridad y costo.',
      commands: [
        { cmd: 'aws s3 ls s3://mi-bucket --recursive --summarize', desc: 'Inventario y tamaño de objetos.', example: 'aws s3 ls s3://mi-bucket --recursive --summarize | tail -3' },
        { cmd: 'aws s3 presign s3://mi-bucket/informe.pdf --expires-in 900', desc: 'URL temporal sin hacer público el objeto.', example: 'aws s3 presign s3://mi-bucket/informe.pdf --expires-in 900' },
        { cmd: 'psql -h db -U app -c "select count(*) from orders"', desc: 'Consulta relacional típica.', example: 'psql -h db -U app -d ventas -c "select status, count(*) from orders group by 1"' },
        { cmd: 'redis-cli -h cache ping && redis-cli -h cache ttl session:42', desc: 'Verificar caché y expiración de sesión.', example: 'redis-cli -h cache ping\nredis-cli -h cache ttl session:42' },
        { cmd: 'kafka-topics --bootstrap-server broker:9092 --list', desc: 'Topics disponibles (awareness de brokers).', example: 'kafka-topics --bootstrap-server broker:9092 --describe --topic pedidos' }
      ],
      labIds: ['lab-lpi701-plataformas'],
      challenge: {
        prompt: 'Para una app de pedidos con picos de tráfico, elegí y justificá: almacenamiento de imágenes, base transaccional, caché de sesiones, cola de eventos y CDN. Indicá qué pasa si el consumidor recibe un mensaje duplicado.',
        criteria: ['Objetos para imágenes con URL prefirmada', 'Base relacional para pedidos', 'Caché para sesión', 'Cola con DLQ y consumidor idempotente', 'CDN con TTL e invalidación']
      },
      mistakes: [
        'Usar un bucket como filesystem compartido para una base de datos.',
        'Elegir NoSQL para reportes con joins complejos.',
        'Asumir exactly-once sin diseñar idempotencia.',
        'Guardar credenciales de larga duración en la app en lugar de un rol.'
      ],
      mastery: [
        'Elegís el servicio por patrón de acceso y consistencia.',
        'Explicás la diferencia entre at-least-once y exactly-once con un caso.',
        'Diseñás IAM con roles y credenciales temporales.'
      ],
      keyIdeas: ['object storage', 'buckets', 'ACL', 'ACID', 'NoSQL', 'at-least-once', 'DLQ', 'FaaS', 'CDN', 'IAM']
    },
    {
      id: 'lpi701-licencias', day: 2, title: 'Composición, licencias y open source',
      subtitle: '701.5 · Dependencias, copyleft y SBOM', minutes: 40, tags: ['sec'], difficulty: 2,
      lpi: '701.5', lpiDomain: '701 · Software Engineering', track: 'lpi701',
      objectives: [
        'Distinguir licencias permisivas de copyleft y sus obligaciones.',
        'Auditar las dependencias de un proyecto y generar un SBOM.',
        'Detectar incompatibilidades de licencia antes de distribuir.'
      ],
      theory: `Una aplicación moderna es en su mayoría código de terceros. El objetivo 701.5 pide entender **cómo se combinan componentes** y qué obligaciones genera cada licencia.

### Permisivas vs copyleft
- **MIT y BSD**: permisivas. Se puede usar, modificar y distribuir en software propietario conservando el aviso de copyright.
- **Apache 2.0**: permisiva, agrega concesión explícita de patentes y requiere avisos.
- **GPL v2/v3**: copyleft fuerte. Si distribuís un binario que incorpora código GPL, debés entregar el código fuente bajo GPL.
- **LGPL**: copyleft débil para bibliotecas; permite enlazar desde propietario si se respetan condiciones de reemplazo.
- **AGPL**: cierra el hueco del SaaS: si el software se usa por red, también hay obligación de ofrecer el fuente.

La **compatibilidad** no es obvia: Apache 2.0 con GPLv2 es problemática; MIT dentro de GPL es válida. Multilicencia (una versión GPL y otra comercial) es un modelo de negocio, no una licencia libre.

### Inventario y SBOM
Un **SBOM** (SPDX o CycloneDX) lista componentes, versiones y licencias. Se genera con la herramienta del ecosistema: npm, gradle, composer, syft. Sirve para responder en minutos "¿tenemos log4j?" o "¿qué licencias distribuye este release?". Las licencias se auditan en CI y el resultado se archiva con el artefacto.

### Dependencias
Los gestores (npm, Maven/Gradle, Composer, pip) resuelven versiones transitivas. Un lockfile fija el árbol exacto y hace builds reproducibles. Las dependencias sin mantenimiento son riesgo de seguridad y de licencia: se revisan en cada actualización, no una vez al año.

> Un error caro: copiar un fragmento de Stack Overflow con licencia incompatible dentro de código propietario. La auditoría de licencias no es burocracia: es parte de la entrega.`,
      realWorld: 'En una due diligence, el comprador pide el SBOM y el listado de licencias. Un proyecto sin inventario tarda semanas en responder y puede bloquear la operación.',
      commands: [
        { cmd: 'npm ls --all --depth=2', desc: 'Árbol de dependencias y versiones.', example: 'npm ls --all --depth=2 | head -40' },
        { cmd: 'npx license-checker --summary', desc: 'Resumen de licencias del árbol npm.', example: 'npx license-checker --summary --production' },
        { cmd: 'syft dir:. -o spdx-json > sbom.json', desc: 'Genera un SBOM en formato SPDX.', example: 'syft dir:. -o spdx-json > sbom.json' },
        { cmd: 'composer licenses --format=json', desc: 'Licencias de un proyecto PHP.', example: 'composer licenses --format=json | jq' },
        { cmd: 'gradle dependencies --configuration runtimeClasspath', desc: 'Dependencias transitivas en Java.', example: 'gradle dependencies --configuration runtimeClasspath' }
      ],
      labIds: ['lab-lpi701-licencias'],
      challenge: {
        prompt: 'Elegí un proyecto real tuyo, generá su SBOM, listá las licencias de producción y marcá qué pasaría si lo distribuyeras como SaaS propietario. Indicá al menos una dependencia problemática o justificá por qué no hay.',
        criteria: ['SBOM generado y guardado', 'Listado de licencias de producción', 'Análisis de copyleft vs permisiva', 'Conclusión sobre distribución o SaaS', 'Acción concreta para una licencia incompatible']
      },
      mistakes: [
        'Confundir open source con ausencia de obligaciones.',
        'Revisar solo dependencias directas y no las transitivas.',
        'Asumir que AGPL no aplica porque no se distribuye el binario.',
        'No fijar versiones con lockfile y perder reproducibilidad.'
      ],
      mastery: [
        'Clasificás una licencia como permisiva, copyleft débil o fuerte.',
        'Generás y leés un SBOM sin ayuda.',
        'Detectás un conflicto de licencias antes de distribuirlo.'
      ],
      keyIdeas: ['MIT/BSD', 'Apache 2.0', 'GPL/LGPL/AGPL', 'copyleft', 'SBOM', 'SPDX', 'CycloneDX', 'lockfile']
    },
    {
      id: 'lpi703-helm', day: 4, title: 'Helm, Kustomize y entrega en Kubernetes',
      subtitle: '703.3 · Charts, releases, values y GitOps', minutes: 50, tags: ['k8s'], difficulty: 3,
      lpi: '703.3', lpiDomain: '703 · Kubernetes', track: 'lpi703',
      objectives: [
        'Explicar chart, release, values y revisiones de Helm.',
        'Instalar, actualizar y revertir software con Helm sin romper producción.',
        'Diferenciar Helm de Kustomize y ubicar Argo CD o Flux en GitOps.'
      ],
      theory: `Los manifiestos YAML sueltos no escalan para instalar software de terceros ni para manejar entornos. **Helm** empaqueta Kubernetes en un **chart**: plantillas Go, values.yaml con defaults, Chart.yaml con versión y dependencias, y hooks. Instalar un chart crea un **release** con nombre y namespace; cada upgrade genera una revisión que se puede revertir.

### Flujo
\`helm repo add\` + \`helm repo update\` para el catálogo. \`helm install web repo/chart -f values.yaml -n prod\` instala; \`helm upgrade --install\` es idempotente en CI (instala si no existe, actualiza si existe) y con \`--atomic --wait\` revierte solo si falla. \`helm template\` renderiza localmente sin tocar el clúster, \`helm lint\` valida el chart y \`helm rollback\` vuelve a una revisión. \`helm uninstall\` borra el release, no los PVC por defecto.

### Values y secretos
Los values sobrescriben los defaults; en producción se versionan por entorno y se pasan por archivo. Los secretos no van en values.yaml del repo: se usan External Secrets, Sealed Secrets o un gestor. \`--set\` es cómodo para probar y peligroso para producción (queda en el historial).

### Kustomize y GitOps
**Kustomize** no usa plantillas: superpone capas (base + overlays) con kustomization.yaml. Es nativo de kubectl (-k) y encaja cuando el equipo quiere YAML plano. **Helm** encaja para software de terceros y parametrización compleja. **Argo CD** y **Flux** son controladores GitOps: el estado deseado vive en Git y el clúster se reconcilia solo; el deploy es un merge, el rollback es un revert.

> Pregunta típica: "¿Helm o Kustomize?" Respuesta madura: Helm para empaquetar y distribuir, Kustomize para variaciones de entorno sobre manifiestos propios; se pueden combinar.`,
      realWorld: 'Un helm upgrade sin --atomic en producción puede dejar la app a medias si el rollout falla. El botón de rollback de Helm es la diferencia entre un incidente de minutos y uno de horas.',
      commands: [
        { cmd: 'helm repo add bitnami https://charts.bitnami.com/bitnami && helm repo update', desc: 'Agrega y actualiza un repositorio de charts.', example: 'helm repo add bitnami https://charts.bitnami.com/bitnami\nhelm repo update' },
        { cmd: 'helm install web bitnami/nginx -f values.yaml -n prod --create-namespace', desc: 'Instala un release con values propios.', example: 'helm install web bitnami/nginx -f values-prod.yaml -n prod --create-namespace' },
        { cmd: 'helm upgrade --install web bitnami/nginx -f values.yaml --atomic --wait', desc: 'Actualiza de forma idempotente y con rollback automático.', example: 'helm upgrade --install web bitnami/nginx -f values-prod.yaml --atomic --wait --timeout 5m' },
        { cmd: 'helm template web bitnami/nginx -f values.yaml', desc: 'Renderiza manifiestos sin aplicar.', example: 'helm template web bitnami/nginx -f values-prod.yaml > rendered.yaml' },
        { cmd: 'helm history web -n prod && helm rollback web 1 -n prod', desc: 'Ver revisiones y volver a una anterior.', example: 'helm history web -n prod\nhelm rollback web 1 -n prod' },
        { cmd: 'kustomize build overlays/prod | kubectl apply -f -', desc: 'Alternativa sin plantillas para variaciones de entorno.', example: 'kubectl apply -k overlays/prod' }
      ],
      labIds: ['lab-helm'],
      challenge: {
        prompt: 'Escribí un values.yaml para desplegar una app con 2 réplicas, imagen fijada por tag, resources y un Ingress. Mostrá los comandos de install, upgrade con --atomic y rollback, y explicá dónde guardarías los secretos.',
        criteria: ['values.yaml con replicaCount, image y resources', 'helm upgrade --install con --atomic', 'helm history y rollback', 'Secretos fuera del values del repo', 'Diferencia con Kustomize explicada']
      },
      mistakes: [
        'Usar --set para secretos y dejarlos en el historial de shell o CI.',
        'Actualizar sin --atomic y dejar el release a medias.',
        'Editar recursos creados por Helm a mano: el siguiente upgrade los pisa.',
        'Confundir helm uninstall con borrar el namespace y los PVC.'
      ],
      mastery: [
        'Explicás chart, release, revision y values sin confundirlos.',
        'Elegís Helm o Kustomize según el caso y lo justificás.',
        'Diseñás un flujo GitOps con Argo CD o Flux y rollback por revert.'
      ],
      keyIdeas: ['chart', 'release', 'values.yaml', 'helm upgrade --install', '--atomic', 'helm rollback', 'Kustomize', 'Argo CD', 'Flux']
    },
    {
      id: 'lpi704-logs', day: 5, title: 'Gestión y análisis de logs',
      subtitle: '704.3 · journald, shippers, Loki/ELK y retención', minutes: 45, tags: ['obs'], difficulty: 2,
      lpi: '704.3', lpiDomain: '704 · Security and Observability', track: 'lpi704',
      objectives: [
        'Describir el pipeline de logs: recolectar, enviar, almacenar, consultar.',
        'Elegir entre Loki y Elasticsearch/OpenSearch según consulta y costo.',
        'Definir retención, estructura y protección de datos sensibles.'
      ],
      theory: `Los logs son eventos discretos. A diferencia de las métricas, permiten reconstruir **qué pasó exactamente** en una request. El problema no es generarlos: es almacenarlos sin arruinar el presupuesto ni exponer datos personales.

### Fuentes y recolección
En Linux conviven **syslog** (/var/log/syslog, auth.log, nginx/) y **journald**. journald captura stdout/stderr de servicios y metadatos (unidad, PID, prioridad); se consulta con journalctl y puede exportarse en JSON. En contenedores, el estándar es escribir a stdout/stderr y dejar que el runtime rote; meter logs en archivos internos del contenedor es un antipatrón.

### Pipeline
1. **Shipper/agente**: Filebeat, Fluent Bit, Vector o Promtail leen archivos o el journal y envían.
2. **Transporte y buffer**: cola para tolerar caídas del backend.
3. **Almacenamiento e índice**: Elasticsearch/OpenSearch indexa todo el texto (búsqueda potente, costo alto); Loki indexa solo labels y guarda el contenido comprimido (barato, consulta por labels y tiempo); Graylog ofrece búsqueda sobre MongoDB/OpenSearch.
4. **Visualización**: Kibana o Grafana.
5. **Alertas y retención**: reglas sobre patrones y políticas por antigüedad.

### Diseño práctico
Logs **estructurados en JSON** con timestamp, level, service, trace_id, request_id y user_id (seudonimizado). Sin estructura, grep no escala. No loguear tokens, contraseñas, tarjetas ni datos personales completos. Niveles coherentes: DEBUG en desarrollo, INFO en producción, ERROR con contexto. Retención por valor: 7–30 días en caliente, archivo comprimido para auditoría. La **cardinalidad** de labels es el enemigo del costo: nunca pongas user_id o request_id como label en Loki.

> Un log sin correlación entre servicios es una novela sin nombres. trace_id en todos los logs convierte una investigación de horas en una consulta.`,
      realWorld: 'Una app que loguea el body completo de cada request en producción puede duplicar el costo de observabilidad y filtrar datos personales. Loguear bien es una decisión de arquitectura.',
      commands: [
        { cmd: 'journalctl -u api -o json --since "10 min ago" | jq .MESSAGE', desc: 'Logs de una unidad en JSON procesable.', example: 'journalctl -u api -o json --since "10 min ago" | jq -r .MESSAGE' },
        { cmd: 'logger -p local0.info "prueba de syslog"', desc: 'Escribe un evento de prueba en syslog.', example: 'logger -p local0.info -t miapp "pedido creado id=42"' },
        { cmd: 'fluent-bit -c fluent-bit.conf --dry-run', desc: 'Valida configuración de un shipper.', example: 'fluent-bit -c /etc/fluent-bit/fluent-bit.conf --dry-run' },
        { cmd: 'curl -s -H "Content-Type: application/json" -X POST http://loki:3100/loki/api/v1/push -d @payload.json', desc: 'Envío directo a Loki (API).', example: 'curl -s -X POST http://loki:3100/loki/api/v1/push -H "Content-Type: application/json" -d @payload.json' },
        { cmd: 'kubectl logs deploy/api --since=15m --tail=200 | jq -c', desc: 'Logs de Kubernetes filtrados por tiempo.', example: 'kubectl logs deploy/api --since=15m | grep -i error' }
      ],
      labIds: ['lab-logs-stack'],
      challenge: {
        prompt: 'Diseñá el pipeline de logs de una API en Kubernetes: agente, backend, visualización, retención y campos obligatorios. Explicá qué dato NO loguearías y por qué.',
        criteria: ['Agente (Fluent Bit/Filebeat/Promtail)', 'Backend elegido con justificación', 'Campos estructurados y trace_id', 'Retención y costo', 'Datos sensibles excluidos']
      },
      mistakes: [
        'Loguear credenciales, tokens o datos personales completos.',
        'Escribir logs a archivos dentro del contenedor y perderlos al reiniciar.',
        'Usar user_id como label de Loki y disparar la cardinalidad.',
        'Guardar todo para siempre sin política de retención.'
      ],
      mastery: [
        'Diagramás el pipeline completo sin mirar apuntes.',
        'Elegís Loki o Elasticsearch según consulta y presupuesto.',
        'Definís un esquema de log estructurado y seguro.'
      ],
      keyIdeas: ['journald', 'syslog', 'Fluent Bit', 'Promtail', 'Loki', 'Elasticsearch', 'retención', 'trace_id', 'cardinalidad']
    },
    {
      id: 'lpi704-tracing', day: 5, title: 'Trazas distribuidas y OpenTelemetry',
      subtitle: '704.4 · Spans, contexto y muestreo', minutes: 40, tags: ['obs'], difficulty: 3,
      lpi: '704.4', lpiDomain: '704 · Security and Observability', track: 'lpi704',
      objectives: [
        'Explicar trace, span y propagación de contexto entre servicios.',
        'Instrumentar una aplicación con OpenTelemetry y exportar a Jaeger o Tempo.',
        'Elegir una estrategia de muestreo y justificar su costo.'
      ],
      theory: `Una **traza** es el recorrido completo de una request por varios servicios. Se compone de **spans**: unidades de trabajo con nombre, inicio, duración, atributos, eventos, estado y relaciones padre-hijo. El **trace_id** es común a todos los spans; el **span_id** identifica cada uno. Ese par es lo que permite unir logs, métricas y trazas.

### Propagación de contexto
El contexto viaja en headers. El estándar W3C **traceparent** incluye versión, trace_id, span_id y flags de muestreo. Si el gateway genera la traza pero el servicio B no propaga el header, la traza se corta y no sirve. Instrumentación automática (agentes) cubre HTTP, gRPC y bases; la manual agrega spans de negocio ("cobrar pedido") que es donde está el valor.

### OpenTelemetry
OTel es el estándar de facto: API + SDK por lenguaje + **Collector** (receives, processors, exporters). El Collector desacopla la app del backend: la app exporta OTLP y el Collector decide a qué destino (Tempo, Jaeger, un vendor). Procesadores típicos: batch, memory_limiter, atributos y sampling por cola.

### Muestreo
Guardar el 100% de las trazas es caro. **Head sampling** decide al inicio (simple, puede perder trazas lentas); **tail sampling** decide al final del collector (conserva errores y latencias altas, requiere buffer). La estrategia madura: muestreo bajo por defecto, 100% en errores y una fracción de las requests lentas.

### Uso
En un incidente, la traza responde "¿dónde se fue el tiempo?": la suma de spans muestra el cuello de botella y el span con error muestra la causa. Sin trazas, en microservicios solo tenés hipótesis.

> Métricas te dicen que algo está mal; logs te dicen qué pasó; trazas te dicen dónde. Un sistema sin trazas es un sistema a ciegas entre servicios.`,
      realWorld: 'Un p95 alto en el gateway con CPU normal suele ser una dependencia lenta. La traza muestra si el tiempo se fue en la base, en un reintento o en una llamada externa sin timeout.',
      commands: [
        { cmd: 'otelcol --config=/etc/otel/config.yaml', desc: 'Inicia el OpenTelemetry Collector.', example: 'otelcol --config=/etc/otel/config.yaml' },
        { cmd: 'curl -H "traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01" https://api.local/v1/orders', desc: 'Propaga contexto en una prueba manual.', example: 'curl -H "traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01" https://api.local/v1/orders' },
        { cmd: 'kubectl logs deploy/api | grep trace_id', desc: 'Correlaciona logs con la traza.', example: 'kubectl logs deploy/api | grep 4bf92f3577b34da6a3ce929d0e0e4736' },
        { cmd: 'curl -s "http://jaeger:16686/api/traces?service=api&limit=20" | jq', desc: 'Consulta la API de Jaeger.', example: 'curl -s "http://jaeger:16686/api/traces?service=api&limit=20" | jq ".data[0].traceID"' },
        { cmd: 'tempo-cli query trace 4bf92f3577b34da6', desc: 'Consulta una traza en Grafana Tempo (awareness).', example: 'tempo-cli query trace 4bf92f3577b34da6a3ce929d0e0e4736' }
      ],
      labIds: ['lab-tracing'],
      challenge: {
        prompt: 'Instrumentá un flujo de dos servicios (gateway → api → db) con spans, propagación traceparent y muestreo. Explicá qué span agregarías para el negocio y cómo encontrarías el cuello de botella.',
        criteria: ['trace_id y span_id explicados', 'traceparent propagado entre servicios', 'Span de negocio además del HTTP', 'Estrategia de muestreo justificada', 'Backend Tempo o Jaeger elegido']
      },
      mistakes: [
        'Generar un trace_id nuevo en cada servicio y romper la traza.',
        'Muestrear 100% en producción y multiplicar el costo.',
        'Instrumentar solo HTTP y no las llamadas a base o colas.',
        'Guardar atributos con datos personales en los spans.'
      ],
      mastery: [
        'Explicás trace, span y contexto con un diagrama mental.',
        'Diseñás muestreo por cola que conserva errores y latencias.',
        'Usás una traza para ubicar el cuello de botella en 2 minutos.'
      ],
      keyIdeas: ['trace', 'span', 'trace_id', 'span_id', 'traceparent', 'OpenTelemetry', 'Collector', 'head/tail sampling', 'Tempo', 'Jaeger']
    },
    {
      id: 'tf-equipo', day: 4, title: 'Terraform en equipo: state, módulos y CI',
      subtitle: 'Backend remoto, lock, workspaces y drift', minutes: 50, tags: ['terraform'], difficulty: 3,
      lpi: 'Terraform · complemento', lpiDomain: 'IaC · Terraform', track: 'terraform',
      objectives: [
        'Configurar un backend remoto con bloqueo para evitar applies concurrentes.',
        'Organizar módulos y entornos sin duplicar configuración.',
        'Integrar plan revisado en CI y detectar drift con evidencia.'
      ],
      theory: `Terraform en una laptop es un ejercicio; Terraform en equipo es un sistema de control de cambios. La diferencia está en el **state**, la revisión del plan y la reproducibilidad.

### State remoto y lock
El state mapea recursos declarados con IDs reales. En equipo va en un backend remoto: S3 + DynamoDB (lock), Azure Storage, GCS o Terraform Cloud. El backend se configura con \`terraform init -backend-config=backend.hcl\` y el lock evita que dos applies simultáneos corrompan el state. El bucket debe tener versionado y cifrado; el state puede contener datos sensibles aunque no se commitee.

### Entornos y módulos
Dos estrategias válidas: **un state por entorno** (carpetas con backend distinto, recomendado para aislar producción) o **workspaces** (\`terraform workspace select prod\`) cuando la infraestructura es idéntica. Los **módulos** encapsulan patrones (red, base, servicio) con variables, outputs y version pinneada. Un módulo sin versión es una bomba de tiempo.

### CI y revisión
El pipeline corre \`fmt -check\`, \`validate\`, \`plan -out=tfplan\`, publica el plan y espera aprobación para \`apply tfplan\`. Así se aplica exactamente lo revisado. \`plan -detailed-exitcode\` devuelve 2 cuando hay cambios, útil para detectar drift programado. El apply automático sin revisión en producción es una decisión que se justifica solo con guardrails y entornos desechables.

### Drift, import y refactor
El **drift** es la diferencia entre state y realidad (alguien cambió la consola). Se detecta con un plan periódico y se corrige aplicando o importando. \`terraform import\` adopta un recurso existente; los bloques \`moved\` permiten renombrar recursos sin destruirlos. Los secretos no van en .tfvars versionados: se inyectan desde el backend de secretos o variables del CI.

> La pregunta de entrevista no es "¿sabés terraform apply?" sino "¿cómo evitás que dos personas rompan producción el mismo viernes?". La respuesta es state remoto, lock, plan revisado y apply desde CI.`,
      realWorld: 'Un state local compartido por chat es la forma más rápida de destruir una base de datos. El lock y el plan revisado son controles, no burocracia.',
      commands: [
        { cmd: 'terraform init -backend-config=backend.hcl', desc: 'Inicializa con backend remoto separado por entorno.', example: 'terraform init -backend-config=envs/prod/backend.hcl' },
        { cmd: 'terraform workspace list && terraform workspace select prod', desc: 'Cambia de workspace con state aislado.', example: 'terraform workspace list\nterraform workspace select prod' },
        { cmd: 'terraform plan -out=tfplan -detailed-exitcode; echo $?', desc: 'Exit 2 indica cambios pendientes (drift o nuevos recursos).', example: 'terraform plan -out=tfplan -detailed-exitcode; echo "exit=$?"' },
        { cmd: 'terraform import aws_instance.web i-0abc123', desc: 'Adopta un recurso existente en el state.', example: 'terraform import aws_instance.web i-0abc123\nterraform plan' },
        { cmd: 'terraform state mv aws_instance.web aws_instance.api', desc: 'Renombra sin destruir (o usá un bloque moved).', example: 'terraform state mv aws_instance.web aws_instance.api' },
        { cmd: 'terraform fmt -check -recursive && terraform validate', desc: 'Chequeos de CI antes del plan.', example: 'terraform fmt -check -recursive\nterraform validate' }
      ],
      labIds: ['lab-terraform-team'],
      challenge: {
        prompt: 'Escribí el backend.hcl y la estructura de dos entornos (staging/prod) con un módulo versionado. Mostrá el pipeline de CI con fmt, validate y plan aprobado, y explicá cómo detectarías drift.',
        criteria: ['Backend remoto con lock', 'Un state por entorno', 'Módulo con source y version', 'Plan guardado y aplicado en CI', 'Detección de drift con detailed-exitcode']
      },
      mistakes: [
        'Commitear terraform.tfstate o credenciales.',
        'Aplicar en CI sin revisar el plan o sin aprobación en producción.',
        'Compartir un state entre entornos y destruir staging junto con prod.',
        'Usar módulos sin versión y romper el plan en el peor momento.'
      ],
      mastery: [
        'Explicás state, lock y backend como un sistema de control.',
        'Estructurás módulos y entornos sin duplicar código.',
        'Diagnosticás drift y lo corregís sin recrear recursos.'
      ],
      keyIdeas: ['backend remoto', 'DynamoDB lock', 'workspaces', 'módulos versionados', 'plan revisado', 'detailed-exitcode', 'drift', 'import', 'moved']
    }
  ];

  /* Alineación con LPI DevOps Tools Engineer 701-200 v2.0 y complementos.
     Formato: [objetivo, dominio, track]. */
  var trackMap = {
    'd1-arquitectura': ['LFCS 1.1', 'LFCS · Essential Commands', 'lfcs'],
    'd1-permisos': ['LFCS 1.4', 'LFCS · Users and Groups', 'lfcs'],
    'd1-procesos': ['LFCS 2.1', 'LFCS · Operation of Running Systems', 'lfcs'],
    'd1-texto': ['LFCS 1.2', 'LFCS · Essential Commands', 'lfcs'],
    'd1-redes': ['LFCS 1.5', 'LFCS · Networking', 'lfcs'],
    'lfcs-storage': ['LFCS 3.1', 'LFCS · Storage Management', 'lfcs'],
    'lfcs-systemd': ['LFCS 2.2', 'LFCS · Operation of Running Systems', 'lfcs'],
    'lpi701-arq': ['701.1', '701 · Software Engineering', 'lpi701'],
    'lpi701-plataformas': ['701.2', '701 · Software Engineering', 'lpi701'],
    'd3-cloud': ['701.2', '701 · Software Engineering', 'lpi701'],
    'd1-git': ['701.3', '701 · Software Engineering', 'lpi701'],
    'd2-cicd': ['701.4', '701 · Software Engineering', 'lpi701'],
    'd2-actions': ['701.4', '701 · Software Engineering', 'lpi701'],
    'lpi701-licencias': ['701.5', '701 · Software Engineering', 'lpi701'],
    'd2-contenedores': ['702.1', '702 · Application Container', 'lpi702'],
    'd2-compose': ['702.2', '702 · Application Container', 'lpi702'],
    'd2-imagenes': ['702.3', '702 · Application Container', 'lpi702'],
    'd2-registries': ['702.3', '702 · Application Container', 'lpi702'],
    'd3-k8s-arq': ['703.1', '703 · Kubernetes', 'lpi703'],
    'd3-k8s-workloads': ['703.2', '703 · Kubernetes', 'lpi703'],
    'lpi703-helm': ['703.3', '703 · Kubernetes', 'lpi703'],
    'd4-devsecops': ['704.1', '704 · Security and Observability', 'lpi704'],
    'd4-observabilidad': ['704.2', '704 · Security and Observability', 'lpi704'],
    'lpi704-logs': ['704.3', '704 · Security and Observability', 'lpi704'],
    'lpi704-tracing': ['704.4', '704 · Security and Observability', 'lpi704'],
    'd4-troubleshooting': ['704 · transversal', '704 · Security and Observability', 'lpi704'],
    'd4-entrevista': ['704 · transversal', '704 · Security and Observability', 'lpi704'],
    'd3-terraform': ['Terraform · fundamentos', 'IaC · Terraform', 'terraform'],
    'tf-equipo': ['Terraform · equipo', 'IaC · Terraform', 'terraform']
  };

  extraModules.forEach(function (m) { window.COURSE.modules.push(m); });

  window.COURSE.modules.forEach(function (m) {
    var t = trackMap[m.id];
    if (t) {
      m.lpi = m.lpi || t[0];
      m.lpiDomain = m.lpiDomain || t[1];
      m.track = m.track || t[2];
    }
  });

  window.COURSE.cheatsheets.push({
    id: 'cheat-lpi',
    title: 'Chuleta · LPI 701-200 en una página',
    body:
'### Dominios y peso (examen de 60 preguntas)\n' +
'| Dominio | Peso | Objetivos |\n' +
'| --- | --- | --- |\n' +
'| 701 Software Engineering | 20 | 701.1 diseño, 701.2 plataformas, 701.3 Git, 701.4 CI/CD, 701.5 licencias |\n' +
'| 702 Application Container | 13 | 702.1 Docker/Podman, 702.2 Compose, 702.3 imágenes OCI |\n' +
'| 703 Kubernetes | 13 | 703.1 arquitectura, 703.2 operación, 703.3 Helm |\n' +
'| 704 Security & Observability | 14 | 704.1 seguridad, 704.2 Prometheus, 704.3 logs, 704.4 trazas |\n\n' +
'### Si el tiempo aprieta\n' +
'1. 703.2 y 701.1 son los de mayor peso: operación de Kubernetes y diseño de servicios.\n' +
'2. 704.2 Prometheus (peso 6) y 701.3 Git (peso 6) rinden más que 704.4 (peso 2).\n' +
'3. Practicá comandos, no solo definiciones: el examen es multiple choice y fill-in-the-blank.\n\n' +
'### Comandos que aparecen seguido\n' +
'~~~\n' +
'kubectl get pods -A; kubectl describe pod; kubectl logs --previous\n' +
'kubectl apply -f; kubectl rollout undo deployment/app\n' +
'helm install/upgrade --install --atomic; helm rollback\n' +
'docker run/exec/logs; docker build; docker compose up -d\n' +
'git switch -c; git add -p; git rebase; git revert\n' +
'busybox/promtool query instant; journalctl -u; systemctl enable --now\n' +
'~~~\n\n' +
'### Complementos de esta plataforma\n' +
'- **LFCS** cubre la base práctica que el examen asume (LPIC-1).\n' +
'- **Terraform** es IaC de equipo: no está en 701-200 v2.0, pero se pregunta en entrevistas y en el trabajo diario.\n' +
'- **Kubernetes extendido** incluye PVC, workloads y GitOps además de los objetivos 703.1-703.3.'
  });
})();
