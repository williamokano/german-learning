import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// The test ensures the component renders optional controls when enabled via attributes.
describe('audio-play custom element', () => {
  beforeEach(() => {
    // clear DOM
    document.body.innerHTML = '';
  });

  it('renders controls when enable-replay and enable-seeking are set', async () => {
    document.body.innerHTML = `<audio-play data-src="audio/test.mp3" data-enable-replay="1" data-replay-limit="2" data-enable-seeking="1" data-seek-step="5">Test</audio-play>`;
    // import the module to define the custom element
    await import('../web/src/scripts/audio-play.js');
    const el = document.querySelector('audio-play');
    expect(el).not.toBeNull();
    // wait a tick for connectedCallback
    await new Promise((r) => setTimeout(r, 0));
    const restart = el.querySelector('.audio-restart');
    const progress = el.querySelector('.audio-progress');
    expect(restart).not.toBeNull();
    expect(progress).not.toBeNull();
  });
});
