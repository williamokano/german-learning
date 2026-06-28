/**
 * <audio-play> custom element.
 *
 * Attribute: data-src — path relative to the Astro BASE_URL,
 * e.g. "audio/A1/01-erste-kontakte/dialog1_a.mp3"
 *
 * New optional data attributes (all optional; default preserves existing behavior):
 * - data-enable-replay="1"         : show restart button / replay UI
 * - data-replay-limit="2"         : number of allowed replays (integer). If omitted or empty => unlimited.
 * - data-enable-seeking="1"        : show seek back/forward buttons and progress bar
 * - data-seek-step="5"            : seek step in seconds (default 5)
 * - data-show-waveform="0"        : reserved for future waveform integration (no-op for now)
 *
 * Inner text (optional) is shown as a label beside ▶.
 * One-active-clip policy via "audio-play:stop" document event.
 */

// import.meta.env.BASE_URL is replaced by Vite at build time.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

class AudioPlayElement extends HTMLElement {
  #audio = null;
  #btn = null;
  #controls = null;
  #progress = null;
  #progressInner = null;
  #restartBtn = null;
  #backBtn = null;
  #forwardBtn = null;
  #replayInfo = null;

  // config
  #enableReplay = false;
  #replayLimit = null; // null = unlimited
  #remainingReplays = null;
  #enableSeeking = false;
  #seekStep = 5;
  #showWaveform = false;

  // state
  #playedOnce = false;
  #ended = false;

