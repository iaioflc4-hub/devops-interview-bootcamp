/* Renderizador Markdown mínimo y seguro (sin dependencias).
   Soporta encabezados, listas, tablas, bloques de código, citas, énfasis y enlaces. */
window.MD = (function () {
  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function inline(src) {
    var s = esc(src);
    var codes = [];
    s = s.replace(/`([^`]+)`/g, function (_, c) {
      codes.push('<code>' + c + '</code>');
      return '\u0000' + (codes.length - 1) + '\u0000';
    });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    s = s.replace(/\u0000(\d+)\u0000/g, function (_, i) { return codes[+i]; });
    return s;
  }

  function splitRow(line) {
    return line.trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); });
  }

  function md(src) {
    if (!src) return '';
    var lines = String(src).replace(/\r/g, '').split('\n');
    var out = [];
    var i = 0;
    while (i < lines.length) {
      var line = lines[i];

      if (/^\s*(```|~~~)/.test(line)) {
        var fence = /^\s*(```|~~~)/.exec(line)[1];
        var lang = line.trim().slice(3).trim();
        var buf = [];
        i++;
        while (i < lines.length && lines[i].trim().slice(0, 3) !== fence) { buf.push(lines[i]); i++; }
        i++;
        out.push('<pre><code' + (lang ? ' data-lang="' + esc(lang) + '"' : '') + '>' +
          esc(buf.join('\n')) + '</code></pre>');
        continue;
      }

      if (/^\s*$/.test(line)) { i++; continue; }

      var h = /^(#{1,4})\s+(.*)$/.exec(line);
      if (h) { var lvl = h[1].length; out.push('<h' + lvl + '>' + inline(h[2]) + '</h' + lvl + '>'); i++; continue; }

      if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { out.push('<hr>'); i++; continue; }

      if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1])) {
        var head = splitRow(line);
        i += 2;
        var rows = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(splitRow(lines[i])); i++; }
        var t = '<table><thead><tr>' + head.map(function (c) { return '<th>' + inline(c) + '</th>'; }).join('') +
          '</tr></thead><tbody>' + rows.map(function (r) {
            return '<tr>' + r.map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>';
          }).join('') + '</tbody></table>';
        out.push(t);
        continue;
      }

      if (/^\s*[-*]\s+/.test(line)) {
        var items = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
          i++;
          while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i])) {
            items[items.length - 1] += ' ' + lines[i].trim();
            i++;
          }
        }
        out.push('<ul>' + items.map(function (it) { return '<li>' + inline(it) + '</li>'; }).join('') + '</ul>');
        continue;
      }

      if (/^\s*\d+\.\s+/.test(line)) {
        var oitems = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { oitems.push(lines[i].replace(/^\s*\d+\.\s+/, '')); i++; }
        out.push('<ol>' + oitems.map(function (it) { return '<li>' + inline(it) + '</li>'; }).join('') + '</ol>');
        continue;
      }

      if (/^\s*>\s?/.test(line)) {
        var quote = [];
        while (i < lines.length && /^\s*>\s?/.test(lines[i])) { quote.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
        out.push('<blockquote>' + inline(quote.join(' ')) + '</blockquote>');
        continue;
      }

      var para = [line.trim()];
      i++;
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#{1,4}\s|\s*[-*]\s+|\s*\d+\.\s+|\s*>|\s*(```|~~~)|\s*\|)/.test(lines[i])) {
        para.push(lines[i].trim());
        i++;
      }
      out.push('<p>' + inline(para.join(' ')) + '</p>');
    }
    return out.join('\n');
  }

  return { md: md, esc: esc, inline: inline };
})();
