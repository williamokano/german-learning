// Authoring aid: a gap-fill line whose cued verb leaves no trace in the finished
// sentence — the parenthesis says "(wohnen)" but no gap ever supplied "gewohnt",
// so the rendered sentence is unfinished. Structurally valid, so no gate sees it.
import fs from 'node:fs';
const PREFIX = /^(auf|an|aus|ab|ein|mit|vor|zu|nach|her|hin|los|weiter|zurück|um|über|unter|durch|wieder|fest|frei|statt|teil|voll|zusammen|entgegen|bei)/;
const root = (inf) => {
  let w = inf.replace(/(en|ern|eln|n)$/, '');
  const m = w.match(PREFIX);
  if (m && w.length - m[0].length >= 3) w = w.slice(m[0].length);
  return w.slice(0, 4);
};
let n = 0;
for (const f of fs.readdirSync(process.argv[2]).filter(f => f.endsWith('.txt'))) {
  let ex = '', gap = false;
  for (const line of fs.readFileSync(`${process.argv[2]}/${f}`, 'utf8').split('\n')) {
    if (line.startsWith('--- ')) { ex = line.slice(4, 70); gap = /\[gap-(text|bank)\]/.test(line); continue; }
    if (!gap || !line.includes('«')) continue;
    for (const m of line.matchAll(/\(([a-zäöüß]{4,}(?:en|ern|eln))\)/g)) {
      const r = root(m[1]);
      if (r.length < 3) continue;
      const rest = line.replace(m[0], ' ').toLowerCase();
      if (!rest.includes(r)) { console.log(`${f.replace('.txt','')} :: ${ex}\n    ${line.trim()}`); n++; }
    }
  }
}
console.log(`\n${n} hit(s)`);
