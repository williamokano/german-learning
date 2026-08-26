// Render each exercise with its answers substituted, so the finished German can be read.
import fs from 'node:fs';
import { parse as yparse } from 'yaml';
const yaml = { load: (s) => yparse(s) };

for (const dir of process.argv.slice(2)) {
  const p = `${dir}/exercises.yml`;
  if (!fs.existsSync(p)) continue;
  const doc = yaml.load(fs.readFileSync(p, 'utf8'));
  console.log(`\n########## ${doc.lesson} — ${dir}`);
  for (const ex of doc.exercises ?? []) {
    const head = `--- ${ex.id} [${ex.type}] ${ex.title ?? ''}`;
    if (ex.type === 'gap-text' || ex.type === 'gap-bank') {
      let t = ex.text ?? '';
      const a = ex.answers ?? {};
      t = t.replace(/\{(\w+)\}/g, (m, k) => {
        const v = a[k];
        if (v === undefined) return `«MISSING:${k}»`;
        return `«${Array.isArray(v) ? v.join(' | ') : v}»`;
      });
      console.log(head);
      if (ex.instructions) console.log(`  [i] ${ex.instructions.trim().replace(/\n/g, ' ')}`);
      console.log(t.replace(/^/gm, '  '));
    } else if (ex.type === 'single-choice' || ex.type === 'true-false') {
      console.log(head);
      for (const it of ex.items ?? []) {
        if (ex.type === 'true-false') {
          console.log(`  ${it.answer ? 'R' : 'F'} :: ${it.q}`);
        } else {
          const opt = (it.options ?? []).find(o => o.key === it.answer);
          console.log(`  ${it.q}  ==> ${it.answer}) ${opt ? opt.text : '«NO SUCH KEY»'}`);
        }
        if (it.why) console.log(`      why: ${it.why}`);
      }
    } else if (ex.type === 'matching') {
      console.log(head);
      for (const it of ex.items ?? []) console.log(`  ${it.left ?? it.q} == ${it.right ?? it.answer}`);
    } else if (ex.type === 'order') {
      console.log(head);
      for (const it of ex.items ?? []) console.log(`  ${Array.isArray(it.answer) ? it.answer.join(' ') : it.answer}`);
    } else if (ex.type === 'table-fill') {
      console.log(head);
      console.log('  ' + JSON.stringify(ex.rows ?? ex.items ?? ''));
    } else if (ex.type === 'categorize') {
      console.log(head);
      console.log('  ' + JSON.stringify(ex.items ?? ex.categories ?? ''));
    } else if (ex.type === 'free-write') {
      console.log(head);
      if (ex.stimulus) console.log(ex.stimulus.replace(/^/gm, '  > '));
      if (ex.model) console.log(ex.model.replace(/^/gm, '  M '));
    } else {
      console.log(head + '  (unrendered)');
    }
  }
}
