/* Extrae el array `classesData` del manual HTML de UTN a un archivo JS de datos.
   Uso: node tools/extract-course.js */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'Curso_Linux_UTN.html'), 'utf8');
const marker = 'const classesData = ';
const start = html.indexOf(marker);
if (start === -1) throw new Error('No se encontró classesData en el HTML');

let i = html.indexOf('[', start);
const begin = i;
let depth = 0;
let inString = false;
let quote = '';
let escaped = false;

for (; i < html.length; i++) {
  const ch = html[i];
  if (inString) {
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === quote) { inString = false; }
    continue;
  }
  if (ch === '"' || ch === "'") { inString = true; quote = ch; continue; }
  if (ch === '[') depth++;
  else if (ch === ']') {
    depth--;
    if (depth === 0) { i++; break; }
  }
}

const raw = html.slice(begin, i);
const data = JSON.parse(raw);
fs.mkdirSync(path.join(root, 'js', 'data'), { recursive: true });
const out = path.join(root, 'js', 'data', 'linux-course.js');
fs.writeFileSync(out,
  '/* Biblioteca Linux extraída de Curso_Linux_UTN.html (Diplomado Linux UTN-FRD).\n' +
  '   Se usa como material de consulta dentro de la plataforma. */\n' +
  'window.LINUX_COURSE = ' + JSON.stringify(data) + ';\n', 'utf8');

const keys = new Set();
data.forEach(c => Object.keys(c).forEach(k => keys.add(k)));
console.log('Clases extraídas:', data.length);
console.log('Campos:', [...keys].join(', '));
console.log('Con laboratorio:', data.filter(c => c.lab_guide).length);
console.log('Tamaño generado:', (fs.statSync(out).size / 1024).toFixed(1), 'KB');
console.log('Títulos:');
data.forEach(c => console.log(' -', c.id, c.title));
