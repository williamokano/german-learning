/**
 * Adds class="merkasten" to blockquotes whose first paragraph
 * starts with "📌 **Merkasten" — makes them styleable as callout boxes.
 * Does not change the DOM structure; CSS handles the visual treatment.
 */
import { visit } from 'unist-util-visit';

export default function rehypeMerkasten() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'blockquote') return;

      // Check if first child paragraph text starts with 📌
      const firstEl = node.children?.find(c => c.type === 'element');
      if (!firstEl) return;

      const text = extractText(firstEl);
      if (!text.startsWith('📌')) return;

      node.properties = node.properties ?? {};
      const existing = node.properties.className ?? [];
      node.properties.className = [...(Array.isArray(existing) ? existing : [existing]), 'merkasten'];
    });
  };
}

function extractText(node) {
  if (node.type === 'text') return node.value ?? '';
  return (node.children ?? []).map(extractText).join('');
}
