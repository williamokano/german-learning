// AudioService — one-active-clip audio management
// Full implementation in P1. See docs/web/TECH-STACK.md §6.

export interface AudioServiceInterface {
  play(src: string): void;
  pause(): void;
  toggle(src: string): void;
  isPlaying(src: string): boolean;
}

export class AudioService implements AudioServiceInterface {
  private current: { src: string; el: HTMLAudioElement } | null = null;
  private base: string;

  constructor(base: string = '') {
    this.base = base.replace(/\/$/, '');
  }

  private resolve(src: string): string {
    if (src.startsWith('http') || src.startsWith('/')) return src;
    return `${this.base}/${src}`;
  }

  play(src: string): void {
    const url = this.resolve(src);
    if (this.current) {
      this.current.el.pause();
      if (this.current.src === url) {
        this.current = null;
        return;
      }
    }
    const el = new Audio(url);
    el.addEventListener('ended', () => { this.current = null; });
    el.play().catch(() => { /* user interaction required */ });
    this.current = { src: url, el };
  }

  pause(): void {
    this.current?.el.pause();
    this.current = null;
  }

  toggle(src: string): void {
    this.play(src); // play() handles the one-active-clip stop
  }

  isPlaying(src: string): boolean {
    return this.current?.src === this.resolve(src) && !this.current.el.paused;
  }
}
