/**
 * Wraps every <table> in <div class="table-scroll"> so wide grammar tables scroll
 * inside their own box instead of pushing the whole page sideways on phones
 * (issue #473). prose.css styles `.table-scroll`; this plugin emits it. The wrapper
 * is focusable and labelled so keyboard users can scroll it too.
 */
import { visit } from 'unist-util-visit';

export default function rehypeTableScroll() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table' || !parent || index == null) return;
      const cls = parent.properties?.className;
      if (parent.tagName === 'div' && (Array.isArray(cls) ? cls : [cls]).includes('table-scroll')) return;
      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-scroll'], tabIndex: 0, role: 'region', ariaLabel: 'Tabelle' },
        children: [node],
      };
    });
  };
}
