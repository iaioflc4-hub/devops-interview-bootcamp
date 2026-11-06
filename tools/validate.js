/* Validación automática de la app: integridad de datos, SM-2 y labs de terminal.
   Uso: node tools/validate.js */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
global.window = global;
global.localStorage = {
  _d: {},
  getItem(k) { return Object.prototype.hasOwnProperty.call(this._d, k) ? this._d[k] : null; },
  setItem(k, v) { this._d[k] = String(v); },
  removeItem(k) { delete this._d[k]; }
};

function load(rel) {
  const file = path.join(root, rel);
  vm.runInThisContext(fs.readFileSync(file, 'utf8'), { filename: rel });
}
['js/data/linux-course.js', 'js/data/curriculum.js', 'js/data/curriculum-lpi.js',
 'js/data/flashcards.js', 'js/data/interview.js', 'js/data/labs.js', 'js/core/md.js',
 'js/core/store.js', 'js/core/terminal.js'].forEach(load);

const errors = [];
const warn = [];
function check(cond, msg) { if (!cond) errors.push(msg); }

const COURSE = global.COURSE;
const CARDS = global.FLASHCARDS;
const QUESTIONS = global.QUESTIONS;
const LABS = global.LABS;
const TS = global.SCENARIOS;
const PROJECT = global.PROJECT;
const LINUX = global.LINUX_COURSE;

// ---------- existencia y volumen ----------
check(COURSE && COURSE.days.length === 5, 'Deben existir 5 días');
check(LABS.length >= 20, 'Se esperan al menos 20 laboratorios, hay ' + (LABS ? LABS.length : 0));
check(TS.length >= 10, 'Se esperan al menos 10 escenarios, hay ' + (TS ? TS.length : 0));
check(QUESTIONS.length >= 100, 'Se esperan al menos 100 preguntas, hay ' + (QUESTIONS ? QUESTIONS.length : 0));
check(CARDS.length >= 80, 'Se esperan al menos 80 tarjetas, hay ' + (CARDS ? CARDS.length : 0));
check(LINUX.length === 24, 'La biblioteca debe tener 24 clases');

// ---------- ids únicos ----------
function unique(list, name) {
  const seen = new Set();
  list.forEach(x => {
    if (seen.has(x.id)) errors.push('ID duplicado en ' + name + ': ' + x.id);
    seen.add(x.id);
  });
}
unique(COURSE.modules, 'módulos');
unique(CARDS, 'tarjetas');
unique(QUESTIONS, 'preguntas');
unique(LABS, 'laboratorios');
unique(TS, 'escenarios');

const moduleIds = new Set(COURSE.modules.map(m => m.id));
const labIds = new Set(LABS.map(l => l.id));

// ---------- alineación LPI DevOps Tools Engineer 701-200 v2.0 ----------
const LPI_OBJECTIVES = ['701.1', '701.2', '701.3', '701.4', '701.5',
  '702.1', '702.2', '702.3', '703.1', '703.2', '703.3',
  '704.1', '704.2', '704.3', '704.4'];
const lpiSeen = new Set(COURSE.modules.map(m => m.lpi));
LPI_OBJECTIVES.forEach(o => check(lpiSeen.has(o), 'Falta cobertura del objetivo LPI ' + o));
COURSE.modules.forEach(m => {
  check(m.lpi && m.track && m.lpiDomain, 'Módulo ' + m.id + ' sin alineación LPI/track');
});
const lpiWeight = COURSE.days.reduce((a, d) => a + (d.weight || 0), 0);
check(lpiWeight === 60, 'Los pesos de los dominios LPI deben sumar 60, suman ' + lpiWeight);
COURSE.days.forEach(d => {
  check(Array.isArray(d.modules) && d.modules.length >= 3, 'Día ' + d.id + ' con menos de 3 módulos');
  check(d.lpi && d.objective, 'Día ' + d.id + ' sin dominio LPI u objetivo');
});

