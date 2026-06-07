import { musicManifest, type MusicKey } from "../data/music";

export class ArcadeAudio {
  private context?: AudioContext;
  private readonly music = new Audio();
  private readonly musicVolumes = [.18, .34, .55] as const;
  private musicLevel = 1;
  private muted = false;
  private musicKey: MusicKey = "intro";
  constructor() {
    this.music.loop = true;
    this.setMusic(this.musicKey);
    this.applyMusicVolume();
    this.music.preload = "auto";
  }
  unlock(): void { this.context ??= new AudioContext(); void this.context.resume(); this.music.load(); }
  setMusic(key: MusicKey, options: { restart?: boolean } = {}): void {
    const track = musicManifest[key] ?? musicManifest.intro;
    const sameTrack = this.musicKey === key && this.music.src.endsWith(track.url);
    if (sameTrack) {
      if (options.restart) this.music.currentTime = 0;
      return;
    }
    const shouldResume = Boolean(this.context && !this.muted && !this.music.paused);
    this.musicKey = key;
    this.music.pause();
    this.music.src = track.url;
    this.music.currentTime = 0;
    this.music.load();
    this.applyMusicVolume();
    if (shouldResume) void this.music.play().catch((error) => console.warn("Music playback blocked", error));
  }
  play(kind: "hit" | "error" | "kill" | "damage" | "start" | "win"): void {
    if (!this.context) return;
    const map = { hit: [520, .035], error: [115, .11], kill: [230, .2], damage: [80, .25], start: [330, .22], win: [660, .35] } as const;
    const [frequency, duration] = map[kind]; this.tone(frequency, duration, kind === "error" ? "sawtooth" : "square", .035);
  }
  startMusic(): void {
    if (!this.context || this.muted || !this.music.paused) return;
    this.music.currentTime = 0;
    void this.music.play().catch((error) => console.warn("Music playback blocked", error));
  }
  toggleMusic(): boolean {
    this.muted = !this.muted;
    if (this.muted) this.music.pause();
    else if (this.context) void this.music.play().catch((error) => console.warn("Music playback blocked", error));
    return !this.muted;
  }
  cycleMusicVolume(): number {
    this.musicLevel = (this.musicLevel + 1) % this.musicVolumes.length;
    this.muted = false;
    this.applyMusicVolume();
    if (this.context && this.music.paused) void this.music.play().catch((error) => console.warn("Music playback blocked", error));
    return this.musicVolumePercent();
  }
  isMusicEnabled(): boolean { return !this.muted; }
  currentMusicKey(): MusicKey { return this.musicKey; }
  currentMusicTitle(): string { return musicManifest[this.musicKey].title; }
  musicVolumePercent(): number { return Math.round(this.musicVolumes[this.musicLevel] * 100); }
  private applyMusicVolume(): void { this.music.volume = this.musicVolumes[this.musicLevel]; }
  private tone(frequency: number, duration: number, type: OscillatorType, gainValue: number): void {
    if (!this.context) return; const oscillator = this.context.createOscillator(); const gain = this.context.createGain();
    oscillator.frequency.value = frequency; oscillator.type = type; gain.gain.setValueAtTime(gainValue, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001, this.context.currentTime + duration); oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(); oscillator.stop(this.context.currentTime + duration);
  }
}
