/**
 * <audio-play> custom element.
 *
 * Attribute: data-src — path relative to the Astro BASE_URL,
 * e.g. "audio/A1/01-erste-kontakte/dialog1_a.mp3"
 *
 * Inner text (optional) is shown as a label beside ▶.
 * One-active-clip policy via "audio-play:stop" document event.
 */

// import.meta.env.BASE_URL is replaced by Vite at build time.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

class AudioPlayElement extends HTMLElement {
  #audio = null;
  #btn   = null;

  connectedCallback() {
    const label = this.textContent.trim();
    this.innerHTML = '';

    if (label) {
      const span = document.createElement('span');
      span.className = 'audio-label';
      span.textContent = label;
      this.appendChild(span);
    }

    this.#btn = document.createElement('button');
    this.#btn.type = 'button';
    this.#btn.className = 'audio-btn';
    this.#btn.innerHTML = '&#9654;'; // ▶
    this.#btn.setAttribute('aria-label',
      label ? `${label} abspielen` : 'Audio abspielen');
    this.appendChild(this.#btn);

    this.#btn.addEventListener('click', () => this.#toggle());
    document.addEventListener('audio-play:stop', (e) => {
      if (e.detail !== this) this.#pause();
    });
  }

  #toggle() {
    if (!this.#audio) {
      const src = `${BASE}/${this.dataset.src}`;
      this.#audio = new Audio(src);
      this.#audio.addEventListener('ended', () => this.#pause());
    }
    if (this.#btn.dataset.playing === '1') {
      this.#pause();
    } else {
      document.dispatchEvent(new CustomEvent('audio-play:stop', { detail: this }));
      this.#audio.play().catch(() => {});
      this.#btn.innerHTML = '&#9646;&#9646;'; // ⏸
      this.#btn.dataset.playing = '1';
    }
  }

  #pause() {
    this.#audio?.pause();
    if (this.#btn) {
      this.#btn.innerHTML = '&#9654;';
      this.#btn.dataset.playing = '0';
    }
  }
}

customElements.define('audio-play', AudioPlayElement);