// ---------- referencias ----------
COURSE.days.forEach(d => {
  d.modules.forEach(id => check(moduleIds.has(id), 'Día ' + d.id + ' referencia módulo inexistente: ' + id));
});
COURSE.modules.forEach(m => {
  ['objectives', 'theory', 'commands', 'labIds', 'mistakes', 'mastery', 'keyIdeas'].forEach(f => {
    check(m[f] !== undefined, 'Módulo ' + m.id + ' sin campo ' + f);
  });
  check(m.objectives.length >= 3, 'Módulo ' + m.id + ' con menos de 3 objetivos');
  check(m.theory.length > 600, 'Módulo ' + m.id + ' con teoría demasiado corta');
  check(m.labIds.length <= 2, 'Módulo ' + m.id + ' con demasiados labs');
  m.labIds.forEach(id => check(labIds.has(id), 'Módulo ' + m.id + ' referencia lab inexistente: ' + id));
  check(CARDS.some(c => c.module === m.id), 'Módulo ' + m.id + ' sin tarjetas asociadas');
});
CARDS.forEach(c => {
  check(moduleIds.has(c.module), 'Tarjeta ' + c.id + ' con módulo inexistente: ' + c.module);
  ['q', 'a', 'example', 'topic', 'sub'].forEach(f => check(c[f], 'Tarjeta ' + c.id + ' sin ' + f));
  check(Array.isArray(c.misconceptions) && c.misconceptions.length, 'Tarjeta ' + c.id + ' sin misconceptions');
});
LABS.forEach(l => {
  check(moduleIds.has(l.moduleId), 'Lab ' + l.id + ' con módulo inexistente: ' + l.moduleId);
  check(['terminal', 'manual', 'guided'].includes(l.mode), 'Lab ' + l.id + ' con modo inválido');
  check(Array.isArray(l.checks) && l.checks.length >= 2, 'Lab ' + l.id + ' con menos de 2 checks');
  l.checks.forEach((c, i) => {
    try { new RegExp(c.re, 'i'); } catch (e) { errors.push('Regex inválida en lab ' + l.id + ' check ' + i + ': ' + c.re); }
  });
  check(Array.isArray(l.steps) && l.steps.length >= 2, 'Lab ' + l.id + ' con pasos insuficientes');
  if (l.mode !== 'terminal') check(Array.isArray(l.fields) && l.fields.length, 'Lab ' + l.id + ' sin campos de evidencia');
});
TS.forEach(t => {
  check(moduleIds.has(t.moduleId), 'Escenario ' + t.id + ' con módulo inexistente');
  check(t.evidence.length >= 2, 'Escenario ' + t.id + ' sin evidencia suficiente');
  check(t.questions.length >= 2, 'Escenario ' + t.id + ' con menos de 2 preguntas');
  t.questions.forEach((qq, i) => {
    check(qq.correct >= 0 && qq.correct < qq.options.length, 'Escenario ' + t.id + ' pregunta ' + i + ' con índice correcto inválido');
  });
  t.solutionChecks.forEach((c, i) => {
    try { new RegExp(c.re, 'i'); } catch (e) { errors.push('Regex inválida en escenario ' + t.id + ' check ' + i); }
  });
});
QUESTIONS.forEach(qq => {
  check(['accuracy', 'problem', 'troubleshoot', 'architecture', 'communication'].includes(qq.dim), 'Pregunta ' + qq.id + ' con dim inválida');
  check(qq.level >= 1 && qq.level <= 4, 'Pregunta ' + qq.id + ' con nivel inválido');
  check(['open', 'mc', 'command', 'scenario', 'yaml', 'design'].includes(qq.type), 'Pregunta ' + qq.id + ' con tipo inválido');
  check(qq.answer && qq.answer.length > 20, 'Pregunta ' + qq.id + ' sin respuesta modelo');
  if (qq.type === 'mc') {
    check(Array.isArray(qq.options) && qq.options.length >= 3, 'MC ' + qq.id + ' con opciones insuficientes');
    check(qq.correct >= 0 && qq.correct < qq.options.length, 'MC ' + qq.id + ' con correct inválido');
  } else {
    check(Array.isArray(qq.keywords) && qq.keywords.length >= 2, 'Pregunta ' + qq.id + ' sin keywords');
  }
  if (qq.module) check(moduleIds.has(qq.module), 'Pregunta ' + qq.id + ' con módulo inexistente: ' + qq.module);
});
PROJECT.sections.forEach(s => s.items.forEach(i => check(i.id && i.label, 'Ítem de proyecto inválido en ' + s.id)));

