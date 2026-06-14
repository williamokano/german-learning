/**
 * Converts  > **Hör zu N — Label:** word · word · …  blockquotes
 * into a styled <div class="hoerzu-words"> element.
 *
 * The 🎧 audio link above (handled by remark-audio-links) is already a play
 * button; this plugin just styles the word list below it.
 */
import { visit, SKIP } from 'unist-util-visit';

const HOERZU_RE = /^Hör zu \d+ — .+:$/;

export default function remarkHoerzu() {
  return (tree) => {
    visit(tree, 'blockquote', (node, index, parent) => {
      if (!isHoerzuBlockquote(node) || !parent) return;

      const para = node.children[0];
      const strong = para.children[0];
      const labelText = extractText(strong).replace(/:$/, '');
      const wordsText = para.children
        .slice(1)
        .map(c => (c.type === 'text' ? c.value : ''))
        .join('')
        .trim();

      parent.children.splice(index, 1, {
        type: 'html',
        value: `<div class="hoerzu-words"><span class="hoerzu-label">${labelText}:</span> ${wordsText}</div>`,
      });
      return [SKIP, index];
    });
  };
}

function isHoerzuBlockquote(node) {
  if (node.children?.length !== 1) return false;
  const para = node.children[0];
  if (para.type !== 'paragraph') return false;
  const first = para.children?.[0];
  if (first?.type !== 'strong') return false;
  return HOERZU_RE.test(extractText(first).replace(/:$/, ':'));
}

function extractText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.value;
  return (node.children ?? []).map(extractText).join('');
}
