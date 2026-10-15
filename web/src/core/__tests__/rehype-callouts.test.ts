import { describe, it, expect } from 'vitest';
import rehypeMerkasten from '../../plugins/rehype-merkasten.mjs';
import rehypeChunkMarks from '../../plugins/rehype-chunk-marks.mjs';

type Node = { type: string; tagName?: string; value?: string; properties?: Record<string, unknown>; children?: Node[] };
const text = (value: string): Node => ({ type: 'text', value });
const el = (tagName: string, children: Node[] = []): Node => ({ type: 'element', tagName, properties: {}, children });

describe('rehype-merkasten callout classes (#477)', () => {
  it.each([
    ['📌 Merkasten', 'merkasten'], ['▶ Faustregel:', 'merkasten'], ['💡 Lerntipp:', 'lerntipp'],
    ['⚠️ Häufige Fehler', 'haeufige-fehler'], ['✏️ Selbsttest Wortschatz:', 'tipp'], ['📖 Lese-Tipp:', 'tipp'],
  ])('classifies "%s" as %s', (lead, cls) => {
    const quote = el('blockquote', [el('p', [text(lead)])]);
    rehypeMerkasten()({ type: 'root', children: [quote] });
    expect(quote.properties?.className).toEqual([cls]);
  });

  it('leaves an ordinary quote alone', () => {
    const quote = el('blockquote', [el('p', [text('„Ein Zitat."')])]);
    rehypeMerkasten()({ type: 'root', children: [quote] });
    expect(quote.properties?.className).toBeUndefined();
  });
});

describe('rehype-chunk-marks (#477)', () => {
  const run = (children: Node[]) => { const p = el('p', children); rehypeChunkMarks()({ type: 'root', children: [p] }); return p.children!; };
  const sups = (nodes: Node[]) => nodes.filter(n => n.tagName === 'sup').map(n => n.children![0].value);

  it('turns marks after an <em> or a word into superscripts', () => {
    expect(sups(run([el('em', [text('sitzen')]), text('**. Die Pause')]))).toEqual(['**']);
    expect(sups(run([text('auch wenn* die Grammatik')]))).toEqual(['*']);
    expect(sups(run([text('Gitarre mit!**** Ich')]))).toEqual(['****']);
  });

  it('leaves code and asterisks inside words alone', () => {
    const p = el('p', [el('code', [text('a**b')]), text(' 2 * 3')]);
    rehypeChunkMarks()({ type: 'root', children: [p] });
    expect(sups(p.children!)).toEqual([]);
  });
});
