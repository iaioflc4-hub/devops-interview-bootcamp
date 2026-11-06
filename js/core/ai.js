/* Adaptador de IA opcional y provider-agnostic (API compatible con OpenAI).
   La app funciona al 100% sin clave: sin configuración se usa evaluación determinística.
   La clave se guarda solo en localStorage de este navegador. */
window.AI = (function () {
  function cfg() {
    var s = (window.Store && Store.state && Store.state.settings.ai) || {};
    return s;
  }

  function enabled() {
    var c = cfg();
    return !!(c.enabled && c.apiKey && c.baseUrl && c.model);
  }

  function systemPrompt() {
    return 'Sos un entrevistador técnico DevOps senior que evalúa a un candidato junior. ' +
      'Respondé en español rioplatense, breve y concreto. Evaluá precisión técnica, método y comunicación. ' +
      'No inventes comandos. Si falta información, pedila. Formato: 1) puntaje 0-100, 2) qué estuvo bien, ' +
      '3) qué faltó, 4) una pregunta de seguimiento.';
  }

  async function chat(messages, maxTokens) {
    var c = cfg();
    if (!enabled()) return { ok: false, error: 'IA no configurada' };
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 25000);
    try {
      var res = await fetch(String(c.baseUrl).replace(/\/+$/, '') + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + c.apiKey
        },
        body: JSON.stringify({
          model: c.model,
          messages: messages,
          temperature: 0.3,
          max_tokens: maxTokens || 500
        }),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!res.ok) {
        var detail = '';
        try { detail = (await res.json()).error && (await res.text()); } catch (e) { detail = ''; }
        return { ok: false, error: 'HTTP ' + res.status + (detail ? ' · ' + String(detail).slice(0, 200) : '') };
      }
      var data = await res.json();
      var text = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (!text) return { ok: false, error: 'Respuesta vacía del proveedor' };
      return { ok: true, text: String(text).trim() };
    } catch (e) {
      clearTimeout(timer);
      return { ok: false, error: e.name === 'AbortError' ? 'Timeout de la IA' : ('Error de red: ' + e.message) };
    }
  }

  async function evaluate(question, answer, modelAnswer) {
    return chat([
      { role: 'system', content: systemPrompt() },
      {
        role: 'user', content:
          'Pregunta de entrevista: ' + question +
          '\n\nRespuesta del candidato: ' + (answer || '(vacía)') +
          '\n\nRespuesta modelo: ' + (modelAnswer || '(sin modelo)')
      }
    ], 550);
  }

  async function tutor(step, moduleTitle, context, userAnswer) {
    return chat([
      { role: 'system', content: systemPrompt() },
      {
        role: 'user', content:
          'Módulo: ' + moduleTitle + '\nPaso: ' + step +
          '\nContexto del material: ' + String(context || '').slice(0, 1800) +
          (userAnswer ? '\nRespuesta del alumno: ' + userAnswer : '') +
          '\nSi es una pregunta, evaluá la respuesta en 3 líneas y hacé una sola pregunta de seguimiento.'
      }
    ], 400);
  }

  return { enabled: enabled, chat: chat, evaluate: evaluate, tutor: tutor };
})();
