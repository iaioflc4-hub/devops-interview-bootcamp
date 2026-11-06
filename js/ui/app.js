/* Interfaz de la plataforma: router, vistas y lógica de interacción. */
(function () {
  'use strict';

  var DATA = {
    days: COURSE.days,
    modules: COURSE.modules,
    cheats: COURSE.cheatsheets,
    cards: FLASHCARDS,
    questions: QUESTIONS,
    labs: LABS,
    ts: SCENARIOS,
    project: PROJECT,
    library: window.LINUX_COURSE || []
  };
  var COURSE_VIEW = { MODULES: DATA.modules, labs: DATA.labs, cards: DATA.cards };

  var view = document.getElementById('view');
  var nav = document.getElementById('main-nav');
  var modalBackdrop = document.getElementById('modal-backdrop');
  var toastEl = document.getElementById('toast');
  var interviewPreset = null;
  var reviewKeys = null;
  var tutorCards = [];
  var tutorIndex = 0;

  /* ---------------- helpers ---------------- */
  function esc(s) { return MD.esc(s == null ? '' : s); }
  function q(sel, root) { return (root || document).querySelector(sel); }
  function qa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function byId(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }
  function moduleById(id) { return byId(DATA.modules, id); }
  function dayById(id) { return byId(DATA.days, id); }
  function catClass(cat) {
    var map = { Linux: 'linux', Redes: 'cloud', Git: 'git', Docker: 'docker', 'CI/CD': 'cicd', Cloud: 'cloud', Terraform: 'cloud', Kubernetes: 'k8s', Observabilidad: 'obs', DevSecOps: 'sec', Licencias: 'sec', Troubleshooting: 'obs', Diseño: 'k8s', Entrevista: 'obs' };
    return 'badge-' + (map[cat] || 'linux');
  }
  function fmtDate(ts) {
    if (!ts) return '—';
    var d = new Date(ts);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }
  function fmtInterval(ms) {
    if (ms < 60 * 60 * 1000) return Math.round(ms / 60000) + ' min';
    if (ms < 24 * 60 * 60 * 1000) return Math.round(ms / 3600000) + ' h';
    return Math.round(ms / 86400000) + ' días';
  }
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('Copiado al portapapeles'); },
        function () { toast('No se pudo copiar'); });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast('Copiado'); } catch (e) { toast('No se pudo copiar'); }
      document.body.removeChild(ta);
    }
  }
  function openModal(html) { modalBackdrop.hidden = false; q('#modal').innerHTML = html; }
  function closeModal() { modalBackdrop.hidden = true; q('#modal').innerHTML = ''; }
  function on(sel, ev, fn, root) { qa(sel, root).forEach(function (el) { el.addEventListener(ev, fn); }); }
  function progressBar(pct, cls) {
    return '<div class="bar ' + (cls || '') + '"><i style="width:' + Math.max(0, Math.min(100, pct)) + '%"></i></div>';
  }
  function moduleProgress(m) {
    var p = Store.state.progress[m.id] || {};
    return p.studied ? 100 : 0;
  }
  function dayProgress(day) {
    var mods = day.modules.map(moduleById).filter(Boolean);
    var done = mods.filter(function (m) { return (Store.state.progress[m.id] || {}).studied; }).length;
    return { done: done, total: mods.length, pct: mods.length ? Math.round(done / mods.length * 100) : 0 };
  }
  function tagBadge(tag) {
    var map = { linux: 'Linux', docker: 'Docker', cicd: 'CI/CD', cloud: 'Cloud', k8s: 'K8s', obs: 'Obs', sec: 'Sec', git: 'Git', redes: 'Redes', terraform: 'Terraform' };
    return '<span class="badge badge-' + tag + '">' + (map[tag] || tag) + '</span>';
  }
  function statusBadge(done) {
    return done ? '<span class="badge" style="color:#a7f3d0;border-color:#065f46;background:#041a15">completado</span>'
      : '<span class="badge">pendiente</span>';
  }

  /* ---------------- chrome ---------------- */
  function updateChrome() {
    var o = Store.overall(COURSE_VIEW);
    var raw = Store.rawDayNumber();
    var totalDays = DATA.days.length;
    document.getElementById('pill-day').textContent = raw > totalDays ? 'Repaso · día ' + raw : 'Día ' + Store.dayNumber() + ' / ' + totalDays;
    document.getElementById('pill-streak').textContent = '🔥 ' + Store.streak();
    document.getElementById('pill-xp').textContent = Store.levelInfo().xp + ' XP';
    document.getElementById('side-pct').textContent = o.score + '%';
    document.getElementById('side-bar').style.width = o.score + '%';
    document.getElementById('side-note').textContent = o.modulesDone + '/' + o.modulesTotal + ' módulos · ' + o.labsDone + '/' + o.labsTotal + ' labs';
    var due = Store.dueQueue(DATA.cards).due.length;
    document.getElementById('nav-due').textContent = due;
    var day = dayById(Store.dayNumber());
    document.getElementById('side-goal').textContent = day ? day.objective : '';
    var route = (location.hash.replace(/^#\/?/, '').split('/')[0]) || 'dashboard';
    qa('a', nav).forEach(function (a) {
      var r = a.getAttribute('data-route');
      var active = r === route || (route === 'module' && r === 'roadmap') || (route === 'lab' && r === 'labs') || (route === 'scenario' && r === 'troubleshoot') || (route === 'library' && r === 'library');
      a.classList.toggle('active', active);
    });
  }

  /* ---------------- router ---------------- */
  function parseRoute() {
    var raw = location.hash.replace(/^#\/?/, '');
    return raw.split('/').filter(Boolean);
  }
  function go(hash) { location.hash = hash; }
  function render() {
    var parts = parseRoute();
    var route = parts[0] || 'dashboard';
    if (!location.hash) { location.hash = '#/dashboard'; return; }
    if (reviewKeys) { document.removeEventListener('keydown', reviewKeys); reviewKeys = null; }
    updateChrome();
    window.scrollTo({ top: 0 });
    var v;
    switch (route) {
      case 'dashboard': v = viewDashboard(); break;
      case 'roadmap': v = viewRoadmap(); break;
      case 'module': v = viewModule(parts[1]); break;
      case 'review': v = viewReview(); break;
      case 'labs': v = viewLabs(); break;
      case 'lab': v = viewLab(parts[1]); break;
      case 'terminal': v = viewTerminal(); break;
      case 'troubleshoot': v = viewTroubleshoot(); break;
      case 'scenario': v = viewScenario(parts[1]); break;
      case 'interview': v = viewInterview(); break;
      case 'tutor': v = viewTutor(); break;
      case 'analytics': v = viewAnalytics(); break;
      case 'library': v = viewLibrary(parts[1]); break;
      case 'notes': v = viewNotes(); break;
      case 'project': v = viewProject(); break;
      case 'settings': v = viewSettings(); break;
      default: v = viewDashboard();
    }
    view.innerHTML = v.html;
    if (v.bind) v.bind();
    document.getElementById('sidebar').classList.remove('open');
    updateChrome();
  }

  /* ================= DASHBOARD ================= */
  function viewDashboard() {
    var st = Store.state;
    var o = Store.overall(COURSE_VIEW);
    var day = dayById(Store.dayNumber());
    var mods = day.modules.map(moduleById).filter(Boolean);
    var next = mods.filter(function (m) { return !(st.progress[m.id] || {}).studied; })[0];
    var queue = Store.dueQueue(DATA.cards);
    var due = queue.due.length, fresh = queue.fresh.length;
    var readiness = Store.readiness(COURSE_VIEW);
    var weak = Store.weakTopics(COURSE_VIEW, 4);
    var name = st.settings.name ? ', ' + esc(st.settings.name) : '';
    var raw = Store.rawDayNumber();
    var totalDays = DATA.days.length;
    var dayNote = raw > totalDays
      ? 'El plan de ' + totalDays + ' días terminó. Estás en modo repaso: mantené las tarjetas y hacé simulacros.'
      : 'Ritmo sugerido: 2–3 h por día. Teoría + laboratorio + repaso en la misma sesión.';

    var html = '' +
      '<div class="hero">' +
        '<div class="between" style="align-items:flex-start;gap:1.2rem;flex-wrap:wrap">' +
          '<div style="flex:1;min-width:260px">' +
            '<div class="eyebrow">' + (raw > totalDays ? 'Modo repaso' : 'Día ' + day.id + ' de ' + totalDays) + ' · ' + esc(day.title) + '</div>' +
            '<h2>Hola' + name + ', esto es lo que toca hoy</h2>' +
            '<p>' + dayNote + '</p>' +
            '<div class="hero-actions">' +
              (next ? '<a class="btn btn-primary" href="#/module/' + next.id + '">Continuar: ' + esc(next.title) + '</a>'
                     : '<a class="btn btn-primary" href="#/review">Repasar tarjetas</a>') +
              '<a class="btn" href="#/review">Repaso (' + (due + fresh) + ')</a>' +
              '<a class="btn" href="#/interview">Simular entrevista</a>' +
              '<a class="btn btn-ghost" href="#/labs">Laboratorios</a>' +
            '</div>' +
          '</div>' +
          '<div class="ring" style="--p:' + o.score + '"><div>' + o.score + '%</div></div>' +
        '</div>' +
        '<div class="day-track">' +
          DATA.days.map(function (d) {
            var p = dayProgress(d);
            return '<div class="day-chip ' + (d.id === day.id ? 'active' : '') + ' ' + (p.pct === 100 ? 'done' : '') + '">' +
              '<b>Día ' + d.id + ' · ' + esc(d.title) + '</b>' +
              '<span>' + p.done + '/' + p.total + ' módulos</span>' +
              progressBar(p.pct) + '</div>';
          }).join('') +
        '</div>' +
      '</div>' +

      '<div class="grid g4 mt2">' +
        '<div class="card tight"><div class="side-label">MÓDULOS</div><div class="metric">' + o.modulesDone + '<small>/' + o.modulesTotal + '</small></div><div class="card-sub">estudiados</div></div>' +
        '<div class="card tight"><div class="side-label">LABORATORIOS</div><div class="metric">' + o.labsDone + '<small>/' + o.labsTotal + '</small></div><div class="card-sub">completados</div></div>' +
        '<div class="card tight"><div class="side-label">RETENCIÓN</div><div class="metric">' + o.retention + '<small>%</small></div><div class="card-sub">última pasada de tarjetas</div></div>' +
        '<div class="card tight"><div class="side-label">ENTREVISTAS</div><div class="metric">' + o.interviewAvg + '<small>%</small></div><div class="card-sub">promedio</div></div>' +
      '</div>' +

      '<div class="grid g2 mt2">' +
        '<div class="card">' +
          '<div class="between"><h3>Plan del día</h3><span class="badge">' + esc(day.title) + '</span></div>' +
          '<div class="list mt1">' + mods.map(function (m) {
            var done = !!(st.progress[m.id] || {}).studied;
            return '<a class="list-item" href="#/module/' + m.id + '">' +
              '<span class="' + (done ? 'ok' : 'dim') + '">' + (done ? '✓' : '○') + '</span>' +
              '<span class="grow"><span class="title">' + esc(m.title) + '</span><span class="sub">' + m.minutes + ' min · ' + esc(m.subtitle) + '</span></span>' +
              tagBadge(m.tags[0]) + '</a>';
          }).join('') + '</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="between"><h3>Repaso pendiente</h3><span class="badge">' + due + ' vencidas</span></div>' +
          '<p class="small muted mt1">' + (due + fresh ? 'Tenés ' + due + ' tarjetas vencidas y ' + fresh + ' nuevas. El orden prioriza lo que estás por olvidar.' : 'No hay repasos pendientes. Podés adelantar tarjetas nuevas.') + '</p>' +
          '<div class="row">' +
            (due + fresh ? '<a class="btn btn-primary btn-sm" href="#/review">Empezar repaso</a>' : '') +
            '<button class="btn btn-sm" data-action="start-review-new">10 tarjetas nuevas</button>' +
          '</div>' +
          '<div class="hr"></div>' +
          '<div class="side-label">TEMAS MÁS DÉBILES</div>' +
          '<div class="list mt1">' + (weak.length ? weak.map(function (w) {
            return '<div class="list-item"><span class="grow"><span class="title">' + esc(w.cat) + '</span><span class="sub">' + w.a + ' respuestas</span></span><b class="' + (w.pct < 60 ? 'bad' : w.pct < 80 ? 'warn' : 'ok') + '">' + w.pct + '%</b></div>';
          }).join('') : '<p class="small dim">Respondé preguntas para detectar puntos flojos.</p>') + '</div>' +
        '</div>' +
      '</div>' +

      '<div class="grid g2 mt2">' +
        '<div class="card">' +
          '<h3>Preparación por rol</h3>' +
          '<div class="readiness mt1">' + readiness.map(function (r) {
            return '<div class="ready-item"><b>' + esc(r.role) + '</b><span>' + r.label + ' · ' + r.value + '%</span>' + progressBar(r.value) + '</div>';
          }).join('') + '</div>' +
        '</div>' +
        '<div class="card">' +
          '<h3>Actividad reciente</h3>' +
          (Store.state.activity.length ? '<div class="list mt1">' + Store.state.activity.slice(0, 6).map(function (a) {
            return '<div class="list-item"><span class="grow"><span class="title">' + esc(a.detail) + '</span><span class="sub">' + fmtDate(a.ts) + ' · ' + a.type + '</span></span></div>';
          }).join('') + '</div>' : '<p class="small dim mt1">Todavía no hay actividad. Empezá por el primer módulo.</p>') +
        '</div>' +
      '</div>';

    return {
      html: html,
      bind: function () {
        on('[data-action="start-review-new"]', 'click', function () {
          Store.log('review', 'Repaso de tarjetas nuevas');
          go('#/review');
        });
      }
    };
  }

  /* ================= ROADMAP ================= */
  function viewRoadmap() {
    var st = Store.state;
    var html = '<div class="page-head"><div><div class="eyebrow">Plan intensivo</div><h2>Ruta de aprendizaje</h2>' +
      '<p>' + DATA.days.length + ' días y ' + DATA.modules.length + ' módulos alineados con LPI DevOps Tools Engineer 701-200 y complementados con LFCS, Terraform y Kubernetes. Cada módulo combina teoría, comandos, laboratorio y criterios de dominio. El objetivo no es leer: es poder explicarlo y hacerlo.</p></div>' +
      '<div class="row"><span class="badge">' + Store.overall(COURSE_VIEW).studiedPct + '% completado</span></div></div>';

    html += DATA.days.map(function (d) {
      var p = dayProgress(d);
      var mods = d.modules.map(moduleById).filter(Boolean);
      return '<div class="card mt2">' +
        '<div class="between"><div><div class="eyebrow">Día ' + d.id + ' · ' + esc(d.lpi || '') + (d.weight ? ' · peso ' + d.weight : '') + ' · ' + d.interviewFocus.join(' · ') + '</div>' +
        '<h3>' + esc(d.title) + '</h3><p class="small muted">' + esc(d.objective) + '</p></div>' +
        '<div class="center"><div class="metric">' + p.pct + '<small>%</small></div><div class="card-sub">' + p.done + '/' + p.total + '</div></div></div>' +
        progressBar(p.pct) +
        '<div class="grid g2 mt2">' + mods.map(function (m) {
          var done = (st.progress[m.id] || {}).studied;
          return '<a class="list-item" href="#/module/' + m.id + '">' +
            '<span class="' + (done ? 'ok' : 'dim') + '">' + (done ? '✓' : '○') + '</span>' +
            '<span class="grow"><span class="title">' + esc(m.title) + '</span><span class="sub">' + m.minutes + ' min · ' + m.objectives.length + ' objetivos · ' + (m.labIds || []).length + ' lab(s) · ' + esc(m.lpi || 'sin objetivo LPI') + '</span></span>' +
            tagBadge(m.tags[0]) + '</a>';
        }).join('') + '</div>' +
        '</div>';
    }).join('');

    html += '<div class="callout info mt2"><strong>Regla de oro del plan:</strong> no avances de módulo sin haber hecho el laboratorio y al menos un repaso de tarjetas. Leer no es saber.</div>';
    return { html: html };
  }

  /* ================= MODULE ================= */
  function viewModule(id) {
    var m = moduleById(id);
    if (!m) return { html: '<div class="empty">Módulo no encontrado. <a href="#/roadmap">Volver a la ruta</a></div>' };
    var st = Store.state;
    var p = st.progress[m.id] || {};
    var day = dayById(m.day);
    var cards = DATA.cards.filter(function (c) { return c.module === m.id; });
    var questions = DATA.questions.filter(function (x) { return x.module === m.id; });
    var labs = (m.labIds || []).map(function (lid) { return byId(DATA.labs, lid); }).filter(Boolean);
    var idx = day.modules.indexOf(m.id);
    var prev = idx > 0 ? moduleById(day.modules[idx - 1]) : null;
    var nextInDay = idx >= 0 && idx < day.modules.length - 1 ? moduleById(day.modules[idx + 1]) : null;
    var nextDay = nextInDay ? null : dayById(m.day + 1);
    var nm = nextDay ? moduleById(nextDay.modules[0]) : null;

    var html = '' +
      '<div class="page-head"><div>' +
        '<div class="eyebrow">Día ' + m.day + ' · ' + esc(day.title) + ' · ' + m.minutes + ' min</div>' +
        '<h2>' + esc(m.title) + '</h2><p>' + esc(m.subtitle) + '</p></div>' +
        '<div class="row">' + tagBadge(m.tags[0]) + (m.lpi ? '<span class="badge">' + esc(m.lpi) + '</span>' : '') +
          (p.studied ? '<span class="badge" style="color:#a7f3d0;border-color:#065f46">estudiado</span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="mini-nav">' +
        '<button class="tab active" data-tab="teoria">Teoría</button>' +
        '<button class="tab" data-tab="comandos">Comandos</button>' +
        '<button class="tab" data-tab="practica">Práctica</button>' +
        '<button class="tab" data-tab="dominio">Dominio</button>' +
      '</div>' +

      '<div data-panel="teoria">' +
        '<div class="card"><h3>Objetivos de aprendizaje</h3><ul class="obj-list mt1">' +
          m.objectives.map(function (o) { return '<li>' + esc(o) + '</li>'; }).join('') + '</ul></div>' +
        '<div class="card mt2 prose">' + MD.md(m.theory) +
          '<div class="callout info"><strong>Uso real:</strong> ' + esc(m.realWorld) + '</div>' +
        '</div>' +
        '<div class="card mt2">' +
          '<div class="between"><h3>¿Ya lo dominás?</h3>' +
          '<button class="btn ' + (p.studied ? 'btn-green' : 'btn-primary') + '" data-action="toggle-studied">' +
          (p.studied ? '✓ Marcado como estudiado' : 'Marcar como estudiado') + '</button></div>' +
          '<p class="small dim mt1">Marcar como estudiado no significa dominado: es el registro de que leíste y practicaste. El dominio se mide en el repaso y la entrevista.</p>' +
        '</div>' +
      '</div>' +

      '<div data-panel="comandos" class="hidden">' +
        '<div class="card"><h3>Comandos y ejemplos</h3>' +
        (m.commands.length ? m.commands.map(function (c) {
          return '<div class="cmd mt1"><div class="cmd-head"><code>' + esc(c.cmd) + '</code>' +
            '<button class="copy-btn" data-copy="' + esc(c.cmd) + '">copiar</button></div>' +
            '<div class="cmd-body">' + esc(c.desc) +
            '<pre>' + esc(c.example) + '</pre></div></div>';
        }).join('') : '<p class="small dim mt1">Este módulo es conceptual: la práctica está en el laboratorio y en la entrevista.</p>') +
        '</div>' +
        '<div class="callout warn mt2">En el laboratorio simulado podés probar estos comandos sin riesgo. En tu máquina real, revisá cada comando antes de ejecutarlo.</div>' +
      '</div>' +

      '<div data-panel="practica" class="hidden">' +
        '<div class="card"><h3>Laboratorios del módulo</h3>' +
        (labs.length ? '<div class="list mt1">' + labs.map(function (l) {
          var done = (st.labs[l.id] || {}).done;
          return '<a class="list-item" href="#/lab/' + l.id + '"><span class="' + (done ? 'ok' : 'dim') + '">' + (done ? '✓' : '⌘') + '</span>' +
            '<span class="grow"><span class="title">' + esc(l.title) + '</span><span class="sub">' + l.minutes + ' min · ' + (l.mode === 'terminal' ? 'terminal simulado' : l.mode === 'manual' ? 'máquina real' : 'ejercicio guiado') + '</span></span>' +
            statusBadge(done) + '</a>';
        }).join('') + '</div>' : '<p class="small dim mt1">Sin laboratorio asociado.</p>') +
        '</div>' +
        '<div class="card mt2"><h3>Desafío independiente</h3><p class="small muted">' + esc(m.challenge.prompt) + '</p>' +
        '<div class="side-label mt2">CRITERIOS DE ACEPTACIÓN</div><div class="list mt1">' + m.challenge.criteria.map(function (c, i) {
          var checked = p.challenges && p.challenges[i];
          return '<label class="check-item ' + (checked ? 'done' : '') + '"><input type="checkbox" data-challenge="' + i + '" ' + (checked ? 'checked' : '') + '><span>' + esc(c) + '</span></label>';
        }).join('') + '</div></div>' +
      '</div>' +

      '<div data-panel="dominio" class="hidden">' +
        '<div class="grid g2">' +
          '<div class="card"><h3>Errores frecuentes</h3><ul class="obj-list mt1">' +
            m.mistakes.map(function (x) { return '<li style="--c:#f87171">' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
          '<div class="card"><h3>Criterio de dominio</h3><ul class="obj-list mt1">' +
            m.mastery.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
        '</div>' +
        '<div class="card mt2"><div class="between"><h3>Tarjetas de este módulo</h3>' +
          '<button class="btn btn-sm btn-primary" data-action="review-module">Repasar ' + cards.length + ' tarjetas</button></div>' +
          '<p class="small dim mt1">' + cards.length + ' conceptos en el motor de repetición espaciada.</p></div>' +
        '<div class="card mt2"><div class="between"><h3>Preguntas de entrevista</h3>' +
          (questions.length ? '<button class="btn btn-sm" data-action="interview-module">Simular con estas preguntas</button>' : '') + '</div>' +
          (questions.length ? questions.map(function (x) {
            return '<details class="mt1" style="border:1px solid var(--line-soft);border-radius:8px;padding:.5rem .6rem">' +
              '<summary style="cursor:pointer;font-size:.84rem">' + esc(x.q) + '</summary>' +
              '<p class="small muted mt1">' + esc(x.answer) + '</p>' +
              (x.followUp ? '<p class="tiny dim">Seguimiento: ' + esc(x.followUp) + '</p>' : '') + '</details>';
          }).join('') : '<p class="small dim mt1">Este módulo no tiene preguntas asociadas en el banco.</p>') +
        '</div>' +
      '</div>' +

      '<div class="between mt3">' +
        (prev ? '<a class="btn btn-ghost" href="#/module/' + prev.id + '">← ' + esc(prev.title) + '</a>' : '<span></span>') +
        (nextInDay ? '<a class="btn btn-primary" href="#/module/' + nextInDay.id + '">Siguiente: ' + esc(nextInDay.title) + ' →</a>'
          : (nm ? '<a class="btn btn-primary" href="#/module/' + nm.id + '">Día ' + nextDay.id + ': ' + esc(nextDay.title) + ' →</a>' : '<a class="btn btn-primary" href="#/review">Repasar →</a>')) +
      '</div>';

    return {
      html: html,
      bind: function () {
        on('.mini-nav .tab', 'click', function (e) {
          var tab = e.currentTarget.getAttribute('data-tab');
          qa('.mini-nav .tab').forEach(function (t) { t.classList.toggle('active', t === e.currentTarget); });
          qa('[data-panel]').forEach(function (p2) { p2.classList.toggle('hidden', p2.getAttribute('data-panel') !== tab); });
        });
        on('[data-copy]', 'click', function (e) { copyText(e.currentTarget.getAttribute('data-copy')); });
        on('[data-action="toggle-studied"]', 'click', function () {
          var pr = Store.state.progress[m.id] || {};
          if (pr.studied) {
            delete pr.studied; Store.state.progress[m.id] = pr; Store.save();
            toast('Módulo desmarcado');
          } else {
            Store.markStudied(m.id);
            toast('Módulo registrado. Ahora demostralo en el repaso.');
          }
          render();
        });
        on('[data-challenge]', 'click', function (e) {
          Store.toggleChallenge(m.id, +e.currentTarget.getAttribute('data-challenge'));
        });
        on('[data-action="review-module"]', 'click', function () {
          sessionStorage.setItem('devops-review-module', m.id);
          go('#/review');
        });
        on('[data-action="interview-module"]', 'click', function () {
          interviewPreset = { ids: questions.map(function (x) { return x.id; }), title: m.title };
          go('#/interview');
        });
      }
    };
  }

  /* ================= REVIEW ================= */
  var reviewState = null;
  function buildQueue() {
    var moduleFilter = sessionStorage.getItem('devops-review-module');
    var cards = moduleFilter ? DATA.cards.filter(function (c) { return c.module === moduleFilter; }) : DATA.cards;
    var now = Date.now();
    var due = [], fresh = [];
    cards.forEach(function (c) {
      var s = Store.state.sr[c.id];
      if (!s || !s.reps) fresh.push(c);
      else if (s.due <= now) due.push(c);
    });
    due.sort(function (a, b) { return Store.state.sr[a.id].due - Store.state.sr[b.id].due; });
    fresh.sort(function (a, b) {
      var da = (moduleById(a.module) || {}).day || 9, db = (moduleById(b.module) || {}).day || 9;
      return da - db;
    });
    return { due: due, fresh: fresh, filter: moduleFilter };
  }
  function reviewSummary(s) {
    var total = s.answered;
    var fresh = total - s.again;
    var acc = total ? Math.round(fresh / total * 100) : 0;
    var mins = Math.max(1, Math.round((Date.now() - (s.sessionStart || s.started)) / 60000));
    var next = Store.dueQueue(DATA.cards).due.length;
    return {
      html: '<div class="review-wrap">' +
        '<div class="page-head"><div><div class="eyebrow">Sesión completada</div><h2>Resumen del repaso</h2>' +
        '<p>Terminaste la cola de esta sesión. Lo importante no es la velocidad: es haber recuperado cada respuesta sin mirar.</p></div></div>' +
        '<div class="grid g4">' +
        '<div class="card center"><div class="metric">' + total + '</div><div class="card-sub">respuestas</div></div>' +
        '<div class="card center"><div class="metric">' + acc + '%</div><div class="card-sub">sin "otra vez"</div></div>' +
        '<div class="card center"><div class="metric">' + mins + ' min</div><div class="card-sub">tiempo de sesión</div></div>' +
        '<div class="card center"><div class="metric">' + next + '</div><div class="card-sub">vencidas ahora</div></div>' +
        '</div>' +
        '<div class="card mt2"><h3>Qué sigue</h3><p class="small muted">Las tarjetas calificadas ya tienen nueva fecha. Las marcadas "Otra vez" vuelven en 10 minutos.</p>' +
        '<div class="row mt1"><button class="btn btn-primary" data-action="review-again">Repasar otra tanda</button>' +
        '<a class="btn" href="#/dashboard">Volver al panel</a></div></div>' +
        '<div class="callout info mt2">Atajos durante el repaso: <strong>Espacio</strong> revela y <strong>1–4</strong> califican.</div>' +
        '</div>',
      bind: function () {
        on('[data-action="review-again"]', 'click', function () { reviewState = null; render(); });
      }
    };
  }

  function viewReview() {
    if (!reviewState) {
      var queue = buildQueue();
      reviewState = {
        cards: queue.due.concat(queue.fresh.slice(0, 10)),
        index: 0,
        revealed: false,
        started: Date.now(),
        sessionStart: Date.now(),
        answered: 0,
        again: 0,
        moduleFilter: queue.filter
      };
    }
    var s = reviewState;
    /* Sin este corte, al calificar la última tarjeta s.cards[s.index] es
       undefined y la vista explota (card.id). */
    if (s.answered > 0 && s.index >= s.cards.length) return reviewSummary(s);
    var dueAll = buildQueue();
    var sr = Store.state.sr;
    var reviewed = Object.keys(sr).filter(function (k) { return sr[k].reps > 0; }).length;

    if (!s.cards.length) {
      var upcoming = DATA.cards.filter(function (c) { var x = sr[c.id]; return x && x.reps && x.due > Date.now(); })
        .sort(function (a, b) { return sr[a.id].due - sr[b.id].due; }).slice(0, 6);
      return {
        html: '<div class="review-wrap">' +
          '<div class="page-head"><div><div class="eyebrow">Repetición espaciada</div><h2>Repaso</h2>' +
          '<p>Sin tarjetas pendientes en esta cola. Podés adelantar tarjetas nuevas o volver mañana.</p></div></div>' +
          '<div class="card center"><div class="metric">' + reviewed + '</div><div class="card-sub">conceptos en seguimiento</div>' +
          '<div class="row mt2" style="justify-content:center">' +
          '<button class="btn btn-primary" data-action="new-batch">Estudiar 10 tarjetas nuevas</button>' +
          (s.moduleFilter ? '<button class="btn" data-action="clear-filter">Quitar filtro de módulo</button>' : '') +
          '</div></div>' +
          (upcoming.length ? '<div class="card mt2"><h3>Próximos vencimientos</h3><div class="list mt1">' + upcoming.map(function (c) {
            return '<div class="list-item"><span class="grow"><span class="title">' + esc(c.q) + '</span><span class="sub">' + esc(c.topic) + ' · ' + fmtInterval(sr[c.id].due - Date.now()) + '</span></span><span class="tag">' + esc(c.sub) + '</span></div>';
          }).join('') + '</div></div>' : '') +
          '<div class="callout info mt2">El algoritmo usa intervalos cortos a propósito: preparación de ' + DATA.days.length + ' días. Un "Otra vez" vuelve en 10 minutos; "Bien" arranca en 8 horas.</div>' +
          '</div>',
        bind: function () {
          on('[data-action="new-batch"]', 'click', function () {
            var extra = dueAll.fresh.slice(0, 10);
            if (!extra.length) { toast('No quedan tarjetas nuevas en el banco.'); return; }
            reviewState = { cards: extra, index: 0, revealed: false, started: Date.now(), sessionStart: Date.now(), answered: 0, again: 0, moduleFilter: s.moduleFilter };
            render();
          });
          on('[data-action="clear-filter"]', 'click', function () { sessionStorage.removeItem('devops-review-module'); reviewState = null; render(); });
        }
      };
    }

    var card = s.cards[s.index];
    var state = Store.state.sr[card.id] || { reps: 0, ease: 2.5, interval: 0 };
    var html = '<div class="review-wrap">' +
      '<div class="between"><div><div class="eyebrow">Repaso · ' + (s.index + 1) + ' de ' + s.cards.length + '</div>' +
      '<h2>' + esc(card.topic) + ' · ' + esc(card.sub) + '</h2></div>' +
      '<span class="badge ' + catClass(card.topic) + '">' + esc(card.topic) + '</span></div>' +
      progressBar(Math.round(s.index / s.cards.length * 100)) +
      '<div class="flash mt2">' +
        '<div class="row tiny dim"><span>' + (state.reps ? 'repasada ' + state.reps + ' vez/veces · facilidad ' + state.ease.toFixed(2) : 'tarjeta nueva') + '</span></div>' +
        '<div class="q">' + esc(card.q) + '</div>' +
        (s.revealed ? '<div class="a"><div class="side-label">RESPUESTA ESPERADA</div><p class="mt1">' + esc(card.a) + '</p>' +
          '<div class="callout info"><strong>Ejemplo:</strong><br>' + MD.md(card.example) + '</div>' +
          (card.misconceptions && card.misconceptions.length ? '<div class="callout bad"><strong>Errores típicos:</strong> ' + card.misconceptions.map(esc).join(' · ') + '</div>' : '') +
          '</div>' : '') +
      '</div>' +
      (!s.revealed ? '<button class="btn btn-primary btn-block mt2" data-action="reveal">Mostrar respuesta</button>' +
        '<p class="small dim center mt1">Intentá responder en voz alta antes de revelar: la recuperación activa es lo que consolida.</p>' +
        '<p class="small dim center">Atajo: <strong>Espacio</strong> o <strong>Enter</strong> para revelar.</p>'
        : '<div class="grade-row">' +
          '<button class="grade-btn" data-g="0"><b>Otra vez</b>10 min</button>' +
          '<button class="grade-btn" data-g="1"><b>Difícil</b>20 min</button>' +
          '<button class="grade-btn" data-g="2"><b>Bien</b>' + (state.reps ? 'x' + state.ease.toFixed(1) : '8 h') + '</button>' +
          '<button class="grade-btn" data-g="3"><b>Fácil</b>' + (state.reps ? 'x' + (state.ease * 1.35).toFixed(1) : '1 día') + '</button>' +
        '</div>' +
        '<p class="small dim center mt1">Atajos: <strong>1</strong> Otra vez · <strong>2</strong> Difícil · <strong>3</strong> Bien · <strong>4</strong> Fácil.</p>') +
      '</div>';

    return {
      html: html,
      bind: function () {
        on('[data-action="reveal"]', 'click', function () { s.revealed = true; render(); });
        function grade(g) {
          var elapsed = Date.now() - s.started;
          var updated = Store.review(card.id, g, elapsed);
          s.answered++;
          if (g === 0) { s.again++; s.cards.push(card); }
          s.index++;
          s.revealed = false;
          s.started = Date.now();
          toast(g === 0 ? 'Vuelve en 10 minutos' : 'Próximo repaso en ' + fmtInterval(updated.interval));
          render();
        }
        on('.grade-btn', 'click', function (e) { grade(+e.currentTarget.getAttribute('data-g')); });

        reviewKeys = function (e) {
          if ((parseRoute()[0] || 'dashboard') !== 'review') return;
          var tag = (e.target.tagName || '').toLowerCase();
          if (tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'button' || tag === 'a' || e.target.isContentEditable) return;
          if (!modalBackdrop.hidden) return;
          if (!s.revealed && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); s.revealed = true; render(); return; }
          if (s.revealed && /^[1-4]$/.test(e.key)) { e.preventDefault(); grade(+e.key - 1); }
        };
        document.addEventListener('keydown', reviewKeys);
      }
    };
  }

  /* ================= LABS ================= */
  function viewLabs() {
    var html = '<div class="page-head"><div><div class="eyebrow">Práctica activa</div><h2>Laboratorios</h2>' +
      '<p>' + DATA.labs.length + ' laboratorios: terminal simulado para aprender sin riesgo, misiones reales en tu Ubuntu/WSL2 con validación de evidencia y ejercicios guiados de configuración.</p></div>' +
      '<div class="row"><span class="badge">' + Store.overall(COURSE_VIEW).labsDone + '/' + DATA.labs.length + ' completados</span></div></div>';

    html += '<div class="callout warn"><strong>Seguridad:</strong> el terminal de esta plataforma es simulado y no ejecuta nada en tu equipo. Las misiones "máquina real" son comandos que ejecutás vos, con validación de la salida pegada. Nunca ejecutes comandos destructivos que no entiendas.</div>';

    DATA.days.forEach(function (d) {
      var labs = DATA.labs.filter(function (l) { return l.day === d.id; });
      if (!labs.length) return;
      html += '<div class="card mt2"><div class="between"><h3>Día ' + d.id + ' · ' + esc(d.title) + '</h3><span class="badge">' + labs.filter(function (l) { return (Store.state.labs[l.id] || {}).done; }).length + '/' + labs.length + '</span></div>' +
        '<div class="list mt1">' + labs.map(function (l) {
          var done = (Store.state.labs[l.id] || {}).done;
          var modeLabel = l.mode === 'terminal' ? 'terminal simulado' : l.mode === 'manual' ? 'tu máquina (real)' : 'ejercicio guiado';
          return '<a class="list-item" href="#/lab/' + l.id + '"><span class="' + (done ? 'ok' : 'dim') + '">' + (done ? '✓' : '⌘') + '</span>' +
            '<span class="grow"><span class="title">' + esc(l.title) + '</span><span class="sub">' + l.minutes + ' min · ' + modeLabel + '</span></span>' +
            statusBadge(done) + '</a>';
        }).join('') + '</div></div>';
    });
    return { html: html };
  }

  var termInstance = null;
  function labCheckResults(lab, input) {
    return (lab.checks || []).map(function (c) {
      var hay = '';
      if (c.type === 'cmd') hay = (input.history || []).join('\n');
      else if (c.field) hay = (input.values || {})[c.field] || '';
      else hay = input.text || '';
      var ok;
      try {
        if (c.type === 'forbid') ok = !(new RegExp(c.re, 'im')).test(hay);
        else ok = (new RegExp(c.re, 'im')).test(hay);
      } catch (e) { ok = false; }
      return { label: c.label, hint: c.hint, ok: ok, type: c.type };
    });
  }

  function viewLab(id) {
    var lab = byId(DATA.labs, id);
    if (!lab) return { html: '<div class="empty">Laboratorio no encontrado. <a href="#/labs">Volver</a></div>' };
    var mod = moduleById(lab.moduleId);
    var done = (Store.state.labs[lab.id] || {}).done;
    var modeLabel = lab.mode === 'terminal' ? 'Terminal simulado' : lab.mode === 'manual' ? 'Misión en tu máquina' : 'Ejercicio guiado';
    var html = '<div class="page-head"><div><div class="eyebrow">Día ' + lab.day + ' · ' + modeLabel + ' · ' + lab.minutes + ' min</div>' +
      '<h2>' + esc(lab.title) + '</h2><p>' + esc(lab.objective) + '</p></div>' +
      '<div class="row"><a class="btn btn-ghost btn-sm" href="#/labs">← Labs</a>' + (done ? '<span class="badge ok">completado</span>' : '') + '</div></div>';

    if (lab.safety) html += '<div class="callout warn"><strong>Seguridad:</strong> ' + esc(lab.safety) + '</div>';
    if (lab.mode === 'terminal') {
      html += '<div class="lab-layout">' +
        '<div class="card"><h3>Briefing</h3><div class="prose small">' + MD.md(lab.briefing) + '</div>' +
          '<div class="side-label mt2">PASOS</div><ol class="small muted" style="padding-left:1.2rem">' + lab.steps.map(function (s) {
            return '<li style="margin-bottom:.35rem">' + esc(s.text) + (s.cmd ? ' <code class="tiny">' + esc(s.cmd) + '</code>' : '') + '</li>';
          }).join('') + '</ol>' +
          '<div class="hr"></div><div class="between"><div class="side-label">VALIDACIÓN</div><span class="badge" id="lab-score">0/' + lab.checks.length + '</span></div>' +
          '<ul class="check-list" id="lab-checks">' + lab.checks.map(function (c) {
            return '<li data-check="' + esc(c.label) + '">○ ' + esc(c.label) + '</li>';
          }).join('') + '</ul>' +
          '<div class="row mt2"><button class="btn btn-primary" id="lab-eval">Validar intento</button>' +
          '<button class="btn btn-ghost" id="lab-reset">Reiniciar entorno</button></div>' +
          '<div id="lab-feedback" class="mt2"></div>' +
        '</div>' +
        '<div id="term-host"></div>' +
      '</div>';
    } else {
      html += '<div class="card"><h3>Briefing</h3><div class="prose small">' + MD.md(lab.briefing) + '</div>' +
        '<div class="side-label mt2">' + (lab.mode === 'manual' ? 'COMANDOS A EJECUTAR EN TU ENTORNO' : 'PASOS DEL EJERCICIO') + '</div>' +
        '<ol class="small muted" style="padding-left:1.2rem">' + lab.steps.map(function (s) {
          return '<li style="margin-bottom:.45rem">' + esc(s.text) +
            (s.cmd ? ' <button class="copy-btn" data-copy="' + esc(s.cmd) + '">copiar</button><pre style="margin:.25rem 0 0;background:#040a14;border:1px solid var(--line-soft);border-radius:6px;padding:.4rem;font-size:.74rem;overflow-x:auto">' + esc(s.cmd) + '</pre>' : '') + '</li>';
        }).join('') + '</ol></div>' +
        '<div class="card mt2"><h3>Evidencia y validación</h3>' +
        '<p class="small dim">Pegá la salida real. La validación es determinística: verifica que hayas ejecutado los comandos y obtenido la información esperada.</p>' +
        (lab.fields || []).map(function (f) {
          return '<label class="field"><span>' + esc(f.label) + '</span><textarea data-field="' + f.id + '" placeholder="' + esc(f.placeholder || '') + '"></textarea></label>';
        }).join('') +
        '<div class="row"><button class="btn btn-primary" id="lab-eval">Validar evidencia</button><button class="btn btn-ghost" id="lab-clear">Limpiar</button></div>' +
        '<div id="lab-checks" class="mt2"></div></div>';
    }

    return {
      html: html,
      bind: function () {
        on('[data-copy]', 'click', function (e) { copyText(e.currentTarget.getAttribute('data-copy')); });

        if (lab.mode === 'terminal') {
          SimTerminal.reset();
          mountTerminal(document.getElementById('term-host'), { title: 'lab@debian-lab' });
          var evaluate = function () {
            var results = labCheckResults(lab, { history: SimTerminal.history() });
            var passed = results.filter(function (r) { return r.ok; }).length;
            document.getElementById('lab-score').textContent = passed + '/' + results.length;
            document.getElementById('lab-checks').innerHTML = results.map(function (r) {
              return '<li class="' + (r.ok ? 'pass' : 'fail') + '">' + (r.ok ? '✓' : '○') + ' ' + esc(r.label) + '</li>';
            }).join('');
            var all = passed === results.length;
            Store.labResult(lab.id, all, passed + '/' + results.length);
            document.getElementById('lab-feedback').innerHTML = all
              ? '<div class="callout ok"><strong>Laboratorio completado.</strong> ' + esc(lab.success) + '</div>'
              : '<div class="callout warn"><strong>Faltan pasos (' + passed + '/' + results.length + ').</strong> Revisá los ítems en rojo y volvé a intentar.</div>';
            updateChrome();
            if (all) toast('Laboratorio validado');
          };
          on('#lab-eval', 'click', evaluate);
          on('#lab-reset', 'click', function () { SimTerminal.reset(); toast('Entorno reiniciado'); render(); });
        } else {
          var evaluate2 = function () {
            var values = {};
            qa('[data-field]').forEach(function (t) { values[t.getAttribute('data-field')] = t.value; });
            var text = Object.keys(values).map(function (k) { return values[k]; }).join('\n');
            var results = labCheckResults(lab, { values: values, text: text });
            var passed = results.filter(function (r) { return r.ok; }).length;
            document.getElementById('lab-checks').innerHTML =
              '<div class="between"><div class="side-label">RESULTADO</div><span class="badge">' + passed + '/' + results.length + '</span></div>' +
              '<ul class="check-list">' + results.map(function (r) {
                return '<li class="' + (r.ok ? 'pass' : 'fail') + '">' + (r.ok ? '✓' : '✗') + ' ' + esc(r.label) +
                  (!r.ok ? '<div class="tiny" style="color:#fca5a5">' + esc(r.hint || '') + '</div>' : '') + '</li>';
              }).join('') + '</ul>' +
              (passed === results.length
                ? '<div class="callout ok mt2"><strong>Validado.</strong> ' + esc(lab.success) + '</div>'
                : '<div class="callout warn mt2">Todavía no se valida. Corregí lo indicado y volvé a validar.</div>');
            Store.labResult(lab.id, passed === results.length, passed + '/' + results.length);
            updateChrome();
            if (passed === results.length) toast('Laboratorio validado');
          };
          on('#lab-eval', 'click', evaluate2);
          on('#lab-clear', 'click', function () { qa('[data-field]').forEach(function (t) { t.value = ''; }); qa('[data-field]')[0].focus(); });
        }
      }
    };
  }

  /* ================= TERMINAL ================= */
  function mountTerminal(host, opts) {
    opts = opts || {};
    host.innerHTML = '' +
      '<div class="term">' +
        '<div class="term-bar"><span class="dot" style="background:#f87171"></span><span class="dot" style="background:#fbbf24"></span><span class="dot" style="background:#34d399"></span>' +
        '<span style="margin-left:.5rem">' + esc(opts.title || 'student@debian-lab') + ' · simulado</span></div>' +
        '<div class="term-out" tabindex="0"></div>' +
        '<div class="term-input-row"><span class="term-prompt">' + esc(opts.prompt || 'student@debian-lab:~$') + '</span>' +
        '<input type="text" autocomplete="off" spellcheck="false" aria-label="Comando"></div>' +
      '</div>';
    var out = q('.term-out', host);
    var input = q('.term-input-row input', host);
    var promptEl = q('.term-prompt', host);

    function print(text, cls) {
      var div = document.createElement('div');
      div.className = 'term-line ' + (cls || '');
      div.textContent = text;
      out.appendChild(div);
      out.scrollTop = out.scrollHeight;
    }
    function updatePrompt() {
      var cwd = SimTerminal.cwd();
      promptEl.textContent = 'student@debian-lab:' + (cwd === '/home/student' ? '~' : cwd) + '$';
    }
    if (opts.banner !== false) print(SimTerminal.banner, 'term-dim');
    print('Sugerencia: escribí "help" para ver los comandos disponibles.', 'term-dim');

    var histIdx = null, draft = '';
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var line = input.value;
        input.value = '';
        histIdx = null; draft = '';
        if (!line.trim()) return;
        print((promptEl.textContent + ' ' + line), 'term-cmd');
        if (line.trim() === 'clear') { out.innerHTML = ''; return; }
        var res;
        try { res = SimTerminal.exec(line); }
        catch (err) { res = { out: 'bash: error interno de la simulación: ' + err.message, code: 1 }; }
        if (res.out) print(res.out, res.code ? 'term-err' : '');
        updatePrompt();
        if (opts.onCommand) opts.onCommand(line, res);
      } else if (e.key === 'ArrowUp') {
        var h = SimTerminal.history();
        if (!h.length) return;
        if (histIdx === null) { draft = input.value; histIdx = h.length - 1; }
        else histIdx = Math.max(0, histIdx - 1);
        input.value = h[histIdx];
        e.preventDefault();
        setTimeout(function () { input.setSelectionRange(input.value.length, input.value.length); }, 0);
      } else if (e.key === 'ArrowDown') {
        var hn = SimTerminal.history();
        if (histIdx === null) return;
        if (histIdx < hn.length - 1) { histIdx++; input.value = hn[histIdx]; }
        else { histIdx = null; input.value = draft; }
        e.preventDefault();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        var c = SimTerminal.complete(input.value);
        if (c.options.length === 1) input.value = c.line;
        else if (c.options.length > 1) {
          input.value = c.line;
          print(c.options.join('   '), 'term-dim');
        }
      } else if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault(); out.innerHTML = '';
      } else if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault(); input.value = ''; histIdx = null; draft = '';
        print(promptEl.textContent + ' ^C', 'term-dim');
      }
    });
    updatePrompt();
    input.focus();
    host.addEventListener('click', function () { input.focus(); });
  }

  function viewTerminal() {
    return {
      html: '<div class="page-head"><div><div class="eyebrow">Laboratorio libre</div><h2>Terminal Linux simulado</h2>' +
        '<p>Filesystem virtual con /etc, /var/log, /srv y logs de ejemplo. Probá diagnóstico de servicios, permisos, pipelines de texto, Docker y Kubernetes simulados.</p></div>' +
        '<div class="row"><button class="btn btn-ghost" id="term-clear">Limpiar</button><button class="btn" id="term-reset">Reiniciar entorno</button></div></div>' +
        '<div class="callout warn"><strong>No ejecuta comandos reales.</strong> Es un entorno didáctico. Para práctica real usá el laboratorio de tu máquina (WSL2/Ubuntu).</div>' +
        '<div id="term-host" class="mt2"></div>' +
        '<div class="grid g2 mt2"><div class="card"><h3>Rutas útiles</h3><div class="prose small">' +
        '<ul><li><code>/etc/nginx/nginx.conf</code> · <code>/etc/nginx/sites-enabled/default</code></li>' +
        '<li><code>/etc/ssh/sshd_config</code> · <code>/etc/os-release</code> · <code>/etc/fstab</code></li>' +
        '<li><code>/var/log/nginx/access.log</code> (200 requests, con 502)</li>' +
        '<li><code>/var/log/auth.log</code> (intentos fallidos desde 203.0.113.44)</li>' +
        '<li><code>/srv/empresa/</code> para prácticas de permisos</li></ul></div></div>' +
        '<div class="card"><h3>Desafíos para probar</h3><ol class="small muted" style="padding-left:1.2rem">' +
        '<li>Contá los 502 del access.log con <code>grep -c</code>.</li>' +
        '<li>Encontrá la IP con más requests con <code>awk | sort | uniq -c</code>.</li>' +
        '<li>Revisá por qué nginx devuelve error con <code>systemctl status nginx</code> y <code>journalctl</code>.</li>' +
        '<li>Aplicá <code>chmod 2770 /srv/empresa/compras</code> y verificá con <code>ls -ld</code>.</li>' +
        '<li>Probá <code>docker ps</code>, <code>docker logs web</code>, <code>kubectl get pods</code>.</li></ol></div></div>',
      bind: function () {
        mountTerminal(document.getElementById('term-host'), {});
        on('#term-reset', 'click', function () { SimTerminal.reset(); render(); toast('Entorno reiniciado'); });
        on('#term-clear', 'click', function () { q('.term-out').innerHTML = ''; });
      }
    };
  }

  /* ================= TROUBLESHOOTING ================= */
  function viewTroubleshoot() {
    var solved = DATA.ts.filter(function (t) { return (Store.state.troubleshoot[t.id] || {}).solved; }).length;
    var html = '<div class="page-head"><div><div class="eyebrow">Diagnóstico bajo presión</div><h2>Escenarios de troubleshooting</h2>' +
      '<p>' + DATA.ts.length + ' incidentes realistas con evidencia. Elegí la causa, escribí la resolución y recibí validación con explicación. Es el tipo de ejercicio que más aparece en entrevistas.</p></div>' +
      '<span class="badge">' + solved + '/' + DATA.ts.length + ' resueltos</span></div>' +
      '<div class="grid g2">' + DATA.ts.map(function (t) {
        var s = Store.state.troubleshoot[t.id] || {};
        return '<a class="card" href="#/scenario/' + t.id + '" style="text-decoration:none">' +
          '<div class="between"><span class="badge badge-obs">Escenario</span>' + (s.solved ? '<span class="badge ok">resuelto</span>' : '<span class="badge">' + t.minutes + ' min</span>') + '</div>' +
          '<h3 class="mt1">' + esc(t.title) + '</h3>' +
          '<p class="small muted">' + esc(t.symptom) + '</p>' +
          '<div class="row tiny dim"><span>' + t.questions.length + ' preguntas</span><span>·</span><span>intentos: ' + (s.attempts || 0) + '</span></div>' +
          '</a>';
      }).join('') + '</div>';
    return { html: html };
  }

  function viewScenario(id) {
    var t = byId(DATA.ts, id);
    if (!t) return { html: '<div class="empty">Escenario no encontrado. <a href="#/troubleshoot">Volver</a></div>' };
    var html = '<div class="page-head"><div><div class="eyebrow">Escenario · ' + t.minutes + ' min</div><h2>' + esc(t.title) + '</h2>' +
      '<p>' + esc(t.symptom) + '</p></div><a class="btn btn-ghost btn-sm" href="#/troubleshoot">← Escenarios</a></div>' +
      '<div class="grid g2"><div class="card"><div class="side-label">CONTEXTO</div><div class="prose small mt1">' + MD.md(t.context) + '</div>' +
      '<div class="side-label mt2">EVIDENCIA</div>' + t.evidence.map(function (e) {
        return '<div class="mt1"><div class="tiny dim">' + esc(e.label) + '</div><pre class="mono" style="background:#040a14;border:1px solid var(--line);border-radius:7px;padding:.55rem;font-size:.72rem;overflow-x:auto;white-space:pre-wrap">' + esc(e.body) + '</pre></div>';
      }).join('') + '</div>' +
      '<div><div class="card"><h3>Preguntas de diagnóstico</h3>' +
        t.questions.map(function (qq, qi) {
          return '<div class="mt2" data-question="' + qi + '"><p class="small"><strong>' + (qi + 1) + '.</strong> ' + esc(qq.q) + '</p>' +
            qq.options.map(function (opt, oi) {
              return '<label class="check-item"><input type="radio" name="q' + qi + '" value="' + oi + '"><span>' + esc(opt) + '</span></label>';
            }).join('') + '<div class="tiny" data-explain="' + qi + '"></div></div>';
        }).join('') +
        '<div class="side-label mt2">TU RESOLUCIÓN (comandos y explicación)</div>' +
        '<textarea id="ts-solution" class="mt1" placeholder="Ej: revisé journalctl -u miapp, el servicio estaba caído; lo inicié y verifiqué con curl..."></textarea>' +
        '<div class="row mt1"><button class="btn btn-primary" id="ts-eval">Evaluar resolución</button>' +
        '<button class="btn btn-ghost" id="ts-hints">Ver pistas</button></div>' +
        '<div id="ts-hints-box" class="mt1"></div>' +
        '<div id="ts-result" class="mt2"></div>' +
      '</div>' +
      '<div class="card mt2"><h3>Informe esperado</h3>' +
        '<p class="small dim">Se revela al evaluar. Intentá primero con la evidencia.</p>' +
        '<div id="ts-report" class="hidden"><p class="small"><strong>Causa raíz:</strong> ' + esc(t.rootCause) + '</p>' +
        '<div class="side-label mt1">RESOLUCIÓN</div><pre class="mono" style="background:#040a14;border:1px solid var(--line);border-radius:7px;padding:.55rem;font-size:.72rem;white-space:pre-wrap">' + esc(t.resolution.join('\n')) + '</pre>' +
        '<div class="callout info"><strong>Prevención:</strong> ' + esc(t.prevention) + '</div></div></div></div></div>';

    return {
      html: html,
      bind: function () {
        var hintIdx = 0;
        on('#ts-hints', 'click', function () {
          if (hintIdx >= t.hints.length) { toast('No hay más pistas'); return; }
          var box = document.getElementById('ts-hints-box');
          var div = document.createElement('div');
          div.className = 'callout warn';
          div.textContent = 'Pista ' + (hintIdx + 1) + ': ' + t.hints[hintIdx];
          box.appendChild(div);
          hintIdx++;
        });
        on('#ts-eval', 'click', function () {
          var selections = t.questions.map(function (_, i) {
            var el = q('input[name="q' + i + '"]:checked');
            return el ? +el.value : -1;
          });
          var mcOk = t.questions.filter(function (qq, i) { return selections[i] === qq.correct; }).length;
          t.questions.forEach(function (qq, i) {
            var ex = q('[data-explain="' + i + '"]');
            var ok = selections[i] === qq.correct;
            ex.className = 'callout ' + (ok ? 'ok' : 'bad');
            ex.textContent = (ok ? 'Correcto. ' : 'Incorrecto. ') + qq.explain;
          });
          var sol = document.getElementById('ts-solution').value;
          var solChecks = (t.solutionChecks || []).map(function (c) {
            var ok = false;
            try { ok = new RegExp(c.re, 'im').test(sol); } catch (e) { ok = false; }
            return { ok: ok, label: c.label, hint: c.hint };
          });
          var solOk = solChecks.filter(function (c) { return c.ok; }).length;
          var need = Math.ceil(solChecks.length * 0.6);
          var solved = mcOk === t.questions.length && solOk >= need;
          document.getElementById('ts-result').innerHTML =
            '<div class="callout ' + (solved ? 'ok' : 'warn') + '"><strong>' + (solved ? 'Escenario resuelto.' : 'Todavía no.') + '</strong> ' +
            mcOk + '/' + t.questions.length + ' preguntas correctas · ' + solOk + '/' + solChecks.length + ' pasos de resolución detectados.</div>' +
            '<ul class="check-list">' + solChecks.map(function (c) {
              return '<li class="' + (c.ok ? 'pass' : 'fail') + '">' + (c.ok ? '✓' : '✗') + ' ' + esc(c.label) + (!c.ok ? '<div class="tiny" style="color:#fca5a5">' + esc(c.hint || '') + '</div>' : '') + '</li>';
            }).join('') + '</ul>';
          q('#ts-report').classList.remove('hidden');
          Store.tsResult(t.id, solved, mcOk + '/' + t.questions.length);
          if (solved) toast('Escenario resuelto');
          updateChrome();
        });
      }
    };
  }

  /* ================= INTERVIEW ================= */
  var session = null;
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }
  function scoreAnswer(qq, answer) {
    if (qq.type === 'mc') {
      return { score: qq._selected === qq.correct ? 100 : 0, hit: [], missing: [] };
    }
    var text = String(answer || '').toLowerCase();
    var kws = qq.keywords || [];
    var hit = kws.filter(function (k) { return text.indexOf(String(k).toLowerCase()) > -1; });
    var coverage = kws.length ? hit.length / kws.length : (text.length > 80 ? 1 : 0);
    var words = text.split(/\s+/).filter(Boolean).length;
    var lengthFactor = Math.min(1, words / 30);
    var score = Math.round((coverage * 0.8 + lengthFactor * 0.2) * 100);
    if (qq.dim === 'communication') {
      var structure = ['porque', 'ejemplo', 'primero', 'luego', 'después', 'tradeoff', 'impacto', 'resultado', 'mitig'];
      if (structure.some(function (w) { return text.indexOf(w) > -1; })) score = Math.min(100, score + 10);
    }
    return { score: Math.max(0, Math.min(100, score)), hit: hit, missing: kws.filter(function (k) { return hit.indexOf(k) === -1; }) };
  }
  function startSession(cfg) {
    var pool = DATA.questions.filter(function (qq) {
      if (cfg.cats.length && cfg.cats.indexOf(qq.cat) === -1) return false;
      return qq.level >= cfg.baseLevel - 0 && qq.level <= cfg.baseLevel + 2;
    });
    if (cfg.ids) pool = DATA.questions.filter(function (qq) { return cfg.ids.indexOf(qq.id) > -1; });
    pool = shuffle(pool);
    if (!pool.length) return null;
    return {
      type: cfg.type, cats: cfg.cats, length: Math.min(cfg.length, pool.length), baseLevel: cfg.baseLevel,
      level: cfg.baseLevel, pool: pool, asked: [], results: [], startedAt: Date.now(), answers: [],
      current: null
    };
  }
  function pickNext(s) {
    var used = s.asked;
    var candidates = s.pool.filter(function (qq) { return used.indexOf(qq.id) === -1; });
    if (!candidates.length) candidates = DATA.questions.filter(function (qq) { return used.indexOf(qq.id) === -1 && (!s.cats.length || s.cats.indexOf(qq.cat) > -1); });
    if (!candidates.length) return null;
    var near = candidates.filter(function (qq) { return Math.abs(qq.level - s.level) <= 1; });
    var list = near.length ? near : candidates;
    var dims = s.results.map(function (r) { return r.dim; });
    var preferred = list.filter(function (qq) { return dims.indexOf(qq.dim) === -1; });
    var pickFrom = preferred.length ? preferred : list;
    var qq = pickFrom[Math.floor(Math.random() * pickFrom.length)];
    s.asked.push(qq.id);
    s.current = qq;
    qq._selected = null;
    return qq;
  }

  function viewInterview() {
    if (interviewPreset) {
      var preset = interviewPreset; interviewPreset = null;
      session = startSession({ type: 'Módulo', cats: [], length: preset.ids.length, baseLevel: 1, ids: preset.ids });
      if (session) { pickNext(session); session.presetTitle = preset.title; }
    }

    if (!session) {
      var cats = [];
      DATA.questions.forEach(function (qq) { if (cats.indexOf(qq.cat) === -1) cats.push(qq.cat); });
      var html = '<div class="page-head"><div><div class="eyebrow">Simulacro adaptativo</div><h2>Simulador de entrevista</h2>' +
        '<p>Preguntas abiertas, de comandos, escenarios y análisis de configuración. El nivel se ajusta según tus respuestas y al final recibís un informe con puntaje por dimensión.</p></div></div>' +
        '<div class="grid g2"><div class="card"><h3>Configurar sesión</h3>' +
        '<label class="field mt1"><span>Nivel inicial</span><select id="iv-level">' +
        '<option value="1">Trainee</option><option value="2" selected>Junior</option><option value="3">Junior avanzado</option><option value="4">Semi-senior</option></select></label>' +
        '<label class="field"><span>Cantidad de preguntas</span><select id="iv-length"><option>6</option><option selected>10</option><option>14</option></select></label>' +
        '<div class="side-label">ÁREAS</div><div class="row mt1" style="gap:.3rem">' +
        '<button class="tab active" data-cat="all">Todas</button>' + cats.map(function (c) { return '<button class="tab" data-cat="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>' +
        '<p class="tiny dim mt1">Sin selección manual se usan todas las áreas. El banco tiene ' + DATA.questions.length + ' preguntas.</p>' +
        '<button class="btn btn-primary btn-block mt2" id="iv-start">Comenzar entrevista</button></div>' +
        '<div class="card"><h3>Qué se evalúa</h3><div class="prose small">' +
        '<ul><li><strong>Precisión técnica (30%)</strong>: conceptos y comandos correctos.</li>' +
        '<li><strong>Resolución de problemas (25%)</strong>: método y pasos.</li>' +
        '<li><strong>Troubleshooting (20%)</strong>: hipótesis y evidencia.</li>' +
        '<li><strong>Arquitectura (15%)</strong>: tradeoffs y diseño.</li>' +
        '<li><strong>Comunicación (10%)</strong>: estructura y claridad.</li></ul>' +
        '<p>Últimas sesiones: ' + (Store.state.interviews.length ? Store.state.interviews.slice(0, 3).map(function (s) { return s.score + '%'; }).join(' · ') : 'sin registros') + '.</p></div>' +
        '<div class="callout info">Respondé como en una entrevista real: 60–90 segundos, primero la idea central y después el ejemplo.</div></div></div>';
      return {
        html: html,
        bind: function () {
          var selected = [];
          on('[data-cat]', 'click', function (e) {
            var cat = e.currentTarget.getAttribute('data-cat');
            if (cat === 'all') { selected = []; qa('[data-cat]').forEach(function (b) { b.classList.toggle('active', b === e.currentTarget); }); return; }
            e.currentTarget.classList.toggle('active');
            var idx = selected.indexOf(cat);
            if (idx > -1) selected.splice(idx, 1); else selected.push(cat);
          });
          on('#iv-start', 'click', function () {
            session = startSession({
              type: 'Mixta', cats: selected, length: +q('#iv-length').value,
              baseLevel: +q('#iv-level').value
            });
            if (!session) { toast('No hay preguntas para esa combinación'); return; }
            pickNext(session);
            render();
          });
        }
      };
    }

    if (session.done) return interviewReport();

    var s = session;
    var qq = s.current;
    if (!qq) { pickNext(s); qq = s.current; if (!qq) { s.done = true; return interviewReport(); } }
    var pos = s.results.length + 1;
    var html = '<div class="page-head"><div><div class="eyebrow">Entrevista · pregunta ' + pos + ' de ' + s.length + ' · nivel ' + s.level + '</div>' +
      '<h2>' + esc(qq.cat) + ' · ' + esc(qq.dim === 'accuracy' ? 'precisión técnica' : qq.dim === 'problem' ? 'resolución de problemas' : qq.dim === 'troubleshoot' ? 'troubleshooting' : qq.dim === 'architecture' ? 'arquitectura' : 'comunicación') + '</h2></div>' +
      '<button class="btn btn-ghost btn-sm" id="iv-abort">Terminar</button></div>' +
      progressBar(Math.round((pos - 1) / s.length * 100)) +
      '<div class="qcard mt2"><div class="row tiny dim"><span class="badge ' + catClass(qq.cat) + '">' + esc(qq.cat) + '</span><span>nivel ' + qq.level + '</span><span>·</span><span>' + esc(qq.type) + '</span></div>' +
      '<div class="quote mt1">' + esc(qq.q) + '</div>' +
      (qq.type === 'mc'
        ? '<div id="iv-options">' + qq.options.map(function (o, i) {
            return '<label class="check-item"><input type="radio" name="iv-opt" value="' + i + '"><span>' + esc(o) + '</span></label>';
          }).join('') + '</div>'
        : '<label class="field"><span>Tu respuesta</span><textarea id="iv-answer" placeholder="Respondé como en la entrevista: idea central, ejemplo y verificación..."></textarea></label>') +
      '<div class="row"><button class="btn btn-primary" id="iv-submit">Enviar respuesta</button><span class="tiny dim">Sin apuro, pero sin divagar: 60–90 segundos.</span></div>' +
      '<div id="iv-feedback" class="mt2"></div></div>' +
      '<div class="card mt2"><div class="side-label">PROGRESO</div><div class="row mt1">' +
      s.results.map(function (r) { return '<span class="badge ' + (r.score >= 70 ? 'ok' : r.score >= 40 ? 'warn' : 'bad') + '">' + esc(r.cat) + ' ' + r.score + '</span>'; }).join('') +
      '</div></div>';

    return {
      html: html,
      bind: function () {
        on('#iv-abort', 'click', function () {
          if (!confirm('¿Terminar la entrevista y ver el informe con lo respondido?')) return;
          s.done = true; render();
        });
        on('#iv-submit', 'click', function () {
          var answer = '';
          if (qq.type === 'mc') {
            var sel = q('input[name="iv-opt"]:checked');
            if (!sel) { toast('Elegí una opción'); return; }
            qq._selected = +sel.value;
            answer = qq.options[qq._selected];
          } else {
            answer = (document.getElementById('iv-answer') || {}).value || '';
            if (answer.trim().length < 12) { toast('Escribí una respuesta un poco más completa'); return; }
          }
          var res = scoreAnswer(qq, answer);
          var result = {
            id: qq.id, cat: qq.cat, dim: qq.dim, level: qq.level, score: res.score,
            hit: res.hit, missing: res.missing, question: qq.q, answer: answer, model: qq.answer
          };
          s.results.push(result);
          s.answers.push(result);
          if (res.score >= 75) s.level = Math.min(4, s.level + 1);
          else if (res.score < 50) s.level = Math.max(1, s.level - 1);

          var fb = document.getElementById('iv-feedback');
          fb.innerHTML = '<div class="callout ' + (res.score >= 70 ? 'ok' : res.score >= 40 ? 'warn' : 'bad') + '"><strong>Puntaje: ' + res.score + '/100</strong> · ' +
            (res.score >= 70 ? 'Respuesta sólida.' : res.score >= 40 ? 'Parcial: faltó profundidad.' : 'Insuficiente para el nivel.') + '</div>' +
            (qq.type !== 'mc' && res.hit.length ? '<p class="small"><strong>Detectado:</strong> ' + res.hit.map(esc).join(', ') + '</p>' : '') +
            (qq.type !== 'mc' && res.missing.length ? '<p class="small"><strong>Faltó mencionar:</strong> ' + res.missing.map(esc).join(', ') + '</p>' : '') +
            '<div class="callout info"><strong>Respuesta modelo:</strong> ' + esc(qq.answer) + '</div>' +
            (qq.followUp ? '<p class="small muted"><strong>Seguimiento del entrevistador:</strong> ' + esc(qq.followUp) + '</p>' : '') +
            '<div class="row mt1">' + (AI.enabled() ? '<button class="btn btn-sm" id="iv-ai">Pedir feedback a la IA</button>' : '') +
            '<button class="btn btn-primary btn-sm" id="iv-next">' + (s.results.length >= s.length ? 'Ver informe final' : 'Siguiente pregunta') + '</button></div>' +
            '<div id="iv-ai-out" class="small mt1"></div>';
          on('#iv-next', 'click', function () {
            if (s.results.length >= s.length) { s.done = true; render(); return; }
            pickNext(s); render();
          });
          on('#iv-ai', 'click', async function () {
            var out = document.getElementById('iv-ai-out');
            out.innerHTML = '<span class="dim">Consultando IA…</span>';
            var r = await AI.evaluate(qq.q, answer, qq.answer);
            out.innerHTML = r.ok ? '<div class="callout info"><div style="white-space:pre-wrap">' + esc(r.text) + '</div></div>'
              : '<div class="callout bad">' + esc(r.error || 'Error de IA') + '</div>';
          });
          updateChrome();
        });
      }
    };
  }

  function interviewReport() {
    var s = session;
    var dims = { accuracy: [], problem: [], troubleshoot: [], architecture: [], communication: [] };
    s.results.forEach(function (r) { (dims[r.dim] || dims.accuracy).push(r.score); });
    var weights = { accuracy: 0.30, problem: 0.25, troubleshoot: 0.20, architecture: 0.15, communication: 0.10 };
    var totalW = 0, weighted = 0;
    Object.keys(dims).forEach(function (d) {
      if (dims[d].length) {
        var avg = dims[d].reduce(function (a, b) { return a + b; }, 0) / dims[d].length;
        weighted += avg * weights[d];
        totalW += weights[d];
      }
    });
    var overall = s.results.length ? Math.round(totalW ? weighted / totalW : 0) : 0;
    var catMap = {};
    s.results.forEach(function (r) {
      catMap[r.cat] = catMap[r.cat] || { sum: 0, n: 0 };
      catMap[r.cat].sum += r.score; catMap[r.cat].n++;
    });
    var cats = Object.keys(catMap).map(function (c) { return { cat: c, score: Math.round(catMap[c].sum / catMap[c].n) }; }).sort(function (a, b) { return b.score - a.score; });
    var wrong = s.results.filter(function (r) { return r.score < 60; });
    var sessionId = 'iv' + Date.now();
    var last = Store.state.interviews[0];
    if (!last || last.id !== sessionId) {
      Store.saveInterview({
        id: sessionId, date: new Date().toISOString(), type: s.presetTitle ? 'Módulo: ' + s.presetTitle : 'Mixta',
        score: overall, breakdown: Object.keys(dims).reduce(function (acc, d) {
          acc[d] = dims[d].length ? Math.round(dims[d].reduce(function (a, b) { return a + b; }, 0) / dims[d].length) : null;
          return acc;
        }, {}),
        answers: s.results.map(function (r) { return { id: r.id, q: r.question, score: r.score, cat: r.cat }; }),
        categories: cats
      });
    }
    var readiness = Store.readiness(COURSE_VIEW);
    var html = '<div class="page-head"><div><div class="eyebrow">Informe de entrevista</div><h2>Resultado del simulacro</h2>' +
      '<p>' + s.results.length + ' preguntas respondidas · ' + Math.round((Date.now() - s.startedAt) / 60000) + ' minutos · evaluado con rúbrica determinística.</p></div>' +
      '<button class="btn" id="iv-new">Nueva entrevista</button></div>' +
      '<div class="grid g2"><div class="card"><div class="report-grid"><div class="center"><div class="big-score">' + overall + '</div><div class="card-sub">/100 global</div></div>' +
      '<div>' + Object.keys(dims).map(function (d) {
        var avg = dims[d].length ? Math.round(dims[d].reduce(function (a, b) { return a + b; }, 0) / dims[d].length) : null;
        var labels = { accuracy: 'Precisión técnica (30%)', problem: 'Resolución (25%)', troubleshoot: 'Troubleshooting (20%)', architecture: 'Arquitectura (15%)', communication: 'Comunicación (10%)' };
        return '<div class="score-row"><span class="lbl">' + labels[d] + '</span>' + progressBar(avg == null ? 0 : avg) + '<span class="val">' + (avg == null ? '—' : avg) + '</span></div>';
      }).join('') + '</div></div>' +
      '<div class="hr"></div><p class="small muted">' + (overall >= 75 ? 'Nivel de entrevista junior sólido. Seguí con simulacros de troubleshooting y arquitectura.' :
        overall >= 55 ? 'Base correcta con huecos. Reforzá los temas con menor puntaje y repetí el simulacro en 24 h.' :
        'Todavía insuficiente para entrevista. Volvé a los módulos de los temas bajos, hacé los laboratorios y repetí.') + '</p></div>' +
      '<div class="card"><h3>Por categoría</h3><div class="mt1">' + cats.map(function (c) {
        return '<div class="cat-bar"><div class="between"><span>' + esc(c.cat) + '</span><span class="tiny ' + (c.score >= 70 ? 'ok' : c.score >= 40 ? 'warn' : 'bad') + '">' + c.score + '%</span></div>' + progressBar(c.score) + '</div>';
      }).join('') + '</div>' +
      '<div class="side-label mt2">PREPARACIÓN POR ROL</div>' + readiness.map(function (r) {
        return '<div class="ready-item mt1"><b>' + esc(r.role) + '</b><span>' + r.label + ' · ' + r.value + '%</span>' + progressBar(r.value) + '</div>';
      }).join('') + '</div></div>' +
      '<div class="card mt2"><h3>Fortalezas y brechas</h3><div class="grid g2 mt1">' +
      '<div><div class="side-label ok">MEJOR</div><ul class="obj-list mt1">' + cats.slice(0, 3).map(function (c) { return '<li>' + esc(c.cat) + ' · ' + c.score + '%</li>'; }).join('') + '</ul></div>' +
      '<div><div class="side-label bad">A REFORZAR</div><ul class="obj-list mt1">' + (cats.slice(-3).map(function (c) { return '<li>' + esc(c.cat) + ' · ' + c.score + '%</li>'; }).join('') || '<li>Sin datos</li>') + '</ul></div></div>' +
      '<div class="hr"></div><div class="side-label">RESPUESTAS A REVISAR</div>' +
      (wrong.length ? wrong.map(function (r) {
        return '<details class="mt1" style="border:1px solid var(--line-soft);border-radius:8px;padding:.5rem .6rem"><summary style="cursor:pointer;font-size:.82rem">[' + r.score + '] ' + esc(r.question) + '</summary>' +
          '<p class="small muted mt1"><strong>Tu respuesta:</strong> ' + esc(r.answer || '(vacía)') + '</p>' +
          '<p class="small"><strong>Respuesta esperada:</strong> ' + esc(r.model) + '</p></details>';
      }).join('') : '<p class="small dim mt1">Sin respuestas por debajo de 60. Muy bien.</p>') + '</div>';

    return {
      html: html,
      bind: function () {
        on('#iv-new', 'click', function () { session = null; render(); });
      }
    };
  }

  /* ================= TUTOR ================= */
  function viewTutor() {
    var modules = DATA.modules;
    if (!tutorCards.length) {
      var first = modules[0];
      tutorCards = DATA.cards.filter(function (c) { return c.module === first.id; });
      tutorIndex = 0;
    }
    var current = tutorCards[tutorIndex] || null;
    var html = '<div class="page-head"><div><div class="eyebrow">Tutor interactivo</div><h2>Aprender conversando</h2>' +
      '<p>El tutor explica, pregunta de a una y evalúa tu respuesta con el material del curso. Funciona sin IA; si configurás un proveedor, podés pedir feedback extendido.</p></div></div>' +
      '<div class="split"><div class="card"><div class="side-label">ELEGIR TEMA</div><div class="side-list mt1">' +
      modules.map(function (m) {
        return '<button data-tutor-module="' + m.id + '" class="' + (tutorCards.length && tutorCards[0].module === m.id ? 'active' : '') + '">Día ' + m.day + ' · ' + esc(m.title) + '</button>';
      }).join('') + '</div></div>' +
      '<div class="card"><div class="side-label">DIÁLOGO</div>' +
      (current ? '<div class="prose small mt1"><p><strong>Tutor:</strong> Vamos a trabajar <em>' + esc(current.sub) + '</em> dentro de ' + esc(current.topic) + '. Primero te pregunto y después corrijo: no leas la respuesta antes de intentarlo.</p>' +
        '<div class="card tight mt2" style="background:#08131f"><strong>Pregunta:</strong> ' + esc(current.q) + '</div>' +
        '<label class="field mt2"><span>Tu respuesta</span><textarea id="tutor-answer" placeholder="Explicá con tus palabras; si no sabés, escribí lo que recordás."></textarea></label>' +
        '<div class="row"><button class="btn btn-primary" id="tutor-eval">Evaluar respuesta</button>' +
        '<button class="btn btn-ghost" id="tutor-reveal">Ver explicación</button>' +
        '<button class="btn btn-ghost" id="tutor-next">Siguiente tarjeta</button></div>' +
        '<div id="tutor-feedback" class="mt2"></div>' +
        (AI.enabled() ? '<button class="btn btn-sm mt2" id="tutor-ai">Consultar IA con mi respuesta</button><div id="tutor-ai-out" class="small mt1"></div>' : '') +
        '</div>' : '<p class="small dim mt1">No hay tarjetas para este módulo.</p>') +
      '</div></div>';

    return {
      html: html,
      bind: function () {
        on('[data-tutor-module]', 'click', function (e) {
          var mid = e.currentTarget.getAttribute('data-tutor-module');
          tutorCards = DATA.cards.filter(function (c) { return c.module === mid; });
          tutorIndex = 0;
          render();
        });
        var answerEl = () => document.getElementById('tutor-answer');
        on('#tutor-reveal', 'click', function () {
          var fb = document.getElementById('tutor-feedback');
          fb.innerHTML = '<div class="callout info"><strong>Explicación:</strong> ' + esc(current.a) + '</div>' +
            '<div class="callout"><strong>Ejemplo:</strong><br>' + MD.md(current.example) + '</div>' +
            (current.misconceptions.length ? '<div class="callout bad"><strong>Cuidado con:</strong> ' + current.misconceptions.map(esc).join(' · ') + '</div>' : '');
        });
        on('#tutor-eval', 'click', function () {
          var ans = (answerEl() || {}).value || '';
          if (ans.trim().length < 8) { toast('Escribí tu respuesta primero'); return; }
          var text = ans.toLowerCase();
          var words = (current.a.toLowerCase().match(/[a-záéíóúñ]{5,}/g) || []).filter(function (w, i, arr) { return arr.indexOf(w) === i; });
          var hits = words.filter(function (w) { return text.indexOf(w) > -1; });
          var coverage = words.length ? hits.length / Math.min(words.length, 10) : 0;
          var good = coverage >= 0.18 || text.length > 160;
          var fb = document.getElementById('tutor-feedback');
          fb.innerHTML = '<div class="callout ' + (good ? 'ok' : 'warn') + '"><strong>' + (good ? 'Vas bien.' : 'Falta precisión.') + '</strong> ' +
            (good ? 'Tu respuesta cubre los conceptos centrales. Afiná estos detalles:' : 'Compará con la respuesta esperada y reformulá.') + '</div>' +
            '<div class="callout info"><strong>Respuesta esperada:</strong> ' + esc(current.a) + '</div>' +
            '<div class="callout"><strong>Ejemplo:</strong><br>' + MD.md(current.example) + '</div>' +
            '<p class="tiny dim">Tutor sin IA: evaluación por cobertura de conceptos. Configurá un proveedor en Ajustes para feedback semántico.</p>';
        });
        on('#tutor-next', 'click', function () {
          if (tutorIndex + 1 >= tutorCards.length) { toast('Última tarjeta del módulo'); return; }
          tutorIndex++;
          render();
        });
        on('#tutor-ai', 'click', async function () {
          var out = document.getElementById('tutor-ai-out');
          var ans = (answerEl() || {}).value || '';
          out.innerHTML = '<span class="dim">Consultando…</span>';
          var mod = moduleById(current.module);
          var r = await AI.tutor('evaluar respuesta del alumno', mod ? mod.title : current.topic, current.a + ' ' + current.example, ans);
          out.innerHTML = r.ok ? '<div class="callout info" style="white-space:pre-wrap">' + esc(r.text) + '</div>' : '<div class="callout bad">' + esc(r.error) + '</div>';
        });
      }
    };
  }

  /* ================= ANALYTICS ================= */
  function viewAnalytics() {
    var o = Store.overall(COURSE_VIEW);
    var st = Store.state;
    var cats = Object.keys(st.stats.byCategory).map(function (c) {
      return { cat: c, pct: Math.round(st.stats.byCategory[c].c / st.stats.byCategory[c].a * 100), a: st.stats.byCategory[c].a };
    }).sort(function (a, b) { return b.a - a.a; });
    var sr = st.sr;
    var cardStates = { nueva: 0, aprendiendo: 0, consolidada: 0 };
    DATA.cards.forEach(function (c) {
      var s = sr[c.id];
      if (!s || !s.reps) cardStates.nueva++;
      else if (s.reps < 3 || s.lastGrade === 0) cardStates.aprendiendo++;
      else cardStates.consolidada++;
    });
    var last30 = [];
    for (var i = 29; i >= 0; i--) {
      var d = new Date(Date.now() - i * 86400000);
      var iso = Store.today(d);
      var count = st.streak.days.indexOf(iso) > -1 ? 1 : 0;
      last30.push({ iso: iso, active: count, day: d.getDate() });
    }
    var upcoming = DATA.cards.map(function (c) { return { c: c, s: sr[c.id] }; })
      .filter(function (x) { return x.s && x.s.reps && x.s.due > Date.now(); })
      .sort(function (a, b) { return a.s.due - b.s.due; }).slice(0, 8);

    var html = '<div class="page-head"><div><div class="eyebrow">Datos de tu preparación</div><h2>Analítica</h2>' +
      '<p>Todo se calcula sobre tu actividad local. No se envía nada a ningún servidor.</p></div></div>' +
      '<div class="grid g4">' +
      '<div class="card tight"><div class="side-label">PUNTAJE GLOBAL</div><div class="metric">' + o.score + '<small>%</small></div>' + progressBar(o.score) + '</div>' +
      '<div class="card tight"><div class="side-label">TARJETAS REPASADAS</div><div class="metric">' + o.cardsReviewed + '<small>/' + DATA.cards.length + '</small></div><div class="card-sub">' + cardStates.consolidada + ' consolidadas</div></div>' +
      '<div class="card tight"><div class="side-label">RESPUESTAS</div><div class="metric">' + st.stats.answered + '</div><div class="card-sub">' + (st.stats.answered ? Math.round(st.stats.correct / st.stats.answered * 100) : 0) + '% correctas</div></div>' +
      '<div class="card tight"><div class="side-label">RACHA</div><div class="metric">' + Store.streak() + '<small>días</small></div><div class="card-sub">nivel ' + Store.levelInfo().level + ' · ' + st.xp + ' XP</div></div>' +
      '</div>' +
      '<div class="grid g2 mt2"><div class="card"><h3>Precisión por categoría</h3>' +
      (cats.length ? cats.map(function (c) {
        return '<div class="cat-bar mt1"><div class="between"><span class="small">' + esc(c.cat) + '</span><span class="tiny ' + (c.pct >= 70 ? 'ok' : c.pct >= 40 ? 'warn' : 'bad') + '">' + c.pct + '% · ' + c.a + ' resp.</span></div>' + progressBar(c.pct) + '</div>';
      }).join('') : '<p class="small dim mt1">Sin respuestas registradas todavía.</p>') +
      '<div class="hr"></div><div class="side-label">ESTADO DEL REPASO</div>' +
      '<div class="row mt1"><span class="badge">nuevas ' + cardStates.nueva + '</span><span class="badge warn">aprendiendo ' + cardStates.aprendiendo + '</span><span class="badge ok">consolidadas ' + cardStates.consolidada + '</span></div></div>' +
      '<div class="card"><h3>Constancia (30 días)</h3><div class="heat">' + last30.map(function (d) {
        return '<i class="' + (d.active ? 'l2' : '') + '" title="' + d.iso + '"></i>';
      }).join('') + '</div>' +
      '<p class="tiny dim mt1">Cada celda es un día con actividad. La constancia importa más que la duración de una sesión.</p>' +
      '<div class="hr"></div><div class="side-label">PRÓXIMOS REPASOS</div>' +
      (upcoming.length ? '<div class="list mt1">' + upcoming.map(function (x) {
        return '<div class="list-item"><span class="grow"><span class="title">' + esc(x.c.q) + '</span><span class="sub">' + esc(x.c.topic) + ' · ' + fmtInterval(x.s.due - Date.now()) + '</span></span></div>';
      }).join('') + '</div>' : '<p class="small dim mt1">Nada programado.</p>') + '</div></div>' +
      '<div class="card mt2"><div class="between"><h3>Historial de entrevistas</h3><span class="badge">' + st.interviews.length + '</span></div>' +
      (st.interviews.length ? '<table class="tbl mt1"><thead><tr><th>Fecha</th><th>Tipo</th><th>Puntaje</th><th>Mejor categoría</th></tr></thead><tbody>' +
        st.interviews.slice(0, 10).map(function (s) {
          var best = (s.categories || [])[0];
          return '<tr><td>' + fmtDate(s.date) + '</td><td>' + esc(s.type) + '</td><td><strong>' + s.score + '</strong>/100</td><td>' + (best ? esc(best.cat) + ' · ' + best.score + '%' : '—') + '</td></tr>';
        }).join('') + '</tbody></table>' : '<p class="small dim mt1">Todavía no hiciste simulacros.</p>') + '</div>' +
      '<div class="card mt2"><h3>Actividad completa</h3><div class="list mt1" style="max-height:340px;overflow:auto">' +
      (st.activity.length ? st.activity.slice(0, 60).map(function (a) {
        return '<div class="list-item"><span class="tag">' + a.type + '</span><span class="grow"><span class="title">' + esc(a.detail) + '</span><span class="sub">' + fmtDate(a.ts) + '</span></span></div>';
      }).join('') : '<p class="small dim">Sin actividad.</p>') + '</div></div>';
    return { html: html };
  }

  /* ================= LIBRARY ================= */
  function viewLibrary(id) {
    var classes = DATA.library;
    var selected = id ? +id : (classes[0] || {}).id;
    var cls = classes.filter(function (c) { return c.id === selected; })[0] || classes[0];
    var html = '<div class="page-head"><div><div class="eyebrow">Material fuente · Diplomado Linux UTN-FRD</div><h2>Biblioteca Linux</h2>' +
      '<p>24 clases del diplomado con teoría profunda y comandos. Se incluyen como referencia: complementan los módulos y sirven para preparar preguntas de Linux más específicas.</p></div></div>' +
      '<div class="split"><div class="card"><input type="text" id="lib-search" class="search-box" placeholder="Buscar en 24 clases...">' +
      '<div class="side-list" id="lib-list">' + classes.map(function (c) {
        return '<button data-lib="' + c.id + '" class="' + (c.id === selected ? 'active' : '') + '">' + esc(c.title.replace(/^Clase \d+: /, 'Clase ' + c.id + ': ')) + '</button>';
      }).join('') + '</div></div>' +
      '<div class="card">' +
      (cls ? '<div class="row tiny dim"><span class="badge">Clase ' + cls.id + '</span>' + (cls.date ? '<span>' + esc(cls.date) + '</span>' : '') + '</div>' +
        '<h2 class="mt1" style="font-size:1.2rem">' + esc(cls.title) + '</h2>' +
        '<div class="prose small">' + MD.md(cls.intro) + '</div>' +
        '<div class="hr"></div><div class="side-label">TEORÍA DEL DIPLOMADO</div>' +
        '<div class="prose small">' + MD.md(cls.theory_deep) + '</div>' +
        (cls.commands_deep && cls.commands_deep.length ? '<div class="side-label mt2">COMANDOS</div>' + cls.commands_deep.map(function (c) {
          return '<div class="cmd mt1"><div class="cmd-head"><code>' + esc(c.cmd) + '</code><button class="copy-btn" data-copy="' + esc(c.cmd) + '">copiar</button></div>' +
            '<div class="cmd-body">' + esc(c.desc) + (c.flags ? '<div class="tiny dim mt1">Flags: ' + esc(c.flags) + '</div>' : '') +
            '<pre>' + esc(c.example || '') + '</pre>' + (c.why ? '<div class="tiny dim">Por qué: ' + esc(c.why) + '</div>' : '') + '</div></div>';
        }).join('') : '') +
        (cls.lab_guide ? '<div class="side-label mt2">LABORATORIO DE LA CLASE</div><div class="prose small">' + MD.md(cls.lab_guide) + '</div>' : '') +
        '<div class="callout info mt2">Este material pertenece al curso original y se muestra solo como consulta. La evaluación y las tarjetas de esta plataforma usan el currículo DevOps de ' + DATA.days.length + ' días (LPI 701-200).</div>'
        : '<div class="empty">Sin clases cargadas.</div>') +
      '</div></div>';

    return {
      html: html,
      bind: function () {
        on('[data-lib]', 'click', function (e) { go('#/library/' + e.currentTarget.getAttribute('data-lib')); });
        on('[data-copy]', 'click', function (e) { copyText(e.currentTarget.getAttribute('data-copy')); });
        var search = document.getElementById('lib-search');
        if (search) search.addEventListener('input', function () {
          var term = search.value.toLowerCase().trim();
          qa('#lib-list button').forEach(function (b) {
            var c = classes.filter(function (x) { return x.id === +b.getAttribute('data-lib'); })[0];
            var hay = (c.title + ' ' + c.intro + ' ' + c.theory_deep + ' ' + JSON.stringify(c.commands_deep || [])).toLowerCase();
            b.style.display = !term || hay.indexOf(term) > -1 ? '' : 'none';
          });
        });
      }
    };
  }

  /* ================= NOTES ================= */
  function viewNotes() {
    var st = Store.state;
    var html = '<div class="page-head"><div><div class="eyebrow">Material propio</div><h2>Notas y chuletas</h2>' +
      '<p>Chuletas por día para repasar antes de la entrevista y notas personales guardadas en este navegador.</p></div></div>' +
      '<div class="grid g2"><div><div class="card"><h3>Agregar nota</h3>' +
      '<label class="field mt1"><span>Título</span><input type="text" id="note-title" placeholder="Ej: diferencia entre 502 y 504"></label>' +
      '<label class="field"><span>Contenido (Markdown)</span><textarea id="note-body" placeholder="- 502: el proxy no pudo hablar con el upstream&#10;- 504: el upstream no respondió a tiempo"></textarea></label>' +
      '<button class="btn btn-primary" id="note-save">Guardar nota</button></div>' +
      '<div class="card mt2"><h3>Mis notas <small class="dim">(' + st.notes.length + ')</small></h3>' +
      (st.notes.length ? st.notes.map(function (n) {
        return '<div class="mt2" style="border:1px solid var(--line-soft);border-radius:8px;padding:.6rem .7rem">' +
          '<div class="between"><strong class="small">' + esc(n.title) + '</strong><button class="copy-btn" data-del-note="' + n.id + '">borrar</button></div>' +
          '<div class="prose small mt1">' + MD.md(n.body) + '</div>' +
          '<div class="tiny dim">' + fmtDate(n.ts) + '</div></div>';
      }).join('') : '<p class="small dim mt1">Todavía no hay notas propias.</p>') + '</div></div>' +
      '<div><div class="card"><h3>Chuletas rápidas</h3>' +
      DATA.cheats.map(function (c) {
        return '<details class="mt1" style="border:1px solid var(--line-soft);border-radius:8px;padding:.5rem .6rem">' +
          '<summary style="cursor:pointer;font-size:.86rem;font-weight:600">' + esc(c.title) + '</summary>' +
          '<div class="prose small mt1">' + MD.md(c.body) + '</div></details>';
      }).join('') + '</div></div></div>';
    return {
      html: html,
      bind: function () {
        on('#note-save', 'click', function () {
          var t = document.getElementById('note-title').value.trim();
          var b = document.getElementById('note-body').value.trim();
          if (!t || !b) { toast('Completá título y contenido'); return; }
          Store.addNote(t, b);
          toast('Nota guardada');
          render();
        });
        on('[data-del-note]', 'click', function (e) {
          if (!confirm('¿Borrar esta nota?')) return;
          Store.deleteNote(e.currentTarget.getAttribute('data-del-note'));
          render();
        });
      }
    };
  }

  /* ================= PROJECT ================= */
  function viewProject() {
    var st = Store.state;
    var all = PROJECT.sections.reduce(function (a, s) { return a.concat(s.items); }, []);
    var done = all.filter(function (i) { return st.project[i.id]; }).length;
    var pct = Math.round(done / all.length * 100);
    var html = '<div class="page-head"><div><div class="eyebrow">Integración final</div><h2>' + esc(PROJECT.title) + '</h2>' +
      '<p>' + esc(PROJECT.intro) + '</p></div><span class="badge">' + done + '/' + all.length + ' · ' + pct + '%</span></div>' +
      progressBar(pct) +
      '<div class="grid g2 mt2"><div class="card"><h3>Arquitectura</h3><div class="prose small">' + MD.md(PROJECT.architecture) + '</div></div>' +
      '<div>' + PROJECT.sections.map(function (sec) {
        return '<div class="card mt1"><h3>' + esc(sec.title) + '</h3>' + sec.items.map(function (it) {
          var checked = !!st.project[it.id];
          return '<label class="check-item ' + (checked ? 'done' : '') + '"><input type="checkbox" data-project="' + it.id + '" ' + (checked ? 'checked' : '') + '><span>' + esc(it.label) + '</span></label>';
        }).join('') + '</div>';
      }).join('') + '</div></div>' +
      '<div class="card mt2"><h3>Evaluación del proyecto</h3>' +
      '<p class="small muted">' + (pct === 100
        ? 'Checklist completo. Ahora practicá la explicación de 3 minutos: repositorio, pipeline, imagen, deploy, healthcheck, monitoreo y rollback. Si podés contarlo sin leer, está listo.'
        : 'Completá los ítems restantes. Para cada uno deberías poder mostrar evidencia (comando, URL, captura o log).') + '</p>' +
      '<div class="callout warn"><strong>Criterio honesto:</strong> no marques un ítem que no puedas demostrar. En la entrevista te van a pedir el detalle.</div></div>';
    return {
      html: html,
      bind: function () {
        on('[data-project]', 'click', function (e) {
          Store.toggleProject(e.currentTarget.getAttribute('data-project'));
          render();
        });
      }
    };
  }

  /* ================= SETTINGS ================= */
  function viewSettings() {
    var st = Store.state;
    var size = 0;
    try { size = (JSON.stringify(st).length / 1024).toFixed(1); } catch (e) { size = '?'; }
    var html = '<div class="page-head"><div><div class="eyebrow">Configuración</div><h2>Ajustes</h2>' +
      '<p>Datos locales en tu navegador. Exportá un backup antes de cambiar de equipo o limpiar el navegador.</p></div></div>' +
      '<div class="grid g2"><div><div class="card"><h3>Perfil y plan</h3>' +
      '<label class="field mt1"><span>Nombre (opcional)</span><input type="text" id="set-name" value="' + esc(st.settings.name) + '" placeholder="Tu nombre"></label>' +
      '<label class="field"><span>Fecha de inicio del plan</span><input type="date" id="set-start" value="' + esc(st.settings.startDate) + '"></label>' +
      '<label class="field"><span>Objetivo diario (minutos)</span><input type="number" id="set-goal" min="30" max="600" step="15" value="' + st.settings.dailyGoalMin + '"></label>' +
      '<button class="btn btn-primary" id="set-save">Guardar cambios</button></div>' +
      '<div class="card mt2"><h3>Datos</h3><p class="small muted">Tamaño actual: ' + size + ' KB · ' + st.activity.length + ' eventos · ' + st.notes.length + ' notas.</p>' +
      '<div class="row mt1"><button class="btn" id="data-export">Exportar JSON</button>' +
      '<label class="btn btn-ghost" style="cursor:pointer">Importar<input type="file" id="data-import" accept="application/json" class="hidden"></label>' +
      '<button class="btn btn-red" id="data-reset">Borrar todo</button></div>' +
      '<div class="callout warn mt2">El progreso vive en localStorage de este navegador. Si limpiás datos del sitio, se pierde. Exportá seguido.</div></div></div>' +
      '<div><div class="card"><h3>IA opcional</h3>' +
      '<p class="small muted">La plataforma funciona sin IA. Si configurás un proveedor compatible con OpenAI, se habilitan evaluaciones semánticas y feedback extendido. La clave se guarda solo en este navegador y se envía únicamente a ese endpoint.</p>' +
      '<label class="check-item mt1"><input type="checkbox" id="ai-enabled" ' + (st.settings.ai.enabled ? 'checked' : '') + '><span>Habilitar IA</span></label>' +
      '<label class="field mt1"><span>Base URL</span><input type="text" id="ai-base" value="' + esc(st.settings.ai.baseUrl) + '" placeholder="https://api.openai.com/v1"></label>' +
      '<label class="field"><span>Modelo</span><input type="text" id="ai-model" value="' + esc(st.settings.ai.model) + '" placeholder="gpt-4o-mini"></label>' +
      '<label class="field"><span>API Key</span><input type="password" id="ai-key" value="' + esc(st.settings.ai.apiKey) + '" placeholder="sk-..."></label>' +
      '<button class="btn btn-primary" id="ai-save">Guardar IA</button>' +
      '<div id="ai-status" class="small mt2"></div></div>' +
      '<div class="card mt2"><h3>Seguridad del laboratorio</h3><ul class="obj-list">' +
      '<li>El terminal integrado es simulado: no ejecuta comandos reales.</li>' +
      '<li>Las misiones reales son comandos que ejecutás vos; solo se valida el texto que pegás.</li>' +
      '<li>Los comandos destructivos están marcados con advertencia.</li>' +
      '<li>No se solicita ni se almacena sudo, claves SSH ni credenciales cloud.</li></ul></div></div></div>';
    return {
      html: html,
      bind: function () {
        on('#set-save', 'click', function () {
          st.settings.name = document.getElementById('set-name').value.trim();
          st.settings.startDate = document.getElementById('set-start').value || Store.today();
          st.settings.dailyGoalMin = Math.max(30, +document.getElementById('set-goal').value || 150);
          Store.save();
          toast('Ajustes guardados');
          updateChrome();
          render();
        });
        on('#ai-save', 'click', function () {
          st.settings.ai.enabled = document.getElementById('ai-enabled').checked;
          st.settings.ai.baseUrl = document.getElementById('ai-base').value.trim();
          st.settings.ai.model = document.getElementById('ai-model').value.trim();
          st.settings.ai.apiKey = document.getElementById('ai-key').value.trim();
          Store.save();
          document.getElementById('ai-status').innerHTML = AI.enabled()
            ? '<span class="ok">IA configurada. Probá una entrevista o el tutor.</span>'
            : '<span class="dim">IA deshabilitada o incompleta: se sigue usando evaluación determinística.</span>';
          toast('Configuración de IA guardada');
        });
        on('#data-export', 'click', function () {
          var blob = new Blob([Store.exportJSON()], { type: 'application/json' });
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'devops-bootcamp-' + Store.today() + '.json';
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          toast('Backup exportado');
        });
        on('#data-import', 'change', function (e) {
          var f = e.target.files[0];
          if (!f) return;
          var reader = new FileReader();
          reader.onload = function () {
            try {
              Store.importJSON(reader.result);
              reviewState = null; session = null;
              toast('Datos importados');
              render();
            } catch (err) { toast('Archivo inválido: ' + err.message); }
          };
          reader.readAsText(f);
        });
        on('#data-reset', 'click', function () {
          if (!confirm('Se borrará todo el progreso, tarjetas, notas e historial de entrevistas. ¿Continuar?')) return;
          Store.resetAll();
          reviewState = null; session = null; tutorCards = [];
          toast('Progreso borrado');
          render();
        });
      }
    };
  }

  /* ---------------- help modal ---------------- */
  function helpModal() {
    openModal('<div class="between"><h3>Cómo usar la plataforma</h3><button class="icon-btn" id="modal-close">✕</button></div>' +
      '<div class="prose small mt1">' +
      '<p><strong>Objetivo:</strong> prepararte para entrevistas de Trainee/Junior DevOps en ' + DATA.days.length + ' días, con práctica activa y cobertura de LPI DevOps Tools Engineer 701-200.</p>' +
      '<ol><li><strong>Ruta:</strong> ' + DATA.modules.length + ' módulos alineados con los dominios 701-704 de LPI y complementados con LFCS, Terraform y Kubernetes. Marcá "estudiado" solo cuando hayas practicado.</li>' +
      '<li><strong>Repaso:</strong> tarjetas programadas con SM-2 adaptado al plan. Respondé antes de revelar.</li>' +
      '<li><strong>Laboratorios:</strong> terminal simulado (sin riesgo), misiones reales en tu Ubuntu/WSL2 con validación y ejercicios guiados.</li>' +
      '<li><strong>Troubleshooting:</strong> ' + DATA.ts.length + ' incidentes con evidencia; elegí causa y escribí la resolución.</li>' +
      '<li><strong>Entrevista:</strong> simulacro adaptativo con informe por dimensión y estimación por rol.</li>' +
      '<li><strong>Tutor:</strong> preguntas socráticas sobre cada módulo.</li></ol>' +
      '<p><strong>Datos:</strong> se guardan en este navegador (localStorage). Exportá un backup desde Ajustes.</p>' +
      '<p><strong>Seguridad:</strong> el terminal es simulado; la plataforma no accede a tu sistema operativo ni pide credenciales.</p>' +
      '</div>');
    on('#modal-close', 'click', closeModal);
  }

  /* ---------------- boot ---------------- */
  Store.load();
  document.getElementById('menu-toggle').addEventListener('click', function () {
    document.getElementById('sidebar').classList.toggle('open');
  });
  document.getElementById('btn-help').addEventListener('click', helpModal);
  modalBackdrop.addEventListener('click', function (e) { if (e.target === modalBackdrop) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modalBackdrop.hidden) closeModal(); });

  window.addEventListener('hashchange', function () {
    reviewState = null;
    if (parseRoute()[0] !== 'interview') session = null;
    render();
  });

  render();
})();
