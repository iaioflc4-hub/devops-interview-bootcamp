/* Terminal LINUX SIMULADA.
   IMPORTANTE: no ejecuta comandos reales. Implementa un filesystem virtual,
   servicios ficticios y un subconjunto de comandos para practicar sin riesgo. */
window.SimTerminal = (function () {
  var ACCESS = (function () {
    var ips = ['10.0.0.5', '10.0.0.7', '192.168.1.20', '203.0.113.44', '198.51.100.9'];
    var paths = ['/api/users', '/api/orders', '/login', '/health', '/static/app.js', '/api/payments'];
    var codes = [200, 200, 200, 200, 301, 404, 500, 502, 502, 503];
    var lines = [];
    for (var i = 0; i < 200; i++) {
      var ip = ips[i % ips.length === 0 ? 3 : i % ips.length];
      var code = codes[i % codes.length];
      var p = paths[i % paths.length];
      var size = 120 + (i * 37) % 4000;
      lines.push(ip + ' - - [05/Nov/2026:0' + (i % 9) + ':' + String(i % 60).padStart(2, '0') + ':11 +0000] "GET ' + p + ' HTTP/1.1" ' + code + ' ' + size + ' "-" "Mozilla/5.0"');
    }
    return lines.join('\n');
  })();

  function file(content, mode, owner, group) {
    return { type: 'f', content: content, mode: mode || '-rw-r--r--', owner: owner || 'root', group: group || 'root' };
  }
  function dir(children) { return { type: 'd', children: children || {}, mode: 'drwxr-xr-x', owner: 'root', group: 'root' }; }

  var services = {
    nginx: { active: true, pid: 4242, desc: 'A high performance web server' },
    ssh: { active: true, pid: 918, desc: 'OpenBSD Secure Shell server' },
    miapp: { active: false, pid: 0, desc: 'API Node.js del bootcamp' },
    cron: { active: true, pid: 640, desc: 'Regular background program processing daemon' }
  };

  var processes = [
    { pid: 1, user: 'root', cpu: 0.0, mem: 0.1, stat: 'Ss', cmd: '/sbin/init' },
    { pid: 812, user: 'www-data', cpu: 0.1, mem: 0.4, stat: 'Ss', cmd: 'nginx: master process' },
    { pid: 4242, user: 'www-data', cpu: 0.0, mem: 0.3, stat: 'S', cmd: 'nginx: worker process' },
    { pid: 918, user: 'root', cpu: 0.0, mem: 0.2, stat: 'Ss', cmd: 'sshd: /usr/sbin/sshd -D' },
    { pid: 5150, user: 'student', cpu: 99.7, mem: 2.1, stat: 'R', cmd: 'python3 loop_infinito.py' },
    { pid: 1200, user: 'student', cpu: 0.2, mem: 0.6, stat: 'S', cmd: 'bash' }
  ];

  var images = [
    { repo: 'nginx', tag: '1.27', size: '192MB' },
    { repo: 'postgres', tag: '16-alpine', size: '243MB' },
    { repo: 'miapp', tag: '1.0', size: '154MB' }
  ];
  var containers = [
    { name: 'web', image: 'nginx:1.27', status: 'Up 2 hours', ports: '0.0.0.0:8080->80/tcp' },
    { name: 'db', image: 'postgres:16-alpine', status: 'Up 2 hours (healthy)', ports: '5432/tcp' }
  ];

  var pods = [
    { name: 'api-7d9f8c6b5f-2xk4p', ready: '0/1', status: 'CrashLoopBackOff', restarts: 7, age: '6m' },
    { name: 'web-6c8d7f9b4d-9m2qk', ready: '1/1', status: 'Running', restarts: 0, age: '2h' },
    { name: 'db-0', ready: '1/1', status: 'Running', restarts: 0, age: '26h' }
  ];

  function makeFS() {
    return dir({
      bin: dir({}),
      etc: dir({
        'os-release': file('PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"\nNAME="Debian GNU/Linux"\nVERSION_ID="12"\nVERSION="12 (bookworm)"\nID=debian\nHOME_URL="https://www.debian.org/"'),
        hostname: file('debian-lab\n'),
        hosts: file('127.0.0.1\tlocalhost\n127.0.1.1\tdebian-lab\n10.0.0.10\tdb.internal\n10.0.0.11\tapi.internal\n'),
        'resolv.conf': file('nameserver 10.0.0.2\nnameserver 1.1.1.1\noptions edns0\n'),
        fstab: file('# <file system> <mount point> <type> <options> <dump> <pass>\nUUID=4a82b9e1-2314 /            ext4    errors=remount-ro 0  1\nUUID=9f8e7d6c-1234 none         swap    sw                0  0\n'),
        passwd: file('root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nstudent:x:1000:1000:Student:/home/student:/bin/bash\nana:x:1001:1001::/home/ana:/bin/bash\nbruno:x:1002:1002::/home/bruno:/bin/bash\n'),
        group: file('root:x:0:\nsudo:x:27:student\nwww-data:x:33:\nstudent:x:1000:\ndeploy:x:1003:student\ncompras:x:1004:bruno\nventas:x:1005:ana\n'),
        nginx: dir({
          'nginx.conf': file('user www-data;\nworker_processes auto;\nevents { worker_connections 768; }\nhttp {\n    include /etc/nginx/mime.types;\n    access_log /var/log/nginx/access.log;\n    error_log /var/log/nginx/error.log;\n    server {\n        listen 80;\n        server_name _;\n        location / { proxy_pass http://127.0.0.1:3000; }\n    }\n}\n'),
          'sites-enabled': dir({ default: file('server {\n    listen 80 default_server;\n    root /var/www/html;\n    index index.html;\n}\n') })
        }),
        ssh: dir({ sshd_config: file('Port 22\nPermitRootLogin no\nPasswordAuthentication yes\nPubkeyAuthentication yes\nUsePAM yes\n') }),
        systemd: dir({ system: dir({}) })
      }),
      home: dir({
        student: dir({
          'notes.txt': file('Objetivos de la semana:\n- Repasar permisos y SGID\n- Practicar pipelines de logs\n- Preparar el proyecto final\n'),
          projects: dir({ demo: dir({ 'README.md': file('# Demo\nProyecto de práctica para git.\n') }) }),
          docs: dir({})
        })
      }),
      opt: dir({ app: dir({ 'deploy.sh': file('#!/bin/bash\necho "deploy"\n', '-rw-r--r--') }) }),
      root: dir({}),
      srv: dir({ empresa: dir({ compras: dir({}), ventas: dir({}), compartido: dir({}) }) }),
      tmp: dir({}, 'drwxrwxrwt'),
      usr: dir({ bin: dir({}), local: dir({ bin: dir({}) }), share: dir({}) }),
      var: dir({
        log: dir({
          syslog: file('Nov  5 09:00:01 debian-lab systemd[1]: Started Daily apt download activities.\nNov  5 09:05:12 debian-lab sshd[918]: Server listening on 0.0.0.0 port 22.\nNov  5 09:12:44 debian-lab nginx[812]: 2026/11/05 09:12:44 [error] connect() failed while connecting to upstream 127.0.0.1:3000\nNov  5 09:20:00 debian-lab CRON[1201]: (root) CMD (/usr/local/bin/backup.sh)\n'),
          'auth.log': file('Nov  5 08:41:02 debian-lab sshd[918]: Failed password for invalid user admin from 203.0.113.44 port 51022 ssh2\nNov  5 08:41:04 debian-lab sshd[918]: Failed password for invalid user root from 203.0.113.44 port 51024 ssh2\nNov  5 08:41:09 debian-lab sshd[918]: Failed password for invalid user test from 203.0.113.44 port 51026 ssh2\nNov  5 08:55:10 debian-lab sshd[918]: Accepted publickey for student from 10.0.0.7 port 49876 ssh2\nNov  5 09:03:33 debian-lab sudo: student : TTY=pts/0 ; PWD=/home/student ; COMMAND=/bin/systemctl status nginx\n'),
          nginx: dir({
            'error.log': file('2026/11/05 09:12:44 [error] 812#812: *45 connect() failed (111: Connection refused) while connecting to upstream, upstream: "http://127.0.0.1:3000/api/health"\n2026/11/05 09:12:46 [error] 812#812: *46 connect() failed (111: Connection refused) while connecting to upstream\n'),
            'access.log': file(ACCESS)
          })
        }),
        www: dir({ html: dir({ 'index.html': file('<!doctype html><html><body><h1>Servidor de práctica</h1></body></html>\n') }) }),
        lib: dir({ mysql: dir({}) })
      }),
      dev: dir({ sda: dir({}), sdb: dir({}) })
    });
  }

  var fs = makeFS();
  var cwd = '/home/student';
  var history = [];
  var started = new Date();

  var COMMAND_NAMES = ['awk', 'cat', 'cd', 'chmod', 'chown', 'clear', 'cp', 'curl', 'cut', 'date', 'df', 'dig', 'docker', 'du', 'echo', 'env', 'find', 'free', 'git', 'grep', 'groups', 'head', 'help', 'history', 'hostname', 'id', 'journalctl', 'kill', 'kubectl', 'ls', 'mkdir', 'mv', 'nc', 'ping', 'ps', 'pwd', 'reset', 'rm', 'sed', 'sort', 'ss', 'sudo', 'systemctl', 'tail', 'tee', 'top', 'touch', 'uname', 'uniq', 'wc', 'which', 'whoami'];

  function editDistance(a, b) {
    var prev = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      var cur = [i];
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[b.length];
  }

  function suggestCommand(name) {
    var best = null, bestD = 3;
    COMMAND_NAMES.forEach(function (c) {
      var d = editDistance(name, c);
      if (d < bestD) { bestD = d; best = c; }
    });
    return bestD <= 2 ? best : null;
  }

  function commonPrefix(items) {
    if (!items.length) return '';
    var p = items[0];
    for (var i = 1; i < items.length; i++) {
      var j = 0;
      while (j < p.length && j < items[i].length && p[j] === items[i][j]) j++;
      p = p.slice(0, j);
    }
    return p;
  }

  function pathCandidates(fragment) {
    var slash = fragment.lastIndexOf('/');
    var dirPart = slash >= 0 ? fragment.slice(0, slash + 1) : '';
    var prefix = slash >= 0 ? fragment.slice(slash + 1) : fragment;
    var node = get(dirPart ? norm(cwd, dirPart) : cwd);
    if (!node || node.type !== 'd') return [];
    return Object.keys(node.children).filter(function (n) { return n.indexOf(prefix) === 0; }).sort().map(function (n) {
      return dirPart + n + (node.children[n].type === 'd' ? '/' : '');
    });
  }

  /* Autocompletado tipo bash: comando en la primera palabra, rutas después. */
  function complete(line) {
    line = line == null ? '' : String(line);
    if (line.indexOf('|') !== -1) return { line: line, options: [] };
    var endingSpace = /\s$/.test(line);
    var m = line.match(/^(.*?)(\S*)$/);
    var head = m[1], token = m[2];
    var options;
    if (!/\s/.test(line.trim()) && !endingSpace) {
      options = COMMAND_NAMES.filter(function (c) { return c.indexOf(token) === 0; });
      if (options.length === 1) return { line: options[0] + ' ', options: options };
    } else {
      options = pathCandidates(token).map(function (o) { return head + o; });
      if (options.length === 1) return { line: options[0], options: options };
    }
    if (!options.length) return { line: line, options: [] };
    return { line: commonPrefix(options), options: options };
  }

  function reset() {
    fs = makeFS();
    cwd = '/home/student';
    history = [];
    services.nginx.active = true; services.nginx.pid = 4242;
    services.miapp.active = false; services.miapp.pid = 0;
    processes = processes.filter(function (p) { return p.pid !== 5150; });
    processes.push({ pid: 5150, user: 'student', cpu: 99.7, mem: 2.1, stat: 'R', cmd: 'python3 loop_infinito.py' });
  }

  function norm(base, p) {
    if (!p || p === '.') return base;
    if (p[0] !== '/') p = (base === '/' ? '' : base) + '/' + p;
    var parts = p.split('/');
    var out = [];
    parts.forEach(function (s) {
      if (!s || s === '.') return;
      if (s === '..') out.pop();
      else out.push(s);
    });
    return '/' + out.join('/');
  }

  function get(path) {
    var p = norm('/', path);
    if (p === '/') return fs;
    var parts = p.slice(1).split('/');
    var node = fs;
    for (var i = 0; i < parts.length; i++) {
      if (!node || node.type !== 'd' || !node.children[parts[i]]) return null;
      node = node.children[parts[i]];
    }
    return node;
  }

  function parentOf(path) {
    var p = norm('/', path);
    var parts = p.slice(1).split('/');
    var name = parts.pop();
    return { parent: get('/' + parts.join('/')), name: name };
  }

  function human(bytes) {
    if (bytes > 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + 'M';
    if (bytes > 1024) return (bytes / 1024).toFixed(1) + 'K';
    return bytes + '';
  }

  function modeToNum(m) {
    var chars = m.slice(1);
    var n = 0;
    for (var i = 0; i < 9; i++) if (chars[i] !== '-') n += Math.pow(2, 8 - i);
    return n;
  }
  function numToMode(num, isDir) {
    var chars = '';
    for (var i = 2; i >= 0; i--) {
      var v = Math.floor(num / Math.pow(10, i)) % 10;
      chars += (v & 4 ? 'r' : '-') + (v & 2 ? 'w' : '-') + (v & 1 ? 'x' : '-');
    }
    return (isDir ? 'd' : '-') + chars;
  }

  function modeOf(c) {
    var mode = c.mode || (c.type === 'd' ? 'drwxr-xr-x' : '-rw-r--r--');
    if (c.special === '2' && mode.length >= 10) {
      var arr = mode.split('');
      arr[6] = arr[6] === 'x' ? 's' : 'S';
      mode = arr.join('');
    }
    return mode;
  }
  function listDir(path, showAll, long, humanFlag, selfOnly) {
    var node = get(path);
    if (!node) return { out: 'ls: cannot access \'' + path + '\': No such file or directory', code: 1 };
    var name = path === '/' ? '/' : path.split('/').pop();
    var sizeOf = function (c) { return c.type === 'd' ? 4096 : (c.content || '').length; };
    var lineOf = function (c, n) {
      return modeOf(c) + ' ' + (c.type === 'd' ? '2' : '1') + ' ' + (c.owner || 'root') + ' ' + (c.group || 'root') + ' ' + String(humanFlag ? human(sizeOf(c)) : sizeOf(c)).padStart(6) + ' Nov  5 09:00 ' + n;
    };
    if (node.type === 'f' || selfOnly) {
      return { out: long ? lineOf(node, name) : name, code: 0 };
    }
    var names = Object.keys(node.children);
    if (!showAll) names = names.filter(function (n) { return n[0] !== '.'; });
    names.sort();
    if (!long) return { out: names.join('  '), code: 0 };
    var lines = ['total ' + names.length];
    names.forEach(function (n) { lines.push(lineOf(node.children[n], n)); });
    return { out: lines.join('\n'), code: 0 };
  }

  function runSimple(name, args, stdin) {
    var a = args.filter(function (x) { return x; });
    var flags = a.filter(function (x) { return x[0] === '-'; }).join(' ');
    var positional = a.filter(function (x) { return x[0] !== '-'; });

    switch (name) {
      case 'help':
        return { out: 'Comandos disponibles (SIMULADOS):\n' +
          '  Navegación: pwd, cd, ls [-l -a -h], find, tree\n' +
          '  Archivos: cat, head, tail [-n], echo, mkdir, touch, rm, cp, mv, chmod, chown\n' +
          '  Texto: grep [-i -v -c -n -r], awk, sed, sort, uniq [-c], cut, wc, tee\n' +
          '  Sistema: uname, whoami, id, date, df [-h], du [-sh], free, ps, top, kill, ss, systemctl, journalctl\n' +
          '  Red: dig, nc, curl, ping\n' +
          '  Contenedores: docker ps|images|run|logs|inspect|exec, kubectl get|describe|logs|scale|rollout\n' +
          '  Otros: git status|log|branch, history, clear, env, sudo <cmd>, reset\n' +
          'Todo se ejecuta en un entorno virtual: no afecta tu máquina.' };

      case 'pwd': return { out: cwd };

      case 'cd': {
        var target = positional[0] || '/home/student';
        if (target === '-') target = '/home/student';
        var p = norm(cwd, target);
        var n = get(p);
        if (!n) return { out: 'bash: cd: ' + target + ': No such file or directory', code: 1 };
        if (n.type !== 'd') return { out: 'bash: cd: ' + target + ': Not a directory', code: 1 };
        cwd = p;
        return { out: '' };
      }

      case 'ls': {
        var target = positional[0] || '.';
        var p = norm(cwd, target);
        return listDir(p, /a/.test(flags), /l/.test(flags), /h/.test(flags), /d/.test(flags));
      }

      case 'cat': {
        if (!positional.length) return { out: stdin || '', code: 0 };
        var outs = [];
        for (var i = 0; i < positional.length; i++) {
          var node = get(norm(cwd, positional[i]));
          if (!node) return { out: 'cat: ' + positional[i] + ': No such file or directory', code: 1 };
          if (node.type === 'd') return { out: 'cat: ' + positional[i] + ': Is a directory', code: 1 };
          outs.push(node.content);
        }
        return { out: outs.join('\n'), code: 0 };
      }

      case 'head':
      case 'tail': {
        var n = 10, fileArg = positional[0];
        var m = (/-n\s*(\d+)|-(\d+)/.exec(a.join(' ')));
        if (m) n = +(m[1] || m[2]);
        var content = stdin;
        if (fileArg) {
          var f = get(norm(cwd, fileArg));
          if (!f || f.type !== 'f') return { out: name + ': cannot open \'' + fileArg + '\' for reading: No such file or directory', code: 1 };
          content = f.content;
        }
        if (content == null) return { out: '', code: 0 };
        var ls = content.split('\n');
        var sel = name === 'head' ? ls.slice(0, n) : ls.slice(-n);
        return { out: sel.join('\n'), code: 0 };
      }

      case 'echo':
        return { out: positional.join(' ') };

      case 'mkdir': {
        var mkdirArgs = a.filter(function (x) { return x[0] !== '-'; });
        if (a.indexOf('-p') === -1 && mkdirArgs.length > 1) {
          // se permite igual para simplificar la práctica
        }
        mkdirArgs.forEach(function (d) {
          var p = norm(cwd, d);
          var target = get(p);
          if (target) return;
          var parts = p.slice(1).split('/');
          var node = fs;
          for (var j = 0; j < parts.length; j++) {
            if (!node.children[parts[j]]) node.children[parts[j]] = dir({});
            node = node.children[parts[j]];
          }
        });
        return { out: '' };
      }

      case 'touch': {
        positional.forEach(function (f) {
          var p = norm(cwd, f);
          var node = get(p);
          if (!node) {
            var par = parentOf(p);
            if (par.parent && par.parent.type === 'd') par.parent.children[par.name] = file('');
          }
        });
        return { out: '' };
      }

      case 'rm': {
        if (a.indexOf('-rf') === -1 && a.indexOf('-fr') === -1 && a.indexOf('-r') === -1 && a.indexOf('-f') === -1) {
          return { out: 'rm: missing operand (en esta simulación usá -f o -r)', code: 1 };
        }
        positional.filter(function (x) { return x[0] !== '-'; }).forEach(function (f) {
          var p = norm(cwd, f);
          if (p === '/') return;
          var par = parentOf(p);
          if (par.parent && par.parent.type === 'd') delete par.parent.children[par.name];
        });
        return { out: '' };
      }

      case 'cp': {
        var src = positional[0], dst = positional[1];
        if (!src || !dst) return { out: 'cp: missing file operand', code: 1 };
        var s = get(norm(cwd, src));
        if (!s) return { out: 'cp: cannot stat \'' + src + '\': No such file or directory', code: 1 };
        var d = norm(cwd, dst);
        var dn = get(d);
        if (dn && dn.type === 'd') {
          dn.children[dst.split('/').pop()] = JSON.parse(JSON.stringify(s));
        } else {
          var par = parentOf(d);
          if (par.parent) par.parent.children[par.name] = JSON.parse(JSON.stringify(s));
        }
        return { out: '' };
      }

      case 'mv': {
        var msrc = positional[0], mdst = positional[1];
        if (!msrc || !mdst) return { out: 'mv: missing file operand', code: 1 };
        var ms = get(norm(cwd, msrc));
        if (!ms) return { out: 'mv: cannot stat \'' + msrc + '\'', code: 1 };
        delete parentOf(norm(cwd, msrc)).parent.children[parentOf(norm(cwd, msrc)).name];
        var mp = parentOf(norm(cwd, mdst));
        if (mp.parent) mp.parent.children[mp.name] = ms;
        return { out: '' };
      }

      case 'chmod': {
        var mode = a.filter(function (x) { return x[0] !== '-'; })[0];
        var targets = a.filter(function (x) { return x[0] !== '-'; }).slice(1);
        if (!mode || !targets.length) return { out: 'chmod: missing operand', code: 1 };
        targets.forEach(function (t) {
          var node = get(norm(cwd, t));
          if (!node) return;
          if (/^[0-7]{3,4}$/.test(mode)) {
            var num = parseInt(mode, 10) % 1000;
            node.mode = numToMode(num, node.type === 'd');
            node.special = mode.length === 4 ? mode[0] : '0';
          } else if (/^g\+s$/.test(mode)) {
            node.special = '2';
          }
        });
        return { out: '' };
      }

      case 'chown': {
        var owner = a.filter(function (x) { return x[0] !== '-'; })[0];
        var ct = a.filter(function (x) { return x[0] !== '-'; }).slice(1);
        if (!owner || !ct.length) return { out: 'chown: missing operand', code: 1 };
        ct.forEach(function (t) {
          var node = get(norm(cwd, t));
          if (node) node.owner = owner.split(':')[0];
        });
        return { out: '' };
      }

      case 'find': {
        var start = positional[0] || '.';
        var base = norm(cwd, start);
        var nameM = /-name\s+"?([^"\s]+)"?/.exec(a.join(' '));
        var typeM = /-type\s+([fd])/.exec(a.join(' '));
        var results = [];
        (function walk(p, node) {
          if (!node) return;
          var baseName = p === '/' ? '/' : p.split('/').pop();
          if (!typeM || (typeM[1] === 'd' && node.type === 'd') || (typeM[1] === 'f' && node.type === 'f')) {
            if (!nameM || simpleMatch(baseName, nameM[1])) results.push(p);
          }
          if (node.type === 'd') Object.keys(node.children).forEach(function (k) { walk(p === '/' ? '/' + k : p + '/' + k, node.children[k]); });
        })(base, get(base));
        return { out: results.join('\n') || '', code: 0 };
      }

      case 'grep': {
        var pattern = positional[0];
        if (!pattern) return { out: 'usage: grep [opciones] patron [archivo]', code: 1 };
        var text = stdin;
        if (positional[1]) {
          var g = get(norm(cwd, positional[1]));
          if (!g || g.type !== 'f') return { out: 'grep: ' + positional[1] + ': No such file or directory', code: 1 };
          text = g.content;
        }
        if (text == null) text = '';
        pattern = pattern.replace(/^['"]|['"]$/g, '');
        var re;
        try {
          re = new RegExp(pattern, /i/.test(flags) ? 'i' : '');
        } catch (e) {
          re = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), /i/.test(flags) ? 'i' : '');
        }
        var rows = text.split('\n').filter(function (l) {
          var hit = re.test(l);
          return /v/.test(flags.split(' ').join('')) ? !hit : hit;
        });
        if (/\bc\b|-c/.test(flags)) return { out: String(rows.length), code: 0 };
        var out = /n/.test(flags) ? rows.map(function (l, idx) { return (idx + 1) + ':' + l; }).join('\n') : rows.join('\n');
        return { out: out, code: rows.length ? 0 : 1 };
      }

      case 'awk': {
        var prog = a[0] || '';
        var text = stdin;
        var file = a[a.length - 1];
        if (file && file !== prog && get(norm(cwd, file))) text = get(norm(cwd, file)).content;
        if (text == null) text = '';
        var printM = /print\s+\$(\d+)/.exec(prog);
        var countM = /END\s*\{\s*print\s+c\s*\}/.test(prog) || /c\+\+/.test(prog);
        if (countM) return { out: String(text.split('\n').filter(Boolean).length), code: 0 };
        if (!printM) return { out: text, code: 0 };
        var col = +printM[1];
        return {
          out: text.split('\n').filter(Boolean).map(function (l) {
            var f = l.trim().split(/\s+/);
            return col === 0 ? l : (f[col - 1] || '');
          }).join('\n'), code: 0
        };
      }

      case 'sed': {
        var script = a[0] || '';
        var sm = /s\/(.*?)\/(.*?)\/(g?)/.exec(script);
        var text = stdin || '';
        if (positional[1]) {
          var sf = get(norm(cwd, positional[1]));
          if (sf) text = sf.content;
        }
        if (!sm) return { out: text, code: 0 };
        var re2 = new RegExp(sm[1], sm[3] ? 'g' : '');
        return { out: text.replace(re2, sm[2]), code: 0 };
      }

      case 'sort': {
        var lines = (stdin || '').split('\n').filter(Boolean);
        if (/-n/.test(flags)) lines.sort(function (x, y) { return parseFloat(x) - parseFloat(y); });
        else lines.sort();
        if (/-r/.test(flags)) lines.reverse();
        return { out: lines.join('\n'), code: 0 };
      }

      case 'uniq': {
        var ul = (stdin || '').split('\n').filter(Boolean);
        var res = [], prev = null, count = 0;
        ul.forEach(function (l) {
          if (l === prev) count++;
          else {
            if (prev !== null) res.push(/-c/.test(flags) ? String(count).padStart(4) + ' ' + prev : prev);
            prev = l; count = 1;
          }
        });
        if (prev !== null) res.push(/-c/.test(flags) ? String(count).padStart(4) + ' ' + prev : prev);
        return { out: res.join('\n'), code: 0 };
      }

      case 'cut': {
        var d = /-d\s*['"]?(.)['"]?/.exec(a.join(' '));
        var f = /-f\s*([0-9,]+)/.exec(a.join(' '));
        var dl = d ? d[1] : '\t';
        var fields = f ? f[1].split(',').map(Number) : [1];
        return {
          out: (stdin || '').split('\n').map(function (l) {
            var parts = l.split(dl);
            return fields.map(function (n) { return parts[n - 1] || ''; }).join(dl);
          }).join('\n'), code: 0
        };
      }

      case 'wc': {
        var wtext = stdin;
        if (positional[0]) {
          var wf = get(norm(cwd, positional[0]));
          if (!wf) return { out: 'wc: ' + positional[0] + ': No such file or directory', code: 1 };
          wtext = wf.content;
        }
        wtext = wtext || '';
        var wlines = wtext.split('\n').length - (wtext.endsWith('\n') ? 1 : 0);
        if (/-l/.test(flags)) return { out: String(wlines), code: 0 };
        return { out: '  ' + wlines + '  ' + wtext.split(/\s+/).filter(Boolean).length + ' ' + wtext.length, code: 0 };
      }

      case 'tee': {
        var tname = positional[0];
        if (tname) {
          var tp = parentOf(norm(cwd, tname));
          if (tp.parent) tp.parent.children[tp.name] = file(stdin || '');
        }
        return { out: stdin || '', code: 0 };
      }

      case 'uname':
        return { out: /a/.test(flags) ? 'Linux debian-lab 6.1.0-18-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.76-1 x86_64 GNU/Linux' : (/r/.test(flags) ? '6.1.0-18-amd64' : 'Linux'), code: 0 };

      case 'whoami': return { out: 'student', code: 0 };
      case 'id': return { out: 'uid=1000(student) gid=1000(student) groups=1000(student),27(sudo),1003(deploy)', code: 0 };
      case 'groups': return { out: 'student sudo deploy', code: 0 };
      case 'hostname': return { out: 'debian-lab', code: 0 };
      case 'date': return { out: new Date().toString(), code: 0 };
      case 'env': return { out: 'HOME=/home/student\nPATH=/usr/local/bin:/usr/bin:/bin\nSHELL=/bin/bash\nUSER=student\nLANG=es_AR.UTF-8', code: 0 };
      case 'which': return { out: '/usr/bin/' + (positional[0] || ''), code: 0 };

      case 'df': {
        var dfh = 'Filesystem      Type  Size  Used Avail Use% Mounted on\n/dev/sda2       ext4   40G  8.5G   29G  23% /\n/dev/sda1       vfat  512M   30M  482M   6% /boot/efi\n/dev/sdb1       ext4   80G   79G  1.1G  99% /var\nproc            proc    0      0     0    - /proc\n';
        return { out: /T/.test(flags) ? dfh : dfh.replace(/ ext4| vfat| proc/g, ''), code: 0 };
      }
      case 'du':
        return { out: positional[0] ? '1.2G\t' + positional[0] : '4.0K\t./docs', code: 0 };
      case 'free':
        return { out: '               total        used        free      shared  buff/cache   available\nMem:           7.7Gi       2.1Gi       3.2Gi        85Mi       2.4Gi       5.2Gi\nSwap:          2.0Gi          0B       2.0Gi', code: 0 };

      case 'ps': {
        if (/aux|ef/.test(flags)) {
          return {
            out: 'USER       PID %CPU %MEM STAT COMMAND\n' + processes.map(function (p) {
              return (p.user + '        ').slice(0, 8) + String(p.pid).padStart(6) + ' ' + p.cpu.toFixed(1).padStart(4) + ' ' + p.mem.toFixed(1).padStart(4) + ' ' + p.stat.padEnd(3) + '  ' + p.cmd;
            }).join('\n'), code: 0
          };
        }
        return { out: '    PID TTY          TIME CMD\n   1200 pts/0    00:00:00 bash', code: 0 };
      }

      case 'top':
        return { out: 'top - ' + new Date().toTimeString().slice(0, 8) + ' up 3 days,  2 users,  load average: 0.42, 0.35, 0.30\nTasks:  86 total,   1 running,  85 sleeping\n%Cpu(s):  2.1 us,  0.8 sy, 96.9 id\nMiB Mem :   7890 total,   3276 free,   2150 used\n\n    PID USER      %CPU  %MEM  COMMAND\n   5150 student   99.7   2.1  python3 loop_infinito.py\n    812 www-data   0.1   0.4  nginx: master process', code: 0 };

      case 'kill': {
        var km = /-(9|15|1|2)\s+(\d+)/.exec(a.join(' '));
        if (!km) return { out: 'kill: usage: kill [-s sigspec | -n signum] pid', code: 1 };
        var pid = +km[2];
        var idx = processes.findIndex(function (p) { return p.pid === pid; });
        if (idx === -1) return { out: 'bash: kill: (' + pid + ') - No such process', code: 1 };
        if (km[1] === '9') {
          processes.splice(idx, 1);
          return { out: '', code: 0 };
        }
        if (km[1] === '15') {
          processes.splice(idx, 1);
          return { out: '[proceso terminado con SIGTERM]', code: 0 };
        }
        return { out: '', code: 0 };
      }

      case 'ss': {
        return { out: 'Netid State  Local Address:Port  Peer Address:Port Process\n' +
          'tcp   LISTEN 0.0.0.0:22          0.0.0.0:*       users:(("sshd",pid=918,fd=3))\n' +
          (services.nginx.active ? 'tcp   LISTEN 0.0.0.0:80          0.0.0.0:*       users:(("nginx",pid=812,fd=6))\n' : '') +
          (services.miapp.active ? 'tcp   LISTEN 127.0.0.1:3000      0.0.0.0:*       users:(("node",pid=1214,fd=21))\n' : ''), code: 0 };
      }

      case 'systemctl': {
        var sub = positional[0], unit = (positional[1] || '').replace('.service', '');
        if (sub === 'get-default') return { out: 'multi-user.target', code: 0 };
        if (sub === 'list-units') return { out: '  UNIT             LOAD   ACTIVE SUB     DESCRIPTION\n  nginx.service    loaded active running A high performance web server\n  ssh.service      loaded active running OpenBSD Secure Shell server\n  miapp.service    loaded inactive dead  API Node.js del bootcamp\n  cron.service     loaded active running Regular background daemon', code: 0 };
        if (!services[unit]) return { out: 'Unit ' + unit + '.service could not be found.', code: 1 };
        var s = services[unit];
        if (sub === 'status') {
          var active = s.active ? 'active (running)' : 'inactive (dead)';
          return {
            out: '● ' + unit + '.service - ' + s.desc + '\n     Loaded: loaded (/etc/systemd/system/' + unit + '.service; enabled; preset: enabled)\n     Active: ' + active + (s.active ? ' since Thu 2026-11-05 09:00:12 UTC; 2h ago' : ' since Thu 2026-11-05 02:14:11 UTC; 7h ago') + '\n' +
              (s.active ? '   Main PID: ' + s.pid + ' (nginx)\n      Tasks: 2 (limit: 9453)\n     Memory: 4.2M' : '    Process: 1214 ExecStart=/usr/bin/node server.js (code=exited, status=1/FAILURE)') + '\n' +
              (unit === 'miapp' && !s.active ? '\nNov 05 02:14:11 node[1214]: Error: Cannot find module \'./config/production.json\'' : ''), code: s.active ? 0 : 3
          };
        }
        if (sub === 'is-active') return { out: s.active ? 'active' : 'inactive', code: s.active ? 0 : 3 };
        if (sub === 'is-enabled') return { out: 'enabled', code: 0 };
        if (sub === 'start' || sub === 'restart' || sub === 'reload') {
          s.active = true; s.pid = unit === 'nginx' ? 4242 : 1214;
          if (!processes.find(function (p) { return p.pid === s.pid; })) {
            processes.push({ pid: s.pid, user: unit === 'nginx' ? 'www-data' : 'student', cpu: 0.1, mem: 0.5, stat: 'S', cmd: unit });
          }
          return { out: '', code: 0 };
        }
        if (sub === 'stop') { s.active = false; s.pid = 0; return { out: '', code: 0 }; }
        if (sub === 'enable' || sub === 'disable') return { out: '', code: 0 };
        return { out: 'systemctl: subcomando no soportado en la simulación', code: 1 };
      }

      case 'journalctl': {
        var jm = /-u\s+(\w+)/.exec(a.join(' '));
        var jn = /-n\s*(\d+)/.exec(a.join(' '));
        var unitName = jm ? jm[1].replace('.service', '') : 'system';
        var n = jn ? +jn[1] : 10;
        var logs = {
          nginx: 'Nov 05 09:12:44 debian-lab nginx[812]: 2026/11/05 09:12:44 [error] connect() failed (111: Connection refused) while connecting to upstream\nNov 05 09:12:46 debian-lab nginx[812]: 2026/11/05 09:12:46 [error] connect() failed (111: Connection refused) while connecting to upstream\nNov 05 09:00:12 debian-lab systemd[1]: Started A high performance web server.',
          miapp: 'Nov 05 02:14:11 debian-lab systemd[1]: Started API Node.js del bootcamp.\nNov 05 02:14:11 debian-lab node[1214]: Error: Cannot find module \'./config/production.json\'\nNov 05 02:14:11 debian-lab systemd[1]: miapp.service: Main process exited, code=exited, status=1/FAILURE\nNov 05 02:14:11 debian-lab systemd[1]: miapp.service: Failed with result \'exit-code\'.',
          ssh: 'Nov 05 08:55:10 debian-lab sshd[918]: Accepted publickey for student from 10.0.0.7 port 49876 ssh2\nNov 05 08:41:02 debian-lab sshd[918]: Failed password for invalid user admin from 203.0.113.44 port 51022 ssh2\nNov 05 09:05:12 debian-lab sshd[918]: Server listening on 0.0.0.0 port 22.',
          system: 'Nov 05 09:00:01 debian-lab systemd[1]: Started Daily apt download activities.\nNov 05 09:05:12 debian-lab sshd[918]: Server listening on 0.0.0.0 port 22.\nNov 05 09:10:00 debian-lab CRON[1201]: (root) CMD (/usr/local/bin/backup.sh)'
        };
        var out = (logs[unitName] || logs.system).split('\n');
        return { out: out.slice(-n).join('\n'), code: 0 };
      }

      case 'dig': {
        var host = positional.filter(function (x) { return x[0] !== '@'; })[0] || 'example.com';
        return { out: '\n; <<>> DiG 9.18.24 <<>> ' + host + '\n;; QUESTION SECTION:\n;' + host + '.\t\t\tIN\tA\n\n;; ANSWER SECTION:\n' + host + '.\t\t300\tIN\tA\t93.184.216.34\n\n;; Query time: 18 msec\n;; SERVER: 10.0.0.2#53(10.0.0.2)', code: 0 };
      }

      case 'nc': {
        var target = positional.filter(function (x) { return /^\d+$/.test(x) || x.indexOf('.') > -1 || x === 'localhost'; });
        var port = positional[positional.length - 1];
        return { out: 'Connection to ' + (target[0] || 'host') + ' ' + port + ' port [tcp/*] succeeded!', code: 0 };
      }

      case 'curl': {
        var url = positional[positional.length - 1] || '';
        if (/-I/.test(flags)) {
          return { out: 'HTTP/1.1 200 OK\r\nServer: nginx/1.27\r\nDate: Thu, 05 Nov 2026 09:40:00 GMT\r\nContent-Type: text/html\r\nContent-Length: 615\r\nConnection: keep-alive', code: 0 };
        }
        return { out: '<!doctype html><html><body><h1>Servidor de práctica</h1></body></html>', code: 0 };
      }

      case 'ping':
        return { out: 'PING ' + (positional[0] || 'example.com') + ' (93.184.216.34) 56(84) bytes of data.\n64 bytes from 93.184.216.34: icmp_seq=1 ttl=56 time=11.2 ms\n64 bytes from 93.184.216.34: icmp_seq=2 ttl=56 time=10.8 ms\n\n--- 2 packets transmitted, 2 received, 0% packet loss, time 1001ms', code: 0 };

      case 'docker': {
        var dsub = positional[0];
        if (dsub === 'ps') {
          return { out: 'CONTAINER ID   IMAGE                  STATUS                  PORTS                    NAMES\n' + containers.map(function (c, i) {
            return 'a' + (i + 1) + 'b2c3d4e5f6   ' + (c.image + '                      ').slice(0, 22) + ' ' + c.status.padEnd(23) + ' ' + c.ports.padEnd(24) + ' ' + c.name;
          }).join('\n'), code: 0 };
        }
        if (dsub === 'images') {
          return { out: 'REPOSITORY   TAG          IMAGE ID       SIZE\n' + images.map(function (im) {
            return (im.repo + '            ').slice(0, 12) + (im.tag + '            ').slice(0, 12) + '9f2c1ab34de5   ' + im.size;
          }).join('\n'), code: 0 };
        }
        if (dsub === 'run') {
          var name = /--name\s+(\S+)/.exec(a.join(' '));
          var img = positional.filter(function (x) { return x.indexOf(':') > -1 || x === 'nginx' || x === 'postgres'; })[0] || 'nginx:1.27';
          var cname = name ? name[1] : 'container_' + Math.random().toString(16).slice(2, 8);
          containers.push({ name: cname, image: img, status: 'Up 1 second', ports: '0.0.0.0:8080->80/tcp' });
          return { out: '9f2c1ab34de5' + Math.random().toString(16).slice(2, 10), code: 0 };
        }
        if (dsub === 'logs') {
          var lname = positional[positional.length - 1];
          return { out: '/docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration\n2026/11/05 09:41:02 [notice] 1#1: using the "epoll" event method\n2026/11/05 09:41:02 [notice] 1#1: nginx/1.27.0\n2026/11/05 09:41:02 [notice] 1#1: start worker processes\n10.0.0.7 - - [05/Nov/2026:09:41:10 +0000] "GET / HTTP/1.1" 200 615 "-" "curl/8.5.0"', code: 0 };
        }
        if (dsub === 'inspect') {
          return { out: '[{"Id":"a1b2c3d4e5f6","Name":"/web","State":{"Status":"running","Running":true,"ExitCode":0,"OOMKilled":false},"Config":{"Image":"nginx:1.27"}}]', code: 0 };
        }
        if (dsub === 'exec') {
          return { out: 'user  nginx;\nworker_processes  auto;\nevents { worker_connections  1024; }\nhttp { include /etc/nginx/mime.types; server { listen 80; } }', code: 0 };
        }
        if (dsub === 'stats') {
          return { out: 'CONTAINER ID   NAME   CPU %   MEM USAGE / LIMIT   MEM %\na1b2c3d4e5f6   web    0.02%   4.2MiB / 512MiB    0.82%', code: 0 };
        }
        if (dsub === 'rm') {
          var rname = positional[positional.length - 1];
          containers = containers.filter(function (c) { return c.name !== rname; });
          return { out: rname, code: 0 };
        }
        return { out: 'docker: subcomando no soportado en la simulación (' + (dsub || '') + ')', code: 1 };
      }

      case 'kubectl': {
        var ksub = positional[0], kobj = positional[1];
        if (ksub === 'get' && (kobj === 'pods' || kobj === 'po')) {
          return { out: 'NAME                        READY   STATUS             RESTARTS      AGE\n' + pods.map(function (p) {
            return p.name.padEnd(28) + p.ready.padEnd(8) + p.status.padEnd(19) + String(p.restarts).padEnd(14) + p.age;
          }).join('\n'), code: 0 };
        }
        if (ksub === 'get' && (kobj === 'svc' || kobj === 'services')) {
          return { out: 'NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE\nkubernetes   ClusterIP   10.96.0.1       <none>        443/TCP   30d\nweb          ClusterIP   10.96.14.22     <none>        80/TCP    2h', code: 0 };
        }
        if (ksub === 'get' && kobj === 'endpoints') {
          return { out: 'NAME         ENDPOINTS                     AGE\nweb          10.244.1.15:8080,10.244.2.9:8080   2h', code: 0 };
        }
        if (ksub === 'get' && kobj === 'nodes') {
          return { out: 'NAME       STATUS   ROLES           AGE   VERSION   INTERNAL-IP\nlab-1      Ready    control-plane   30d   v1.29.3   10.0.0.21\nlab-2      Ready    <none>          30d   v1.29.3   10.0.0.22', code: 0 };
        }
        if (ksub === 'describe') {
          return { out: 'Name:             api-7d9f8c6b5f-2xk4p\nNamespace:        default\nNode:             lab-1/10.0.0.21\nStatus:           Running\nContainers:\n  api:\n    Image:          miapp:1.4.0\n    State:          Waiting\n      Reason:       CrashLoopBackOff\n    Last State:     Terminated\n      Reason:       Error\n      Exit Code:    1\nEvents:\n  Type     Reason   Age                   From     Message\n  ----     ------   ----                  ----     -------\n  Warning  BackOff  2m (x7 over 6m)       kubelet  Back-off restarting failed container', code: 0 };
        }
        if (ksub === 'logs') {
          return { out: 'Error: Cannot find module \'./config/production.json\'\n    at Module._resolveFilename (node:internal/modules/cjs/loader:1145:15)', code: 0 };
        }
        if (ksub === 'scale' || ksub === 'set' || ksub === 'apply' || ksub === 'delete') {
          return { out: (ksub === 'apply' ? 'deployment.apps/web configured' : (ksub === 'scale' ? 'deployment.apps/web scaled' : ksub === 'delete' ? 'pod deleted' : 'deployment.apps/web image updated')), code: 0 };
        }
        if (ksub === 'rollout') {
          return { out: 'deployment "web" successfully rolled out', code: 0 };
        }
        if (ksub === 'exec') {
          return { out: 'Server listening on 8080', code: 0 };
        }
        if (ksub === 'top') {
          return { out: 'NAME                        CPU(cores)   MEMORY(bytes)\napi-7d9f8c6b5f-2xk4p        45m          254Mi\nweb-6c8d7f9b4d-9m2qk        2m           8Mi', code: 0 };
        }
        return { out: 'kubectl: subcomando no soportado en la simulación', code: 1 };
      }

      case 'git': {
        var gsub = positional[0];
        if (gsub === 'status') {
          return { out: 'On branch main\nYour branch is up to date with \'origin/main\'.\n\nnothing to commit, working tree clean', code: 0 };
        }
        if (gsub === 'log') {
          return { out: '* a1b2c3d (HEAD -> main) docs: agrega README\n* 9f2c1ab feat: estructura inicial', code: 0 };
        }
        if (gsub === 'branch') return { out: '* main\n  feature/login', code: 0 };
        if (gsub === 'init') return { out: 'Initialized empty Git repository in ' + norm(cwd, positional[1] || '.') + '/.git/', code: 0 };
        if (gsub === 'add') return { out: '', code: 0 };
        if (gsub === 'commit') return { out: '[main a1b2c3d] commit simulado', code: 0 };
        if (gsub === 'switch' || gsub === 'checkout') return { out: 'Switched to branch \'' + (positional[positional.length - 1] || 'main') + '\'', code: 0 };
        if (gsub === 'merge') return { out: 'Merge made by the \'ort\' strategy.', code: 0 };
        return { out: 'git: subcomando simulado no disponible (' + (gsub || '') + ')', code: 1 };
      }

      case 'history':
        return { out: history.map(function (h, i) { return String(i + 1).padStart(4) + '  ' + h; }).join('\n'), code: 0 };

      case 'reset':
        reset();
        return { out: 'Entorno simulado reiniciado.', code: 0 };

      case 'sudo':
        return runSimple(positional[0] || 'help', positional.slice(1), stdin);

      case 'clear':
        return { out: '\u0000CLEAR', code: 0 };

      default: {
        var sug = suggestCommand(name);
        return { out: 'bash: ' + name + ': command not found' + (sug ? ' — quizás quisiste decir "' + sug + '"' : ' (probá "help")'), code: 127 };
      }
    }
  }

  function simpleMatch(name, pattern) {
    var re = new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    return re.test(name);
  }

  function exec(line) {
    line = String(line || '').trim();
    if (!line) return { out: '', code: 0 };
    history.push(line);

    var redirectFile = null, append = false;
    var redir = /\s(>>|>)\s*(\S+)\s*$/.exec(line);
    if (redir) {
      append = redir[1] === '>>';
      redirectFile = redir[2];
      line = line.slice(0, redir.index);
    }
    line = line.replace(/\s*2>&1\s*$/, '');

    var segments = line.split('|');
    var stdin = null;
    var result = { out: '', code: 0 };
    for (var i = 0; i < segments.length; i++) {
      var seg = segments[i].trim();
      var tokens = seg.match(/"[^"]*"|'[^']*'|\S+/g) || [];
      tokens = tokens.map(function (t) { return t.replace(/^['"]|['"]$/g, ''); });
      var name = tokens[0];
      if (!name) continue;
      var args = tokens.slice(1);
      result = runSimple(name, args, stdin);
      stdin = result.out;
    }

    if (redirectFile) {
      var p = norm(cwd, redirectFile);
      var par = parentOf(p);
      if (par.parent && par.parent.type === 'd') {
        var prev = par.parent.children[par.name];
        var content = (append && prev ? prev.content + '\n' : '') + (result.out || '');
        par.parent.children[par.name] = file(content);
      }
    }
    return result;
  }

  return {
    exec: exec,
    reset: reset,
    complete: complete,
    history: function () { return history.slice(); },
    snapshot: function () {
      var modes = {};
      (function walk(p, node) {
        modes[p] = node.mode;
        if (node.type === 'd') Object.keys(node.children).forEach(function (k) { walk(p === '/' ? '/' + k : p + '/' + k, node.children[k]); });
      })('/', fs);
      return { cwd: cwd, modes: modes, services: JSON.parse(JSON.stringify(services)) };
    },
    cwd: function () { return cwd; },
    banner: 'Bienvenido al laboratorio simulado (Debian 12). Este entorno NO ejecuta comandos reales.\nProbá "help" para ver los comandos disponibles.\n'
  };
})();
