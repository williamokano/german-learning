import { describe, it, expect } from 'vitest';
import rehypeTableScroll from '../../plugins/rehype-table-scroll.mjs';

type Node = { type: string; tagName?: string; properties?: Record<string, unknown>; children?: Node[] };
const el = (tagName: string, children: Node[] = [], properties: Record<string, unknown> = {}): Node =>
  ({ type: 'element', tagName, properties, children });

describe('rehype-table-scroll (#473)', () => {
  it('wraps each table in a focusable, labelled .table-scroll div', () => {
    const tree: Node = { type: 'root', children: [el('p'), el('table', [el('tr')]), el('table')] };
    rehypeTableScroll()(tree);
    const [, w1, w2] = tree.children!;
    for (const w of [w1, w2]) {
      expect(w.tagName).toBe('div');
      expect(w.properties).toMatchObject({ className: ['table-scroll'], tabIndex: 0, role: 'region' });
      expect(w.children![0].tagName).toBe('table');
    }
  });

  it('does not double-wrap a table that is already wrapped', () => {
    const tree: Node = { type: 'root', children: [el('div', [el('table')], { className: ['table-scroll'] })] };
    rehypeTableScroll()(tree);
    expect(tree.children![0].children![0].tagName).toBe('table');
  });
});