  connectedCallback() {
    const label = this.textContent.trim();
    this.innerHTML = '';

    // read configuration from data- attributes (strings)
    this.#enableReplay = this.dataset.enableReplay === '1' || this.dataset.enableReplay === 'true';
    this.#enableSeeking = this.dataset.enableSeeking === '1' || this.dataset.enableSeeking === 'true';
    this.#seekStep = Number(this.dataset.seekStep) || this.#seekStep;
    this.#showWaveform = this.dataset.showWaveform === '1' || this.dataset.showWaveform === 'true';

    if (this.dataset.replayLimit != null && this.dataset.replayLimit !== '') {
      const n = Number(this.dataset.replayLimit);
      this.#replayLimit = Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
    } else {
      this.#replayLimit = null;
    }
    this.#remainingReplays = this.#replayLimit;

    if (label) {
      const span = document.createElement('span');
      span.className = 'audio-label';
      span.textContent = label;
      this.appendChild(span);
    }

    // main play/pause button (keeps original look)
    this.#btn = document.createElement('button');
    this.#btn.type = 'button';
    this.#btn.className = 'audio-btn';
    this.#btn.innerHTML = '&#9654;'; // ▶
    this.#btn.setAttribute('aria-label',
      label ? `${label} abspielen` : 'Audio abspielen');
    this.appendChild(this.#btn);

    // optional controls container (seek/restart/progress)
    if (this.#enableSeeking || this.#enableReplay) {
      this.#controls = document.createElement('div');
      this.#controls.className = 'audio-controls';

      if (this.#enableSeeking) {
        // back button
        this.#backBtn = document.createElement('button');
        this.#backBtn.type = 'button';
        this.#backBtn.className = 'audio-seek-back';
        this.#backBtn.innerHTML = '&#9198;'; // small back icon (fallback)
        this.#backBtn.title = `-${this.#seekStep}s`;
        this.#backBtn.setAttribute('aria-label', `Seek back ${this.#seekStep} seconds`);
        this.#controls.appendChild(this.#backBtn);

        // forward button
        this.#forwardBtn = document.createElement('button');
        this.#forwardBtn.type = 'button';
        this.#forwardBtn.className = 'audio-seek-forward';
        this.#forwardBtn.innerHTML = '&#9197;'; // small forward icon (fallback)
        this.#forwardBtn.title = `+${this.#seekStep}s`;
        this.#forwardBtn.setAttribute('aria-label', `Seek forward ${this.#seekStep} seconds`);
        this.#controls.appendChild(this.#forwardBtn);
      }

      if (this.#enableReplay) {
        // restart button
        this.#restartBtn = document.createElement('button');
        this.#restartBtn.type = 'button';
        this.#restartBtn.className = 'audio-restart';
        this.#restartBtn.innerHTML = '&#8634;'; // ↺
        this.#restartBtn.title = 'Start over';
        this.#restartBtn.setAttribute('aria-label', 'Start audio from the beginning');
        this.#controls.appendChild(this.#restartBtn);

        // replay info
        this.#replayInfo = document.createElement('span');
        this.#replayInfo.className = 'audio-replay-info';
        this.#controls.appendChild(this.#replayInfo);
        this.#updateReplayInfo();
      }

      // progress bar (click-to-seek) if seeking enabled
      if (this.#enableSeeking) {
        this.#progress = document.createElement('div');
        this.#progress.className = 'audio-progress';
        this.#progress.setAttribute('role', 'progressbar');
        this.#progress.setAttribute('aria-valuemin', '0');
        this.#progress.setAttribute('aria-valuemax', '100');
        this.#progressInner = document.createElement('div');
        this.#progressInner.className = 'audio-progress-inner';
        this.#progress.appendChild(this.#progressInner);
        this.#controls.appendChild(this.#progress);
      }

      this.appendChild(this.#controls);
    }

    // events
    this.#btn.addEventListener('click', () => this.#toggle());
    document.addEventListener('audio-play:stop', (e) => {
      if (e.detail !== this) this.#pause();
    });

    // keyboard: space toggles when focus is on this element; left/right seek when seeking enabled
    this.tabIndex = 0;
    this.addEventListener('keydown', (ev) => {
      if (ev.code === 'Space' || ev.key === ' ') {
        ev.preventDefault();
        this.#toggle();
      } else if (this.#enableSeeking && (ev.code === 'ArrowLeft' || ev.code === 'ArrowRight')) {
        ev.preventDefault();
        const dir = ev.code === 'ArrowLeft' ? -1 : 1;
        this.#seekBy(dir * this.#seekStep);
      }
    });

    if (this.#backBtn) this.#backBtn.addEventListener('click', () => this.#seekBy(-this.#seekStep));
    if (this.#forwardBtn) this.#forwardBtn.addEventListener('click', () => this.#seekBy(this.#seekStep));
    if (this.#restartBtn) this.#restartBtn.addEventListener('click', () => this.#restart());

    if (this.#progress) {
      this.#progress.addEventListener('click', (e) => {
        const rect = this.#progress.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        this.#seekToPercent(x);
      });
    }
  }

  #createAudioIfNeeded() {
    if (!this.#audio) {
      const src = `${BASE}/${this.dataset.src}`;
      this.#audio = new Audio(src);
      this.#audio.preload = 'metadata';
      this.#audio.addEventListener('ended', () => {
        this.#ended = true;
        this.#pause();
      });
      this.#audio.addEventListener('timeupdate', () => this.#onTimeUpdate());
      this.#audio.addEventListener('play', () => {
        // mark that we've started playback at least once
        if (!this.#playedOnce) this.#playedOnce = true;
      });
    }
  }

  #toggle() {
    // create audio object lazily
    this.#createAudioIfNeeded();

    if (this.#btn.dataset.playing === '1') {
      this.#pause();
    } else {
      // if replay limit exists and this play qualifies as a replay, enforce it
      if (this.#enableReplay && this.#replayLimit != null && this.#isReplayAttempt()) {
        if (this.#remainingReplays !== null && this.#remainingReplays <= 0) {
          // show a small UI hint (could be tooltip; for now update info text)
          this.#showReplayBlocked();
          return;
        }
        // consume one replay
        if (this.#remainingReplays !== null) this.#remainingReplays--;
        this.#updateReplayInfo();
      }

      document.dispatchEvent(new CustomEvent('audio-play:stop', { detail: this }));
      // If the audio was ended and the user hits play, resume from 0 (most likely)
      if (this.#ended) {
        try { this.#audio.currentTime = 0; } catch (e) { /* ignore */ }
        this.#ended = false;
      }
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
    // keep element around for seeking / replay UI; do not null out
  }

  #restart() {
    // restart = set to 0 and play
    this.#createAudioIfNeeded();

    // enforce replay policy
    if (this.#enableReplay && this.#replayLimit != null) {
      if (this.#remainingReplays !== null && this.#remainingReplays <= 0) {
        this.#showReplayBlocked();
        return;
      }
      if (this.#remainingReplays !== null) this.#remainingReplays--;
      this.#updateReplayInfo();
    }

    try { this.#audio.currentTime = 0; } catch (e) { /* ignore */ }
    this.#ended = false;
    document.dispatchEvent(new CustomEvent('audio-play:stop', { detail: this }));
    this.#audio.play().catch(() => {});
    this.#btn.innerHTML = '&#9646;&#9646;'; // ⏸
    this.#btn.dataset.playing = '1';
    this.#playedOnce = true;
  }

  #isReplayAttempt() {
    // heuristics: a replay is when a play is attempted after we've already played
    // at least once and we're starting from near the beginning (currentTime < 1s)
    // or when the audio had ended and we're starting again.
    if (!this.#playedOnce) return false;
    if (!this.#audio) return true; // creating a new audio to play again -> treat as replay
    if (this.#ended) return true;
    try {
      const t = this.#audio.currentTime || 0;
      return t < 1.0;
    } catch (e) {
      return true;
    }
  }

  #showReplayBlocked() {
    if (this.#replayInfo) {
      this.#replayInfo.textContent = 'No replays remaining';
    } else {
      // quick visual feedback by disabling restart button if present
      if (this.#restartBtn) this.#restartBtn.disabled = true;
    }
  }

  #updateReplayInfo() {
    if (!this.#replayInfo) return;
    if (this.#replayLimit == null) {
      this.#replayInfo.textContent = '';
      return;
    }
    this.#replayInfo.textContent = `${this.#remainingReplays} replay(s) remaining`;
    if (this.#remainingReplays !== null && this.#remainingReplays <= 0 && this.#restartBtn) {
      this.#restartBtn.disabled = true;
    }
  }

  #seekBy(deltaSeconds) {
    this.#createAudioIfNeeded();
    if (!this.#audio) return;
    try {
      let t = this.#audio.currentTime || 0;
      t = Math.max(0, Math.min(this.#audio.duration || Infinity, t + deltaSeconds));
      this.#audio.currentTime = t;
      // if seeking while paused, leave paused; if playing, continue playing
    } catch (e) { /* ignore */ }
  }

  #seekToPercent(pct) {
    this.#createAudioIfNeeded();
    if (!this.#audio || !this.#progress) return;
    try {
      const dur = this.#audio.duration || 0;
      const t = Math.max(0, Math.min(dur, pct * dur));
      this.#audio.currentTime = t;
    } catch (e) { /* ignore */ }
  }

  #onTimeUpdate() {
    if (!this.#audio || !this.#progressInner) return;
    const dur = this.#audio.duration || 0;
    const pos = this.#audio.currentTime || 0;
    const pct = dur > 0 ? Math.round((pos / dur) * 100) : 0;
    this.#progressInner.style.width = `${pct}%`;
    this.#progress.setAttribute('aria-valuenow', String(pct));
  }
}

customElements.define('audio-play', AudioPlayElement);