// ---------- Markdown ----------
const rendered = MD.md('## Título\n\n**negrita** y `código`\n\n~~~\nls -l\n~~~\n\n| a | b |\n| --- | --- |\n| 1 | 2 |');
check(rendered.includes('<h2>'), 'MD no renderiza encabezados');
check(rendered.includes('<strong>'), 'MD no renderiza negrita');
check(rendered.includes('<code>ls -l</code>'), 'MD no renderiza bloques ~~~');
check(rendered.includes('<table>'), 'MD no renderiza tablas');

// ---------- Store / SM-2 ----------
Store.load();
const st = Store.state;
check(st.settings.planDays === 5, 'planDays debe ser 5');
const before = Store.card('c-octal');
check(before.reps === 0 && before.ease === 2.5, 'Tarjeta nueva mal inicializada');
const r1 = Store.review('c-octal', 2, 4000);
const i1 = r1.interval, reps1 = r1.reps;
check(reps1 === 1, 'SM-2: reps no incrementó');
check(i1 === 8 * 3600 * 1000, 'SM-2: primer "Bien" debe ser 8 h, fue ' + i1);
const r2 = Store.review('c-octal', 2, 4000);
check(r2.interval > i1, 'SM-2: el intervalo no creció (' + i1 + ' → ' + r2.interval + ')');
const r3 = Store.review('c-octal', 0, 2000);
check(r3.interval === 10 * 60 * 1000, 'SM-2: "Otra vez" debe ser 10 min');
check(r3.lapses === 1, 'SM-2: no registró lapse');
check(r3.ease >= 1.3, 'SM-2: facilidad por debajo del piso');
const intervalCap = Store.review('c-octal', 3, 1000);
check(intervalCap.interval <= 21 * 86400000, 'SM-2: el intervalo excede el tope');
const q = Store.dueQueue(CARDS);
check(Array.isArray(q.due) && Array.isArray(q.fresh), 'dueQueue debe devolver due y fresh');
check(q.fresh.length === CARDS.length - 1, 'dueQueue: tarjeta revisada no debería ser nueva');
const ov = Store.overall({ MODULES: COURSE.modules, labs: LABS, cards: CARDS });
check(ov.modulesTotal === COURSE.modules.length, 'overall: total de módulos incorrecto');
check(ov.score >= 0 && ov.score <= 100, 'overall: puntaje fuera de rango');
const ready = Store.readiness({ MODULES: COURSE.modules, labs: LABS, cards: CARDS });
check(ready.length === 4, 'readiness debe devolver 4 roles');
check(Store.streak() >= 1, 'streak debería contar la actividad de hoy');
Store.markStudied('d1-arquitectura');
check(Store.state.progress['d1-arquitectura'].studied, 'markStudied no registra');
Store.save();
const raw = localStorage.getItem('devops-bootcamp-v1');
check(raw && raw.includes('d1-arquitectura'), 'No se persistió en localStorage');
Store.load();
check(Store.state.progress['d1-arquitectura'].studied, 'No se recuperó el progreso tras recargar');

