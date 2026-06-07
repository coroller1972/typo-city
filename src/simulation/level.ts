import type { EnemyArchetype, LevelEnvironment, LevelTheme, WaveDefinition } from "./types";
import { defaultLevelId, levels, type EnemyBlueprint, type LevelBlueprint, type WaveBlueprint } from "../data/levelBlueprints";
import type { MusicKey } from "../data/music";
import { wordPools, type WordDifficulty } from "../data/wordPools";
import { normalizeKey } from "./words";

type Rng = () => number;

export interface LevelOptions { levelId?: string; seed?: number; rng?: Rng }
export interface LevelSummary { id: string; title: string; subtitle: string; briefing: string; threat: string; waveCount: number; theme: LevelTheme; environment: LevelEnvironment; music: MusicKey }

export function createLevel(options: LevelOptions = {}): WaveDefinition[] {
  const level = findLevel(options.levelId);
  const rng = options.rng ?? (options.seed === undefined ? Math.random : createSeededRng(options.seed));
  const usedWords = new Set<string>();
  const generated = level.waves.map((wave) => generateBalancedWave(wave, rng, usedWords));
  validateLevel(generated);
  return generated;
}

export function listLevels(): LevelSummary[] { return levels.map((level) => ({ id: level.id, title: level.title, subtitle: level.subtitle, briefing: level.briefing, threat: level.threat, waveCount: level.waves.length, theme: level.theme, environment: level.environment, music: level.music })); }

export function levelInfo(levelId = defaultLevelId): LevelSummary {
  const level = findLevel(levelId);
  return { id: level.id, title: level.title, subtitle: level.subtitle, briefing: level.briefing, threat: level.threat, waveCount: level.waves.length, theme: level.theme, environment: level.environment, music: level.music };
}

export function createSeededRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function generateBalancedWave(wave: WaveBlueprint, rng: Rng, usedWords: Set<string>): WaveDefinition {
  let fallback: WaveDefinition | undefined;
  let fallbackScore = Number.POSITIVE_INFINITY;
  for (let attempt = 0; attempt < 24; attempt++) {
    const attemptUsedWords = new Set(usedWords);
    const generated = generateWave(wave, rng, attemptUsedWords);
    const score = waveDifficultyScore(generated);
    if (score >= wave.difficulty.min && score <= wave.difficulty.max) {
      for (const word of generated.enemies.flatMap((enemy) => enemy.words)) usedWords.add(wordKey(word));
      return generated;
    }
    const distanceFromBudget = Math.min(Math.abs(score - wave.difficulty.min), Math.abs(score - wave.difficulty.max));
    if (distanceFromBudget < fallbackScore) { fallback = generated; fallbackScore = distanceFromBudget; }
  }
  if (!fallback) throw new Error(`Unable to generate wave "${wave.label}"`);
  for (const word of fallback.enemies.flatMap((enemy) => enemy.words)) usedWords.add(wordKey(word));
  return fallback;
}

function generateWave(wave: WaveBlueprint, rng: Rng, usedWords: Set<string>): WaveDefinition {
  const waveInitials = new Set<string>();
  return {
    label: wave.label,
    travelMs: wave.travelMs,
    enemies: wave.enemies.map((enemy) => ({
      archetype: enemy.archetype,
      words: chooseWords(enemy, rng, waveInitials, usedWords, wave.label),
      distance: enemy.distance,
      lane: enemy.lane,
      labelOffset: enemy.labelOffset,
      labelScreenOffset: enemy.labelScreenOffset,
    })),
  };
}

function chooseWords(enemy: EnemyBlueprint, rng: Rng, waveInitials: Set<string>, usedWords: Set<string>, waveLabel: string): string[] {
  const chosen: string[] = [];
  const localUsed = new Set<string>();
  for (let index = 0; index < enemy.wordCount; index++) {
    const word = pickWord(enemy.pools, rng, {
      blockedInitials: index === 0 ? waveInitials : undefined,
      localUsed,
      usedWords,
    }, waveLabel);
    chosen.push(word);
    localUsed.add(wordKey(word));
    usedWords.add(wordKey(word));
    if (index === 0) waveInitials.add(initialKey(word));
  }
  return chosen;
}

function pickWord(pools: WordDifficulty[], rng: Rng, constraints: { blockedInitials?: Set<string>; localUsed: Set<string>; usedWords: Set<string> }, waveLabel: string): string {
  const pool = pools.flatMap((difficulty) => [...wordPools[difficulty]]);
  const freshCandidates = filterCandidates(pool, constraints, true);
  const candidates = freshCandidates.length ? freshCandidates : filterCandidates(pool, constraints, false);
  if (!candidates.length) throw new Error(`No valid word candidate for wave "${waveLabel}"`);
  return candidates[Math.floor(rng() * candidates.length)];
}

function filterCandidates(pool: string[], constraints: { blockedInitials?: Set<string>; localUsed: Set<string>; usedWords: Set<string> }, requireFresh: boolean): string[] {
  return pool.filter((word) => {
    const key = wordKey(word);
    if (constraints.localUsed.has(key)) return false;
    if (requireFresh && constraints.usedWords.has(key)) return false;
    return !constraints.blockedInitials?.has(initialKey(word));
  });
}

function wordKey(word: string): string { return normalizeKey(word); }
function initialKey(word: string): string { return normalizeKey(word[0]); }
export function wordDifficultyScore(word: string): number {
  const normalized = wordKey(word);
  const accentBonus = normalized.length === word.length ? 0 : 1;
  return normalized.length + accentBonus;
}
export function waveDifficultyScore(wave: WaveDefinition): number {
  const archetypeBonus: Record<EnemyArchetype, number> = { walker: 0, runner: 2, brute: 5, boss: 8 };
  return wave.enemies.reduce((total, enemy) => total + archetypeBonus[enemy.archetype] + enemy.words.reduce((sum, word) => sum + wordDifficultyScore(word), 0), 0);
}

export function validateLevel(waves: WaveDefinition[]): void {
  for (const wave of waves) {
    const initials = new Set<string>();
    for (const enemy of wave.enemies) {
      if (!enemy.words.length) throw new Error(`Enemy without words in wave "${wave.label}"`);
      const initial = initialKey(enemy.words[0]);
      if (initials.has(initial)) throw new Error(`Duplicate initial "${initial}" in wave "${wave.label}"`);
      initials.add(initial);
    }
  }
}

export const level: WaveDefinition[] = createLevel();
function findLevel(levelId = defaultLevelId): LevelBlueprint {
  const level = levels.find((item) => item.id === levelId);
  if (!level) throw new Error(`Unknown level "${levelId}"`);
  return level;
}
