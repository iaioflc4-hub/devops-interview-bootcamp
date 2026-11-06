/* Persistencia local + motor de repetición espaciada + métricas.
   Todo vive en localStorage: la app funciona offline y sin cuentas. */
window.Store = (function () {
  var KEY = 'devops-bootcamp-v1';
  var MIN = 60 * 1000, HOUR = 60 * MIN, DAY = 24 * HOUR;

  function localISO(d) {
    d = d || new Date();
    var off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * MIN).toISOString().slice(0, 10);
  }

  function daysBetween(a, b) {
    var p = function (s) { var x = s.split('-'); return Date.UTC(+x[0], +x[1] - 1, +x[2]); };
    return Math.round((p(b) - p(a)) / DAY);
  }

  var defaults = {
    version: 1,
    createdAt: new Date().toISOString(),
    settings: {
      name: '',
      startDate: localISO(),
      dailyGoalMin: 150,
      planDays: 5,
      ai: { enabled: false, baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini', apiKey: '' }
    },
    progress: {},
    sr: {},
    stats: { answered: 0, correct: 0, byCategory: {}, byTag: {}, byModule: {} },
    interviews: [],
    labs: {},
    troubleshoot: {},
    project: {},
    notes: [],
    xp: 0,
    streak: { days: [] },
    activity: []
  };

  var st = null;

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function merge(base, loaded) {
    var out = clone(base);
    if (!loaded || typeof loaded !== 'object') return out;
    Object.keys(loaded).forEach(function (k) {
      if (k === 'settings' && loaded.settings) {
        out.settings = Object.assign(out.settings, loaded.settings);
        out.settings.ai = Object.assign(base.settings.ai, loaded.settings.ai || {});
      } else if (out[k] && typeof out[k] === 'object' && !Array.isArray(out[k]) && out[k] !== null) {
        out[k] = Object.assign(out[k], loaded[k]);
      } else {
        out[k] = loaded[k];
      }
    });
    return out;
  }

  function load() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { raw = null; }
    var loaded = null;
    if (raw) { try { loaded = JSON.parse(raw); } catch (e) { loaded = null; } }
    st = merge(defaults, loaded);
    /* Migración: los backups de la versión de 4 días no deben recortar el día 5. */
    if (!st.settings.planDays || st.settings.planDays < 5) st.settings.planDays = 5;
    return st;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(st)); }
    catch (e) { console.warn('No se pudo guardar en localStorage', e); }
  }

  function log(type, detail) {
    st.activity.unshift({ ts: Date.now(), type: type, detail: detail || '' });
    if (st.activity.length > 250) st.activity.length = 250;
    touchToday();
  }

  function touchToday() {
    var t = localISO();
    if (st.streak.days.indexOf(t) === -1) st.streak.days.push(t);
    if (st.streak.days.length > 400) st.streak.days = st.streak.days.slice(-400);
  }

  function addXP(n) {
    st.xp = (st.xp || 0) + n;
  }

  /* ---------- Repetición espaciada (SM-2 adaptado al plan intensivo) ---------- */
  function card(id) {
    if (!st.sr[id]) {
      st.sr[id] = { ease: 2.5, interval: 0, reps: 0, lapses: 0, due: 0, last: 0, lastGrade: null, history: [] };
    }
    return st.sr[id];
  }

  var FIRST = { 1: 20 * MIN, 2: 8 * HOUR, 3: 1 * DAY };

  function review(id, grade, ms) {
    var c = card(id);
    var now = Date.now();
    if (grade === 0) {
      c.lapses++;
      c.reps = 0;
      c.ease = Math.max(1.3, c.ease - 0.2);
      c.interval = 10 * MIN;
    } else {
      if (c.reps === 0) {
        c.interval = FIRST[grade];
      } else {
        var factor = grade === 1 ? 1.2 : (grade === 2 ? c.ease : c.ease * 1.35);
        c.interval = Math.max(45 * MIN, Math.min(c.interval * factor, 21 * DAY));
      }
      c.reps++;
      c.ease = Math.max(1.3, Math.min(2.9, c.ease + (grade === 1 ? -0.15 : (grade === 2 ? 0 : 0.1))));
    }
    c.last = now;
    c.due = now + c.interval;
    c.lastGrade = grade;
    c.history.push({ g: grade, ts: now, ms: ms || 0 });
    if (c.history.length > 60) c.history = c.history.slice(-60);

    st.stats.answered++;
    if (grade > 0) st.stats.correct++;
    addXP(grade === 0 ? 2 : 5);
    touchToday();
    save();
    return c;
  }

  function isNew(id) { var c = st.sr[id]; return !c || !c.reps; }
  function isDue(id, now) { var c = st.sr[id]; return !!c && c.reps > 0 && c.due <= (now || Date.now()); }

  function dueQueue(cards, now) {
    now = now || Date.now();
    var due = [], fresh = [];
    cards.forEach(function (cd) {
      var c = st.sr[cd.id];
      if (!c || !c.reps) fresh.push(cd);
      else if (c.due <= now) due.push(cd);
    });
    due.sort(function (a, b) { return (st.sr[a.id].due) - (st.sr[b.id].due); });
    return { due: due, fresh: fresh };
  }

  /* ---------- Actividad por módulo / estadísticas ---------- */
  function markStudied(moduleId) {
    var p = st.progress[moduleId] || {};
    if (!p.studied) {
      p.studied = true;
      p.studiedAt = new Date().toISOString();
      addXP(20);
      log('module', 'Módulo estudiado: ' + moduleId);
      save();
    }
    st.progress[moduleId] = p;
  }

  function toggleChallenge(moduleId, idx) {
    var p = st.progress[moduleId] || {};
    p.challenges = p.challenges || {};
    p.challenges[idx] = !p.challenges[idx];
    st.progress[moduleId] = p;
    if (p.challenges[idx]) { addXP(10); touchToday(); }
    save();
  }

  function recordAnswer(category, correct, tag) {
    st.stats.answered++;
    if (correct) st.stats.correct++;
    if (category) {
      var c = st.stats.byCategory[category] || { a: 0, c: 0 };
      c.a++; if (correct) c.c++;
      st.stats.byCategory[category] = c;
    }
    if (tag) {
      var t = st.stats.byTag[tag] || { a: 0, c: 0 };
      t.a++; if (correct) t.c++;
      st.stats.byTag[tag] = t;
    }
    save();
  }

  function labResult(labId, ok, detail) {
    var l = st.labs[labId] || { attempts: 0 };
    l.attempts++;
    l.lastRun = new Date().toISOString();
    l.lastResult = detail || '';
    if (ok && !l.done) {
      l.done = true;
      l.completedAt = new Date().toISOString();
      addXP(35);
      log('lab', 'Laboratorio completado: ' + labId);
    }
    st.labs[labId] = l;
    save();
    return l;
  }

  function tsResult(id, ok, detail) {
    var t = st.troubleshoot[id] || { attempts: 0 };
    t.attempts++;
    if (ok && !t.solved) { t.solved = true; t.solvedAt = new Date().toISOString(); addXP(45); log('ts', 'Escenario resuelto: ' + id); }
    t.lastResult = detail || '';
    st.troubleshoot[id] = t;
    save();
    return t;
  }

  function saveInterview(session) {
    st.interviews.unshift(session);
    if (st.interviews.length > 40) st.interviews.length = 40;
    addXP(50);
    log('interview', 'Entrevista ' + session.type + ' · ' + session.score + '%');
    save();
  }

  function toggleProject(id) {
    st.project[id] = !st.project[id];
    if (st.project[id]) { addXP(15); log('project', 'Ítem del proyecto: ' + id); }
    save();
  }

  function addNote(title, body) {
    st.notes.unshift({ id: 'n' + Date.now(), title: title, body: body, ts: new Date().toISOString() });
    save();
  }
  function deleteNote(id) { st.notes = st.notes.filter(function (n) { return n.id !== id; }); save(); }

  /* ---------- Derivados ---------- */
  function dayNumber() {
    var n = daysBetween(st.settings.startDate, localISO()) + 1;
    return Math.max(1, Math.min(st.settings.planDays, n));
  }
  function rawDayNumber() { return daysBetween(st.settings.startDate, localISO()) + 1; }

  function streakCount() {
    var days = st.streak.days.slice().sort();
    if (!days.length) return 0;
    var today = localISO();
    var last = days[days.length - 1];
    var gap = daysBetween(last, today);
    if (gap > 1) return 0;
    var n = 1;
    for (var i = days.length - 2; i >= 0; i--) {
      if (daysBetween(days[i], days[i + 1]) === 1) n++;
      else break;
    }
    return n;
  }

  function levelInfo() {
    var xp = st.xp || 0;
    var level = 1 + Math.floor(xp / 300);
    var into = xp % 300;
    return { level: level, xp: xp, into: into, next: 300 - into };
  }

  function overall(course) {
    var totalModules = course.MODULES.length, done = 0;
    course.MODULES.forEach(function (m) { if ((st.progress[m.id] || {}).studied) done++; });
    var studied = totalModules ? done / totalModules : 0;
    var labsTotal = course.labs.length, labsDone = 0;
    course.labs.forEach(function (l) { if ((st.labs[l.id] || {}).done) labsDone++; });
    var labPct = labsTotal ? labsDone / labsTotal : 0;
    var srs = course.cards.map(function (c) { return st.sr[c.id]; }).filter(Boolean);
    var srsReps = srs.filter(function (c) { return c.reps > 0; });
    var retention = srsReps.length
      ? srsReps.reduce(function (a, c) { return a + (c.lastGrade > 0 ? 1 : 0); }, 0) / srsReps.length
      : 0;
    var ivs = st.interviews;
    var interviewAvg = ivs.length ? ivs.reduce(function (a, s) { return a + s.score; }, 0) / ivs.length / 100 : 0;
    var score = studied * 0.30 + labPct * 0.20 + retention * 0.25 + interviewAvg * 0.25;
    return {
      modulesDone: done, modulesTotal: totalModules, studiedPct: Math.round(studied * 100),
      labsDone: labsDone, labsTotal: labsTotal, labPct: Math.round(labPct * 100),
      retention: Math.round(retention * 100), interviewAvg: Math.round(interviewAvg * 100),
      score: Math.round(score * 100), cardsReviewed: srsReps.length
    };
  }

  function readiness(course) {
    var o = overall(course);
    var base = o.score;
    var role = function (x) {
      if (x >= 80) return 'Listo para entrevistas';
      if (x >= 65) return 'Casi listo';
      if (x >= 45) return 'En preparación';
      if (x >= 25) return 'Base inicial';
      return 'Insuficiente';
    };
    return [
      { role: 'Trainee DevOps', value: Math.min(100, Math.round(base * 1.18)), label: role(base * 1.18) },
      { role: 'Junior DevOps', value: Math.round(base * 0.95), label: role(base * 0.95) },
      { role: 'Cloud / Infra Engineer', value: Math.round(base * 0.88), label: role(base * 0.88) },
      { role: 'DevOps Support', value: Math.min(100, Math.round(base * 1.1)), label: role(base * 1.1) }
    ];
  }

  function weakTopics(course, limit) {
    var rows = [];
    Object.keys(st.stats.byCategory).forEach(function (cat) {
      var c = st.stats.byCategory[cat];
      if (c.a >= 2) rows.push({ cat: cat, pct: Math.round(c.c / c.a * 100), a: c.a });
    });
    rows.sort(function (a, b) { return a.pct - b.pct; });
    return rows.slice(0, limit || 4);
  }

  function exportJSON() { return JSON.stringify(st, null, 2); }

  function importJSON(text) {
    var data = JSON.parse(text);
    st = merge(defaults, data);
    save();
    return true;
  }

  function resetAll() {
    var keepSettings = clone(st.settings);
    st = clone(defaults);
    st.settings = keepSettings;
    save();
  }

  return {
    get state() { return st; },
    load: load, save: save, clone: clone,
    card: card, review: review, isNew: isNew, isDue: isDue, dueQueue: dueQueue,
    markStudied: markStudied, toggleChallenge: toggleChallenge,
    recordAnswer: recordAnswer, labResult: labResult, tsResult: tsResult,
    saveInterview: saveInterview, toggleProject: toggleProject,
    addNote: addNote, deleteNote: deleteNote, log: log, addXP: addXP,
    dayNumber: dayNumber, rawDayNumber: rawDayNumber, streak: streakCount, levelInfo: levelInfo,
    overall: overall, readiness: readiness, weakTopics: weakTopics,
    exportJSON: exportJSON, importJSON: importJSON, resetAll: resetAll,
    today: localISO, daysBetween: daysBetween
  };
})();