// ---------- Terminal + labs ----------
function evalChecks(lab, history) {
  return lab.checks.map(c => {
    const hay = c.type === 'cmd' ? history.join('\n') : '';
    try { return new RegExp(c.re, 'im').test(hay); } catch (e) { return false; }
  });
}
let terminalLabs = 0, terminalPassed = 0;
LABS.filter(l => l.mode === 'terminal').forEach(lab => {
  terminalLabs++;
  SimTerminal.reset();
  lab.steps.forEach(s => { if (s.cmd) SimTerminal.exec(s.cmd); });
  const res = evalChecks(lab, SimTerminal.history());
  const ok = res.every(Boolean);
  if (ok) terminalPassed++;
  else errors.push('Lab de terminal no validable: ' + lab.id + ' → ' + lab.checks.filter((c, i) => !res[i]).map(c => c.label).join(', '));
});
check(terminalLabs >= 3, 'Se esperan al menos 3 labs de terminal');

// Comandos clave de la simulación (fuera de labs)
SimTerminal.reset();
const probes = [
  ['pwd', 'home/student'],
  ['cat /etc/os-release', 'Debian'],
  ['ls /etc', 'nginx'],
  ['grep -c " 502 " /var/log/nginx/access.log', '40'],
  ['awk \'{print $1}\' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head', '203.0.113.44'],
  ['systemctl status miapp', 'inactive'],
  ['journalctl -u miapp -n 5', 'Cannot find module'],
  ['docker ps', 'web'],
  ['kubectl get pods', 'CrashLoopBackOff'],
  ['ss -tulpn', ':80'],
  ['df -h', '/var'],
  ['chmod 2770 /srv/empresa/compras', ''],
  ['ls -ld /srv/empresa/compras', 'drwxrws---'],
  ['mkdir -p /tmp/a/b && cd /tmp/a/b && pwd', ''],
  ['sudo systemctl start miapp', ''],
  ['systemctl is-active miapp', 'active'],
  ['history', 'pwd']
];
let probeOk = 0;
probes.forEach(([cmd, expect]) => {
  const out = (SimTerminal.exec(cmd).out || '');
  if (!expect || out.toLowerCase().includes(expect.toLowerCase())) probeOk++;
  else errors.push('Terminal: comando "' + cmd + '" no contiene "' + expect + '". Salida: ' + out.slice(0, 120));
});
check(SimTerminal.snapshot().services.miapp.active, 'Terminal: systemctl start no cambió el estado del servicio');

// El modal debe quedar oculto: display:grid del backdrop pisa el atributo hidden
check(require('fs').readFileSync('css/app.css', 'utf8').includes('.modal-backdrop[hidden]'),
  'CSS: falta .modal-backdrop[hidden] (el modal vacío tapa la app al iniciar)');

// Autocompletado y sugerencia de comandos
check(SimTerminal.complete('chm').line === 'chmod ', 'Terminal: Tab no completa "chm" a "chmod"');
check(SimTerminal.complete('cat /etc/os').line === 'cat /etc/os-release', 'Terminal: Tab no completa rutas');
check(SimTerminal.complete('cd /va').line === 'cd /var/', 'Terminal: Tab no completa directorios');
const typoOut = SimTerminal.exec('chmdo 755 archivo').out;
check(typoOut.includes('quizás quisiste decir') && typoOut.includes('chmod'),
  'Terminal: no sugiere el comando correcto ante un typo (salida: ' + typoOut + ')');

// ---------- resultado ----------
console.log('--- Resumen ---');
console.log('Módulos:', COURSE.modules.length, '| Tarjetas:', CARDS.length, '| Preguntas:', QUESTIONS.length);
console.log('Labs:', LABS.length, '(terminal validados: ' + terminalPassed + '/' + terminalLabs + ')', '| Escenarios:', TS.length);
console.log('Clases biblioteca:', LINUX.length, '| Proyecto:', PROJECT.sections.length, 'secciones');
console.log('Comandos de terminal OK:', probeOk + '/' + probes.length);
console.log('Puntaje global simulado:', ov.score + '%');
if (errors.length) {
  console.error('\nERRORES (' + errors.length + '):');
  errors.forEach(e => console.error(' -', e));
  process.exit(1);
}
console.log('\nOK: todas las validaciones pasaron.');
