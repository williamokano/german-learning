/**
 * Classifies callout blockquotes by their leading emoji so prose.css can style
 * them as boxes (issue #477 — 💡/⚠️ boxes used to render as plain grey quotes):
 *   📌 Merkasten, ▶ Faustregel → merkasten   💡 Lerntipp → lerntipp
 *   ⚠️ Häufige Fehler → haeufige-fehler      ✏️ Selbsttest, 📖 Lese-Tipp → tipp
 * Does not change the DOM structure; CSS handles the visual treatment.
 */
const CALLOUTS = [
  ['📌', 'merkasten'],
  ['▶', 'merkasten'],
  ['💡', 'lerntipp'],
  ['⚠', 'haeufige-fehler'],
  ['✏', 'tipp'],
  ['📖', 'tipp'],
];
import { visit } from 'unist-util-visit';

export default function rehypeMerkasten() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'blockquote') return;

      // Check if first child paragraph text starts with 📌
      const firstEl = node.children?.find(c => c.type === 'element');
      if (!firstEl) return;

      const text = extractText(firstEl).trimStart();
      const match = CALLOUTS.find(([emoji]) => text.startsWith(emoji));
      if (!match) return;

      node.properties = node.properties ?? {};
      const existing = node.properties.className ?? [];
      node.properties.className = [...(Array.isArray(existing) ? existing : [existing]), match[1]];
    });
  };
}

function extractText(node) {
  if (node.type === 'text') return node.value ?? '';
  return (node.children ?? []).map(extractText).join('');
}
