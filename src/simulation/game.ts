import { createLevel, levelInfo, listLevels, waveDifficultyScore, type LevelSummary } from "./level";
import { sameKey } from "./words";
import type { EnemyState, GameState, InputFeedback, WaveDefinition } from "./types";
const SPEED = { walker: 1.45, runner: 2.35, brute: 1.05, boss: 0.72 };
const STORAGE_KEY = "typo-city-best-score";
type WaveSource = WaveDefinition[] | ((seed: number, levelId: string) => WaveDefinition[]);
export interface WaveMetrics { index: number; label: string; startedAtMs: number; endedAtMs?: number; totalKeys: number; correctKeys: number; errors: number; defeated: number; damage: number; }
export interface WaveDebugInfo { index: number; label: string; difficulty: number; }
export interface StartOptions { score?: number; lives?: number; elapsedMs?: number; totalKeys?: number; correctKeys?: number; maxCombo?: number }
export function createInitialState(level = levelInfo()): GameState {
  return { phase: "menu", lives: 5, score: 0, combo: 0, maxCombo: 0, enemies: [], waveIndex: -1, waveLabel: "", levelId: level.id, levelTitle: level.title, levelTheme: level.theme, levelEnvironment: level.environment, elapsedMs: 0, totalKeys: 0, correctKeys: 0, errorFlash: 0 };
}
export class TypingGame {
  state = createInitialState(); private enemyCounter = 0; private waveDelay = 0; private waves: WaveDefinition[] = []; private seed = createRandomSeed(); private waveMetrics: WaveMetrics[] = []; private currentWaveMetrics?: WaveMetrics; private inputFeedback?: InputFeedback;
  constructor(private readonly waveSource: WaveSource = (seed, levelId) => createLevel({ seed, levelId }), private levelId = listLevels()[0].id) {}
  selectLevel(levelId: string): void { this.levelId = levelId; this.waves = []; this.state = createInitialState(this.selectedLevel()); this.inputFeedback = undefined; this.resetMetrics(); }
  start(options: StartOptions = {}): void {
    this.waves = this.resolveWaves();
    const initial = createInitialState(this.selectedLevel());
    this.state = { ...initial, phase: "playing", score: options.score ?? initial.score, lives: options.lives ?? initial.lives, maxCombo: options.maxCombo ?? initial.maxCombo, elapsedMs: options.elapsedMs ?? initial.elapsedMs, totalKeys: options.totalKeys ?? initial.totalKeys, correctKeys: options.correctKeys ?? initial.correctKeys };
    this.enemyCounter = 0; this.waveDelay = 550; this.inputFeedback = undefined; this.resetMetrics();
  }
  togglePause(): void { if (this.state.phase === "playing") this.state.phase = "paused"; else if (this.state.phase === "paused") this.state.phase = "playing"; }
  update(deltaMs: number): void {
    const s = this.state; if (s.phase !== "playing") return; s.elapsedMs += deltaMs; s.errorFlash = Math.max(0, s.errorFlash - deltaMs);
    if (!s.enemies.length) { this.closeCurrentWave(); this.waveDelay -= deltaMs; if (this.waveDelay <= 0) this.spawnNextWave(); return; }
    for (const enemy of s.enemies) { if (enemy.status === "defeated") continue; enemy.distance -= SPEED[enemy.archetype] * deltaMs / 1000; if (enemy.distance <= 0) this.enemyAttack(enemy); }
    s.enemies = s.enemies.filter((enemy) => enemy.status !== "defeated");
  }
  type(key: string): "hit" | "error" | "kill" | "ignored" {
    const s = this.state; if (s.phase !== "playing" || [...key].length !== 1) return "ignored"; s.totalKeys++; if (this.currentWaveMetrics) this.currentWaveMetrics.totalKeys++;
    let enemy = s.enemies.find((item) => item.id === s.lockedEnemyId);
    if (!enemy) { enemy = s.enemies.find((item) => sameKey(item.words[item.activeWordIndex][0], key)); if (!enemy) return this.markError(); s.lockedEnemyId = enemy.id; enemy.status = "targeted"; }
    const word = enemy.words[enemy.activeWordIndex]; if (!sameKey(word[enemy.typedLength], key)) return this.markError();
    enemy.typedLength++; s.correctKeys++; if (this.currentWaveMetrics) this.currentWaveMetrics.correctKeys++; s.combo++; s.maxCombo = Math.max(s.maxCombo, s.combo); s.score += 10 + Math.min(s.combo, 50);
    if (enemy.typedLength < word.length) { this.inputFeedback = { kind: "hit", enemyId: enemy.id, combo: s.combo }; return "hit"; }
    enemy.activeWordIndex++; enemy.typedLength = 0;
    if (enemy.activeWordIndex < enemy.words.length) { s.score += 125; this.inputFeedback = { kind: "hit", enemyId: enemy.id, combo: s.combo, wordComplete: true }; return "hit"; }
    enemy.status = "defeated"; if (this.currentWaveMetrics) this.currentWaveMetrics.defeated++; s.lockedEnemyId = undefined; s.score += enemy.archetype === "boss" ? 1500 : 250; this.inputFeedback = { kind: "kill", enemyId: enemy.id, combo: s.combo, wordComplete: true }; return "kill";
  }
  consumeInputFeedback(): InputFeedback | undefined { const feedback = this.inputFeedback; this.inputFeedback = undefined; return feedback; }
  accuracy(): number { return this.state.totalKeys ? Math.round(this.state.correctKeys / this.state.totalKeys * 100) : 100; }
  wordsPerMinute(): number { return this.state.elapsedMs ? Math.round(this.state.correctKeys / 5 / (this.state.elapsedMs / 60000)) : 0; }
  bestScore(): number { return Number(localStorage.getItem(STORAGE_KEY) ?? 0); }
  awardBonus(points: number): void { if (points <= 0) return; this.state.score += Math.round(points); const best = Math.max(this.bestScore(), this.state.score); localStorage.setItem(STORAGE_KEY, String(best)); }
  availableLevels(): LevelSummary[] { return listLevels(); }
  selectedLevel(): LevelSummary { return levelInfo(this.levelId); }
  debugSeed(): number { return this.seed; }
  debugSetSeed(seed: number): void { this.seed = seed >>> 0; this.waves = this.resolveWaves(); if (this.state.phase === "playing" || this.state.phase === "paused") this.start(); }
  debugRerollSeed(): number { this.seed = createRandomSeed(); this.start(); return this.seed; }
  debugMetrics(): WaveMetrics[] { return this.currentWaveMetrics && !this.currentWaveMetrics.endedAtMs ? [...this.waveMetrics, this.currentWaveMetrics] : [...this.waveMetrics]; }
  debugWaveInfo(): WaveDebugInfo[] { this.ensureDebugWaves(); return this.waves.map((wave, index) => ({ index, label: wave.label, difficulty: waveDifficultyScore(wave) })); }
  debugWaveCount(): number { this.ensureDebugWaves(); return this.waves.length; }
  debugSkipWave(): void { this.ensureDebugPlaying(); this.state.enemies = []; this.state.lockedEnemyId = undefined; this.closeCurrentWave(); this.waveDelay = 0; this.spawnNextWave(); }
  debugJumpToWave(index: number): void { this.ensureDebugPlaying(); this.resetMetrics(); this.state.waveIndex = Math.max(-1, Math.min(this.waves.length - 1, index) - 1); this.state.enemies = []; this.state.lockedEnemyId = undefined; this.waveDelay = 0; this.spawnNextWave(); }
  debugClearEnemies(): void { this.ensureDebugPlaying(); this.state.enemies = []; this.state.lockedEnemyId = undefined; this.closeCurrentWave(); this.waveDelay = 250; }
  private markError(): "error" { this.state.combo = 0; this.state.errorFlash = 170; this.inputFeedback = { kind: "error", combo: 0 }; if (this.currentWaveMetrics) this.currentWaveMetrics.errors++; return "error"; }
  private enemyAttack(enemy: EnemyState): void { this.state.lives--; this.state.combo = 0; enemy.status = "defeated"; if (this.currentWaveMetrics) this.currentWaveMetrics.damage++; if (this.state.lockedEnemyId === enemy.id) this.state.lockedEnemyId = undefined; if (this.state.lives <= 0) this.finish("defeat"); }
  private spawnNextWave(): void { this.closeCurrentWave(); this.state.waveIndex++; const wave = this.waves[this.state.waveIndex]; if (!wave) return this.finish("victory"); this.state.waveLabel = wave.label; this.state.enemies = wave.enemies.map((enemy) => ({ ...enemy, id: `enemy-${++this.enemyCounter}`, status: "approaching", activeWordIndex: 0, typedLength: 0 })); this.waveDelay = wave.travelMs; this.currentWaveMetrics = { index: this.state.waveIndex, label: wave.label, startedAtMs: this.state.elapsedMs, totalKeys: 0, correctKeys: 0, errors: 0, defeated: 0, damage: 0 }; }
  private closeCurrentWave(): void { if (!this.currentWaveMetrics || this.currentWaveMetrics.endedAtMs !== undefined) return; this.currentWaveMetrics.endedAtMs = this.state.elapsedMs; this.waveMetrics.push(this.currentWaveMetrics); this.currentWaveMetrics = undefined; }
  private resetMetrics(): void { this.waveMetrics = []; this.currentWaveMetrics = undefined; }
  private ensureDebugWaves(): void { if (!this.waves.length) this.waves = this.resolveWaves(); }
  private ensureDebugPlaying(): void { this.ensureDebugWaves(); if (this.state.phase !== "playing" && this.state.phase !== "paused") this.state = { ...createInitialState(this.selectedLevel()), phase: "playing" }; else this.state.phase = "playing"; }
  private resolveWaves(): WaveDefinition[] { return typeof this.waveSource === "function" ? this.waveSource(this.seed, this.levelId) : this.waveSource; }
  private finish(phase: "victory" | "defeat"): void { this.closeCurrentWave(); this.state.phase = phase; const best = Math.max(this.bestScore(), this.state.score); localStorage.setItem(STORAGE_KEY, String(best)); }
}
function createRandomSeed(): number { return Math.floor(Math.random() * 0xffffffff) >>> 0; }
