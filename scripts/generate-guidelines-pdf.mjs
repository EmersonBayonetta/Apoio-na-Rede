import fs from 'node:fs';
const sections = JSON.parse(fs.readFileSync(new URL('../src/data/registrationGuidelines.json', import.meta.url), 'utf8'));
// A self-contained PDF with standard fonts and Windows-1252 Portuguese text.
const escape = text => text.replaceAll('–', '\x96').replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
const pages = [];
let lines = [], y = 790;
function line(text, heading = false) {
  if (y < 65) { pages.push(lines.join('\n')); lines = []; y = 790; }
  lines.push(`BT /${heading ? 'F2' : 'F1'} ${heading ? 13 : 11} Tf 0.05 0.15 0.14 rg 1 0 0 1 50 ${y} Tm (${escape(text)}) Tj ET`);
  y -= heading ? 21 : 16;
}
function paragraph(text, heading = false) {
  let current = '';
  for (const word of text.split(/\s+/)) {
    if ((current + ' ' + word).length > (heading ? 65 : 88)) { line(current, heading); current = word; }
    else current += (current ? ' ' : '') + word;
  }
  if (current) line(current, heading);
  y -= 10;
}
for (const section of sections) { paragraph(section.heading, true); section.paragraphs.forEach(text => paragraph(text)); }
if (lines.length) pages.push(lines.join('\n'));
const objects = [null, '<< /Type /Catalog /Pages 2 0 R >>', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'];
const kids = [];
for (const [index, content] of pages.entries()) {
  const pageId = objects.length, streamId = pageId + 1;
  kids.push(`${pageId} 0 R`);
  objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamId} 0 R >>`);
  const stream = content + `\nBT /F1 9 Tf 1 0 0 1 280 35 Tm (${index + 1} / ${pages.length}) Tj ET`;
  objects.push(`<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`);
}
objects[2] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pages.length} >>`;
let pdf = '%PDF-1.4\n', offsets = [0];
for (let id = 1; id < objects.length; id++) { offsets.push(Buffer.byteLength(pdf, 'latin1')); pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`; }
const xref = Buffer.byteLength(pdf, 'latin1');
pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n` + offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
const output = new URL('../public/documents/', import.meta.url);
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(new URL('diretrizes-de-cadastro-apoio-na-rede.pdf', output), Buffer.from(pdf, 'latin1'));
console.log(`PDF gerado: ${pages.length} páginas.`);
