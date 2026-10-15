/**
 * Lessons mark "chunk alerts" — phrases using grammar from a later lesson — with a
 * trailing `*`, `**` or `****` (one per note; written `\*` in markdown), explained in
 * a legend paragraph that starts with the same mark. Rendered literally, these read
 * as stray asterisks in the middle of reading texts (issue #477). This plugin turns
 * each mark into a small superscript: a run of 1–4 `*` at the start of a text node
 * (right after an <em>) or glued to the preceding word. Code is left untouched.
 */
import { visit, SKIP } from 'unist-util-visit';

const MARK = /(^|(?<=\S))(\*{1,4})(?=\s|[.,;:!?)»"“”'’]|$)/g;

export default function rehypeChunkMarks() {
  return (tree) => {
    visit(tree, (node, index, parent) => {
      if (node.type === 'element' && (node.tagName === 'code' || node.tagName === 'pre')) return SKIP;
      if (node.type !== 'text' || !parent || index == null || !node.value.includes('*')) return;
      const parts = [];
      let last = 0;
      for (const m of node.value.matchAll(MARK)) {
        const at = m.index + m[1].length;
        if (at > last) parts.push({ type: 'text', value: node.value.slice(last, at) });
        parts.push({
          type: 'element',
          tagName: 'sup',
          properties: { className: ['chunk-mark'], title: 'Chunk: Grammatik aus einer späteren Lektion' },
          children: [{ type: 'text', value: m[2] }],
        });
        last = at + m[2].length;
      }
      if (parts.length === 0) return;
      if (last < node.value.length) parts.push({ type: 'text', value: node.value.slice(last) });
      parent.children.splice(index, 1, ...parts);
      return index + parts.length;
    });
  };
}
