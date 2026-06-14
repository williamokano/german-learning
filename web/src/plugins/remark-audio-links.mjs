/**
 * Converts  🎧 **Audio:** [file.mp3](audio/file.mp3)  paragraphs
 * into  <audio-play data-src="audio/A1/01-slug/file.mp3"></audio-play>  HTML nodes.
 *
 * The lesson-relative audio path is derived from the vfile path so the
 * web component can resolve the correct public URL via window.__audioBase.
 */
import { visit, SKIP } from 'unist-util-visit';
import { basename } from 'node:path';

export default function remarkAudioLinks() {
  return (tree, file) => {
    // Derive "A1/01-slug" from the absolute file path.
    const m = file.path?.replace(/\\/g, '/').match(/([A-C][12])\/(\d{2}-[^/]+)\/lesson/);
    const audioDir = m ? `audio/${m[1]}/${m[2]}/` : 'audio/';

    visit(tree, 'paragraph', (node, index, parent) => {
      if (!isAudioParagraph(node)) return;
      const src = extractSrc(node);
      if (!src || !parent) return;

      parent.children.splice(index, 1, {
        type: 'html',
        value: `<audio-play data-src="${audioDir}${src}"></audio-play>`,
      });
      return [SKIP, index];
    });
  };
}

function isAudioParagraph(node) {
  const ch = node.children ?? [];
  const hasEmoji = ch[0]?.type === 'text' && ch[0].value.includes('🎧');
  const hasStrong = ch.some(c => c.type === 'strong' &&
    c.children?.some(cc => cc.type === 'text' && cc.value.includes('Audio:')));
  return hasEmoji && hasStrong;
}

function extractSrc(node) {
  const link = node.children.find(c => c.type === 'link');
  return link ? basename(link.url) : null;
}
